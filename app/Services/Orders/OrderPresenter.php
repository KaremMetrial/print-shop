<?php

namespace App\Services\Orders;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/** يجهّز بيانات صفحة تفاصيل الأوردر (S-012/013). المصمم لا يرى الأسعار (BR-071) — تُحجب في السيرفر. */
class OrderPresenter
{
    private const ACTION_LABELS = [
        'order.created' => 'إنشاء الأوردر', 'order.updated' => 'تعديل الأوردر', 'order.cancelled' => 'إلغاء الأوردر',
        'order.item_cancelled' => 'إلغاء بند', 'order.status_changed' => 'تغيير الحالة',
    ];

    /** @return array<string, mixed> */
    public function detail(Order $order, User $viewer): array
    {
        $order->load('customer.pricingTier', 'items.product');
        $showPrice = ! $viewer->isDesigner();
        $active = $order->items->whereNull('cancelled_at');
        $approved = $active->whereNotNull('approved_at')->count();
        $next = $active->whereNull('approved_at')->first();
        $paid = $order->paidMinor();
        $c = $order->customer;

        return [
            'order' => [
                'id' => $order->id, 'number' => $order->order_number, 'status' => $order->status->value, 'status_label' => $order->status->label(),
                'customer' => ['id' => $c->id, 'name' => $c->name, 'phone' => $c->phone_normalized, 'phone_display' => $c->phone_display],
                'created_at' => $order->created_at?->toIso8601String(), 'updated_at' => $order->updated_at?->toIso8601String(),
                'delivery_method' => $order->delivery_method, 'delivery_address' => $order->delivery_address, 'eta_days' => $order->printing_eta_days,
                'notes' => $order->notes, 'source_label' => $order->source === 'ACCEPTED_REQUEST' ? 'طلب عميل' : 'موظف المطبعة',
                ...($showPrice ? [
                    'subtotal_minor' => $order->subtotal->minor, 'discount_minor' => $order->discount_amount->minor, 'discount_type' => $order->discount_type, 'discount_value' => (string) (float) $order->discount_value, 'delivery_fee_minor' => $order->delivery_fee->minor,
                    'grand_total_minor' => $order->grand_total->minor, 'paid_minor' => $paid, 'remaining_minor' => $order->grand_total->minor - $paid,
                ] : []),
            ],
            'invoice' => ($inv = Invoice::where('active_order_id', $order->id)->first(['id', 'number'])) ? ['id' => $inv->id, 'number' => $inv->number] : null,
            'approval' => ['approved' => $approved, 'total' => $active->count(), 'next' => $next ? ['id' => $next->id, 'name' => $next->product_snapshot['name']] : null],
            'items' => $order->items->values()->map(fn (OrderItem $i, int $n) => [
                'id' => $i->id, 'label' => 'البند '.str_pad((string) ($n + 1), 2, '0', STR_PAD_LEFT).' — '.$i->product_snapshot['name'],
                'quantity' => $i->quantity, 'notes' => $i->notes, 'designer_id' => $i->designer_id, 'specs' => collect($i->options_snapshot)->pluck('value')->implode(' • '),
                'designer' => $i->designer_id ? User::find($i->designer_id)?->name : null, 'version' => null,
                'status' => $i->cancelled_at ? 'CANCELLED' : ($i->approved_at ? 'APPROVED' : 'PENDING'),
                'updated_at' => $i->updated_at->toIso8601String(),
                ...($showPrice ? ['total_minor' => $i->item_total->minor] : []),
            ])->all(),
            'designers' => $viewer->hasPermission('designers.assignment.manage') ? User::whereHas('role', fn ($r) => $r->where('code', Role::Designer->value))->orderBy('name')->get(['id', 'name']) : [],
            'payments' => $showPrice ? DB::table('payment_allocations')->join('payments', 'payments.id', '=', 'payment_allocations.payment_id')->where('payment_allocations.order_id', $order->id)->orderByDesc('payments.id')->get(['payments.number', 'payments.id', 'payments.status', 'payments.method', 'payments.received_at', 'payment_allocations.amount'])->map(fn ($r) => ['id' => $r->id, 'number' => $r->number, 'at' => Carbon::parse($r->received_at)->toIso8601String(), 'amount_minor' => (int) $r->amount, 'method' => ['CASH' => 'نقدًا', 'BANK_TRANSFER' => 'تحويل بنكي', 'WALLET' => 'محفظة إلكترونية', 'CARD' => 'بطاقة'][$r->method] ?? $r->method, 'status' => $r->status === 'CONFIRMED' ? 'مؤكدة' : 'ملغاة'])->all() : [],
            'files' => [],
            'activity' => AuditLog::where('entity_type', $order->getMorphClass())->where('entity_id', $order->id)->oldest('id')->limit(200)->get()
                ->map(fn (AuditLog $l) => [
                    'id' => $l->id, 'at' => $l->created_at->toIso8601String(), 'actor' => $l->actor_id ? User::find($l->actor_id)?->name : 'النظام',
                    'action' => self::ACTION_LABELS[$l->action] ?? $l->action, 'details' => '',
                ])->all(),
            'delivery_log' => [],
            'link' => null,
            'can' => [
                'update' => (bool) $viewer->hasPermission('orders.update'), 'items' => (bool) $viewer->hasPermission('orders.items.manage'),
                'assign' => (bool) $viewer->hasPermission('designers.assignment.manage'), 'discount' => (bool) $viewer->hasPermission('orders.discount.apply') && ! $order->status->isFinal(), 'invoice_view' => (bool) $viewer->hasPermission('invoices.view'), 'invoice_issue' => (bool) $viewer->hasPermission('invoices.issue') && ! in_array($order->status, [OrderStatus::DESIGN_STAGE, OrderStatus::CANCELLED], true), 'links' => (bool) $viewer->hasPermission('orders.links.manage'), 'pay' => (bool) $viewer->hasPermission('payments.create') && ! $order->status->isFinal(), 'cancel' => (bool) $viewer->hasPermission('orders.cancel') && ! $order->status->isFinal(),
                'next' => $this->nextStep($order, $viewer), 'price' => $showPrice,
            ],
        ];
    }

    /** الإجراء التشغيلي التالي المتاح للمستخدم (واجهة فقط — الباك إند يفحص دائمًا). */
    private function nextStep(Order $o, User $u): ?array
    {
        return match (true) {
            $o->status === OrderStatus::IN_PRINTING && $u->hasPermission('orders.printing.complete') => ['step' => 'complete-printing', 'label' => 'إتمام الطباعة'],
            $o->status === OrderStatus::READY_FOR_DELIVERY && $u->hasPermission('orders.delivery.update') => ['step' => 'out-for-delivery', 'label' => 'خرج للتوصيل'],
            in_array($o->status, [OrderStatus::READY_FOR_PICKUP, OrderStatus::OUT_FOR_DELIVERY], true) && $u->hasPermission('orders.complete') => ['step' => 'complete', 'label' => $o->status === OrderStatus::READY_FOR_PICKUP ? 'تأكيد الاستلام وإتمام الأوردر' : 'تأكيد التسليم وإتمام الأوردر'],
            default => null,
        };
    }
}
