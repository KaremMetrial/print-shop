<?php

use App\Actions\Orders\CreateOrder;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\Finance\PaymentService;

it('shows payment details, receipt page and PDF; designers are denied', function () {
    $a = User::factory()->superAdmin()->create();
    $c = Customer::factory()->create();
    $o = app(CreateOrder::class)->handle($a, ['customer_id' => $c->id, 'items' => [['product_id' => Product::factory()->create()->id, 'quantity' => 1]]]);
    $amt = $o->grand_total->minor;
    $p = app(PaymentService::class)->record($a, $c, $amt, 'CASH', $o);
    $this->actingAs($a)->get("/accounting/payments/{$p->id}")->assertOk()->assertInertia(fn ($x) => $x->component('operations/payment')->where('payment.amount_minor', $amt));
    $this->get("/accounting/payments/{$p->id}/receipt")->assertOk()->assertInertia(fn ($x) => $x->component('operations/payment-receipt'));
    $r = $this->get("/accounting/payments/{$p->id}/receipt/pdf")->assertOk();
    expect(substr($r->getContent(), 0, 4))->toBe('%PDF');
    $this->actingAs(User::factory()->designer()->create())->get("/accounting/payments/{$p->id}")->assertForbidden();
});
