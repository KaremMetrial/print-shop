<?php

use App\Actions\Orders\CreateOrder;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\CustomerCredential;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderLink;
use App\Models\Product;
use App\Models\User;
use App\Services\Orders\OrderLinkService;
use Illuminate\Support\Facades\Hash;

function invOrder(User $u, OrderStatus $st = OrderStatus::IN_PRINTING): Order
{
    $o = app(CreateOrder::class)->handle($u, ['customer_id' => Customer::factory()->create()->id, 'items' => [['product_id' => Product::factory()->create()->id, 'quantity' => 2]]]);
    $o->update(['status' => $st]);

    return $o;
}

it('issues one active invoice per order after printing starts, with an immutable snapshot', function () {
    $a = User::factory()->superAdmin()->create();
    $o = invOrder($a);
    $this->actingAs($a)->post("/orders/{$o->id}/invoice", [], ['Idempotency-Key' => 'i1'])->assertRedirect();
    $inv = Invoice::firstOrFail();
    expect($inv->number)->toStartWith('INV-')->and($inv->snapshot['grand_total_minor'])->toBe($o->grand_total->minor)->and($inv->status)->toBe('ISSUED');
    $this->postJson("/orders/{$o->id}/invoice", [], ['Idempotency-Key' => 'i2'])->assertStatus(422); // سارية بالفعل
    $o->update(['delivery_fee' => 99900]);
    expect($inv->refresh()->snapshot['delivery_fee_minor'])->not->toBe(99900); // لقطة ثابتة
});

it('refuses invoices for design-stage and cancelled orders and requires the permission', function () {
    $a = User::factory()->superAdmin()->create();
    $this->actingAs($a)->postJson('/orders/'.invOrder($a, OrderStatus::DESIGN_STAGE)->id.'/invoice', [], ['Idempotency-Key' => 'd1'])->assertStatus(422);
    $this->postJson('/orders/'.invOrder($a, OrderStatus::CANCELLED)->id.'/invoice', [], ['Idempotency-Key' => 'd2'])->assertStatus(422);
    $o = invOrder($a);
    $this->actingAs(User::factory()->dataEntry()->create())->postJson("/orders/{$o->id}/invoice", [], ['Idempotency-Key' => 'd3'])->assertForbidden();
});

it('voids with a mandatory reason, keeps the record, and allows re-issuing', function () {
    $a = User::factory()->superAdmin()->create();
    $o = invOrder($a);
    $this->actingAs($a)->post("/orders/{$o->id}/invoice", [], ['Idempotency-Key' => 'v1']);
    $inv = Invoice::firstOrFail();
    $this->postJson("/invoices/{$inv->id}/void", ['reason' => ''], ['Idempotency-Key' => 'v2'])->assertStatus(422);
    $this->post("/invoices/{$inv->id}/void", ['reason' => 'خطأ في البيانات'], ['Idempotency-Key' => 'v3'])->assertRedirect();
    expect($inv->refresh()->status)->toBe('VOIDED')->and($inv->void_reason)->toBe('خطأ في البيانات');
    $this->post("/orders/{$o->id}/invoice", [], ['Idempotency-Key' => 'v4'])->assertRedirect();
    expect(Invoice::count())->toBe(2)->and(Invoice::where('status', 'ISSUED')->count())->toBe(1);
});

it('lists, previews and renders an Arabic PDF for staff', function () {
    $a = User::factory()->superAdmin()->create();
    $o = invOrder($a);
    $this->actingAs($a)->post("/orders/{$o->id}/invoice", [], ['Idempotency-Key' => 'p1']);
    $inv = Invoice::firstOrFail();
    $this->get('/invoices')->assertOk()->assertInertia(fn ($p) => $p->component('operations/invoices')->has('invoices.data', 1));
    $this->get("/invoices/{$inv->id}")->assertOk()->assertInertia(fn ($p) => $p->component('operations/invoice')->where('invoice.number', $inv->number));
    $r = $this->get("/invoices/{$inv->id}/pdf")->assertOk();
    expect(substr($r->getContent(), 0, 4))->toBe('%PDF');
    $this->actingAs(User::factory()->designer()->create())->get("/invoices/{$inv->id}")->assertForbidden();
});

it('shows the invoice to its own customer via link and portal only', function () {
    $a = User::factory()->superAdmin()->create();
    $o = invOrder($a);
    $this->actingAs($a)->post("/orders/{$o->id}/invoice", [], ['Idempotency-Key' => 'c1']);
    $svc = app(OrderLinkService::class);
    $token = basename($svc->url(OrderLink::where('order_id', $o->id)->firstOrFail()));
    auth()->logout();
    $this->get("/l/{$token}/invoice")->assertOk()->assertInertia(fn ($p) => $p->component('link/invoice')->has('invoice'));
    expect(substr($this->get("/l/{$token}/invoice/pdf")->getContent(), 0, 4))->toBe('%PDF');
    $this->get('/l/'.str_repeat('x', 40).'/invoice')->assertStatus(410);

    $c = $o->customer;
    $c->update(['platform_access_enabled' => true]);
    CustomerCredential::updateOrCreate(['customer_id' => $c->id], ['password_hash' => Hash::make('Pbms@12345'), 'status' => 'ACTIVE']);
    $this->post('/portal/login', ['phone' => $c->phone_normalized, 'password' => 'Pbms@12345']);
    $this->get("/portal/orders/{$o->id}/invoice")->assertOk()->assertInertia(fn ($p) => $p->component('portal/invoice')->has('invoice'));
    $other = invOrder($a);
    $this->get("/portal/orders/{$other->id}/invoice")->assertNotFound();
});
