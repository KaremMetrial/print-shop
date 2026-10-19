<?php

namespace App\Models;

use App\Casts\MoneyCast;
use App\Support\Money;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $number
 * @property int $customer_id
 * @property Money $amount
 * @property string $method
 * @property string $status
 * @property int|null $target_order_id
 * @property Carbon $received_at
 */
class Payment extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['amount' => MoneyCast::class, 'received_at' => 'datetime', 'voided_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::created(function (self $p) {
            if (! $p->number) {
                $p->forceFill(['number' => 'PAY-'.str_pad((string) $p->id, 4, '0', STR_PAD_LEFT)])->saveQuietly();
            }
        });
    }

    /** @return HasMany<PaymentAllocation, $this> */
    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
