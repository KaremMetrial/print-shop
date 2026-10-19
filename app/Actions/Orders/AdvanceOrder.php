<?php

namespace App\Actions\Orders;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\Order;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Orders\OrderLinkService;
use App\Services\Outbox\Outbox;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * مراحل التنفيذ بعد الاعتماد (BR-031…040): إتمام الطباعة (زر واحد للأوردر) → جاهز للاستلام/التوصيل → خرج للتوصيل → مكتمل.
 * الإتمام لا يشترط السداد الكامل (BR-040). الاعتماد التلقائي بعد 24 ساعة من الخروج للتوصيل (BR-039).
 */
class AdvanceOrder
{
    public function __construct(private AuditService $audit, private Outbox $outbox, private OrderLinkService $links) {}

    public function completePrinting(User $actor, Order $order): Order
    {
        Gate::forUser($actor)->authorize('orders.printing.complete');

        return $this->move($actor, $order, OrderStatus::IN_PRINTING, fn (Order $o) => $o->delivery_method === 'DELIVERY' ? OrderStatus::READY_FOR_DELIVERY : OrderStatus::READY_FOR_PICKUP, 'order.printing_completed');
    }

    public function outForDelivery(User $actor, Order $order): Order
    {
        Gate::forUser($actor)->authorize('orders.delivery.update');

        return $this->move($actor, $order, OrderStatus::READY_FOR_DELIVERY, fn () => OrderStatus::OUT_FOR_DELIVERY, 'order.out_for_delivery', ['out_for_delivery_at' => now()]);
    }

    public function complete(?User $actor, Order $order, string $source = 'MANUAL'): Order
    {
        if ($actor) {
            Gate::forUser($actor)->authorize('orders.complete');
        }
        $from = $order->delivery_method === 'DELIVERY' ? OrderStatus::OUT_FOR_DELIVERY : OrderStatus::READY_FOR_PICKUP;

        return $this->move($actor, $order, $from, fn () => OrderStatus::COMPLETED, 'order.completed', ['completed_at' => now(), 'completed_source' => $source]);
    }

    /** يُشغَّل بالجدولة: يكمل الأوردرات التي مضى على خروجها للتوصيل 24 ساعة. */
    public function autoComplete(): int
    {
        $n = 0;
        foreach (Order::where('status', OrderStatus::OUT_FOR_DELIVERY)->where('out_for_delivery_at', '<=', now()->subDay())->pluck('id') as $id) {
            try {
                $this->complete(null, Order::findOrFail($id), 'AUTO');
                $n++;
            } catch (BusinessException) {
                // سباق مع إتمام يدوي: لا يضر
            }
        }

        return $n;
    }

    /** @param array<string, mixed> $extra */
    private function move(?User $actor, Order $order, OrderStatus $expected, callable $target, string $action, array $extra = []): Order
    {
        return DB::transaction(function () use ($order, $expected, $target, $action, $extra) {
            $o = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($o->status === OrderStatus::COMPLETED) {
                throw new BusinessException(ErrorCode::ORDER_ALREADY_COMPLETED);
            }
            if ($o->status === OrderStatus::CANCELLED) {
                throw new BusinessException(ErrorCode::ORDER_CANCELLED);
            }
            $to = $target($o);
            if ($o->status !== $expected || ! $o->status->canTransitionTo($to)) {
                throw new BusinessException(ErrorCode::INVALID_ORDER_TRANSITION);
            }
            $from = $o->status;
            $o->update(['status' => $to] + $extra);
            $this->audit->record($action, $o, ['status' => $from->value], ['status' => $to->value]);
            $this->outbox->record('OrderStatusChanged', $o, ['order_id' => $o->id, 'from' => $from->value, 'to' => $to->value]);
            if ($to === OrderStatus::COMPLETED) {
                $this->links->closeFor($o);
                $this->outbox->record('OrderCompleted', $o, ['order_id' => $o->id]); // يغلق رابط العميل (BR-006)
            }

            return $o;
        });
    }
}
