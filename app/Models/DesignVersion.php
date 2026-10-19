<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_item_id
 * @property int $version_no
 * @property string $status
 * @property int $manifest_revision
 * @property Carbon|null $submitted_at
 * @property Carbon|null $approved_at
 */
class DesignVersion extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['submitted_at' => 'datetime', 'approved_at' => 'datetime'];
    }

    /** @return BelongsTo<OrderItem, $this> */
    public function item(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }

    /** @return BelongsToMany<File, $this> */
    public function files(): BelongsToMany
    {
        return $this->belongsToMany(File::class, 'design_version_files', 'design_version_id', 'file_id')->withPivot('sort_order')->orderBy('design_version_files.sort_order');
    }

    public function isImmutable(): bool
    {
        return in_array($this->status, ['APPROVED', 'SUPERSEDED'], true);
    }
}
