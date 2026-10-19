<?php

namespace App\Actions\Catalog;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use App\Models\PricingTier;
use App\Models\TierProductPrice;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\DB;

class SaveTier
{
    public function __construct(private AuditService $audit) {}

    /**
     * تعديل الشريحة يؤثر على الأوردرات الجديدة فقط (الـsnapshots تحمي القديمة — BR-057).
     *
     * @param  array<string, mixed>  $data  [name, mode, discount_percentage?, is_active, prices?:[{product_id, base_unit_price_override}]]
     */
    public function handle(User $actor, array $data, ?PricingTier $tier = null): PricingTier
    {
        return DB::transaction(function () use ($data, $tier) {
            $attrs = ['name' => $data['name'], 'mode' => $data['mode'], 'discount_percentage' => $data['mode'] === 'PERCENTAGE' ? $data['discount_percentage'] : null, 'is_active' => (bool) $data['is_active']];
            if ($tier && $tier->is_default && ! $attrs['is_active']) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'لا يمكن تعطيل الشريحة الافتراضية.');
            }
            $before = $tier ? $tier->only(['name', 'mode', 'discount_percentage', 'is_active']) : [];
            $tier = $tier ?? PricingTier::create($attrs);
            if ($before) {
                $tier->update($attrs);
            }

            if ($data['mode'] === 'FIXED_BASE') {
                $ids = [];
                foreach ($data['prices'] ?? [] as $p) {
                    TierProductPrice::updateOrCreate(['tier_id' => $tier->id, 'product_id' => $p['product_id']], ['base_unit_price_override' => (int) $p['base_unit_price_override']]);
                    $ids[] = (int) $p['product_id'];
                }
                TierProductPrice::where('tier_id', $tier->id)->whereNotIn('product_id', $ids)->delete();
            } else {
                TierProductPrice::where('tier_id', $tier->id)->delete();
            }
            [$old, $new] = $this->audit->diff($before, $tier->refresh()->only(['name', 'mode', 'discount_percentage', 'is_active']));
            $this->audit->record($before ? 'pricing_tier.updated' : 'pricing_tier.created', $tier, $old, $new ?: ['name' => $tier->name]);

            return $tier;
        });
    }
}
