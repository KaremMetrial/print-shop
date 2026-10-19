<?php

namespace App\Actions\Orders;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\Order;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Pricing\PricingService;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/** تعديل بيانات الأوردر (S-015): التسليم/المدة/الملاحظات/الرسوم/الخصم. الأسعار تُعاد من السيرفر (BR-055/056/057). */
class UpdateOrder
{
    public function __construct(private PricingService $pricing, private AuditService $audit) {}

    /** @param array<string, mixed> $data */
    public function handle(User $actor, Order $order, array $data): Order
    {
        return DB::transaction(function () use ($actor, $order, $data) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $this->guardEditable($order);

            $method = $data['delivery_method'] ?? $order->delivery_method;
            $address = $method === 'DELIVERY' ? ($data['delivery_address'] ?? $order->delivery_address) : null;
            if ($method === 'DELIVERY' && blank($address)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'التوصيل يحتاج عنوانًا.');
            }
            $fee = $method === 'DELIVERY' ? (int) ($data['delivery_fee'] ?? $order->delivery_fee->minor) : 0;
            $discountType = $data['discount_type'] ?? $order->discount_type;
            $discountValue = $data['discount_value'] ?? $order->discount_value;

            $discountChanged = $discountType !== $order->discount_type || (float) $discountValue !== (float) $order->discount_value;
            $priceChanged = $fee !== $order->delivery_fee->minor || $discountChanged;
            if ($priceChanged) {
                if ($order->paidMinor() > 0 && ! $actor->hasPermission('orders.pricing.edit')) {
                    throw new BusinessException(ErrorCode::PRICE_EDIT_AFTER_PAYMENT_FORBIDDEN);
                }
                if ($discountChanged) {
                    Gate::forUser($actor)->authorize('orders.discount.apply');
                }
            }
            [$discount, $feeM, $grand] = $this->pricing->totals($order->subtotal, $discountType, $discountValue, Money::minor($fee), Money::minor($order->paidMinor()));

            $before = $this->snapshot($order);
            $order->update([
                'delivery_method' => $method, 'delivery_address' => $address, 'delivery_fee' => $feeM, 'printing_eta_days' => $data['printing_eta_days'] ?? $order->printing_eta_days,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $order->notes,
                'discount_type' => $discountType, 'discount_value' => $discountValue, 'discount_amount' => $discount, 'grand_total' => $grand,
            ]);
            [$old, $new] = $this->audit->diff($before, $this->snapshot($order->refresh()));
            if ($new) {
                $this->audit->record('order.updated', $order, $old, $new);
            }

            return $order;
        });
    }

    private function guardEditable(Order $order): void
    {
        match ($order->status) {
            OrderStatus::COMPLETED => throw new BusinessException(ErrorCode::ORDER_ALREADY_COMPLETED),
            OrderStatus::CANCELLED => throw new BusinessException(ErrorCode::ORDER_CANCELLED),
            default => null,
        };
    }

    /** @return array<string, mixed> */
    private function snapshot(Order $o): array
    {
        return [
            'delivery_method' => $o->delivery_method, 'delivery_address' => $o->delivery_address, 'delivery_fee_minor' => $o->delivery_fee->minor,
            'printing_eta_days' => $o->printing_eta_days, 'notes' => $o->notes, 'discount_type' => $o->discount_type, 'discount_value' => (string) (float) $o->discount_value,
            'grand_total_minor' => $o->grand_total->minor,
        ];
    }
}
