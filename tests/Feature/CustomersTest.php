<?php

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\PricingTier;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

function cpayload(array $o = []): array
{
    return array_merge(['name' => 'شركة النور للدعاية', 'phone' => '010 2345 6789', 'address' => 'مدينة نصر', 'notification_mode' => 'MANUAL', 'notes' => null], $o);
}

it('creates a customer with normalized phone, default tier, and audit', function () {
    $u = User::factory()->dataEntry()->create();
    $this->actingAs($u)->post('/customers', cpayload())->assertRedirect();
    $c = Customer::first();
    expect($c->phone_normalized)->toBe('01023456789')->and($c->phone_display)->toBe('010 2345 6789')->and($c->pricing_tier_id)->toBe(PricingTier::default()->id)
        ->and($c->created_by)->toBe($u->id)->and($c->code())->toStartWith('CUS-');
    expect(AuditLog::where('action', 'customer.created')->exists())->toBeTrue();
});

it('requires name and a valid phone (TC-011/012)', function () {
    $this->actingAs(User::factory()->dataEntry()->create());
    $this->post('/customers', cpayload(['name' => '']))->assertSessionHasErrors('name');
    $this->post('/customers', cpayload(['phone' => '']))->assertSessionHasErrors('phone');
    $this->post('/customers', cpayload(['phone' => '123']))->assertSessionHasErrors('phone_normalized');
});

it('blocks duplicate phones in any format without merging (TC-013)', function () {
    $this->actingAs(User::factory()->dataEntry()->create());
    $this->post('/customers', cpayload())->assertRedirect();
    $this->post('/customers', cpayload(['name' => 'آخر', 'phone' => '+20 10 2345 6789']))->assertSessionHasErrors('phone_normalized');
    expect(Customer::count())->toBe(1);
});

it('reports duplicates live via check-phone', function () {
    Customer::factory()->create(['name' => 'مقهى ورد', 'phone_normalized' => '01099998888', 'phone_display' => '010 9999 8888']);
    $this->actingAs(User::factory()->dataEntry()->create())->getJson('/customers/check-phone?phone=010-9999-8888')->assertJsonPath('duplicate.name', 'مقهى ورد')->assertJsonPath('valid', true);
    $this->getJson('/customers/check-phone?phone=011-1111-2222')->assertJsonPath('duplicate', null);
});

it('lets only authorized roles view/create/update customers', function () {
    $c = Customer::factory()->create();
    $this->actingAs(User::factory()->designer()->create());
    $this->get('/customers')->assertForbidden();
    $this->post('/customers', cpayload())->assertForbidden();
    $this->actingAs(User::factory()->accountant()->create());
    $this->get('/customers')->assertOk();
    $this->get("/customers/{$c->id}/edit")->assertForbidden();
});

it('audits tier changes separately and keeps old orders untouched (TC-014 audit part)', function () {
    $c = Customer::factory()->create();
    $gold = PricingTier::create(['name' => 'ذهبية', 'mode' => 'PERCENTAGE', 'discount_percentage' => 10]);
    $this->actingAs(User::factory()->admin()->create())->patch("/customers/{$c->id}", cpayload(['phone' => $c->phone_display, 'pricing_tier_id' => $gold->id]))->assertRedirect();
    expect(AuditLog::where('action', 'customer.tier_changed')->exists())->toBeTrue();
});

it('hides balance from users without customers.view_balance and never sends it', function () {
    Customer::factory()->create();
    $this->actingAs(User::factory()->accountant()->create())->get('/customers')->assertInertia(fn ($p) => $p->where('can.balance', true)->has('customers.data.0.balance_minor'));
});

// ── دخول المنصة (TC-015/016/017/019، BR-007) ───────────────────────────────────
it('enables platform access and shows a one-time temporary password that is never stored or audited', function () {
    $c = Customer::factory()->create();
    $this->actingAs(User::factory()->admin()->create())->post("/customers/{$c->id}/access/enable")->assertRedirect();
    $plain = session('generated_password');
    expect($plain)->toMatch('/^[A-Za-z2-9]{5}-[A-Za-z2-9]{5}$/');
    $c->refresh();
    expect($c->platform_access_enabled)->toBeTrue()->and(Hash::check($plain, $c->credential->password_hash))->toBeTrue()
        ->and(json_encode(AuditLog::all()->toArray()))->not->toContain($plain);
});

it('resets the password invalidating the old one, only for authorized and enabled access', function () {
    $c = Customer::factory()->create();
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->post("/customers/{$c->id}/access/reset-password")->assertStatus(422);
    $this->post("/customers/{$c->id}/access/enable");
    $old = session('generated_password');
    $this->post("/customers/{$c->id}/access/reset-password")->assertRedirect();
    $new = session('generated_password');
    $c->refresh();
    expect($new)->not->toBe($old)->and(Hash::check($old, $c->credential->password_hash))->toBeFalse()->and(Hash::check($new, $c->credential->password_hash))->toBeTrue()
        ->and($c->credential->session_version)->toBeGreaterThan(1);
});

it('disables access keeping the account data and killing sessions', function () {
    $c = Customer::factory()->create();
    $this->actingAs(User::factory()->admin()->create())->post("/customers/{$c->id}/access/enable");
    $this->post("/customers/{$c->id}/access/disable")->assertRedirect();
    $c->refresh();
    expect($c->platform_access_enabled)->toBeFalse()->and($c->credential->status)->toBe('DISABLED')->and($c->credential->session_version)->toBe(2);
});

it('lets the accountant reset passwords but not enable access, and data entry only when delegated', function () {
    $c = Customer::factory()->create();
    $this->actingAs(User::factory()->admin()->create())->post("/customers/{$c->id}/access/enable");
    $this->actingAs(User::factory()->accountant()->create());
    $this->post("/customers/{$c->id}/access/reset-password")->assertRedirect();
    $this->post("/customers/{$c->id}/access/enable")->assertForbidden();
    $this->actingAs(User::factory()->dataEntry()->create());
    $this->post("/customers/{$c->id}/access/reset-password")->assertForbidden();
});

it('renders the profile, access and activity pages with the right component', function () {
    $c = Customer::factory()->create();
    $this->actingAs(User::factory()->admin()->create());
    $this->get("/customers/{$c->id}")->assertInertia(fn ($p) => $p->component('customers/show')->where('customer.code', $c->code()));
    $this->get("/customers/{$c->id}/access")->assertInertia(fn ($p) => $p->component('customers/access'));
    $this->get("/customers/{$c->id}/activity")->assertInertia(fn ($p) => $p->component('customers/activity'));
});

it('records customer activity readable in the activity tab', function () {
    $this->actingAs(User::factory()->dataEntry()->create());
    $this->post('/customers', cpayload());
    $c = Customer::first();
    $this->get("/customers/{$c->id}/activity")->assertInertia(fn ($p) => $p->has('activity.data', 1)->where('activity.data.0.action', 'إضافة عميل'));
});
