<?php

use App\Actions\Orders\AdvanceOrder;
use App\Enums\OrderStatus;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Order;
use App\Models\PricingTier;
use App\Models\Product;
use App\Models\User;
use App\Services\Orders\OrderPresenter;

function opayload(Product $p, array $o = []): array
{
    return array_merge([
        'customer_id' => Customer::factory()->create()->id, 'delivery_method' => 'PICKUP',
        'items' => [['product_id' => $p->id, 'quantity' => 5, 'options' => []]],
    ], $o);
}

function createOrder($test, array $payload, string $key = 'k1')
{
    return $test->withHeaders(['Idempotency-Key' => $key])->postJson('/orders', $payload);
}

it('creates an order with server-computed price, number, snapshots and audit', function () {
    $p = Product::factory()->create(['base_unit_price' => 1000, 'minimum_quantity' => 2]);
    $this->actingAs(User::factory()->dataEntry()->create());
    createOrder($this, opayload($p))->assertRedirect();
    $o = Order::with('items')->first();
    expect($o->status)->toBe(OrderStatus::DESIGN_STAGE)->and($o->order_number)->toBe('ORD-'.str_pad((string) $o->id, 5, '0', STR_PAD_LEFT))
        ->and($o->grand_total->minor)->toBe(5000)->and($o->items)->toHaveCount(1)->and($o->items[0]->product_snapshot['name'])->toBe($p->name);
    expect(AuditLog::where('action', 'order.created')->exists())->toBeTrue();
});

it('ignores client-sent totals and applies the tier price', function () {
    $p = Product::factory()->create(['base_unit_price' => 1000]);
    $tier = PricingTier::create(['name' => 'ذهبية', 'mode' => 'PERCENTAGE', 'discount_percentage' => 20]);
    $c = Customer::factory()->create(['pricing_tier_id' => $tier->id]);
    $this->actingAs(User::factory()->dataEntry()->create());
    createOrder($this, opayload($p, ['customer_id' => $c->id, 'grand_total' => 1]))->assertRedirect();
    expect(Order::first()->grand_total->minor)->toBe(4000);
});

it('rejects empty items, MOQ violations and inactive products', function () {
    $this->actingAs(User::factory()->dataEntry()->create());
    $p = Product::factory()->create(['minimum_quantity' => 10]);
    createOrder($this, opayload($p, ['items' => []]), 'a')->assertJsonValidationErrors('items');
    createOrder($this, opayload($p), 'b')->assertStatus(422);
    $p->update(['is_active' => false, 'minimum_quantity' => null]);
    createOrder($this, opayload($p), 'c')->assertStatus(422);
    expect(Order::count())->toBe(0);
});

it('is idempotent on double submit', function () {
    $p = Product::factory()->create(['base_unit_price' => 1000]);
    $this->actingAs(User::factory()->dataEntry()->create());
    $payload = opayload($p);
    createOrder($this, $payload, 'same');
    createOrder($this, $payload, 'same');
    expect(Order::count())->toBe(1);
});

it('requires an address for delivery and permission for discounts', function () {
    $p = Product::factory()->create(['base_unit_price' => 1000]);
    $this->actingAs(User::factory()->dataEntry()->create());
    $c = Customer::factory()->create(['address' => null]);
    createOrder($this, opayload($p, ['customer_id' => $c->id, 'delivery_method' => 'DELIVERY']), 'd')->assertStatus(422);
    createOrder($this, opayload($p, ['discount_type' => 'PERCENT', 'discount_value' => 10]), 'e')->assertForbidden();
    expect(Order::count())->toBe(0);
});

it('forbids roles without orders.create', function () {
    $p = Product::factory()->create();
    $this->actingAs(User::factory()->designer()->create());
    createOrder($this, opayload($p))->assertForbidden();
});

it('enforces the state machine', function () {
    expect(OrderStatus::DESIGN_STAGE->canTransitionTo(OrderStatus::IN_PRINTING))->toBeTrue()
        ->and(OrderStatus::DESIGN_STAGE->canTransitionTo(OrderStatus::COMPLETED))->toBeFalse()
        ->and(OrderStatus::COMPLETED->canTransitionTo(OrderStatus::CANCELLED))->toBeFalse()
        ->and(OrderStatus::READY_FOR_PICKUP->canTransitionTo(OrderStatus::OUT_FOR_DELIVERY))->toBeFalse();
});

it('lists and shows orders; show exposes totals to staff', function () {
    $p = Product::factory()->create(['base_unit_price' => 1000]);
    $u = User::factory()->dataEntry()->create();
    $this->actingAs($u);
    createOrder($this, opayload($p));
    $o = Order::first();
    $this->get('/orders')->assertOk()->assertInertia(fn ($page) => $page->component('orders/index')->where('orders.total', 1));
    $this->get("/orders/{$o->id}")->assertOk()->assertInertia(fn ($page) => $page->component('orders/show')->where('order.grand_total_minor', 5000)->where('tab', 'overview'));
    $this->get("/orders/{$o->id}?tab=items")->assertInertia(fn ($page) => $page->where('tab', 'items')->has('items', 1));
});

it('hides prices from designers in the presenter (BR-071)', function () {
    $o = Order::factory()->create();
    $d = app(OrderPresenter::class)->detail($o, User::factory()->designer()->create());
    expect($d['order'])->not->toHaveKey('grand_total_minor')->and($d['can']['price'])->toBeFalse();
    $s = app(OrderPresenter::class)->detail($o, User::factory()->dataEntry()->create());
    expect($s['order']['grand_total_minor'])->toBe(5000);
});

it('updates delivery data with audit and recomputes totals server-side', function () {
    $o = Order::factory()->create(['delivery_method' => 'PICKUP']);
    $this->actingAs(User::factory()->dataEntry()->create());
    $this->withHeaders(['Idempotency-Key' => 'u1'])->patchJson("/orders/{$o->id}", ['delivery_method' => 'DELIVERY', 'delivery_address' => 'مدينة نصر', 'delivery_fee' => 10000, 'printing_eta_days' => 3, 'notes' => 'ملاحظة'])->assertRedirect();
    $o->refresh();
    expect($o->delivery_method)->toBe('DELIVERY')->and($o->grand_total->minor)->toBe(15000)->and($o->printing_eta_days)->toBe(3);
    expect(AuditLog::where('action', 'order.updated')->exists())->toBeTrue();
});

it('requires an address when switching to delivery and blocks edits on final orders', function () {
    $o = Order::factory()->create();
    $this->actingAs(User::factory()->dataEntry()->create());
    $this->withHeaders(['Idempotency-Key' => 'u2'])->patchJson("/orders/{$o->id}", ['delivery_method' => 'DELIVERY'])->assertStatus(422);
    $o->update(['status' => OrderStatus::COMPLETED]);
    $this->withHeaders(['Idempotency-Key' => 'u3'])->patchJson("/orders/{$o->id}", ['delivery_method' => 'PICKUP'])->assertStatus(409);
});

it('cancels an order only for admins with a mandatory reason (BR-042/043)', function () {
    $o = Order::factory()->create();
    $this->actingAs(User::factory()->dataEntry()->create());
    $this->withHeaders(['Idempotency-Key' => 'c1'])->postJson("/orders/{$o->id}/cancel", ['reason' => 'طلب العميل'])->assertForbidden();
    $this->actingAs(User::factory()->admin()->create());
    $this->withHeaders(['Idempotency-Key' => 'c2'])->postJson("/orders/{$o->id}/cancel", ['reason' => ''])->assertStatus(422);
    $this->withHeaders(['Idempotency-Key' => 'c3'])->postJson("/orders/{$o->id}/cancel", ['reason' => 'طلب العميل', 'notes' => 'اتصل العميل'])->assertRedirect();
    $o->refresh();
    expect($o->status)->toBe(OrderStatus::CANCELLED)->and($o->cancel_reason)->toContain('طلب العميل')->and($o->cancelled_by)->not->toBeNull();
    expect(AuditLog::where('action', 'order.cancelled')->exists())->toBeTrue();
    $this->withHeaders(['Idempotency-Key' => 'c4'])->postJson("/orders/{$o->id}/cancel", ['reason' => 'x'])->assertStatus(409);
});

it('cannot cancel a completed order', function () {
    $o = Order::factory()->create(['status' => OrderStatus::COMPLETED]);
    $this->actingAs(User::factory()->admin()->create());
    $this->withHeaders(['Idempotency-Key' => 'c5'])->postJson("/orders/{$o->id}/cancel", ['reason' => 'x'])->assertStatus(409);
});

it('runs printing → ready → complete for pickup and delivery with auto-complete after 24h', function () {
    $dm = User::factory()->dataEntry()->create();
    $this->actingAs($dm);
    $p = Order::factory()->create(['status' => OrderStatus::DESIGN_STAGE]);
    $this->withHeaders(['Idempotency-Key' => 'a1'])->postJson("/orders/{$p->id}/complete-printing")->assertStatus(409); // قبل الطباعة
    $p->update(['status' => OrderStatus::IN_PRINTING]);
    $this->withHeaders(['Idempotency-Key' => 'a2'])->postJson("/orders/{$p->id}/complete-printing")->assertRedirect();
    expect($p->refresh()->status)->toBe(OrderStatus::READY_FOR_PICKUP);
    $this->withHeaders(['Idempotency-Key' => 'a3'])->postJson("/orders/{$p->id}/complete")->assertRedirect();
    expect($p->refresh()->status)->toBe(OrderStatus::COMPLETED)->and($p->completed_source)->toBe('MANUAL');
    $this->withHeaders(['Idempotency-Key' => 'a4'])->postJson("/orders/{$p->id}/complete")->assertStatus(409);

    $d = Order::factory()->create(['status' => OrderStatus::IN_PRINTING, 'delivery_method' => 'DELIVERY', 'delivery_address' => 'x']);
    $this->withHeaders(['Idempotency-Key' => 'b1'])->postJson("/orders/{$d->id}/complete-printing");
    expect($d->refresh()->status)->toBe(OrderStatus::READY_FOR_DELIVERY);
    $this->withHeaders(['Idempotency-Key' => 'b2'])->postJson("/orders/{$d->id}/complete")->assertStatus(409); // لازم خروج للتوصيل
    $this->withHeaders(['Idempotency-Key' => 'b3'])->postJson("/orders/{$d->id}/out-for-delivery");
    expect(app(AdvanceOrder::class)->autoComplete())->toBe(0);
    $d->update(['out_for_delivery_at' => now()->subHours(25)]);
    expect(app(AdvanceOrder::class)->autoComplete())->toBe(1);
    expect($d->refresh()->status)->toBe(OrderStatus::COMPLETED)->and($d->completed_source)->toBe('AUTO');
});

it('forbids designers from advancing orders', function () {
    $o = Order::factory()->create(['status' => OrderStatus::IN_PRINTING]);
    $this->actingAs(User::factory()->designer()->create());
    $this->withHeaders(['Idempotency-Key' => 'z'])->postJson("/orders/{$o->id}/complete-printing")->assertForbidden();
});
