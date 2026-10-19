<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $audit = app(AuditService::class);
        $user = User::where('email', $this->string('email')->lower()->toString())->first();

        if (! $user || ! Hash::check($this->string('password')->toString(), $user->password)) {
            RateLimiter::hit($this->throttleKey());
            $audit->record('auth.login_failed', null, [], ['email' => $this->string('email')->toString()]);

            throw ValidationException::withMessages(['email' => __('auth.failed')]);
        }

        // بعد صحة كلمة المرور فقط نكشف حالة الحساب (S-001: الحساب معطّل / بلا دور).
        if (! $user->isActive() || ! $user->role_id) {
            $audit->record('auth.login_blocked', $user, [], ['reason' => $user->isActive() ? 'no_role' : 'inactive']);

            throw ValidationException::withMessages(['email' => 'حساب معطّل: تواصل مع مسؤول النظام لتفعيله.']);
        }

        Auth::guard('staff')->login($user);
        RateLimiter::clear($this->throttleKey());

        $user->forceFill(['last_login_at' => now()])->save();
        $this->session()->put('session_version', $user->session_version);
        $audit->record('auth.login', $user);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
