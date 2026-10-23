<?php

use App\Enums\OrderRequestStatus;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\User;

function makeRequest(array $o = []): OrderRequest
{
    $p = Product::factory()->create(['base_unit_price' => 100, 'minimum_quantity' => 10]);
    $r = OrderRequest::factory()->create($o);
    $r->items()->create(['product_id' => $p->id, 'quantity' => 300, 'original_quantity' => 300, 'options' => []]);

    return $r->refresh();
}
function rq($test, string $method, string $url, array $data = [], string $k = 'rk')
{
    return $test->withHeaders(['Idempotency-Key' => $k.uniqid()])->{$method.'Json'}($url, $data);
}

it('numbers requests and lists them by status (oldest first)', function () {
    $this->actingAs(User::factory()->dataEntry()->create());
    $a = makeRequest();
    expect($a->request_number)->toBe('REQ-'.str_pad((string) $a->id, 4, '0', STR_PAD_LEFT));
    $this->get('/order-requests')->assertOk()->assertInertia(fn ($p) => $p->component('order-requests/index')->where('counts.PENDING', 1)->has('requests.data', 1));
});

it('claims a request atomically — second reviewer is refused (BR-010)', function () {
    $r = makeRequest();
    $u1 = User::factory()->dataEntry()->create();
    $u2 = User::factory()->dataEntry()->create();
    $this->actingAs($u1);
    rq($this, 'post', "/order-requests/{$r->id}/start")->assertRedirect();
    expect($r->refresh()->status)->toBe(OrderRequestStatus::IN_REVIEW)->and($r->reviewer_id)->toBe($u1->id);
    $this->actingAs($u2);
    rq($this, 'post', "/order-requests/{$r->id}/start")->assertStatus(409)->assertJsonPath('error.code', 'REQUEST_ALREADY_CLAIMED');
    expect($r->refresh()->reviewer_id)->toBe($u1->id);
    expect(AuditLog::where('action', 'order_request.review_started')->count())->toBe(1);
});

it('only the reviewer can edit, accept or reject', function () {
    $r = makeRequest();
    $u1 = User::factory()->dataEntry()->create();
    $u2 = User::factory()->dataEntry()->create();
    $this->actingAs($u1);
    rq($this, 'post', "/order-requests/{$r->id}/start");
    $this->actingAs($u2);
    rq($this, 'post', "/order-requests/{$r->id}/accept")->assertStatus(409);
    rq($this, 'post', "/order-requests/{$r->id}/reject", ['reason' => 'x'])->assertStatus(409);
});

it('saves edits with MOQ check and records the diff', function () {
    $r = makeRequest();
    $this->actingAs(User::factory()->dataEntry()->create());
    rq($this, 'post', "/order-requests/{$r->id}/start");
    $item = $r->items->first();
    rq($this, 'patch', "/order-requests/{$r->id}", ['items' => [['id' => $item->id, 'quantity' => 5]]])->assertStatus(422);
    rq($this, 'patch', "/order-requests/{$r->id}", ['items' => [['id' => $item->id, 'quantity' => 500]]])->assertRedirect();
    expect($item->refresh()->quantity)->toBe(500)->and($item->original_quantity)->toBe(300);
    expect(AuditLog::where('action', 'order_request.edited')->exists())->toBeTrue();
});

it('accepts once and creates exactly one order from the edited items (TC-030)', function () {
    $r = makeRequest();
    $this->actingAs(User::factory()->dataEntry()->create());
    rq($this, 'post', "/order-requests/{$r->id}/start");
    rq($this, 'post', "/order-requests/{$r->id}/accept")->assertRedirect();
    $r->refresh();
    expect($r->status)->toBe(OrderRequestStatus::ACCEPTED)->and($r->order_id)->not->toBeNull()->and(Order::count())->toBe(1);
    expect(Order::first()->source)->toBe('ACCEPTED_REQUEST')->and(Order::first()->grand_total->minor)->toBe(30000);
    rq($this, 'post', "/order-requests/{$r->id}/accept")->assertStatus(409)->assertJsonPath('error.code', 'REQUEST_ALREADY_DECIDED');
    expect(Order::count())->toBe(1);
});

it('rejects only with a reason and a rejected request is final (BR-011/012)', function () {
    $r = makeRequest();
    $this->actingAs(User::factory()->dataEntry()->create());
    rq($this, 'post', "/order-requests/{$r->id}/start");
    rq($this, 'post', "/order-requests/{$r->id}/reject", ['reason' => ''])->assertStatus(422);
    rq($this, 'post', "/order-requests/{$r->id}/reject", ['reason' => 'المواصفات المطلوبة غير متاحة'])->assertRedirect();
    expect($r->refresh()->status)->toBe(OrderRequestStatus::REJECTED)->and($r->reject_reason)->toBe('المواصفات المطلوبة غير متاحة');
    rq($this, 'post', "/order-requests/{$r->id}/start")->assertStatus(409);
    rq($this, 'post', "/order-requests/{$r->id}/accept")->assertStatus(409);
});

it('forbids designers from the requests area', function () {
    $r = makeRequest();
    $this->actingAs(User::factory()->designer()->create());
    $this->get('/order-requests')->assertForbidden();
    rq($this, 'post', "/order-requests/{$r->id}/start")->assertForbidden();
});

it('lets an admin release a request held by an absent reviewer (D4) and audits it', function () {
    $held = User::factory()->dataEntry()->create();
    $req = OrderRequest::factory()->create(['status' => 'IN_REVIEW', 'reviewer_id' => $held->id, 'review_started_at' => now()->subDay()]);
    $this->actingAs(User::factory()->designer()->create())->post("/order-requests/{$req->id}/release", [], ['Idempotency-Key' => 'rel-0'])->assertForbidden();
    $this->actingAs(User::factory()->admin()->create())->post("/order-requests/{$req->id}/release", [], ['Idempotency-Key' => 'rel-1'])->assertRedirect();
    $req->refresh();
    expect($req->status->value)->toBe('PENDING')->and($req->reviewer_id)->toBeNull()
        ->and(AuditLog::where('action', 'order_request.review_released')->exists())->toBeTrue();
});
