<?php

use App\Actions\Customers\ManagePlatformAccess;
use App\Models\Customer;
use App\Models\File;
use App\Models\Order;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\Design\DesignService;
use Illuminate\Support\Facades\DB;

function portalCustomer(array $o = []): array
{
    $c = Customer::factory()->create($o + ['phone_normalized' => '01011112222', 'phone_display' => '010 1111 2222']);
    $pw = app(ManagePlatformAccess::class)->enable($c);

    return [$c->refresh(), $pw];
}
function portalLogin($t, string $phone, string $pw)
{
    return $t->post('/portal/login', ['phone' => $phone, 'password' => $pw]);
}

it('logs a registered customer in by phone and keeps the session separate from staff', function () {
    [$c, $pw] = portalCustomer();
    portalLogin($this, '010 1111 2222', $pw)->assertRedirect('/portal');
    $this->get('/portal')->assertOk()->assertInertia(fn ($p) => $p->component('portal/dashboard'));
    $this->get('/dashboard')->assertRedirect('/login'); // لا وصول لواجهة الموظفين
});

it('gives one generic error for unknown phone, wrong password and disabled access (no enumeration)', function () {
    [$c, $pw] = portalCustomer();
    $a = portalLogin($this, '01099999999', 'x')->assertSessionHasErrors('phone');
    $b = portalLogin($this, '01011112222', 'wrong')->assertSessionHasErrors('phone');
    $msg = fn ($r) => session('errors')->first('phone');
    app(ManagePlatformAccess::class)->disable($c);
    portalLogin($this, '01011112222', $pw)->assertSessionHasErrors('phone');
    expect(session('errors')->first('phone'))->toBe('بيانات الدخول غير صحيحة أو الحساب غير مفعّل. تواصل مع المطبعة.');
});

it('rate limits repeated failed logins', function () {
    portalCustomer();
    for ($i = 0; $i < 5; $i++) {
        portalLogin($this, '01011112222', 'bad');
    }
    portalLogin($this, '01011112222', 'bad')->assertSessionHasErrors(['phone' => 'محاولات كثيرة. حاول بعد قليل.']);
});

it('kills the session when access is disabled or the password is reset', function () {
    [$c, $pw] = portalCustomer();
    portalLogin($this, '01011112222', $pw);
    $this->get('/portal')->assertOk();
    app(ManagePlatformAccess::class)->resetPassword($c);
    $this->get('/portal')->assertRedirect('/portal/login');
});

it('password recovery answers identically and opens a staff action only for enabled customers', function () {
    [$c] = portalCustomer();
    User::factory()->admin()->create();
    $r1 = $this->post('/portal/recover', ['phone' => '01011112222'])->assertRedirect()->getSession()->get('success');
    $r2 = $this->post('/portal/recover', ['phone' => '01000000000'])->assertRedirect()->getSession()->get('success');
    expect($r1)->toBe($r2);
    expect(DB::table('password_recovery_requests')->count())->toBe(1)->and(DB::table('staff_actions')->where('type', 'PASSWORD_RECOVERY')->count())->toBe(1);
    $this->post('/portal/recover', ['phone' => '01011112222']);
    expect(DB::table('password_recovery_requests')->count())->toBe(1); // لا تكرار
    app(ManagePlatformAccess::class)->resetPassword($c);
    expect(DB::table('password_recovery_requests')->value('status'))->toBe('COMPLETED')->and(DB::table('staff_actions')->value('status'))->toBe('DONE');
});

it('submits an order request that opens a review action and validates MOQ (BR-008/009)', function () {
    [$c, $pw] = portalCustomer();
    User::factory()->dataEntry()->create();
    $p = Product::factory()->create(['base_unit_price' => 100, 'minimum_quantity' => 10]);
    portalLogin($this, '01011112222', $pw);
    $this->withHeaders(['Idempotency-Key' => 'p1'])->postJson('/portal/requests', ['delivery_method' => 'PICKUP', 'items' => [['product_id' => $p->id, 'quantity' => 2]]])->assertStatus(422);
    $this->withHeaders(['Idempotency-Key' => 'p2'])->postJson('/portal/requests', ['delivery_method' => 'PICKUP', 'items' => [['product_id' => $p->id, 'quantity' => 50]]])->assertRedirect();
    $r = OrderRequest::first();
    expect($r->customer_id)->toBe($c->id)->and($r->status->value)->toBe('PENDING')->and(Order::count())->toBe(0);
    expect(DB::table('staff_actions')->where('type', 'ORDER_REQUEST')->count())->toBe(1);
    $this->withHeaders(['Idempotency-Key' => 'p2'])->postJson('/portal/requests', ['delivery_method' => 'PICKUP', 'items' => [['product_id' => $p->id, 'quantity' => 50]]]);
    expect(OrderRequest::count())->toBe(1); // idempotent
});

it('shows a customer only their own orders and requests (BOLA)', function () {
    [$c, $pw] = portalCustomer();
    $mine = Order::factory()->create(['customer_id' => $c->id]);
    $other = Order::factory()->create();
    $otherReq = OrderRequest::factory()->create();
    portalLogin($this, '01011112222', $pw);
    $this->get('/portal/orders')->assertInertia(fn ($p) => $p->where('orders.total', 1));
    $this->get("/portal/orders/{$mine->id}")->assertOk();
    $this->get("/portal/orders/{$other->id}")->assertNotFound();
    $this->get("/portal/requests/{$otherReq->id}")->assertNotFound();
});

it('lets the customer approve their own design only; another customer cannot (BR-026)', function () {
    [$c, $pw] = portalCustomer();
    $o = Order::factory()->create(['customer_id' => $c->id]);
    $d = User::factory()->designer()->create();
    $p = Product::factory()->create();
    $it = $o->items()->create(['product_id' => $p->id, 'product_snapshot' => ['name' => 'x'], 'options_snapshot' => [], 'quantity' => 1, 'base_unit_price' => 1, 'unit_price' => 1, 'item_total' => 1, 'designer_id' => $d->id]);
    $ds = app(DesignService::class);
    $ds->start($d, $it);
    $v = $ds->createVersion($d, $it);
    $f = File::create(['storage_key' => 'k/'.uniqid(), 'disk' => 'local', 'original_filename' => 'a.pdf', 'mime_type' => 'application/pdf', 'size_bytes' => 1, 'category' => 'design_preview', 'uploaded_by_type' => 'staff', 'uploaded_by_id' => 1, 'checksum' => str_repeat('a', 64)]);
    $ds->setFiles($d, $v, [$f->id]);
    $v = $ds->submit($d, $v->refresh());
    portalLogin($this, '01011112222', $pw);
    $this->get("/portal/orders/{$o->id}/items/{$it->id}")->assertOk()->assertInertia(fn ($x) => $x->where('version.status', 'SUBMITTED'));
    $this->withHeaders(['Idempotency-Key' => 'ap1'])->postJson("/portal/orders/{$o->id}/items/{$it->id}/approve", ['version_id' => $v->id, 'revision' => $v->manifest_revision + 9])->assertStatus(409);
    $this->withHeaders(['Idempotency-Key' => 'ap2'])->postJson("/portal/orders/{$o->id}/items/{$it->id}/approve", ['version_id' => $v->id, 'revision' => $v->manifest_revision])->assertRedirect("/portal/orders/{$o->id}");
    expect($it->refresh()->design_state)->toBe('APPROVED');
    $this->post('/portal/logout');
    [, $pw2] = portalCustomer(['phone_normalized' => '01033334444', 'phone_display' => '010 3333 4444']);
    portalLogin($this, '01033334444', $pw2);
    $this->withHeaders(['Idempotency-Key' => 'ap3'])->postJson("/portal/orders/{$o->id}/items/{$it->id}/approve", ['version_id' => $v->id, 'revision' => $v->manifest_revision])->assertNotFound();
});
