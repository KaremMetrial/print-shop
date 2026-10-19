<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * حسابات تجريبية ثابتة (تطوير فقط، ويُتجاهل في الإنتاج). آمن للتكرار.
 * كلمة المرور لكل الحسابات: Pbms@12345
 */
class FixedUsersSeeder extends Seeder
{
    public const PASSWORD = 'Pbms@12345';

    public const USERS = [
        ['المدير العام', 'superadmin@pbms.test', RoleEnum::SuperAdmin],
        ['مدير النظام', 'admin@pbms.test', RoleEnum::Admin],
        ['مدخل البيانات', 'dataentry@pbms.test', RoleEnum::DataEntry],
        ['المصمم أحمد', 'designer@pbms.test', RoleEnum::Designer],
        ['المحاسب', 'accountant@pbms.test', RoleEnum::Accountant],
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command->warn('تم تجاهل FixedUsersSeeder في بيئة الإنتاج.');

            return;
        }

        foreach (self::USERS as [$name, $email, $role]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make(self::PASSWORD),
                    'role_id' => Role::where('code', $role->value)->firstOrFail()->id,
                    'status' => User::ACTIVE,
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
