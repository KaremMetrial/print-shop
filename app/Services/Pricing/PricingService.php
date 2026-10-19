<?php

namespace App\Services\Pricing;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use App\Models\PricingTier;
use App\Models\Product;
use App\Models\TierProductPrice;
use App\Support\Money;

/**
 * محرك التسعير (§12.3–12.8). نقي ومُختبَر بكثافة. كل الحسابات بالقروش (integer) بتقريب HALF_UP.
 *   السعر القياسي للوحدة = الأساسي + مجموع زيادات الخيارات
 *   Percentage: الوحدة النهائية = القياسي × (1 − نسبة%)   ← الخصم على الأساسي والإضافات معًا
 *   Fixed Base : الوحدة النهائية = سعر الشريحة الأساسي للمنتج + الزيادات   ← الزيادات لا تُخصم
 *   إجمالي البند = الوحدة النهائية × الكمية
 *   الإجمالي = Σ البنود − خصم الأوردر + رسوم التوصيل  (الخصم قبل رسوم التوصيل)
 */
class PricingService
{
    /**
     * @param  array<int|string, list<int>>  $selected  [optionGroupId => [optionValueId,…]]
     */
    public function quoteItem(Product $product, array $selected, int $quantity, ?PricingTier $tier = null): ItemQuote
    {
        if (! $product->is_active) {
            throw new BusinessException(ErrorCode::PRODUCT_INACTIVE);
        }
        if ($quantity < 1 || ($product->minimum_quantity && $quantity < $product->minimum_quantity)) {
            throw new BusinessException(ErrorCode::QUANTITY_BELOW_MINIMUM);
        }

        $additions = Money::zero();
        $snapshot = [];
        $groups = $product->optionGroups()->where('is_active', true)->with(['values' => fn ($q) => $q->where('is_active', true)])->get();
        $known = $groups->pluck('id')->map(fn ($i) => (int) $i)->all();
        foreach (array_keys($selected) as $gid) {
            if (! in_array((int) $gid, $known, true)) {
                throw new BusinessException(ErrorCode::INVALID_PRODUCT_OPTION);
            }
        }
        foreach ($groups as $g) {
            $ids = array_values(array_unique(array_map('intval', $selected[$g->id] ?? $selected[(string) $g->id] ?? [])));
            if ($g->is_required && ! $ids) {
                throw new BusinessException(ErrorCode::INVALID_PRODUCT_OPTION, "المواصفة «{$g->name}» مطلوبة.");
            }
            if ($g->selection_type === 'SINGLE' && count($ids) > 1) {
                throw new BusinessException(ErrorCode::INVALID_PRODUCT_OPTION, "المواصفة «{$g->name}» تقبل اختيارًا واحدًا فقط.");
            }
            foreach ($ids as $vid) {
                $v = $g->values->firstWhere('id', $vid) ?? throw new BusinessException(ErrorCode::INVALID_PRODUCT_OPTION);
                $additions = $additions->add($v->unit_price_addition);
                $snapshot[] = ['group_id' => $g->id, 'group' => $g->name, 'value_id' => $v->id, 'value' => $v->name, 'addition_minor' => $v->unit_price_addition->minor];
            }
        }

        $base = $product->base_unit_price;
        $standard = $base->add($additions);
        $mode = $tier ? $tier->mode : 'PERCENTAGE';
        $final = $standard;
        $tierAdjustment = Money::zero();

        if ($tier && $mode === 'PERCENTAGE' && (float) $tier->discount_percentage > 0) {
            $final = $standard->discountedBy((string) $tier->discount_percentage);
        } elseif ($tier && $mode === 'FIXED_BASE') {
            $override = TierProductPrice::where('tier_id', $tier->id)->where('product_id', $product->id)->value('base_unit_price_override');
            if ($override !== null) {
                $final = Money::minor((int) $override)->add($additions);
            }
        }
        $tierAdjustment = $final->sub($standard);

        return new ItemQuote(
            productId: $product->id, productName: $product->name, quantity: $quantity,
            baseUnit: $base, optionsUnit: $additions, standardUnit: $standard, tierAdjustment: $tierAdjustment,
            finalUnit: $final, itemTotal: $final->mul($quantity), optionsSnapshot: $snapshot,
        );
    }

    /**
     * @param  list<ItemQuote>  $items
     * @param  'NONE'|'FIXED'|'PERCENT'  $discountType
     */
    public function quoteOrder(array $items, string $discountType = 'NONE', string|int $discountValue = 0, ?Money $deliveryFee = null, ?Money $alreadyPaid = null): OrderQuote
    {
        if (! $items) {
            throw new BusinessException(ErrorCode::ORDER_HAS_NO_ITEMS);
        }
        $subtotal = array_reduce($items, fn (Money $c, ItemQuote $i) => $c->add($i->itemTotal), Money::zero());
        [$discount, $fee, $grand] = $this->totals($subtotal, $discountType, $discountValue, $deliveryFee, $alreadyPaid);

        return new OrderQuote($items, $subtotal, $discountType, $discount, $fee, $grand);
    }

    /**
     * الإجمالي من مجموع البنود: Σ − خصم الأوردر + رسوم التوصيل؛ ولا يقل عن المدفوع (BR-056).
     *
     * @return array{0: Money, 1: Money, 2: Money} [الخصم، الرسوم، الإجمالي]
     */
    public function totals(Money $subtotal, string $discountType, string|int $discountValue, ?Money $deliveryFee, ?Money $alreadyPaid = null): array
    {
        $discount = match ($discountType) {
            'PERCENT' => $this->percentDiscount($subtotal, $discountValue),
            'FIXED' => $this->fixedDiscount($subtotal, $discountValue),
            default => Money::zero(),
        };
        $fee = $deliveryFee ?? Money::zero();
        if ($fee->isNegative()) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'رسوم التوصيل لا يمكن أن تكون سالبة.');
        }
        $grand = $subtotal->sub($discount)->add($fee);
        if ($alreadyPaid && $grand->lessThan($alreadyPaid)) {
            throw new BusinessException(ErrorCode::PRICE_BELOW_PAID);
        }

        return [$discount, $fee, $grand];
    }

    private function percentDiscount(Money $subtotal, string|int $pct): Money
    {
        $p = (string) $pct;
        if (! preg_match('/^\d+(\.\d{1,2})?$/', $p) || (float) $p > 100) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'نسبة الخصم يجب أن تكون بين 0 و100.');
        }

        return $subtotal->percent($p);
    }

    private function fixedDiscount(Money $subtotal, string|int $value): Money
    {
        $d = Money::minor((int) $value);
        if ($d->isNegative() || $d->greaterThan($subtotal)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'الخصم الثابت لا يتجاوز إجمالي البنود.');
        }

        return $d;
    }
}
