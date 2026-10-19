<?php

namespace App\Models;

use App\Enums\OrderRequestStatus;
use Database\Factories\OrderRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $request_number
 * @property int $customer_id
 * @property OrderRequestStatus $status
 * @property string $delivery_method
 * @property int|null $reviewer_id
 * @property int|null $order_id
 * @property Carbon $submitted_at
 * @property Carbon|null $decided_at
 * @property Carbon|null $review_started_at
 * @property string|null $delivery_address
 * @property string|null $notes
 * @property string|null $reject_reason
 */
class OrderRequest extends Model
{
    /** @use HasFactory<OrderRequestFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['status' => OrderRequestStatus::class, 'review_started_at' => 'datetime', 'decided_at' => 'datetime', 'submitted_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::created(function (self $r) {
            if (! $r->request_number) {
                $r->forceFill(['request_number' => 'REQ-'.str_pad((string) $r->id, 4, '0', STR_PAD_LEFT)])->saveQuietly();
            }
        });
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return HasMany<OrderRequestItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderRequestItem::class);
    }
}
