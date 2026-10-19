<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property string $status
 * @property Carbon $created_at
 * @property Carbon|null $last_regenerated_at
 */
class OrderLink extends Model
{
    protected $guarded = [];

    protected $hidden = ['token_hash', 'token_encrypted'];

    protected function casts(): array
    {
        return ['last_regenerated_at' => 'datetime', 'suspended_at' => 'datetime', 'closed_at' => 'datetime', 'last_access_at' => 'datetime'];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
