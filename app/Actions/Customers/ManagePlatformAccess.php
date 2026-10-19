<?php

namespace App\Actions\Customers;

use App\Models\Customer;
use App\Services\Audit\AuditService;
use App\Services\Notifications\NotificationService;
use App\Support\TempPassword;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/** تفعيل/إيقاف/إعادة تعيين دخول المنصة. لا يوجد «عرض كلمة المرور الحالية» ولا تغيير ذاتي (BR-007). */
class ManagePlatformAccess
{
    public function __construct(private AuditService $audit) {}

    /** يرجع كلمة المرور المؤقتة (تُعرض مرة واحدة فقط ولا تُخزَّن ولا تُسجَّل). */
    public function enable(Customer $customer): string
    {
        return $this->issue($customer, 'customer.platform_access_enabled', enable: true);
    }

    public function resetPassword(Customer $customer): string
    {
        return $this->issue($customer, 'customer.password_reset', enable: false);
    }

    public function disable(Customer $customer): void
    {
        DB::transaction(function () use ($customer) {
            $customer = Customer::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            $customer->update(['platform_access_enabled' => false]);
            $customer->credential?->update(['status' => 'DISABLED']);
            $customer->credential?->increment('session_version'); // إنهاء جلساته فورًا
            $this->audit->record('customer.platform_access_disabled', $customer);
        });
    }

    private function issue(Customer $customer, string $action, bool $enable): string
    {
        $plain = TempPassword::generate();

        DB::transaction(function () use ($customer, $action, $enable, $plain) {
            $customer = Customer::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            $cred = $customer->credential()->firstOrNew();
            $cred->fill([
                'password_hash' => Hash::make($plain),
                'status' => 'ACTIVE',
                'password_created_at' => now(),
                'last_reset_at' => $enable && ! $cred->exists ? null : now(),
                'session_version' => ($cred->session_version ?? 0) + 1,
            ])->save();
            if ($enable) {
                $customer->update(['platform_access_enabled' => true]);
            }
            if ($action === 'customer.password_reset') {
                DB::table('password_recovery_requests')->where('customer_id', $customer->id)->whereIn('status', ['OPEN', 'CLAIMED'])->update(['status' => 'COMPLETED', 'completed_at' => now()]);
                app(NotificationService::class)->resolveByKey("recovery:{$customer->id}", null, 'أُعيد تعيين كلمة المرور');
            }
            $this->audit->record($action, $customer);
        });

        return $plain;
    }
}
