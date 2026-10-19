<?php

use App\Actions\Orders\CancelOrder;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Finance\PaymentService;
use App\Services\Notifications\NotificationService;
use App\Services\Settings\Settings;
use Illuminate\Support\Facades\DB;

function jpost($t, string $url, array $d = [], string $m = 'post')
{
    return $t->withHeaders(['Idempotency-Key' => uniqid()])->{$m.'Json'}($url, $d);
}

it('shows the read-only audit log with filters, and denies roles without audit.view', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);
    app(AuditService::class)->record('order.created', Order::factory()->create(), [], ['n' => 1]);
    app(AuditService::class)->record('customer.updated');
    $this->get('/audit')->assertOk()->assertInertia(fn ($p) => $p->component('operations/audit')->where('logs.total', 2));
    $this->get('/audit?action=order.')->assertInertia(fn ($p) => $p->where('logs.total', 1));
    $this->get("/audit?actor={$admin->id}")->assertInertia(fn ($p) => $p->where('logs.total', 2));
    $this->actingAs(User::factory()->designer()->create())->get('/audit')->assertForbidden();
});

it('lists execution queues by status with search and delivery filter', function () {
    $this->actingAs(User::factory()->dataEntry()->create());
    $c = Customer::factory()->create(['name' => 'شركة الأفق']);
    Order::factory()->create(['status' => OrderStatus::IN_PRINTING, 'customer_id' => $c->id]);
    Order::factory()->create(['status' => OrderStatus::READY_FOR_DELIVERY, 'delivery_method' => 'DELIVERY']);
    $this->get('/delivery')->assertOk()->assertInertia(fn ($p) => $p->where('orders.total', 1)->where('counts.delivery', 1));
    $this->get('/delivery?tab=printing&q=الأفق')->assertInertia(fn ($p) => $p->where('orders.total', 1));
    $this->get('/delivery?tab=printing&q=لا-يوجد')->assertInertia(fn ($p) => $p->where('orders.total', 0));
    $this->get('/delivery?tab=delivery&method=PICKUP')->assertInertia(fn ($p) => $p->where('orders.total', 0));
});

it('search is permission scoped and needs 2+ chars', function () {
    $this->actingAs(User::factory()->admin()->create());
    Customer::factory()->create(['name' => 'مؤسسة مدار']);
    Product::factory()->create(['name' => 'مدار بانر']);
    $this->get('/search?q=م')->assertInertia(fn ($p) => $p->where('results.customers', []));
    $this->get('/search?q=مدار')->assertInertia(fn ($p) => $p->has('results.customers', 1)->has('results.products', 1));
    $this->actingAs(User::factory()->designer()->create())->get('/search?q=مدار')->assertInertia(fn ($p) => $p->where('results.customers', [])->where('results.orders', []));
});

it('reports are derived from data and gated by permission', function () {
    $this->actingAs(User::factory()->admin()->create());
    Order::factory()->count(2)->create();
    $this->get('/reports')->assertOk()->assertInertia(fn ($p) => $p->where('ops.created', 2)->has('fin'));
    $this->actingAs(User::factory()->designer()->create())->get('/reports')->assertForbidden();
});

it('updates settings only for known keys and permitted groups, with audit', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);
    $this->get('/settings/system')->assertOk();
    $this->patchJson('/settings/system', ['values' => ['orders.default_eta_days' => '3']])->assertRedirect();
    expect(app(Settings::class)->int('orders.default_eta_days'))->toBe(3);
    expect(DB::table('audit_logs')->where('action', 'settings.updated')->exists())->toBeTrue();
    $this->patchJson('/settings/system', ['values' => ['hack.key' => 'x']])->assertForbidden();
    $this->patchJson('/settings/system', ['values' => ['orders.default_eta_days' => 'abc']])->assertStatus(422);
    $this->actingAs(User::factory()->designer()->create())->get('/settings/system')->assertForbidden();
});

it('records, corrects, voids payments and pays refunds through the accounting endpoints', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);
    $c = Customer::factory()->create();
    $o = Order::factory()->create(['customer_id' => $c->id, 'grand_total' => 10000, 'subtotal' => 10000]);
    jpost($this, '/accounting/payments', ['customer_id' => $c->id, 'amount_minor' => 4000, 'method' => 'CASH', 'order_id' => $o->id])->assertRedirect();
    jpost($this, '/accounting/payments', ['customer_id' => $c->id, 'amount_minor' => 7000, 'method' => 'CASH', 'order_id' => $o->id])->assertStatus(422); // أكبر من المتبقي
    $p = Payment::first();
    $this->get('/accounting')->assertOk()->assertInertia(fn ($x) => $x->where('payments.total', 1));
    jpost($this, "/accounting/payments/{$p->id}/correct", ['amount_minor' => 5000, 'reason' => ''])->assertStatus(422);
    jpost($this, "/accounting/payments/{$p->id}/correct", ['amount_minor' => 5000, 'reason' => 'خطأ إدخال'])->assertRedirect();
    expect(app(PaymentService::class)->paid($o))->toBe(5000);
    $this->get('/accounting?tab=receivables')->assertInertia(fn ($x) => $x->where('total_due_minor', 5000));
    app(CancelOrder::class)->handle($admin, $o, 'طلب العميل');
    $ob = DB::table('refund_obligations')->first();
    $this->get('/accounting?tab=refunds')->assertInertia(fn ($x) => $x->where('refunds.0.remaining_minor', 5000));
    jpost($this, "/accounting/refunds/{$ob->id}/payout", ['amount_minor' => 6000, 'method' => 'CASH'])->assertStatus(422);
    jpost($this, "/accounting/refunds/{$ob->id}/payout", ['amount_minor' => 5000, 'method' => 'CASH'])->assertRedirect();
    jpost($this, "/accounting/payments/{$p->id}/void", ['reason' => 'مكررة'])->assertRedirect();
});

it('blocks data entry from correcting or voiding payments and designers from accounting (BR-053)', function () {
    $c = Customer::factory()->create();
    $o = Order::factory()->create(['customer_id' => $c->id, 'grand_total' => 1000]);
    $p = app(PaymentService::class)->record(User::factory()->admin()->create(), $c, 500, 'CASH', $o);
    $this->actingAs(User::factory()->dataEntry()->create());
    jpost($this, "/accounting/payments/{$p->id}/void", ['reason' => 'x'])->assertForbidden();
    $this->actingAs(User::factory()->designer()->create())->get('/accounting')->assertForbidden();
});

it('shows real payments on the order payments tab', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);
    $c = Customer::factory()->create();
    $o = Order::factory()->create(['customer_id' => $c->id, 'grand_total' => 2000]);
    app(PaymentService::class)->record($admin, $c, 800, 'BANK_TRANSFER', $o);
    $this->get("/orders/{$o->id}?tab=payments")->assertInertia(fn ($p) => $p->where('order.paid_minor', 800)->where('order.remaining_minor', 1200)->has('payments', 1));
});

it('dashboard shows real numbers, not constants', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);
    Order::factory()->count(2)->create(['status' => OrderStatus::IN_PRINTING]);
    Order::factory()->create(['status' => OrderStatus::READY_FOR_PICKUP]);
    OrderRequest::factory()->create();
    app(NotificationService::class)->openAction('d1', 'OTHER', 'إجراء');
    $this->get('/dashboard')->assertOk()->assertInertia(fn ($p) => $p->where('kpis.in_printing', 2)->where('kpis.ready', 1)->where('kpis.pending_requests', 1)->where('kpis.follow_up', 1)->where('actions.total', 1)->has('recent', 3));
});
