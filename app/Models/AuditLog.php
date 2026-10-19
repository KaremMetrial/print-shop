<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use LogicException;

/** سجل تدقيق append-only: ممنوع التعديل/الحذف (التطبيق + trigger في MySQL). */
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['old_values' => 'array', 'new_values' => 'array', 'created_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('audit_logs is append-only'));
        static::deleting(fn () => throw new LogicException('audit_logs is append-only'));
    }
}
