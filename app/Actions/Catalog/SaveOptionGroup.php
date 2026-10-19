<?php

namespace App\Actions\Catalog;

use App\Models\Product;
use App\Models\ProductOptionGroup;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\DB;

class SaveOptionGroup
{
    public function __construct(private AuditService $audit) {}

    /**
     * القيم لا تُحذف (لا يجوز كسر تاريخ الأوردرات): ما يُحذف من القائمة يُعطَّل. الأسعار قروش.
     *
     * @param  array<string, mixed>  $data  [name, code, selection_type, is_required, sort_order, is_active, values:[{id?,name,unit_price_addition,sort_order,is_active}]]
     */
    public function handle(User $actor, Product $product, array $data, ?ProductOptionGroup $group = null): ProductOptionGroup
    {
        return DB::transaction(function () use ($product, $data, $group) {
            $attrs = ['name' => $data['name'], 'code' => $data['code'], 'selection_type' => $data['selection_type'], 'is_required' => (bool) $data['is_required'], 'sort_order' => (int) ($data['sort_order'] ?? 0), 'is_active' => (bool) ($data['is_active'] ?? true)];
            $created = ! $group;
            $group = $group ?? $product->optionGroups()->create($attrs);
            if (! $created) {
                $group->update($attrs);
            }

            $keep = [];
            foreach ($data['values'] ?? [] as $i => $v) {
                $row = ['name' => $v['name'], 'unit_price_addition' => (int) $v['unit_price_addition'], 'sort_order' => (int) ($v['sort_order'] ?? $i + 1), 'is_active' => (bool) ($v['is_active'] ?? true)];
                $model = isset($v['id']) ? $group->values()->whereKey($v['id'])->first() : null;
                $model ? $model->update($row) : ($model = $group->values()->create($row));
                $keep[] = $model->id;
            }
            // القيم غير المرسلة تُعطَّل ولا تُحذف
            $group->values()->whereNotIn('id', $keep)->update(['is_active' => false]);

            $product->touch();
            $this->audit->record($created ? 'product.option_group_created' : 'product.option_group_updated', $product, [], ['group' => $group->name, 'values' => count($keep)]);

            return $group;
        });
    }
}
