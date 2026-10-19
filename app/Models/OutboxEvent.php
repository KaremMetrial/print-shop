<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property string $event_type
 * @property array<string, mixed> $payload
 */
class OutboxEvent extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['payload' => 'array', 'available_at' => 'datetime', 'claimed_at' => 'datetime', 'processed_at' => 'datetime', 'failed_at' => 'datetime'];
    }
}
