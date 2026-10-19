<?php

namespace App\Http\Controllers\Orders;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Enums\Role as RoleEnum;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DesignVersion;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\Settings\Settings;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Mpdf\Mpdf;

/** S-014 تفاصيل البند للموظف + S-018 بطاقة تشغيل الطباعة (داخلية، ليست فاتورة). */
class OrderItemController extends Controller
{
    private const STATE = ['NEW' => 'جديد', 'IN_DESIGN' => 'قيد التصميم', 'REVISION_REQUESTED' => 'مطلوب تعديل', 'AWAITING_APPROVAL' => 'بانتظار اعتماد العميل', 'APPROVED' => 'معتمد'];

    private const EVENT = ['started' => 'بدء التصميم', 'submitted' => 'إرسال نسخة', 'approved' => 'اعتماد النسخة', 'revision_requested' => 'طلب تعديل', 'reopened' => 'إعادة فتح التصميم', 'assigned' => 'إسناد المصمم'];

    public function show(Request $request, Order $order, OrderItem $item): Response
    {
        Gate::authorize('orders.view');
        abort_unless($item->order_id === $order->id, 404);
        $u = $request->user();
        $tab = in_array($request->query('tab'), ['specs', 'files', 'versions', 'chat', 'activity'], true) ? $request->query('tab') : 'specs';
        $order->load('customer:id,name');
        $n = $order->items()->where('id', '<=', $item->id)->count();
        $versions = DesignVersion::where('order_item_id', $item->id)->with('files')->orderByDesc('version_no')->get();
        $showPrice = ! $u->isDesigner();

        return Inertia::render('orders/item', [
            'tab' => $tab,
            'order' => ['id' => $order->id, 'number' => $order->order_number, 'customer' => $order->customer->name, 'status' => $order->status->value, 'created_at' => $order->created_at?->toIso8601String()],
            'item' => [
                'id' => $item->id, 'code' => 'ITEM-'.str_pad((string) $n, 2, '0', STR_PAD_LEFT), 'product' => $item->product_snapshot['name'], 'quantity' => $item->quantity,
                'state' => $item->design_state, 'state_label' => $item->cancelled_at ? 'ملغي' : (self::STATE[$item->design_state] ?? $item->design_state),
                'designer' => $item->designer_id ? User::find($item->designer_id)?->name : null, 'designer_id' => $item->designer_id, 'notes' => $item->notes,
                'options' => collect($item->options_snapshot)->map(fn ($o) => ['group' => $o['group'] ?? '', 'value' => $o['value'] ?? '', 'addition_minor' => (int) ($o['addition_minor'] ?? 0)])->all(),
                'cancelled' => (bool) $item->cancelled_at, 'cancel_reason' => $item->cancel_reason, 'updated_at' => $item->updated_at->toIso8601String(),
                ...($showPrice ? ['total_minor' => $item->item_total->minor] : []),
            ],
            'versions' => $versions->map(fn (DesignVersion $v) => ['id' => $v->id, 'no' => $v->version_no, 'status' => $v->status, 'submitted_at' => $v->submitted_at?->toIso8601String(), 'notes' => $v->notes, 'files' => $v->files->map(fn ($f) => ['id' => $f->id, 'name' => $f->original_filename])->all()])->all(),
            'activity' => DB::table('design_events')->where('order_item_id', $item->id)->oldest('id')->get()->map(fn ($e) => ['id' => $e->id, 'action' => self::EVENT[$e->type] ?? $e->type, 'at' => $e->created_at, 'note' => $e->note])->all()
                + [],
            'audit' => AuditLog::where('entity_type', $item->getMorphClass())->where('entity_id', $item->id)->oldest('id')->get()->map(fn (AuditLog $l) => ['id' => $l->id, 'action' => $l->action, 'at' => $l->created_at->toIso8601String()])->all(),
            'designers' => User::whereHas('role', fn ($r) => $r->where('code', RoleEnum::Designer->value))->orderBy('name')->get(['id', 'name']),
            'can' => ['assign' => (bool) $u->hasPermission('designers.assignment.manage') && ! $item->cancelled_at && $order->status === OrderStatus::DESIGN_STAGE, 'chat' => (bool) $u->hasPermission('design.chat.read'), 'price' => $showPrice],
        ]);
    }

    public function jobTicket(Request $request, Order $order): Response
    {
        return Inertia::render('orders/job-ticket', $this->ticket($request, $order));
    }

    public function jobTicketPdf(Request $request, Order $order): HttpResponse
    {
        $d = $this->ticket($request, $order);
        $html = view('pdf.job-ticket', $d + ['shop' => app(Settings::class)->get('shop.name')])->render();
        $pdf = new Mpdf(['mode' => 'utf-8', 'format' => 'A4', 'default_font' => 'dejavusans', 'tempDir' => storage_path('app/mpdf')]);
        $pdf->autoScriptToLang = true;
        $pdf->autoLangToFont = true;
        $pdf->SetDirectionality('rtl');
        $pdf->WriteHTML($html);

        return response($pdf->Output('', 'S'), 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'inline; filename="job-ticket-'.$order->order_number.'.pdf"']);
    }

    /** @return array<string, mixed> */
    private function ticket(Request $request, Order $order): array
    {
        Gate::authorize('orders.view');
        if (in_array($order->status, [OrderStatus::DESIGN_STAGE, OrderStatus::CANCELLED], true)) {
            throw new BusinessException(ErrorCode::ORDER_LOCKED_FOR_PRINTING, 'بطاقة التشغيل تتاح بعد اعتماد جميع التصميمات.');
        }
        $order->load('customer:id,name', 'items');

        return [
            'order' => [
                'number' => $order->order_number, 'customer' => $order->customer->name, 'status_label' => $order->status->label(), 'created_at' => $order->created_at?->toIso8601String(),
                'printing_started_at' => $order->printing_started_at ? Carbon::parse($order->printing_started_at)->toIso8601String() : null, 'eta_days' => $order->printing_eta_days, 'delivery_label' => $order->delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة',
                'notes' => $order->notes,
            ],
            'items' => $order->items->whereNull('cancelled_at')->values()->map(function (OrderItem $i) {
                $v = $i->approved_version_id ? DesignVersion::find($i->approved_version_id) : null;

                return ['id' => $i->id, 'name' => $i->product_snapshot['name'], 'quantity' => $i->quantity, 'specs' => collect($i->options_snapshot)->pluck('value')->implode(' • '), 'version' => $v ? 'الإصدار '.str_pad((string) $v->version_no, 2, '0', STR_PAD_LEFT) : '—', 'notes' => $i->notes ?: 'بدون ملاحظات خاصة'];
            })->all(),
        ];
    }
}
