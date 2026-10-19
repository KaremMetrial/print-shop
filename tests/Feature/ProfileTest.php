<?php

use App\Models\AuditLog;
use App\Models\User;

it('lets staff update only name and phone, never email or role', function () {
    $u = User::factory()->dataEntry()->create(['email' => 'x@pbms.test']);
    $role = $u->role_id;
    $this->actingAs($u)->patch('/settings/profile', ['name' => 'اسم جديد', 'phone' => '010 1234 5678', 'email' => 'evil@x.com', 'role_id' => 1])->assertRedirect();
    $u->refresh();
    expect($u->name)->toBe('اسم جديد')->and($u->phone)->toBe('010 1234 5678')->and($u->email)->toBe('x@pbms.test')->and($u->role_id)->toBe($role);
    expect(AuditLog::where('action', 'employee.profile_updated')->exists())->toBeTrue();
});

it('validates the profile and renders the page', function () {
    $u = User::factory()->admin()->create();
    $this->actingAs($u)->patch('/settings/profile', ['name' => '', 'phone' => 'abc'])->assertSessionHasErrors(['name', 'phone']);
    $this->get('/settings/profile')->assertOk()->assertInertia(fn ($p) => $p->component('settings/profile')->where('profile.email', $u->email));
});
