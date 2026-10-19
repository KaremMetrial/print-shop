<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\Permission;
use App\Models\Role;
use App\Support\Auth\Permissions;
use Illuminate\Database\Seeder;

/** يزامن الأدوار والصلاحيات من الكود (آمن للتكرار، ويعمل في الإنتاج). */
class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $ids = [];
        foreach (Permissions::CATALOG as $module => $perms) {
            foreach ($perms as $code => $desc) {
                $ids[$code] = Permission::updateOrCreate(['code' => $code], ['module' => $module, 'description' => $desc])->id;
            }
        }
        foreach (RoleEnum::cases() as $role) {
            $model = Role::updateOrCreate(['code' => $role->value], ['name' => $role->label(), 'is_system_role' => true]);
            $model->permissions()->sync(array_map(fn (string $c) => $ids[$c], Permissions::forRole($role)));
        }
    }
}
