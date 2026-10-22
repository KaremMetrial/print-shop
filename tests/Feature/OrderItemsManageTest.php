<?php

use App\Actions\Orders\CreateOrder;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;

function mkOrder(User $u, int $n = 2): array
{
    $c = Customer::factory()->create();
    $ps = Product::factory()->count($n)->create();
    $o = app(CreateOrder::class)->handle($u, ['customer_id' => $c->id, 'items' => $ps->map(fn ($p) => ['product_id' => $p->id, 'quantity' => 1])->all()]);

    return [$o, $ps];
}

beforeEach(fn () => $this->admin = User::factory()->superAdmin()->create());

it('adds an item, reprices and keeps the order in design', function () {
    [$o, $ps] = mkOrder($this->admin);
    $before = $o->grand_total->minor;
    $this->actingAs($this->admin)->post("/orders/{$o->id}/items", ['product_id' => $ps[0]->id, 'quantity' => 2], ['Idempotency-Key' => 'a1'])->assertRedirect();
    $o->refresh();
    expect($o->items()->count())->toBe(3)->and($o->grand_total->minor)->toBeGreaterThan($before)->and($o->status)->toBe(OrderStatus::DESIGN_STAGE);
});

it('soft-cancels an item with reason, excludes it from total and starts printing when the rest are approved', function () {
    [$o] = mkOrder($this->admin);
    [$a, $b] = $o->items;
    $a->update(['design_state' => 'APPROVED', 'approved_at' => now()]);
    $total = $o->grand_total->minor;
    $this->actingAs($this->admin)->post("/orders/{$o->id}/items/{$b->id}/cancel", ['reason' => ''], ['Idempotency-Key' => 'c0'])->assertSessionHasErrors('reason');
    $this->post("/orders/{$o->id}/items/{$b->id}/cancel", ['reason' => 'طلب العميل'], ['Idempotency-Key' => 'c1'])->assertRedirect();
    $o->refresh();
    expect($b->refresh()->cancelled_at)->not->toBeNull()->and($o->grand_total->minor)->toBeLessThan($total)->and($o->status)->toBe(OrderStatus::IN_PRINTING);
});

it('refuses to cancel the last active item and any change once printing', function () {
    [$o, $ps] = mkOrder($this->admin, 1);
    $this->actingAs($this->admin)->postJson("/orders/{$o->id}/items/{$o->items[0]->id}/cancel", ['reason' => 'x'], ['Idempotency-Key' => 'l1'])->assertStatus(422);
    $o->update(['status' => OrderStatus::IN_PRINTING]);
    $this->postJson("/orders/{$o->id}/items", ['product_id' => $ps[0]->id, 'quantity' => 1], ['Idempotency-Key' => 'l2'])->assertStatus(409);
});

it('requires orders.items.manage', function () {
    [$o, $ps] = mkOrder($this->admin);
    $this->actingAs(User::factory()->designer()->create())->post("/orders/{$o->id}/items", ['product_id' => $ps[0]->id, 'quantity' => 1], ['Idempotency-Key' => 'p1'])->assertForbidden();
});

it('edits an item quantity/notes, reprices server-side, audits, and is locked once printing', function () {
    [$o] = mkOrder($this->admin, 1);
    $it = $o->items[0];
    $total = $o->grand_total->minor;
    $this->actingAs($this->admin)->patch("/orders/{$o->id}/items/{$it->id}", ['quantity' => 3, 'notes' => 'ملاحظة جديدة'], ['Idempotency-Key' => 'u1'])->assertRedirect();
    expect($it->refresh()->quantity)->toBe(3)->and($it->notes)->toBe('ملاحظة جديدة')->and($o->refresh()->grand_total->minor)->toBeGreaterThan($total);
    expect(DB::table('audit_logs')->where('action', 'order.item_updated')->count())->toBe(1);
    $this->patchJson("/orders/{$o->id}/items/{$it->id}", ['quantity' => 0], ['Idempotency-Key' => 'u2'])->assertStatus(422);
    $o->update(['status' => OrderStatus::IN_PRINTING]);
    $this->patchJson("/orders/{$o->id}/items/{$it->id}", ['quantity' => 5], ['Idempotency-Key' => 'u3'])->assertStatus(409);
    $this->actingAs(User::factory()->designer()->create())->patch("/orders/{$o->id}/items/{$it->id}", ['quantity' => 2], ['Idempotency-Key' => 'u4'])->assertForbidden();
});

it('exposes designers and assign permission to the order page for managers only', function () {
    [$o] = mkOrder($this->admin, 1);
    $this->actingAs($this->admin)->get("/orders/{$o->id}?tab=items")->assertInertia(fn ($p) => $p->where('can.assign', true)->has('designers'));
});

it('applies and removes a discount through the dedicated endpoint with validation and permission', function () {
    [$o] = mkOrder($this->admin, 1);
    $total = $o->grand_total->minor;
    $this->actingAs($this->admin)->patch("/orders/{$o->id}/discount", ['discount_type' => 'PERCENT', 'discount_value' => 10], ['Idempotency-Key' => 'x1'])->assertRedirect();
    expect($o->refresh()->grand_total->minor)->toBeLessThan($total)->and($o->discount_type)->toBe('PERCENT');
    $this->patchJson("/orders/{$o->id}/discount", ['discount_type' => 'PERCENT', 'discount_value' => 150], ['Idempotency-Key' => 'x2'])->assertStatus(422);
    $this->patch("/orders/{$o->id}/discount", ['discount_type' => 'NONE'], ['Idempotency-Key' => 'x3'])->assertRedirect();
    expect($o->refresh()->grand_total->minor)->toBe($total);
    $this->actingAs(User::factory()->designer()->create())->patch("/orders/{$o->id}/discount", ['discount_type' => 'FIXED', 'discount_value' => 100], ['Idempotency-Key' => 'x4'])->assertForbidden();
});
