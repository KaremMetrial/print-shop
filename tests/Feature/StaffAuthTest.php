<?php

use App\Models\AuditLog;
use App\Models\User;

function loginAs(User $u, string $password = 'password')
{
    return test()->post('/login', ['email' => $u->email, 'password' => $password]);
}

it('logs an active staff user in, stamps last_login and audits it', function () {
    $u = User::factory()->admin()->create();
    loginAs($u)->assertRedirect('/dashboard');
    $this->assertAuthenticatedAs($u, 'staff');
    expect($u->fresh()->last_login_at)->not->toBeNull()
        ->and(AuditLog::where('action', 'auth.login')->where('actor_id', $u->id)->exists())->toBeTrue();
});

it('gives a generic error for wrong credentials and never reveals the account', function () {
    $u = User::factory()->admin()->create();
    loginAs($u, 'wrong')->assertSessionHasErrors(['email' => __('auth.failed')]);
    $this->post('/login', ['email' => 'nobody@x.test', 'password' => 'x'])->assertSessionHasErrors(['email' => __('auth.failed')]);
    $this->assertGuest('staff');
    expect(AuditLog::where('action', 'auth.login_failed')->count())->toBe(2)
        ->and(AuditLog::all()->pluck('new_values')->map(fn ($v) => json_encode($v))->join(''))->not->toContain('wrong');
});

it('blocks an inactive account only after the right password (S-001)', function () {
    $u = User::factory()->admin()->inactive()->create();
    loginAs($u)->assertSessionHasErrors(['email' => 'حساب معطّل: تواصل مع مسؤول النظام لتفعيله.']);
    loginAs($u, 'wrong')->assertSessionHasErrors(['email' => __('auth.failed')]);
    $this->assertGuest('staff');
});

it('blocks a user that has no role', function () {
    $u = User::factory()->create();
    loginAs($u)->assertSessionHasErrors('email');
    $this->assertGuest('staff');
});

it('rate limits repeated failures', function () {
    $u = User::factory()->admin()->create();
    for ($i = 0; $i < 5; $i++) {
        loginAs($u, 'bad');
    }
    loginAs($u, 'bad')->assertSessionHasErrors('email');
    loginAs($u)->assertSessionHasErrors('email'); // حتى بكلمة مرور صحيحة وهو محظور مؤقتًا
    $this->assertGuest('staff');
});

it('kills the session of a user deactivated while signed in (§40.36)', function () {
    $u = User::factory()->admin()->create();
    loginAs($u);
    $this->get('/dashboard')->assertOk();

    $u->update(['status' => 'INACTIVE']);
    app('auth')->forgetGuards(); // نفس سلوك طلب جديد في الإنتاج
    $this->get('/dashboard')->assertRedirect('/login');
    $this->assertGuest('staff');
});

it('kills the session when session_version changes', function () {
    $u = User::factory()->admin()->create();
    loginAs($u);
    $this->get('/dashboard')->assertOk();
    $u->increment('session_version');
    app('auth')->forgetGuards();
    $this->get('/dashboard')->assertRedirect('/login');
});

it('shares role and permissions with the UI without leaking secrets', function () {
    $u = User::factory()->designer()->create();
    loginAs($u);
    $this->get('/dashboard')->assertInertia(fn ($page) => $page
        ->where('auth.user.role', 'designer')
        ->where('auth.user.role_label', 'مصمم')
        ->has('auth.user.permissions')
        ->missing('auth.user.password')
        ->missing('auth.user.remember_token'));
});

it('audits logout', function () {
    $u = User::factory()->admin()->create();
    loginAs($u);
    $this->post('/logout')->assertRedirect('/');
    expect(AuditLog::where('action', 'auth.logout')->exists())->toBeTrue();
});
