<?php

use App\Actions\Orders\CancelOrder;
use App\Actions\Orders\CreateOrder;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\Finance\PaymentService;

it('serves customer tabs with a ledger whose final balance equals PaymentService due', function () {
    $a = User::factory()->superAdmin()->create();
    $c = Customer::factory()->create();
    $mk = fn () => app(CreateOrder::class)->handle($a, ['customer_id' => $c->id, 'items' => [['product_id' => Product::factory()->create()->id, 'quantity' => 1]]]);
    $o1 = $mk();
    $o2 = $mk();
    app(PaymentService::class)->record($a, $c, intdiv($o1->grand_total->minor, 2) ?: 1, 'CASH', $o1);
    app(CancelOrder::class)->handle($a, $o2, 'طلب العميل', null);
    $this->actingAs($a);
    foreach (['orders', 'payments', 'refunds'] as $t) {
        $this->get("/customers/{$c->id}/{$t}")->assertOk()->assertInertia(fn ($p) => $p->component('customers/finance')->where('tab', $t));
    }
    $r = $this->get("/customers/{$c->id}/financial")->assertOk();
    $due = app(PaymentService::class)->customerDue($c);
    expect($r->inertiaProps('summary.due_minor'))->toBe($due)->and($r->inertiaProps('ledger.0.balance_minor'))->toBe($due);
    $this->get("/customers/{$c->id}")->assertInertia(fn ($p) => $p->where('summary.orders_total', 2)->where('summary.orders_active', 1));
});

it('denies the financial tabs without permission', function () {
    $c = Customer::factory()->create();
    $this->actingAs(User::factory()->designer()->create())->get("/customers/{$c->id}/payments")->assertForbidden();
});
