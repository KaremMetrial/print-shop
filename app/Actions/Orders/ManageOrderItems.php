<?php

namespace App\Actions\Orders;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Design\AssignmentService;
use App\Services\Design\DesignService;
use App\Services\Pricing\PricingService;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/** إضافة بند / إلغاء بند (Soft Cancel) قبل الطباعة فقط (6.6). الأسعار من السيرفر، ولا يقل الإجمالي عن المدفوع. */
class ManageOrderItems
{
    public function __construct(private PricingService $pricing, private AuditService $audit, private AssignmentService $assign, private DesignService $design) {}

    /** @param array<string, mixed> $row product_id, quantity, options, notes */
    public function add(User $actor, Order $order, array $row): OrderItem
    {
        Gate::forUser($actor)->authorize('orders.items.manage');

        return DB::transaction(function () use ($actor, $order, $row) {
            $order = $this->lock($order);
            $this->guardPricing($actor, $order);
            $product = Product::findOrFail($row['product_id']);
            $q = $this->pricing->quoteItem($product, $row['options'] ?? [], (int) $row['quantity'], $order->customer->pricingTier);
            $item = $order->items()->create([
                'product_id' => $product->id,
                'product_snapshot' => ['id' => $product->id, 'name' => $product->name, 'category_id' => $product->category_id, 'required_specialty_id' => $product->required_specialty_id],
                'options_snapshot' => $q->optionsSnapshot, 'quantity' => $q->quantity, 'base_unit_price' => $q->baseUnit, 'options_unit_price' => $q->optionsUnit,
                'tier_adjustment' => $q->tierAdjustment->minor, 'unit_price' => $q->finalUnit, 'item_total' => $q->itemTotal, 'notes' => $row['notes'] ?? null,
            ]);
            $this->assign->assignItem($item);
            $this->reprice($order);
            $this->audit->record('order.item_added', $order, [], ['item_id' => $item->id, 'product' => $product->name, 'quantity' => $q->quantity, 'item_total_minor' => $q->itemTotal->minor]);

            return $item;
        });
    }

    /** تعديل كمية/ملاحظات بند قبل الطباعة: يُعاد التسعير من السيرفر بنفس خيارات البند (BR-057)، والتعديل مُدقَّق. */
    public function update(User $actor, Order $order, OrderItem $item, int $quantity, ?string $notes): OrderItem
    {
        Gate::forUser($actor)->authorize('orders.items.manage');

        return DB::transaction(function () use ($actor, $order, $item, $quantity, $notes) {
            $order = $this->lock($order);
            $item = OrderItem::whereKey($item->id)->where('order_id', $order->id)->lockForUpdate()->firstOrFail();
            if ($item->cancelled_at) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'لا يمكن تعديل بند ملغي.');
            }
            $before = ['quantity' => $item->quantity, 'notes' => $item->notes, 'item_total_minor' => $item->item_total->minor];
            if ($quantity !== $item->quantity) {
                $this->guardPricing($actor, $order);
                $selected = [];
                foreach ($item->options_snapshot as $o) {
                    $selected[$o['group_id']][] = $o['value_id'];
                }
                $q = $this->pricing->quoteItem(Product::findOrFail($item->product_id), $selected, $quantity, $order->customer->pricingTier);
                $item->update(['quantity' => $q->quantity, 'base_unit_price' => $q->baseUnit, 'options_unit_price' => $q->optionsUnit, 'tier_adjustment' => $q->tierAdjustment->minor, 'unit_price' => $q->finalUnit, 'item_total' => $q->itemTotal, 'options_snapshot' => $q->optionsSnapshot]);
                $this->reprice($order);
            }
            $item->update(['notes' => $notes]);
            $this->audit->record('order.item_updated', $order, ['item_id' => $item->id] + $before, ['item_id' => $item->id, 'quantity' => $item->quantity, 'notes' => $item->notes, 'item_total_minor' => $item->item_total->minor]);

            return $item;
        });
    }

    public function cancel(User $actor, Order $order, OrderItem $item, string $reason): OrderItem
    {
        Gate::forUser($actor)->authorize('orders.items.manage');
        if (trim($reason) === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'سبب إلغاء البند إلزامي.');
        }

        return DB::transaction(function () use ($actor, $order, $item, $reason) {
            $order = $this->lock($order);
            $item = OrderItem::whereKey($item->id)->where('order_id', $order->id)->lockForUpdate()->firstOrFail();
            if ($item->cancelled_at) {
                return $item; // idempotent
            }
            if (OrderItem::where('order_id', $order->id)->whereNull('cancelled_at')->count() <= 1) {
                throw new BusinessException(ErrorCode::ORDER_HAS_NO_ITEMS, 'لا يمكن إلغاء آخر بند — ألغِ الأوردر بدلًا من ذلك.');
            }
            $this->guardPricing($actor, $order);
            $item->update(['cancelled_at' => now(), 'cancel_reason' => mb_substr($reason, 0, 255)]);
            $this->reprice($order);
            $this->audit->record('order.item_cancelled', $order, [], ['item_id' => $item->id, 'item_total_minor' => $item->item_total->minor], $reason);
            $this->design->startPrintingIfReady($order);

            return $item;
        });
    }

    private function lock(Order $order): Order
    {
        $order = Order::with('customer.pricingTier')->whereKey($order->id)->lockForUpdate()->firstOrFail();
        if ($order->status !== OrderStatus::DESIGN_STAGE) {
            throw new BusinessException(match ($order->status) {
                OrderStatus::CANCELLED => ErrorCode::ORDER_CANCELLED,
                OrderStatus::COMPLETED => ErrorCode::ORDER_ALREADY_COMPLETED,
                default => ErrorCode::ORDER_LOCKED_FOR_PRINTING,
            });
        }

        return $order;
    }

    /** تغيير السعر بعد دفعة يحتاج صلاحية تعديل الأسعار (6.6). */
    private function guardPricing(User $actor, Order $order): void
    {
        if ($order->paidMinor() > 0 && ! $actor->hasPermission('orders.pricing.edit')) {
            throw new BusinessException(ErrorCode::PRICE_EDIT_AFTER_PAYMENT_FORBIDDEN);
        }
    }

    private function reprice(Order $order): void
    {
        $subtotal = Money::minor((int) OrderItem::where('order_id', $order->id)->whereNull('cancelled_at')->sum('item_total'));
        [$discount, , $grand] = $this->pricing->totals($subtotal, $order->discount_type, (string) $order->discount_value, $order->delivery_fee, Money::minor($order->paidMinor()));
        $order->update(['subtotal' => $subtotal, 'discount_amount' => $discount, 'grand_total' => $grand]);
    }
}
