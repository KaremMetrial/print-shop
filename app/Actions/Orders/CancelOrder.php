<?php

namespace App\Actions\Orders;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\Order;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Finance\PaymentService;
use App\Services\Orders\OrderLinkService;
use App\Services\Outbox\Outbox;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/** إلغاء الأوردر (S-016): للإدارة فقط وبسبب إلزامي (BR-042)؛ مسموح بعد بدء الطباعة ما لم يكتمل (BR-043). */
class CancelOrder
{
    public function __construct(private AuditService $audit, private Outbox $outbox, private OrderLinkService $links) {}

    public function handle(User $actor, Order $order, string $reason, ?string $notes = null): Order
    {
        Gate::forUser($actor)->authorize('orders.cancel');
        $reason = trim($reason);
        if ($reason === '') {
            throw new BusinessException(ErrorCode::CANCEL_REASON_REQUIRED);
        }

        return DB::transaction(function () use ($actor, $order, $reason, $notes) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($order->status === OrderStatus::COMPLETED) {
                throw new BusinessException(ErrorCode::ORDER_ALREADY_COMPLETED);
            }
            if (! $order->status->canTransitionTo(OrderStatus::CANCELLED)) {
                throw new BusinessException(ErrorCode::ORDER_CANCELLED);
            }
            $from = $order->status;
            $order->update([
                'status' => OrderStatus::CANCELLED, 'cancelled_at' => now(), 'cancelled_by' => $actor->id,
                'cancel_reason' => $notes ? "{$reason} — {$notes}" : $reason,
            ]);
            $this->links->closeFor($order);
            app(PaymentService::class)->openRefundObligation($order);
            $this->audit->record('order.cancelled', $order, ['status' => $from->value], ['status' => OrderStatus::CANCELLED->value], $reason);
            // يغلق رابط العميل ويوقف المهام ويحسب Refund Due في وحداتها عبر الحدث (BR-006/044/045)
            $this->outbox->record('OrderCancelled', $order, ['order_id' => $order->id, 'paid_minor' => $order->paidMinor()]);

            return $order;
        });
    }
}
