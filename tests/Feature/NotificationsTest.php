<?php

use App\Events\OutboxEventPublished;
use App\Events\StaffNotificationCreated;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Notifications\NotificationService;
use App\Services\Outbox\Outbox;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

function fire(string $type, Order $o, array $extra = []): void
{
    app(Outbox::class)->record($type, $o, ['order_id' => $o->id] + $extra);
    app(Outbox::class)->dispatchPending();
}

it('opens one assign-designer action and notifies managers, idempotently (BR-015/066)', function () {
    $admin = User::factory()->admin()->create();
    $o = Order::factory()->create();
    $p = Product::factory()->create();
    $o->items()->create(['product_id' => $p->id, 'product_snapshot' => ['name' => 'x'], 'options_snapshot' => [], 'quantity' => 1, 'base_unit_price' => 1, 'unit_price' => 1, 'item_total' => 1]);
    fire('OrderCreated', $o);
    fire('OrderCreated', $o);
    expect(DB::table('staff_actions')->where('type', 'ASSIGN_DESIGNER')->count())->toBe(1);
    expect(DB::table('staff_notifications')->where('user_id', $admin->id)->count())->toBeGreaterThanOrEqual(1);
});

it('reading a notification never closes its action (BR-066)', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);
    $id = app(NotificationService::class)->openAction('k1', 'OTHER', 'إجراء');
    app(NotificationService::class)->notify(['orders.view'], 'ACTION_REQUIRED', 'إشعار', null, '/actions', $id);
    $n = DB::table('staff_notifications')->where('user_id', $admin->id)->first();
    $this->post("/notifications/{$n->id}/read")->assertRedirect();
    $this->post('/notifications/read-all')->assertRedirect();
    expect(DB::table('staff_actions')->where('id', $id)->value('status'))->toBe('OPEN');
    expect(DB::table('staff_notifications')->where('id', $n->id)->value('read_at'))->not->toBeNull();
});

it('users only see and read their own notifications', function () {
    $a = User::factory()->admin()->create();
    $b = User::factory()->dataEntry()->create();
    DB::table('staff_notifications')->insert(['user_id' => $a->id, 'type' => 'X', 'title' => 'خاص بأ', 'created_at' => now()]);
    $nid = DB::table('staff_notifications')->value('id');
    $this->actingAs($b)->get('/notifications')->assertOk()->assertInertia(fn ($p) => $p->where('counts.all', 0));
    $this->post("/notifications/{$nid}/read");
    expect(DB::table('staff_notifications')->where('id', $nid)->value('read_at'))->toBeNull();
});

it('claims once atomically and only the owner can complete (BR-067)', function () {
    $a = User::factory()->admin()->create();
    $b = User::factory()->dataEntry()->create();
    $id = app(NotificationService::class)->openAction('k2', 'OTHER', 'إجراء');
    $this->actingAs($a)->withHeaders(['Idempotency-Key' => 'c1'])->postJson("/actions/{$id}/claim")->assertRedirect();
    $this->actingAs($b)->withHeaders(['Idempotency-Key' => 'c2'])->postJson("/actions/{$id}/claim")->assertStatus(409);
    $this->withHeaders(['Idempotency-Key' => 'c3'])->postJson("/actions/{$id}/complete")->assertForbidden();
    $this->actingAs($a)->withHeaders(['Idempotency-Key' => 'c4'])->postJson("/actions/{$id}/complete")->assertRedirect();
    expect(DB::table('staff_actions')->where('id', $id)->value('status'))->toBe('DONE');
    $this->get('/actions/log')->assertOk()->assertInertia(fn ($p) => $p->where('actions.total', 1));
});

it('lists actions oldest first and filters by type', function () {
    $this->actingAs(User::factory()->admin()->create());
    $svc = app(NotificationService::class);
    $svc->openAction('a', 'OTHER', 'قديم');
    DB::table('staff_actions')->update(['created_at' => now()->subDay()]);
    $svc->openAction('b', 'CUSTOMER_NOTICE', 'جديد');
    $r = $this->get('/actions')->assertOk();
    $r->assertInertia(fn ($p) => $p->where('actions.data.0.title', 'قديم')->where('counts.total', 2));
    $this->get('/actions?type=CUSTOMER_NOTICE')->assertInertia(fn ($p) => $p->where('actions.total', 1));
});

it('creates a manual customer-notice action when an order becomes ready — no auto WhatsApp (BR-069)', function () {
    User::factory()->admin()->create();
    $o = Order::factory()->create();
    fire('OrderStatusChanged', $o, ['to' => 'READY_FOR_PICKUP']);
    expect(DB::table('staff_actions')->where('type', 'CUSTOMER_NOTICE')->count())->toBe(1);
    fire('OrderStatusChanged', $o, ['to' => 'COMPLETED']);
    expect(DB::table('staff_actions')->where('type', 'CUSTOMER_NOTICE')->value('status'))->toBe('DONE');
});

it('broadcasts each created notification on the recipient private channel with the fresh unread count', function () {
    Event::fake([StaffNotificationCreated::class]);
    $a = User::factory()->superAdmin()->create();
    app(NotificationService::class)->notify(['orders.view'], 'TEST', 'عنوان', 'تفصيل', '/orders');
    Event::assertDispatched(StaffNotificationCreated::class, fn ($e) => $e->userId === $a->id && $e->unread === 1 && $e->broadcastOn()[0]->name === "private-App.Models.User.{$a->id}");
});

it('does not fail the business flow when broadcasting is down', function () {
    config(['broadcasting.default' => 'reverb', 'broadcasting.connections.reverb.options.host' => '127.0.0.1', 'broadcasting.connections.reverb.options.port' => 9]);
    User::factory()->superAdmin()->create();
    expect(app(NotificationService::class)->notify(['orders.view'], 'TEST', 'x'))->toBeGreaterThan(0);
    expect(DB::table('staff_notifications')->where('title', 'x')->count())->toBeGreaterThan(0);
});

it('notifies each recipient exactly once per business event (listeners registered once)', function () {
    $a = User::factory()->superAdmin()->create();
    $o = Order::factory()->create();
    app(Outbox::class)->record('PrintingStarted', $o, ['order_id' => $o->id]);
    app(Outbox::class)->dispatchPending();
    expect(DB::table('staff_notifications')->where('user_id', $a->id)->where('type', 'PRINTING_STARTED')->count())->toBe(1);
    $listeners = collect(app('events')->getListeners(OutboxEventPublished::class));
    expect($listeners)->toHaveCount(2);
});
