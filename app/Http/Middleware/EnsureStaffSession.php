<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * يُنهي جلسة الموظف فورًا عند: تعطيل الحساب، أو تغيير session_version (تغيير دور/إعادة تعيين) — §40.36.
 */
class EnsureStaffSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('staff')->user();

        if ($user) {
            $sv = $request->session()->get('session_version');
            if (! $user->isActive() || ($sv !== null && (int) $sv !== (int) $user->session_version)) {
                Auth::guard('staff')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'error' => ['code' => 'UNAUTHENTICATED', 'message' => 'انتهت الجلسة. سجّل الدخول مرة أخرى.']], 401);
                }

                return redirect()->route('login')->withErrors(['email' => 'انتهت جلستك. سجّل الدخول مرة أخرى.']);
            }
        }

        return $next($request);
    }
}
