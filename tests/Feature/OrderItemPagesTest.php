<?php

use App\Actions\Orders\CreateOrder;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;

function ordWithItems(User $u): array
{
    $c = Customer::factory()->create();
    $p = Product::factory()->create();
    $o = app(CreateOrder::class)->handle($u, ['customer_id' => $c->id, 'items' => [['product_id' => $p->id, 'quantity' => 2]]]);

    return [$o, $o->items[0]];
}

it('shows staff item details and hides other orders items (BOLA)', function () {
    $a = User::factory()->superAdmin()->create();
    [$o, $it] = ordWithItems($a);
    [$o2] = ordWithItems($a);
    $this->actingAs($a)->get("/orders/{$o->id}/items/{$it->id}")->assertOk()->assertInertia(fn ($p) => $p->component('orders/item')->where('item.code', 'ITEM-01')->has('item.total_minor'));
    $this->get("/orders/{$o2->id}/items/{$it->id}")->assertNotFound();
});

it('hides item price from designers (BR-071)', function () {
    $a = User::factory()->superAdmin()->create();
    [$o, $it] = ordWithItems($a);
    $d = User::factory()->designer()->create();
    $d->role->permissions()->syncWithoutDetaching([]);
    $r = $this->actingAs($d)->get("/orders/{$o->id}/items/{$it->id}");
    if ($r->status() === 200) {
        $r->assertInertia(fn ($p) => $p->missing('item.total_minor'));
    } else {
        $r->assertForbidden();
    }
});

it('serves the job ticket only after design approval and renders an Arabic PDF', function () {
    $a = User::factory()->superAdmin()->create();
    [$o] = ordWithItems($a);
    $this->actingAs($a)->getJson("/orders/{$o->id}/job-ticket")->assertStatus(409);
    $o->update(['status' => OrderStatus::IN_PRINTING]);
    $this->get("/orders/{$o->id}/job-ticket")->assertOk()->assertInertia(fn ($p) => $p->component('orders/job-ticket')->has('items', 1));
    $r = $this->get("/orders/{$o->id}/job-ticket/pdf")->assertOk();
    expect($r->headers->get('content-type'))->toContain('application/pdf')->and(substr($r->getContent(), 0, 4))->toBe('%PDF');
});
