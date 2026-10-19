<?php

namespace App\Models;

use App\Enums\DesignerAvailability;
use App\Enums\Role as RoleEnum;
use App\Support\Auth\Permissions;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * @property Carbon|null $created_at
 * @property Carbon|null $last_login_at
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ACTIVE = 'ACTIVE';

    public const INACTIVE = 'INACTIVE';

    /** @var list<string> */
    protected $fillable = ['name', 'email', 'phone', 'password', 'role_id', 'status', 'created_by'];

    /** @var list<string> */
    protected $hidden = ['password', 'remember_token'];

    /** @var array<string, mixed> */
    protected $attributes = ['status' => self::ACTIVE, 'session_version' => 1];

    /** @var list<string>|null */
    private ?array $effectivePermissions = null;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'session_version' => 'integer',
        ];
    }

    /** @return BelongsTo<Role, $this> */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /** @return BelongsToMany<Permission, $this> */
    public function permissionOverrides(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permission_overrides')->withPivot(['granted', 'granted_by', 'granted_at']);
    }

    /** @return BelongsToMany<DesignerSpecialty, $this> */
    public function specialties(): BelongsToMany
    {
        return $this->belongsToMany(DesignerSpecialty::class, 'designer_specialty_memberships', 'designer_id', 'specialty_id');
    }

    public function availabilityStatus(): ?DesignerAvailability
    {
        $v = DB::table('designer_availability')->where('designer_id', $this->id)->value('status');

        return $v ? DesignerAvailability::from($v) : null;
    }

    public function isDesigner(): bool
    {
        return $this->roleEnum() === RoleEnum::Designer;
    }

    public function roleEnum(): ?RoleEnum
    {
        return $this->role_id ? RoleEnum::tryFrom($this->role->code) : null;
    }

    public function isActive(): bool
    {
        return $this->status === self::ACTIVE;
    }

    public function isSuperAdmin(): bool
    {
        return $this->roleEnum() === RoleEnum::SuperAdmin;
    }

    public function isAdminLevel(): bool
    {
        return $this->roleEnum()?->isAdminLevel() ?? false;
    }

    /**
     * الصلاحيات الفعلية = صلاحيات الدور + التفويضات الممنوحة − الملغاة، مع تطبيق القيود الثابتة.
     *
     * @return list<string>
     */
    public function permissionCodes(): array
    {
        if ($this->effectivePermissions !== null) {
            return $this->effectivePermissions;
        }
        $role = $this->roleEnum();
        if (! $role || ! $this->isActive()) {
            return $this->effectivePermissions = [];
        }
        $set = array_flip($this->role->permissions()->pluck('code')->all());
        foreach ($this->permissionOverrides()->get() as $p) {
            if ($p->getAttribute('pivot')?->granted) {
                $set[$p->code] = true;
            } else {
                unset($set[$p->code]);
            }
        }
        $codes = array_values(array_filter(array_keys($set), fn (string $c) => ! Permissions::isHardDenied($role, $c)));

        return $this->effectivePermissions = $codes;
    }

    public function hasPermission(string $code): bool
    {
        return in_array($code, $this->permissionCodes(), true);
    }

    public function flushPermissionCache(): void
    {
        $this->effectivePermissions = null;
    }
}
