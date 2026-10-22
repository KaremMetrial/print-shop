<?php

use App\Models\User;

it('installs the first super admin once and never creates demo accounts', function () {
    $this->artisan('pbms:install', ['--name' => 'المدير', '--email' => 'owner@example.com', '--password' => 'Strong-Password-123'])->assertSuccessful();
    $u = User::where('email', 'owner@example.com')->firstOrFail();
    expect($u->roleEnum()?->value)->toBe('SUPER_ADMIN')->and($u->hasPermission('employees.manage_admins'))->toBeTrue()->and(User::where('email', 'like', '%@pbms.test')->count())->toBe(0);
    $this->artisan('pbms:install', ['--name' => 'آخر', '--email' => 'other@example.com', '--password' => 'Strong-Password-123'])->assertSuccessful();
    expect(User::where('email', 'other@example.com')->exists())->toBeFalse();
});

it('rejects weak passwords', function () {
    $this->artisan('pbms:install', ['--name' => 'م', '--email' => 'a@b.com', '--password' => 'short'])->assertFailed();
});
