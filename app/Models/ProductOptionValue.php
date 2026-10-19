<?php

namespace App\Models;

use App\Casts\MoneyCast;
use App\Support\Money;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $option_group_id
 * @property string $name
 * @property Money $unit_price_addition
 * @property bool $is_active
 */
class ProductOptionValue extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['unit_price_addition' => MoneyCast::class, 'is_active' => 'boolean'];
    }
}
