<?php

namespace App\Listeners;

use App\Events\OutboxEventPublished;
use App\Models\Order;
use App\Services\Notifications\NotificationService;

/** يحوّل أحداث الـOutbox إلى إشعارات وإجراءات للموظفين. idempotent بمفتاح الحدث. لا واتساب تلقائي (BR-069). */
class CreateOperationalNotifications
{
    public function __construct(private NotificationService $n) {}

    public function handle(OutboxEventPublished $e): void
    {
        $type = $e->outbox->event_type;
        $oid = $e->outbox->payload['order_id'] ?? null;
        $order = $oid ? Order::with('customer')->find($oid) : null;
        if (! $order) {
            return;
        }
        $ref = (string) $order->order_number;
        $cust = $order->customer->name;
        $link = "/orders/{$order->id}";

        match ($type) {
            'OrderCreated' => $this->created($order, $ref, $cust, $link),
            'PrintingStarted' => $this->n->notify(['orders.printing.complete'], 'PRINTING_STARTED', "بدأت طباعة الأوردر {$ref}", "{$cust} — اعتُمدت كل التصميمات.", $link),
            'OrderStatusChanged' => $this->status($e->outbox->payload['to'] ?? '', $order, $ref, $cust, $link, (int) $e->outbox->id),
            'OrderCancelled' => $this->cancelled($order, $ref, $cust, $link, (int) ($e->outbox->payload['paid_minor'] ?? 0)),
            default => null,
        };
    }

    private function created(Order $o, string $ref, string $cust, string $link): void
    {
        $unassigned = $o->activeItems()->whereNull('designer_id')->count();
        if ($unassigned > 0) {
            $id = $this->n->openAction("assign:{$o->id}", 'ASSIGN_DESIGNER', "إسناد تصميم غير معيّن — {$ref}", $cust, $ref, '/design');
            if ($id) {
                $this->n->notify(['designers.assignment.manage'], 'ACTION_REQUIRED', "{$unassigned} بنود بلا مصمم — {$ref}", $cust, '/actions', $id);
            }
        } else {
            $this->n->resolveByKey("assign:{$o->id}");
        }
    }

    private function status(string $to, Order $o, string $ref, string $cust, string $link, int $eventId): void
    {
        if (in_array($to, ['READY_FOR_PICKUP', 'READY_FOR_DELIVERY'], true)) {
            // إشعار العميل يدوي (BR-069): إجراء مطلوب للموظف
            $id = $this->n->openAction("notify-ready:{$o->id}", 'CUSTOMER_NOTICE', ($to === 'READY_FOR_PICKUP' ? 'إشعار جاهزية الاستلام' : 'إشعار جاهزية التوصيل')." — {$ref}", $cust, $ref, $link);
            if ($id) {
                $this->n->notify(['orders.delivery.update', 'orders.complete'], 'ACTION_REQUIRED', $to === 'READY_FOR_PICKUP' ? "الأوردر {$ref} جاهز للاستلام" : "الأوردر {$ref} جاهز للتوصيل", $cust, $link, $id);
            }
        }
        if ($to === 'COMPLETED') {
            $this->n->resolveByKey("notify-ready:{$o->id}", null, 'اكتمل الأوردر');
        }
    }

    private function cancelled(Order $o, string $ref, string $cust, string $link, int $paid): void
    {
        $this->n->resolveByKey("assign:{$o->id}", null, 'أُلغي الأوردر');
        $this->n->resolveByKey("notify-ready:{$o->id}", null, 'أُلغي الأوردر');
        if ($paid > 0) {
            $id = $this->n->openAction("refund:{$o->id}", 'OTHER', "رد مبلغ مستحق — {$ref}", $cust, $ref, $link);
            if ($id) {
                $this->n->notify(['refunds.record'], 'ACTION_REQUIRED', "أوردر ملغي بمبلغ مستحق للرد — {$ref}", $cust, $link, $id);
            }
        }
    }
}
