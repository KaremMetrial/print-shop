<?php

use App\Enums\Role;
use App\Models\Permission;
use App\Models\User;
use App\Support\Auth\Permissions;
use Illuminate\Support\Facades\Gate;

it('seeds every permission key and five roles', function () {
    expect(Permission::count())->toBe(count(Permissions::all()))
        ->and(App\Models\Role::count())->toBe(5);
});

it('gives super admin everything and admin everything except super-admin-only', function () {
    $sa = User::factory()->superAdmin()->create();
    $ad = User::factory()->admin()->create();
    expect($sa->hasPermission('employees.manage_admins'))->toBeTrue()
        ->and($ad->hasPermission('orders.cancel'))->toBeTrue()
        ->and($ad->hasPermission('employees.manage_admins'))->toBeFalse()
        ->and($ad->hasPermission('permissions.manage_admins'))->toBeFalse()
        ->and($ad->hasPermission('settings.security.manage'))->toBeFalse();
});

it('keeps data entry inside its limits (BR-053/070 and §3.3)', function () {
    $u = User::factory()->dataEntry()->create();
    expect($u->hasPermission('orders.create'))->toBeTrue()
        ->and($u->hasPermission('payments.create'))->toBeTrue()
        ->and($u->hasPermission('orders.cancel'))->toBeFalse()
        ->and($u->hasPermission('payments.correct'))->toBeFalse()
        ->and($u->hasPermission('design.chat.send_as_designer'))->toBeFalse()
        ->and($u->hasPermission('customers.view_ledger'))->toBeFalse()
        ->and($u->hasPermission('dashboard.financial.view'))->toBeFalse()
        ->and($u->hasPermission('orders.discount.apply'))->toBeFalse();
});

it('lets admin delegate only the three approved powers to data entry', function () {
    $u = User::factory()->dataEntry()->create();
    $perm = Permission::where('code', 'orders.discount.apply')->first();
    $u->permissionOverrides()->attach($perm->id, ['granted' => true, 'granted_by' => User::factory()->admin()->create()->id]);
    expect($u->fresh()->hasPermission('orders.discount.apply'))->toBeTrue();
});

it('never lets an override beat a hard restriction', function () {
    $u = User::factory()->dataEntry()->create();
    foreach (['payments.correct', 'orders.cancel', 'design.chat.send_as_designer'] as $code) {
        $u->permissionOverrides()->attach(Permission::where('code', $code)->first()->id, ['granted' => true]);
    }
    $u = $u->fresh();
    expect($u->hasPermission('payments.correct'))->toBeFalse()
        ->and($u->hasPermission('orders.cancel'))->toBeFalse()
        ->and($u->hasPermission('design.chat.send_as_designer'))->toBeFalse();
});

it('keeps designers away from money (BR-071)', function () {
    $u = User::factory()->designer()->create();
    foreach (['orders.pricing.edit', 'payments.create', 'customers.view_balance', 'invoices.view', 'reports.financial.view'] as $c) {
        expect($u->hasPermission($c))->toBeFalse($c);
    }
    expect($u->hasPermission('design.tasks.view_own'))->toBeTrue();
});

it('revokes a role permission with a granted=false override', function () {
    $u = User::factory()->dataEntry()->create();
    $u->permissionOverrides()->attach(Permission::where('code', 'customers.create')->first()->id, ['granted' => false]);
    expect($u->fresh()->hasPermission('customers.create'))->toBeFalse();
});

it('gives an inactive or role-less user no permissions', function () {
    expect(User::factory()->admin()->inactive()->create()->hasPermission('orders.view'))->toBeFalse()
        ->and(User::factory()->create()->hasPermission('orders.view'))->toBeFalse();
});

it('resolves permission abilities through the Gate', function () {
    $acc = User::factory()->accountant()->create();
    expect(Gate::forUser($acc)->allows('payments.correct'))->toBeTrue()
        ->and(Gate::forUser($acc)->allows('orders.cancel'))->toBeFalse();
});

it('has a role enum label and ui key for every role', function () {
    foreach (Role::cases() as $r) {
        expect($r->label())->not->toBeEmpty()->and($r->uiKey())->not->toBeEmpty();
    }
});
