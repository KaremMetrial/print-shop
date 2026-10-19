<?php

namespace App\Models;

use App\Casts\MoneyCast;
use App\Support\Money;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property int $quantity
 * @property array<string, mixed> $product_snapshot
 * @property list<array<string, mixed>> $options_snapshot
 * @property int|null $designer_id
 * @property Carbon|null $approved_at
 * @property Carbon|null $cancelled_at
 * @property Carbon $updated_at
 * @property Money $unit_price
 * @property Money $item_total
 */
class OrderItem extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'product_snapshot' => 'array', 'options_snapshot' => 'array',
            'base_unit_price' => MoneyCast::class, 'options_unit_price' => MoneyCast::class, 'unit_price' => MoneyCast::class, 'item_total' => MoneyCast::class,
            'approved_at' => 'datetime', 'cancelled_at' => 'datetime',
        ];
    }

    /** رقم البند المعروض: ITEM-{الأوردر}-{الترتيب داخله} */
    public function code(): string
    {
        $pos = self::where('order_id', $this->order_id)->where('id', '<=', $this->id)->count();

        return 'ITEM-'.$this->order_id.'-'.str_pad((string) $pos, 2, '0', STR_PAD_LEFT);
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
