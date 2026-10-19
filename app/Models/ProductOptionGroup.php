<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $product_id
 * @property string $selection_type
 * @property bool $is_required
 * @property bool $is_active
 */
class ProductOptionGroup extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['is_required' => 'boolean', 'is_active' => 'boolean'];
    }

    /** @return HasMany<ProductOptionValue, $this> */
    public function values(): HasMany
    {
        return $this->hasMany(ProductOptionValue::class, 'option_group_id')->orderBy('sort_order')->orderBy('id');
    }
}
