<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\Notifications\NotificationService;
use App\Support\PhoneNormalizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

/** دخول العميل المسجّل (S-079) واسترجاع كلمة المرور (S-080): بالهاتف وكلمة مرور ينشئها موظف (BR-007). لا enumeration. */
class PortalAuthController extends Controller
{
    private const GENERIC = 'بيانات الدخول غير صحيحة أو الحساب غير مفعّل. تواصل مع المطبعة.';

    public function login(): Response
    {
        return Inertia::render('portal/login');
    }

    public function store(Request $request): RedirectResponse
    {
        $d = $request->validate(['phone' => ['required', 'string', 'max:30'], 'password' => ['required', 'string', 'max:100']]);
        $phone = PhoneNormalizer::normalize($d['phone']) ?? '';
        $key = 'portal-login:'.sha1($phone.'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors(['phone' => 'محاولات كثيرة. حاول بعد قليل.']);
        }
        $c = $phone ? Customer::with('credential')->where('phone_normalized', $phone)->first() : null;
        $valid = $c && $c->platform_access_enabled && $c->credential && $c->credential->status === 'ACTIVE' && Hash::check($d['password'], $c->credential->password_hash);
        if (! $valid) {
            RateLimiter::hit($key, 300);
            if ($c) {
                DB::table('audit_logs')->insert(['actor_type' => 'customer', 'actor_id' => $c->id, 'actor_role_snapshot' => 'CUSTOMER', 'entity_type' => $c->getMorphClass(), 'entity_id' => $c->id, 'action' => 'customer.login_failed', 'created_at' => now()]);
            }

            return back()->withErrors(['phone' => self::GENERIC]);
        }
        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->session()->put(['portal.customer_id' => $c->id, 'portal.sv' => $c->credential->session_version]);
        $c->credential->update(['last_login_at' => now()]);
        DB::table('audit_logs')->insert(['actor_type' => 'customer', 'actor_id' => $c->id, 'actor_role_snapshot' => 'CUSTOMER', 'entity_type' => $c->getMorphClass(), 'entity_id' => $c->id, 'action' => 'customer.login', 'created_at' => now()]);

        return redirect('/portal');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget(['portal.customer_id', 'portal.sv']);
        $request->session()->regenerateToken();

        return redirect('/portal/login');
    }

    public function recover(): Response
    {
        return Inertia::render('portal/recover');
    }

    /** الاستجابة متطابقة دائمًا (لا نكشف وجود الرقم). الطلب يُنشأ فقط لعميل له وصول. */
    public function recoverStore(Request $request, NotificationService $n): RedirectResponse
    {
        $d = $request->validate(['phone' => ['required', 'string', 'max:30']]);
        $phone = PhoneNormalizer::normalize($d['phone']) ?? '';
        $key = 'portal-recover:'.sha1($request->ip());
        if (! RateLimiter::tooManyAttempts($key, 5)) {
            RateLimiter::hit($key, 600);
            $c = $phone ? Customer::where('phone_normalized', $phone)->where('platform_access_enabled', true)->first() : null;
            if ($c && ! DB::table('password_recovery_requests')->where('customer_id', $c->id)->whereIn('status', ['OPEN', 'CLAIMED'])->exists()) {
                DB::table('password_recovery_requests')->insert(['customer_id' => $c->id, 'status' => 'OPEN', 'created_at' => now()]);
                $id = $n->openAction("recovery:{$c->id}", 'PASSWORD_RECOVERY', "استرجاع كلمة مرور العميل {$c->name}", $c->name, null, "/customers/{$c->id}/access");
                if ($id) {
                    $n->notify(['customers.password_reset.handle'], 'ACTION_REQUIRED', "طلب استرجاع كلمة مرور — {$c->name}", null, "/customers/{$c->id}/access", $id);
                }
            }
        }

        return back()->with('success', 'إن كان الرقم مسجّلًا ومفعّلًا فسيتواصل معك فريق المطبعة بكلمة مرور جديدة.');
    }
}
