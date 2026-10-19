<?php

use App\Models\AuditLog;
use App\Models\DesignerSpecialty;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

function pw(): string
{
    return 'Str0ngPass99';
}

function payload(array $o = []): array
{
    $sp = DesignerSpecialty::firstOrCreate(['name' => 'بطاقات أعمال']);

    return array_merge(['name' => 'منى إبراهيم', 'email' => 'mona@pbms.test', 'phone' => '01012345678', 'role' => 'DESIGNER', 'password' => pw(), 'specialty_ids' => [$sp->id]], $o);
}

// ── منع التصعيد الإداري (TC-003/004/005، BR-072/073) ─────────────────────────
it('lets super admin create an admin (TC-004) and audits it without the password', function () {
    $sa = User::factory()->superAdmin()->create();
    $this->actingAs($sa)->post('/employees', payload(['role' => 'ADMIN', 'email' => 'a2@pbms.test']))->assertRedirect();
    $new = User::where('email', 'a2@pbms.test')->first();
    expect($new->roleEnum()->value)->toBe('ADMIN')->and($new->created_by)->toBe($sa->id);
    $log = AuditLog::where('action', 'employee.created')->first();
    expect(json_encode($log->new_values))->not->toContain(pw());
});

it('forbids admin from creating an admin (TC-003)', function () {
    $this->actingAs(User::factory()->admin()->create())->post('/employees', payload(['role' => 'ADMIN']))->assertForbidden();
    expect(User::where('email', 'mona@pbms.test')->exists())->toBeFalse();
});

it('never creates a super admin from the UI, even for super admin', function () {
    $this->actingAs(User::factory()->superAdmin()->create())->post('/employees', payload(['role' => 'SUPER_ADMIN']))->assertForbidden();
});

it('lets admin create regular staff', function () {
    foreach (['DATA_ENTRY', 'DESIGNER', 'ACCOUNTANT'] as $i => $role) {
        $this->actingAs(User::factory()->admin()->create())->post('/employees', payload(['role' => $role, 'email' => "s{$i}@pbms.test"]))->assertRedirect();
    }
    expect(User::whereIn('email', ['s0@pbms.test', 's1@pbms.test', 's2@pbms.test'])->count())->toBe(3);
});

it('forbids admin from editing another admin, a super admin, or themselves (TC-005)', function () {
    $admin = User::factory()->admin()->create();
    $other = User::factory()->admin()->create();
    $sa = User::factory()->superAdmin()->create();

    $this->actingAs($admin);
    $this->patch("/employees/{$other->id}", ['name' => 'x', 'email' => $other->email])->assertForbidden();
    $this->patch("/employees/{$sa->id}", ['name' => 'x', 'email' => $sa->email])->assertForbidden();
    $this->patch("/employees/{$admin->id}", ['name' => 'x', 'email' => $admin->email, 'role' => 'SUPER_ADMIN'])->assertForbidden();
    $this->put("/employees/{$admin->id}/permissions", ['grant' => [], 'revoke' => []])->assertForbidden();
    $this->post("/employees/{$other->id}/deactivate")->assertForbidden();
});

it('stops an admin from promoting staff to admin by changing role', function () {
    $staff = User::factory()->dataEntry()->create();
    $this->actingAs(User::factory()->admin()->create())->patch("/employees/{$staff->id}", ['name' => $staff->name, 'email' => $staff->email, 'role' => 'ADMIN'])->assertForbidden();
    expect($staff->fresh()->roleEnum()->value)->toBe('DATA_ENTRY');
});

it('ignores privileged fields smuggled into the payload', function () {
    $staff = User::factory()->dataEntry()->create();
    $this->actingAs(User::factory()->admin()->create())->patch("/employees/{$staff->id}", [
        'name' => 'اسم جديد', 'email' => $staff->email, 'role_id' => 1, 'status' => 'ACTIVE', 'session_version' => 99, 'is_admin' => true,
    ])->assertRedirect();
    $staff->refresh();
    expect($staff->name)->toBe('اسم جديد')->and($staff->roleEnum()->value)->toBe('DATA_ENTRY')->and($staff->session_version)->toBe(1);
});

it('forbids non-managers entirely (data entry, designer, accountant)', function () {
    $target = User::factory()->designer()->create();
    foreach (['dataEntry', 'designer', 'accountant'] as $r) {
        $this->actingAs(User::factory()->{$r}()->create());
        $this->post('/employees', payload())->assertForbidden();
        $this->patch("/employees/{$target->id}", ['name' => 'x', 'email' => $target->email])->assertForbidden();
        $this->get('/employees')->assertForbidden();
    }
});

// ── الحالة وكلمة المرور والجلسات ───────────────────────────────────────────────
it('deactivates, kills sessions via session_version and keeps history (BR-087)', function () {
    $target = User::factory()->designer()->create();
    $this->actingAs(User::factory()->admin()->create())->post("/employees/{$target->id}/deactivate", ['reason' => 'انتهاء العقد'])->assertRedirect();
    $target->refresh();
    expect($target->status)->toBe('INACTIVE')->and($target->session_version)->toBe(2)->and(User::whereKey($target->id)->exists())->toBeTrue();
    expect(AuditLog::where('action', 'employee.deactivated')->first()->reason)->toBe('انتهاء العقد');
});

it('never deactivates a super admin', function () {
    $sa = User::factory()->superAdmin()->create();
    $this->actingAs(User::factory()->superAdmin()->create())->post("/employees/{$sa->id}/deactivate")->assertForbidden();
});

it('resets a password once, invalidates the old one and never audits it', function () {
    $target = User::factory()->dataEntry()->create();
    $r = $this->actingAs(User::factory()->admin()->create())->post("/employees/{$target->id}/reset-password");
    $plain = session('generated_password');
    expect($plain)->toBeString()->toHaveLength(14);
    $target->refresh();
    expect(Hash::check($plain, $target->password))->toBeTrue()
        ->and(Hash::check('password', $target->password))->toBeFalse()
        ->and($target->session_version)->toBe(2)
        ->and(json_encode(AuditLog::all()->toArray()))->not->toContain($plain);
});

it('validates email uniqueness, password strength and phone', function () {
    User::factory()->create(['email' => 'dup@pbms.test']);
    $this->actingAs(User::factory()->admin()->create())->post('/employees', payload(['email' => 'dup@pbms.test']))->assertSessionHasErrors('email');
    $this->post('/employees', payload(['password' => 'weak']))->assertSessionHasErrors('password');
    $this->post('/employees', payload(['phone' => 'abc']))->assertSessionHasErrors('phone');
});

// ── الصلاحيات الإضافية (S-067) ────────────────────────────────────────────────
it('lets admin delegate a permission the admin holds and bumps the target session', function () {
    $de = User::factory()->dataEntry()->create();
    $this->actingAs(User::factory()->admin()->create())->put("/employees/{$de->id}/permissions", ['grant' => ['orders.discount.apply'], 'revoke' => []])->assertRedirect();
    $de->refresh();
    expect($de->hasPermission('orders.discount.apply'))->toBeTrue()->and($de->session_version)->toBe(2);
    expect(AuditLog::where('action', 'employee.permissions_changed')->first()->new_values['grant'])->toBe(['orders.discount.apply']);
});

it('refuses to grant what the actor does not hold or what is hard-denied for the target', function () {
    $de = User::factory()->dataEntry()->create();
    $this->actingAs(User::factory()->admin()->create());
    $this->put("/employees/{$de->id}/permissions", ['grant' => ['payments.correct'], 'revoke' => []])->assertSessionHasErrors('business');
    $this->put("/employees/{$de->id}/permissions", ['grant' => ['employees.manage_admins'], 'revoke' => []])->assertSessionHasErrors('business');
    expect($de->fresh()->hasPermission('payments.correct'))->toBeFalse();
});

it('rejects unknown permission codes', function () {
    $de = User::factory()->dataEntry()->create();
    $this->actingAs(User::factory()->admin()->create())->put("/employees/{$de->id}/permissions", ['grant' => ['made.up'], 'revoke' => []])->assertSessionHasErrors('grant.0');
});

it('only super admin manages admin permissions', function () {
    $ad = User::factory()->admin()->create();
    $this->actingAs(User::factory()->admin()->create())->put("/employees/{$ad->id}/permissions", ['grant' => [], 'revoke' => []])->assertForbidden();
    $this->actingAs(User::factory()->superAdmin()->create())->put("/employees/{$ad->id}/permissions", ['grant' => [], 'revoke' => []])->assertRedirect();
});

// ── صفحات (Inertia) ───────────────────────────────────────────────────────────
it('lists employees with filters and per-row edit rights', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->designer()->create(['name' => 'منى']);
    $this->actingAs($admin)->get('/employees?q=منى')->assertOk()->assertInertia(fn ($p) => $p
        ->component('employees/index')->has('employees.data', 1)->where('employees.data.0.can_edit', true));
    $this->get('/employees?role=ADMIN')->assertInertia(fn ($p) => $p->where('employees.data.0.can_edit', false)); // Admin لا يعدّل Admin
});

it('renders create, show, edit and permissions pages for allowed actors', function () {
    $admin = User::factory()->admin()->create();
    $t = User::factory()->dataEntry()->create();
    $this->actingAs($admin);
    $this->get('/employees/create')->assertOk()->assertInertia(fn ($p) => $p->component('employees/form')->has('roles', 3));
    $this->get("/employees/{$t->id}")->assertRedirect("/employees?selected={$t->id}");
    $this->get("/employees?selected={$t->id}")->assertOk()->assertInertia(fn ($p) => $p->component('employees/index')->where('selected.id', $t->id));
    $this->get("/employees/{$t->id}/edit")->assertOk();
    $this->get("/employees/{$t->id}/permissions")->assertOk()->assertInertia(fn ($p) => $p->component('employees/permissions')->has('groups'));
});

it('offers admin role only to super admin in the create form', function () {
    $this->actingAs(User::factory()->superAdmin()->create())->get('/employees/create')->assertInertia(fn ($p) => $p->has('roles', 4));
});
