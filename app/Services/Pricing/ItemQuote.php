<?php

namespace App\Services\Pricing;

use App\Support\Money;

/** نتيجة تسعير بند واحد (كلها قروش). تُحفظ كـsnapshot في order_items. */
final readonly class ItemQuote
{
    /** @param list<array<string, mixed>> $optionsSnapshot */
    public function __construct(
        public int $productId,
        public string $productName,
        public int $quantity,
        public Money $baseUnit,
        public Money $optionsUnit,
        public Money $standardUnit,
        public Money $tierAdjustment,
        public Money $finalUnit,
        public Money $itemTotal,
        public array $optionsSnapshot,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'product_id' => $this->productId, 'product_name' => $this->productName, 'quantity' => $this->quantity,
            'base_unit_minor' => $this->baseUnit->minor, 'options_unit_minor' => $this->optionsUnit->minor, 'standard_unit_minor' => $this->standardUnit->minor,
            'tier_adjustment_minor' => $this->tierAdjustment->minor, 'final_unit_minor' => $this->finalUnit->minor, 'item_total_minor' => $this->itemTotal->minor,
            'options' => $this->optionsSnapshot,
        ];
    }
}
