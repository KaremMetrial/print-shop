<?php

namespace App\Models;

use App\Enums\NotificationMode;
use App\Support\PhoneNormalizer;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $phone_normalized
 * @property string $phone_display
 * @property bool $platform_access_enabled
 * @property NotificationMode $notification_mode
 * @property Carbon|null $created_at
 */
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['platform_access_enabled' => 'boolean', 'notification_mode' => NotificationMode::class];
    }

    /** رقم العميل المعروض: CUS-0104 */
    public function code(): string
    {
        return 'CUS-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return BelongsTo<PricingTier, $this> */
    public function pricingTier(): BelongsTo
    {
        return $this->belongsTo(PricingTier::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasOne<CustomerCredential, $this> */
    public function credential(): HasOne
    {
        return $this->hasOne(CustomerCredential::class);
    }

    /** @param Builder<Customer> $q */
    public function scopeSearch(Builder $q, ?string $term): void
    {
        $term = trim((string) $term);
        if ($term === '') {
            return;
        }
        $digits = PhoneNormalizer::normalize($term);
        $q->where(function (Builder $w) use ($term, $digits) {
            $w->where('name', 'like', "%{$term}%");
            if (preg_match('/\d{3,}/', $term)) {
                $w->orWhere('phone_normalized', 'like', '%'.preg_replace('/\D+/', '', $digits ?? $term).'%');
            }
        });
    }
}
