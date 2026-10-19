<?php

use App\Exceptions\BusinessException;
use App\Models\PricingTier;
use App\Models\Product;
use App\Models\ProductOptionGroup;
use App\Models\ProductOptionValue;
use App\Models\TierProductPrice;
use App\Services\Pricing\PricingService;
use App\Support\Money;

function pr(): PricingService
{
    return app(PricingService::class);
}

function productWithLamination(): array
{
    $p = Product::factory()->create(['base_unit_price' => 1000, 'minimum_quantity' => 2]); // 10.00
    $g = ProductOptionGroup::create(['product_id' => $p->id, 'code' => 'lamination', 'name' => 'التغليف', 'selection_type' => 'SINGLE', 'is_required' => true]);
    $none = ProductOptionValue::create(['option_group_id' => $g->id, 'name' => 'بدون', 'unit_price_addition' => 0]);
    $matte = ProductOptionValue::create(['option_group_id' => $g->id, 'name' => 'مطفي', 'unit_price_addition' => 200]); // +2.00

    return [$p, $g, $none, $matte];
}

it('TC-020: base 10 + options 2, quantity 5 = standard total 60', function () {
    [$p, $g, , $matte] = productWithLamination();
    $q = pr()->quoteItem($p, [$g->id => [$matte->id]], 5);
    expect($q->standardUnit->minor)->toBe(1200)->and($q->itemTotal->minor)->toBe(6000)->and($q->tierAdjustment->isZero())->toBeTrue();
});

it('TC-021: percentage tier 20% applies to base AND additions → 9.60', function () {
    [$p, $g, , $matte] = productWithLamination();
    $tier = PricingTier::create(['name' => 'ذهبية', 'mode' => 'PERCENTAGE', 'discount_percentage' => 20]);
    $q = pr()->quoteItem($p, [$g->id => [$matte->id]], 5, $tier);
    expect($q->finalUnit->toDecimalString())->toBe('9.60')->and($q->itemTotal->minor)->toBe(4800)->and($q->tierAdjustment->minor)->toBe(-240);
});

it('TC-022: fixed-base tier replaces only the base (7 + 2 = 9)', function () {
    [$p, $g, , $matte] = productWithLamination();
    $tier = PricingTier::create(['name' => 'فضية', 'mode' => 'FIXED_BASE']);
    TierProductPrice::create(['tier_id' => $tier->id, 'product_id' => $p->id, 'base_unit_price_override' => 700]);
    $q = pr()->quoteItem($p, [$g->id => [$matte->id]], 3, $tier);
    expect($q->finalUnit->toDecimalString())->toBe('9.00')->and($q->itemTotal->minor)->toBe(2700);
});

it('falls back to the standard price when a fixed-base tier has no price for the product', function () {
    [$p, $g, , $matte] = productWithLamination();
    $tier = PricingTier::create(['name' => 'مخصصة', 'mode' => 'FIXED_BASE']);
    expect(pr()->quoteItem($p, [$g->id => [$matte->id]], 2, $tier)->finalUnit->minor)->toBe(1200);
});

it('TC-023: rejects quantity below minimum or non-positive', function () {
    [$p, $g, $none] = productWithLamination();
    expect(fn () => pr()->quoteItem($p, [$g->id => [$none->id]], 1))->toThrow(BusinessException::class)
        ->and(fn () => pr()->quoteItem($p, [$g->id => [$none->id]], 0))->toThrow(BusinessException::class);
});

it('rejects inactive products, unknown options, missing required groups and multi-choice on single', function () {
    [$p, $g, $none, $matte] = productWithLamination();
    expect(fn () => pr()->quoteItem($p, [], 2))->toThrow(BusinessException::class, 'مطلوبة')
        ->and(fn () => pr()->quoteItem($p, [$g->id => [$none->id, $matte->id]], 2))->toThrow(BusinessException::class, 'واحدًا')
        ->and(fn () => pr()->quoteItem($p, [$g->id => [999999]], 2))->toThrow(BusinessException::class)
        ->and(fn () => pr()->quoteItem($p, [999999 => [1]], 2))->toThrow(BusinessException::class);
    $p->update(['is_active' => false]);
    expect(fn () => pr()->quoteItem($p, [$g->id => [$none->id]], 2))->toThrow(BusinessException::class);
});

it('ignores inactive option values (cannot be chosen on new orders)', function () {
    [$p, $g, , $matte] = productWithLamination();
    $matte->update(['is_active' => false]);
    expect(fn () => pr()->quoteItem($p, [$g->id => [$matte->id]], 2))->toThrow(BusinessException::class);
});

it('computes the order: items − discount (before delivery) + delivery fee', function () {
    [$p, $g, , $matte] = productWithLamination();
    $item = pr()->quoteItem($p, [$g->id => [$matte->id]], 5); // 60.00
    $o = pr()->quoteOrder([$item], 'PERCENT', '10', Money::minor(500)); // 6.00 off, +5.00 delivery
    expect($o->subtotal->minor)->toBe(6000)->and($o->discount->minor)->toBe(600)->and($o->grandTotal->minor)->toBe(5900);
    $f = pr()->quoteOrder([$item], 'FIXED', 1000);
    expect($f->grandTotal->minor)->toBe(5000);
});

it('TC-026/027: allows 100% discount but never exceeds the subtotal or goes negative', function () {
    [$p, $g, , $matte] = productWithLamination();
    $item = pr()->quoteItem($p, [$g->id => [$matte->id]], 5);
    expect(pr()->quoteOrder([$item], 'PERCENT', '100')->grandTotal->isZero())->toBeTrue();
    expect(fn () => pr()->quoteOrder([$item], 'PERCENT', '100.01'))->toThrow(BusinessException::class)
        ->and(fn () => pr()->quoteOrder([$item], 'FIXED', 6001))->toThrow(BusinessException::class)
        ->and(fn () => pr()->quoteOrder([$item], 'FIXED', -1))->toThrow(BusinessException::class);
});

it('TC-029: the total can never drop below what is already paid', function () {
    [$p, $g, , $matte] = productWithLamination();
    $item = pr()->quoteItem($p, [$g->id => [$matte->id]], 5);
    expect(fn () => pr()->quoteOrder([$item], 'FIXED', 3000, null, Money::minor(4000)))->toThrow(BusinessException::class);
    expect(pr()->quoteOrder([$item], 'FIXED', 2000, null, Money::minor(4000))->grandTotal->minor)->toBe(4000);
});

it('refuses an order without items', function () {
    expect(fn () => pr()->quoteOrder([]))->toThrow(BusinessException::class);
});

it('TC-025: later catalog changes do not alter an already produced quote snapshot', function () {
    [$p, $g, , $matte] = productWithLamination();
    $q = pr()->quoteItem($p, [$g->id => [$matte->id]], 5)->toArray();
    $p->update(['base_unit_price' => 5000]);
    expect($q['final_unit_minor'])->toBe(1200)->and($q['options'][0]['value'])->toBe('مطفي');
});
