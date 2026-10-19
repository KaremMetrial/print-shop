<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\Audit\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $u = $request->user();
        $roles = ['SUPER_ADMIN' => 'مدير النظام الأعلى', 'ADMIN' => 'مدير النظام', 'DATA_ENTRY' => 'مدخل بيانات', 'DESIGNER' => 'مصمم', 'ACCOUNTANT' => 'محاسب'];
        $code = $u->roleEnum()->value ?? '';
        $props = [
            'profile' => [
                'name' => $u->name, 'email' => $u->email, 'phone' => $u->phone, 'role' => $roles[$code] ?? 'موظف', 'status' => $u->status,
                'employee_no' => 'EMP-'.str_pad((string) $u->id, 3, '0', STR_PAD_LEFT), 'last_login_at' => $u->last_login_at?->toIso8601String(),
                'device' => $this->device((string) $request->userAgent()),
            ],
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props['profile'] = array_replace($props['profile'], ['name' => 'أحمد حسن إبراهيم', 'email' => 'ahmed.hassan@aletqan.eg', 'phone' => '010 1234 5678', 'role' => 'مدير النظام', 'employee_no' => 'EMP-001', 'last_login_at' => '2025-06-18T08:42:00+03:00', 'device' => 'Windows • Chrome']);
        }

        return Inertia::render('settings/profile', $props);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $u = $request->user();
        $before = ['name' => $u->name, 'phone' => $u->phone];
        $u->update($request->safe()->only(['name', 'phone']));
        [$old, $new] = app(AuditService::class)->diff($before, ['name' => $u->name, 'phone' => $u->phone]);
        if ($new) {
            app(AuditService::class)->record('employee.profile_updated', $u, $old, $new);
        }

        return back()->with('success', 'تم حفظ التغييرات.');
    }

    private function device(string $ua): string
    {
        $os = str_contains($ua, 'Windows') ? 'Windows' : (str_contains($ua, 'Mac') ? 'macOS' : (str_contains($ua, 'Android') ? 'Android' : (str_contains($ua, 'iPhone') ? 'iOS' : (str_contains($ua, 'Linux') ? 'Linux' : 'جهاز'))));
        $br = str_contains($ua, 'Edg') ? 'Edge' : (str_contains($ua, 'Chrome') ? 'Chrome' : (str_contains($ua, 'Firefox') ? 'Firefox' : (str_contains($ua, 'Safari') ? 'Safari' : 'متصفح')));

        return "{$os} • {$br}";
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
