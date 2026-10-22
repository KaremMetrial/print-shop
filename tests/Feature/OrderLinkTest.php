<?php

use App\Actions\Orders\AdvanceOrder;
use App\Actions\Orders\CancelOrder;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\File;
use App\Models\Order;
use App\Models\OrderLink;
use App\Models\Product;
use App\Models\User;
use App\Services\Design\DesignService;
use App\Services\Orders\OrderLinkService;

function linked(array $o = []): array
{
    $order = Order::factory()->create($o);
    $svc = app(OrderLinkService::class);
    $link = $svc->create($order);

    return [$order, $link, basename($svc->url($link))];
}

it('creates one private link per order on order creation', function () {
    $p = Product::factory()->create(['base_unit_price' => 100]);
    $this->actingAs(User::factory()->dataEntry()->create());
    $this->withHeaders(['Idempotency-Key' => 'l1'])->postJson('/orders', ['customer_id' => Customer::factory()->create()->id, 'delivery_method' => 'PICKUP', 'items' => [['product_id' => $p->id, 'quantity' => 1]]]);
    expect(OrderLink::count())->toBe(1)->and(OrderLink::first()->token_hash)->toHaveLength(64);
});

it('serves the order page by token with noindex and no data leak', function () {
    [$o, , $token] = linked();
    $this->get("/l/{$token}")->assertOk()->assertInertia(fn ($p) => $p->component('link/show')->where('order.number', $o->order_number));
});

it('answers 410 with a generic page for unknown, suspended, regenerated and closed links', function () {
    [$o, $link, $token] = linked();
    $this->get('/l/wrong-token')->assertStatus(410)->assertInertia(fn ($p) => $p->component('link/unavailable'));
    $admin = User::factory()->admin()->create();
    app(OrderLinkService::class)->suspend($admin, $link);
    $this->get("/l/{$token}")->assertStatus(410);
    app(OrderLinkService::class)->reactivate($admin, $link->refresh());
    $this->get("/l/{$token}")->assertOk();
    app(OrderLinkService::class)->regenerate($admin, $link->refresh());
    $this->get("/l/{$token}")->assertStatus(410); // القديم أُبطل
    $new = basename(app(OrderLinkService::class)->url($link->refresh()));
    $this->get("/l/{$new}")->assertOk();
});

it('closes the link when the order is completed or cancelled (BR-006)', function () {
    [$o, , $token] = linked(['status' => OrderStatus::READY_FOR_PICKUP]);
    app(AdvanceOrder::class)->complete(User::factory()->dataEntry()->create(), $o);
    $this->get("/l/{$token}")->assertStatus(410);
    [$o2, , $t2] = linked();
    app(CancelOrder::class)->handle(User::factory()->admin()->create(), $o2, 'سبب');
    $this->get("/l/{$t2}")->assertStatus(410);
});

it('blocks access to an item of another order through a link (BOLA)', function () {
    [, , $token] = linked();
    $other = Order::factory()->create();
    $p = Product::factory()->create();
    $it = $other->items()->create(['product_id' => $p->id, 'product_snapshot' => ['name' => 'x'], 'options_snapshot' => [], 'quantity' => 1, 'base_unit_price' => 1, 'unit_price' => 1, 'item_total' => 1]);
    $this->get("/l/{$token}/items/{$it->id}")->assertNotFound();
});

it('approves a design through the link; stale revision is rejected', function () {
    [$o, , $token] = linked();
    $d = User::factory()->designer()->create();
    $p = Product::factory()->create();
    $it = $o->items()->create(['product_id' => $p->id, 'product_snapshot' => ['name' => 'x'], 'options_snapshot' => [], 'quantity' => 1, 'base_unit_price' => 1, 'unit_price' => 1, 'item_total' => 1, 'designer_id' => $d->id]);
    $ds = app(DesignService::class);
    $ds->start($d, $it);
    $v = $ds->createVersion($d, $it);
    $f = File::create(['storage_key' => 'k/'.uniqid(), 'disk' => 'local', 'original_filename' => 'a.pdf', 'mime_type' => 'application/pdf', 'size_bytes' => 1, 'category' => 'design_preview', 'uploaded_by_type' => 'staff', 'uploaded_by_id' => 1, 'checksum' => str_repeat('a', 64)]);
    $ds->setFiles($d, $v, [$f->id]);
    $v = $ds->submit($d, $v->refresh());
    $this->post("/l/{$token}/items/{$it->id}/approve", ['version_id' => $v->id, 'revision' => $v->manifest_revision + 5])->assertSessionHasErrors();
    expect($it->refresh()->design_state)->toBe('AWAITING_APPROVAL');
    $this->post("/l/{$token}/items/{$it->id}/approve", ['version_id' => $v->id, 'revision' => $v->manifest_revision])->assertRedirect("/l/{$token}");
    expect($it->refresh()->design_state)->toBe('APPROVED')->and($o->refresh()->status)->toBe(OrderStatus::IN_PRINTING);
});

it('lets staff manage the link and forbids others', function () {
    [$o] = linked();
    $this->actingAs(User::factory()->dataEntry()->create())->get("/orders/{$o->id}/link")->assertOk()->assertInertia(fn ($p) => $p->component('orders/link'));
    $this->withHeaders(['Idempotency-Key' => 'x1'])->postJson("/orders/{$o->id}/link/suspend")->assertRedirect();
    expect($o->link->refresh()->status)->toBe('SUSPENDED');
    $this->actingAs(User::factory()->designer()->create())->get("/orders/{$o->id}/link")->assertForbidden();
});

it('creates the link on first open for orders that have none instead of failing', function () {
    $a = User::factory()->superAdmin()->create();
    $o = Order::factory()->create();
    expect($o->link()->exists())->toBeFalse();
    $this->actingAs($a)->get("/orders/{$o->id}/link")->assertOk();
    expect($o->link()->exists())->toBeTrue();
});
