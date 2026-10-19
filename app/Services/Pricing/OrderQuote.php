<?php

namespace App\Services\Pricing;

use App\Support\Money;

final readonly class OrderQuote
{
    /** @param list<ItemQuote> $items */
    public function __construct(
        public array $items,
        public Money $subtotal,
        public string $discountType,
        public Money $discount,
        public Money $deliveryFee,
        public Money $grandTotal,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'items' => array_map(fn (ItemQuote $i) => $i->toArray(), $this->items),
            'subtotal_minor' => $this->subtotal->minor, 'discount_type' => $this->discountType, 'discount_minor' => $this->discount->minor,
            'delivery_fee_minor' => $this->deliveryFee->minor, 'grand_total_minor' => $this->grandTotal->minor,
        ];
    }
}
