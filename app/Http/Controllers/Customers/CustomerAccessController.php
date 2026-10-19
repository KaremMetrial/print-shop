<?php

namespace App\Http\Controllers\Customers;

use App\Actions\Customers\ManagePlatformAccess;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAccessController extends Controller
{
    public function show(Request $request, Customer $customer, CustomerController $profile): Response
    {
        Gate::authorize('view', $customer);
        $customer->load('pricingTier:id,name', 'credential');
        $u = $request->user();

        return Inertia::render('customers/access', [
            'customer' => $profile->profile($customer, $request),
            'access' => [
                'enabled' => $customer->platform_access_enabled,
                'status_label' => $customer->credential?->status === 'ACTIVE' ? 'نشط' : ($customer->platform_access_enabled ? 'نشط' : 'موقوف'),
                'phone' => $customer->phone_display,
                'last_reset_at' => $customer->credential?->last_reset_at?->toIso8601String(),
                'notification' => $customer->notification_mode->label(),
                'last_login_at' => $customer->credential?->last_login_at?->toIso8601String(),
            ],
            'can' => ['manage' => Gate::forUser($u)->allows('managePlatformAccess', $customer), 'reset' => Gate::forUser($u)->allows('resetPassword', $customer)],
            'generated_password' => session('generated_password'),
        ]);
    }

    public function enable(Customer $customer, ManagePlatformAccess $action): RedirectResponse
    {
        Gate::authorize('managePlatformAccess', $customer);

        return back()->with('generated_password', $action->enable($customer))->with('success', 'تم إنشاء كلمة مرور أولية. تظهر مرة واحدة فقط.');
    }

    public function disable(Customer $customer, ManagePlatformAccess $action): RedirectResponse
    {
        Gate::authorize('managePlatformAccess', $customer);
        $action->disable($customer);

        return back()->with('success', 'تم تحديث حالة دخول المنصة.');
    }

    public function resetPassword(Customer $customer, ManagePlatformAccess $action): RedirectResponse
    {
        Gate::authorize('resetPassword', $customer);
        abort_unless($customer->platform_access_enabled, 422, 'دخول المنصة غير مفعّل لهذا العميل.');

        return back()->with('generated_password', $action->resetPassword($customer))->with('success', 'تم إنشاء كلمة مرور مؤقتة جديدة. تظهر مرة واحدة فقط.');
    }
}
