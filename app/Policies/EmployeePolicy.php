<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\User;

/**
 * سياسة إدارة الموظفين وصلاحياتهم — منع التصعيد الإداري (BR-072/073، §4.5):
 *  - Admin لا ينشئ Admin ولا يرقّي ولا يعدّل Admin آخر ولا نفسه ولا Super Admin.
 *  - Super Admin وحده يدير مستويات Admin. ولا أحد ينشئ Super Admin من الواجهة.
 *  - الموظف العادي لا يغيّر دوره/حالته/صلاحياته بنفسه.
 */
class EmployeePolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->hasPermission('employees.view');
    }

    public function view(User $actor, User $target): bool
    {
        return $actor->hasPermission('employees.view') || $actor->is($target);
    }

    /** إنشاء موظف بدور معيّن. */
    public function create(User $actor, Role $role): bool
    {
        if ($role === Role::SuperAdmin) {
            return false;
        }

        return $role->isAdminLevel()
            ? $actor->hasPermission('employees.manage_admins')
            : $actor->hasPermission('employees.manage_staff');
    }

    /** تعديل بيانات موظف (الاسم/البريد/الهاتف/الحالة/كلمة المرور) — ليس نفسه هنا. */
    public function update(User $actor, User $target): bool
    {
        if ($actor->is($target)) {
            return false; // بياناتي من «ملفي الشخصي»، ولا أغيّر دوري/حالتي
        }

        return $this->manages($actor, $target, 'employees');
    }

    /** مزامنة الصلاحيات الإضافية (S-067). */
    public function managePermissions(User $actor, User $target): bool
    {
        if ($actor->is($target)) {
            return false; // لا أعدّل صلاحياتي بنفسي
        }

        return $this->manages($actor, $target, 'permissions');
    }

    private function manages(User $actor, User $target, string $area): bool
    {
        $targetRole = $target->roleEnum();
        if (! $targetRole || $targetRole === Role::SuperAdmin) {
            return false; // Super Admin لا يُدار من الواجهة
        }

        return $targetRole->isAdminLevel()
            ? $actor->hasPermission("$area.manage_admins")
            : $actor->hasPermission("$area.manage_staff");
    }
}
