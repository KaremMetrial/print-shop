<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingTier extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['is_default' => 'boolean', 'is_active' => 'boolean', 'discount_percentage' => 'decimal:2'];
    }

    public static function default(): self
    {
        return self::where('is_default', true)->firstOrFail();
    }
}
