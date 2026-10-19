<?php

namespace App\Actions\Employees;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use App\Models\Permission;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Support\Auth\Permissions;
use Illuminate\Support\Facades\DB;

class SyncEmployeePermissions
{
    public function __construct(private AuditService $audit) {}

    /**
     * @param  list<string>  $grant  صلاحيات إضافية فوق الدور
     * @param  list<string>  $revoke  صلاحيات يُسحبها من الدور
     */
    public function handle(User $actor, User $target, array $grant, array $revoke): User
    {
        $role = $target->roleEnum();
        $known = Permissions::all();

        foreach (array_merge($grant, $revoke) as $code) {
            if (! in_array($code, $known, true)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, "صلاحية غير معروفة: {$code}");
            }
        }
        foreach ($grant as $code) {
            // المنفّذ لا يمنح ما لا يملكه، ولا ما هو محظور بقيد ثابت على دور الهدف (S-067).
            if (! $actor->hasPermission($code) || ($role && Permissions::isHardDenied($role, $code))) {
                throw new BusinessException(ErrorCode::INSUFFICIENT_PERMISSION, "لا يمكن منح الصلاحية: {$code}");
            }
        }

        return DB::transaction(function () use ($actor, $target, $grant, $revoke) {
            $before = $this->current($target);
            $ids = Permission::pluck('id', 'code');

            $target->permissionOverrides()->detach();
            foreach ($grant as $code) {
                $target->permissionOverrides()->attach($ids[$code], ['granted' => true, 'granted_by' => $actor->id, 'granted_at' => now()]);
            }
            foreach (array_diff($revoke, $grant) as $code) {
                $target->permissionOverrides()->attach($ids[$code], ['granted' => false, 'granted_by' => $actor->id, 'granted_at' => now()]);
            }

            $target->increment('session_version'); // الصلاحيات الجديدة تسري فورًا
            $target->flushPermissionCache();
            $after = $this->current($target->refresh());
            $this->audit->record('employee.permissions_changed', $target, $before, $after, null);

            return $target;
        });
    }

    /** @return array{grant:list<string>,revoke:list<string>} */
    private function current(User $u): array
    {
        $rows = DB::table('user_permission_overrides as o')->join('permissions as p', 'p.id', '=', 'o.permission_id')
            ->where('o.user_id', $u->id)->get(['p.code', 'o.granted']);

        return [
            'grant' => $rows->where('granted', 1)->pluck('code')->sort()->values()->all(),
            'revoke' => $rows->where('granted', 0)->pluck('code')->sort()->values()->all(),
        ];
    }
}
