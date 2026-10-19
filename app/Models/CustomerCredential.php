<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $last_login_at
 * @property Carbon|null $last_reset_at
 * @property int $session_version
 */
class CustomerCredential extends Model
{
    protected $guarded = [];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return ['password_created_at' => 'datetime', 'last_reset_at' => 'datetime', 'last_login_at' => 'datetime', 'session_version' => 'integer'];
    }
}
