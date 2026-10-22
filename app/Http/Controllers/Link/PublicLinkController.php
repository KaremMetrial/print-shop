<?php

namespace App\Http\Controllers\Link;

use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\DesignVersion;
use App\Models\File;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderLink;
use App\Services\Chat\ChatService;
use App\Services\Design\DesignService;
use App\Services\Finance\InvoiceService;
use App\Services\Finance\PaymentProofService;
use App\Services\Orders\OrderLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/** عميل الرابط (07-B): يرى أوردرًا واحدًا فقط ويعتمد تصاميمه. لا حساب، لا قائمة. noindex + no-referrer. (BR-004/005/022/026) */
class PublicLinkController extends Controller
{
    public function __construct(private OrderLinkService $links) {}

    public function show(Request $request, string $token): \Inertia\Response|Response
    {
        $link = $this->resolve($token);
        if (! $link instanceof OrderLink) {
            return $this->unavailable();
        }
        $link->forceFill(['last_access_at' => now()])->saveQuietly();

        return $this->render('link/show', $link, ['order' => $this->orderProps($link->order)]);
    }

    public function item(Request $request, string $token, OrderItem $item): \Inertia\Response|Response
    {
        $link = $this->resolve($token);
        if (! $link instanceof OrderLink) {
            return $this->unavailable();
        }
        abort_unless($item->order_id === $link->order_id && ! $item->cancelled_at, 404); // BOLA: بند من أوردر آخر
        $v = DesignVersion::where('order_item_id', $item->id)->whereIn('status', ['SUBMITTED', 'APPROVED'])->latest('version_no')->with('files')->first();

        return $this->render('link/preview', $link, [
            'order' => $this->orderProps($link->order),
            'item' => ['id' => $item->id, 'name' => $item->product_snapshot['name'], 'quantity' => $item->quantity, 'state' => $item->design_state],
            'version' => $v ? [
                'id' => $v->id, 'no' => $v->version_no, 'status' => $v->status, 'revision' => $v->manifest_revision, 'sent_at' => $v->submitted_at?->toIso8601String(),
                'files' => $v->files->map(fn (File $f) => ['id' => $f->id, 'name' => $f->original_filename, 'mime' => $f->mime_type])->all(),
            ] : null,
        ]);
    }

    public function approve(Request $request, string $token, OrderItem $item, DesignService $design): Response
    {
        $link = $this->resolve($token);
        if (! $link instanceof OrderLink) {
            return $this->unavailable();
        }
        abort_unless($item->order_id === $link->order_id, 404);
        $data = $request->validate(['version_id' => ['required', 'integer'], 'revision' => ['required', 'integer']]);
        $version = DesignVersion::where('order_item_id', $item->id)->findOrFail($data['version_id']);
        $design->approve('link', $link->id, $version, (int) $data['revision']);

        return redirect("/l/{$token}")->with('success', 'تم اعتماد التصميم.');
    }

    /** معاينة رسمية للعرض فقط (inline) — لا تنزيل (BR-022). */
    public function file(Request $request, string $token, File $file): Response
    {
        $link = $this->resolve($token);
        if (! $link instanceof OrderLink) {
            return $this->unavailable();
        }
        $ok = $file->parent_type === 'design_version' && DesignVersion::whereKey($file->parent_id)->whereHas('item', fn ($q) => $q->where('order_id', $link->order_id))->whereIn('status', ['SUBMITTED', 'APPROVED'])->exists();
        abort_unless($ok, 404);

        return Storage::disk($file->disk)->response($file->storage_key, $file->original_filename, [
            'Content-Type' => $file->mime_type, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store',
            'Content-Security-Policy' => "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
        ], 'inline');
    }

    private function resolve(string $token): ?OrderLink
    {
        return $this->links->findActive($token);
    }

    /** @param array<string, mixed> $props */
    private function render(string $component, OrderLink $link, array $props): \Inertia\Response
    {
        return Inertia::render($component, ['token' => $this->tokenOf($link)] + $props);
    }

    private function tokenOf(OrderLink $link): string
    {
        return basename($this->links->url($link));
    }

    private function unavailable(): Response
    {
        return Inertia::render('link/unavailable')->toResponse(request())->setStatusCode(410);
    }

    /** @return array<string, mixed> */
    private function orderProps(Order $o): array
    {
        $o->load('customer:id,name', 'items');
        $paid = $o->paidMinor();

        return [
            'number' => $o->order_number, 'customer' => $o->customer->name, 'status' => $o->status->value, 'status_label' => $o->status->label(),
            'created_at' => $o->created_at?->toIso8601String(), 'delivery_method' => $o->delivery_method, 'delivery_address' => $o->delivery_address, 'delivery_fee_minor' => $o->delivery_fee->minor,
            'has_invoice' => Invoice::where('active_order_id', $o->id)->exists(), 'grand_total_minor' => $o->grand_total->minor, 'paid_minor' => $paid, 'remaining_minor' => $o->grand_total->minor - $paid,
            'items' => $o->items->whereNull('cancelled_at')->values()->map(fn (OrderItem $i) => [
                'id' => $i->id, 'name' => $i->product_snapshot['name'], 'quantity' => $i->quantity, 'state' => $i->design_state, 'approved' => (bool) $i->approved_at,
                'version_no' => DesignVersion::where('order_item_id', $i->id)->whereIn('status', ['SUBMITTED', 'APPROVED'])->max('version_no'),
            ])->all(),
        ];
    }

    public function chat(Request $request, string $token, OrderItem $item): JsonResponse|Response
    {
        $link = $this->resolve($token);
        if (! $link instanceof OrderLink) {
            return $this->unavailable();
        }
        abort_unless($item->order_id === $link->order_id && ! $item->cancelled_at, 404);
        $chat = app(ChatService::class);
        if ($request->isMethod('post')) {
            $d = $request->validate(['body' => ['required', 'string', 'max:2000'], 'client_id' => ['required', 'string', 'max:64']]);

            return response()->json(['data' => $chat->send($item, 'link', $link->id, 'العميل', $d['body'], $d['client_id'])], 201);
        }

        return response()->json(['data' => $chat->list($item, (int) $request->query('after', 0)), 'meta' => ['locked' => $chat->isLocked($item), 'can_send' => ! $chat->isLocked($item), 'label' => 'العميل']]);
    }

    public function proof(Request $request, string $token): RedirectResponse|Response
    {
        $link = $this->resolve($token);
        if (! $link instanceof OrderLink) {
            return $this->unavailable();
        }
        $d = $request->validate(['file' => ['required', 'file'], 'amount_minor' => ['required', 'integer', 'min:1', 'max:100000000'], 'method' => ['required', 'in:'.implode(',', array_keys(PaymentMethod::enabled()))], 'reference' => ['nullable', 'string', 'max:100']]);
        app(PaymentProofService::class)->submit(Order::findOrFail($link->order_id), $request->file('file'), (int) $d['amount_minor'], $d['method'], $d['reference'] ?? null, 'link', $link->id);

        return back()->with('success', 'تم إرسال إثبات الدفع للمراجعة. لن يُحتسب إلا بعد تأكيد المطبعة.');
    }

    public function invoice(string $token): \Inertia\Response|Response
    {
        $link = $this->resolve($token);
        if (! $link instanceof OrderLink) {
            return $this->unavailable();
        }
        $inv = Invoice::where('active_order_id', $link->order_id)->first();
        $order = Order::with('customer:id,name')->findOrFail($link->order_id);

        return Inertia::render('link/invoice', ['token' => $token, 'order' => ['number' => $order->order_number, 'customer' => $order->customer->name], 'invoice' => $inv ? app(InvoiceService::class)->payload($inv) : null]);
    }

    public function invoicePdf(string $token): Response
    {
        $link = $this->resolve($token);
        abort_unless($link instanceof OrderLink, 404);
        $inv = Invoice::where('active_order_id', $link->order_id)->firstOrFail();

        return response(app(InvoiceService::class)->pdf($inv), 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'inline; filename="invoice-'.$inv->number.'.pdf"', 'Cache-Control' => 'private, no-store']);
    }
}
