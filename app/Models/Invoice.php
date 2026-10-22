<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * فاتورة داخلية غير ضريبية (قرار D7). اللقطة ثابتة بعد الإصدار؛ الإلغاء يحفظ السبب والمسؤول.
 *
 * @property int $id
 * @property string|null $number
 * @property int $order_id
 * @property int $customer_id
 * @property string $status
 * @property array<string, mixed> $snapshot
 * @property Carbon $issued_at
 */
class Invoice extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['snapshot' => 'array', 'issued_at' => 'datetime', 'voided_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::created(function (self $i) {
            if (! $i->number) {
                $i->forceFill(['number' => 'INV-'.str_pad((string) $i->id, 4, '0', STR_PAD_LEFT)])->saveQuietly();
            }
        });
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
