<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * جلسة العميل المسجّل (منفصلة تمامًا عن جلسة الموظفين). تُبطَل فور تعطيل الوصول أو تغيير كلمة المرور (session_version).
 */
class PortalAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->session()->get('portal.customer_id');
        $customer = $id ? Customer::with('credential')->find($id) : null;
        $ok = $customer && $customer->platform_access_enabled && $customer->credential && $customer->credential->status === 'ACTIVE'
            && $customer->credential->session_version === $request->session()->get('portal.sv');
        if (! $ok) {
            $request->session()->forget(['portal.customer_id', 'portal.sv']);

            return redirect('/portal/login');
        }
        $request->attributes->set('portal_customer', $customer);

        return $next($request);
    }
}
