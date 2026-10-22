<?php

namespace App\Console\Commands;

use App\Enums\Role as RoleEnum;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

/** تهيئة أول تشغيل في الإنتاج: يزامن الأدوار/الصلاحيات وينشئ أول مدير عام (مرة واحدة). لا يُنشئ أي حسابات تجريبية. */
class InstallPbms extends Command
{
    protected $signature = 'pbms:install {--name=} {--email=} {--password=}';

    protected $description = 'مزامنة الصلاحيات وإنشاء أول مدير عام للنظام';

    public function handle(): int
    {
        $this->call('db:seed', ['--class' => RbacSeeder::class, '--force' => true]);
        $super = Role::where('code', RoleEnum::SuperAdmin->value)->first();
        if ($super && User::where('role_id', $super->id)->exists()) {
            $this->info('يوجد مدير عام بالفعل — لم يُنشأ حساب جديد.');

            return self::SUCCESS;
        }
        $name = $this->option('name') ?: $this->ask('اسم المدير العام');
        $email = $this->option('email') ?: $this->ask('البريد الإلكتروني');
        $password = $this->option('password') ?: $this->secret('كلمة المرور (12 حرفًا على الأقل)');
        $v = Validator::make(compact('name', 'email', 'password'), ['name' => ['required', 'string', 'max:120'], 'email' => ['required', 'email', 'unique:users,email'], 'password' => ['required', 'string', 'min:12']]);
        if ($v->fails()) {
            foreach ($v->errors()->all() as $e) {
                $this->error($e);
            }

            return self::FAILURE;
        }
        User::create(['name' => $name, 'email' => strtolower($email), 'password' => Hash::make($password), 'role_id' => $super?->id, 'status' => 'ACTIVE']);
        $this->info("تم إنشاء المدير العام ({$email}). سجّل الدخول وغيّر اسم المطبعة من الإعدادات.");

        return self::SUCCESS;
    }
}
