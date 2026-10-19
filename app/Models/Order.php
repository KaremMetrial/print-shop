<?php

namespace App\Models;

use App\Casts\MoneyCast;
use App\Enums\OrderStatus;
use App\Services\Finance\PaymentService;
use App\Support\Money;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $order_number
 * @property int $customer_id
 * @property OrderStatus $status
 * @property string $delivery_method
 * @property Money $subtotal
 * @property Money $discount_amount
 * @property Money $delivery_fee
 * @property Money $grand_total
 * @property Carbon|null $created_at
 */
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'subtotal' => MoneyCast::class, 'discount_amount' => MoneyCast::class, 'delivery_fee' => MoneyCast::class, 'grand_total' => MoneyCast::class,
            'printing_started_at' => 'datetime', 'completed_at' => 'datetime', 'cancelled_at' => 'datetime',
        ];
    }

    /** المدفوع المؤكد = Σ تخصيصات الدفعات المؤكدة. */
    public function paidMinor(): int
    {
        return $this->exists ? app(PaymentService::class)->paid($this) : 0;
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasOne<OrderLink, $this> */
    public function link(): HasOne
    {
        return $this->hasOne(OrderLink::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function activeItems(): HasMany
    {
        return $this->hasMany(OrderItem::class)->whereNull('cancelled_at');
    }
}
