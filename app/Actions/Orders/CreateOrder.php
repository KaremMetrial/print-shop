<?php

namespace App\Actions\Orders;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Orders\OrderLinkService;
use App\Services\Outbox\Outbox;
use App\Services\Pricing\PricingService;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CreateOrder
{
    public function __construct(private PricingService $pricing, private AuditService $audit, private Outbox $outbox, private OrderLinkService $links) {}

    /**
     * @param  array<string, mixed>  $data  بيانات متحقق منها. الأسعار تُحسب بالسيرفر فقط (BR-057).
     */
    public function handle(User $actor, array $data): Order
    {
        $customer = Customer::with('pricingTier')->findOrFail($data['customer_id']);
        $discountType = $data['discount_type'] ?? 'NONE';
        if ($discountType !== 'NONE') {
            Gate::forUser($actor)->authorize('orders.discount.apply');
        }
        if (($data['delivery_method'] ?? 'PICKUP') === 'DELIVERY' && blank($data['delivery_address'] ?? $customer->address)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'التوصيل يحتاج عنوانًا.');
        }

        $quotes = [];
        foreach ($data['items'] as $row) {
            $product = Product::findOrFail($row['product_id']);
            $quotes[] = [$product, $row, $this->pricing->quoteItem($product, $row['options'] ?? [], (int) $row['quantity'], $customer->pricingTier)];
        }
        $quote = $this->pricing->quoteOrder(
            array_map(fn ($q) => $q[2], $quotes), $discountType, $data['discount_value'] ?? 0, Money::minor((int) ($data['delivery_fee'] ?? 0)),
        );

        return DB::transaction(function () use ($actor, $data, $customer, $quotes, $quote, $discountType) {
            $order = Order::create([
                'customer_id' => $customer->id, 'source' => $data['source'] ?? 'STAFF_CREATED', 'status' => OrderStatus::DESIGN_STAGE,
                'delivery_method' => $data['delivery_method'] ?? 'PICKUP',
                'delivery_address' => ($data['delivery_method'] ?? 'PICKUP') === 'DELIVERY' ? ($data['delivery_address'] ?? $customer->address) : null,
                'printing_eta_days' => $data['printing_eta_days'] ?? null,
                'subtotal' => $quote->subtotal, 'discount_type' => $discountType, 'discount_value' => $data['discount_value'] ?? 0,
                'discount_amount' => $quote->discount, 'delivery_fee' => $quote->deliveryFee, 'grand_total' => $quote->grandTotal,
                'notes' => $data['notes'] ?? null, 'created_by' => $actor->id,
            ]);
            $order->update(['order_number' => 'ORD-'.str_pad((string) $order->id, 5, '0', STR_PAD_LEFT)]);

            foreach ($quotes as [$product, $row, $q]) {
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_snapshot' => ['id' => $product->id, 'name' => $product->name, 'category_id' => $product->category_id, 'required_specialty_id' => $product->required_specialty_id],
                    'options_snapshot' => $q->optionsSnapshot, 'quantity' => $q->quantity,
                    'base_unit_price' => $q->baseUnit, 'options_unit_price' => $q->optionsUnit, 'tier_adjustment' => $q->tierAdjustment->minor,
                    'unit_price' => $q->finalUnit, 'item_total' => $q->itemTotal, 'notes' => $row['notes'] ?? null,
                ]);
            }

            $this->audit->record('order.created', $order, [], [
                'number' => $order->order_number, 'customer_id' => $customer->id, 'items' => count($quotes), 'grand_total_minor' => $quote->grandTotal->minor,
            ]);
            $this->links->create($order);
            $this->outbox->record('OrderCreated', $order, ['order_id' => $order->id]);

            return $order->load('items');
        });
    }
}
