<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = [];

    protected $hidden = ['storage_key', 'disk', 'checksum'];

    protected function casts(): array
    {
        return ['size_bytes' => 'integer', 'created_at' => 'datetime'];
    }
}
