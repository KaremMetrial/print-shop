<?php

use App\Exceptions\BusinessException;
use App\Models\DesignerSpecialty;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Design\AssignmentService;
use App\Services\Outbox\Outbox;
use Illuminate\Support\Facades\DB;

function designer(?DesignerSpecialty $spec = null, string $avail = 'AVAILABLE'): User
{
    $d = User::factory()->designer()->create();
    DB::table('designer_availability')->updateOrInsert(['designer_id' => $d->id], ['status' => $avail, 'updated_at' => now()]);
    if ($spec) {
        $d->specialties()->attach($spec->id);
    }

    return $d;
}
function itemFor(?DesignerSpecialty $spec): OrderItem
{
    $p = Product::factory()->create(['required_specialty_id' => $spec?->id]);
    $o = Order::factory()->create();

    return $o->items()->create([
        'product_id' => $p->id, 'product_snapshot' => ['id' => $p->id, 'name' => $p->name, 'required_specialty_id' => $spec?->id], 'options_snapshot' => [], 'quantity' => 10,
        'base_unit_price' => 100, 'unit_price' => 100, 'item_total' => 1000,
    ]);
}
function svc(): AssignmentService
{
    return app(AssignmentService::class);
}

it('assigns only a qualified, available designer (BR-017)', function () {
    $print = DesignerSpecialty::create(['name' => 'تصميم مطبوعات']);
    $ad = DesignerSpecialty::create(['name' => 'تصميم إعلاني']);
    $wrong = designer($ad);
    $off = designer($print, 'ON_LEAVE');
    $right = designer($print);
    $item = itemFor($print);
    expect(svc()->assignItem($item)?->id)->toBe($right->id);
    expect($item->refresh()->designer_id)->toBe($right->id)->and($wrong->id)->not->toBe($right->id)->and($off->id)->not->toBe($right->id);
    expect(DB::table('item_assignment_history')->where('order_item_id', $item->id)->where('mode', 'AUTO')->count())->toBe(1);
});

it('leaves the item unassigned when nobody qualifies', function () {
    $print = DesignerSpecialty::create(['name' => 'تصميم مطبوعات']);
    designer(null);
    $item = itemFor($print);
    expect(svc()->assignItem($item))->toBeNull()->and($item->refresh()->designer_id)->toBeNull();
});

it('picks the designer with the least ACTIVE work; new and awaiting-approval do not count (BR-016)', function () {
    $s = DesignerSpecialty::create(['name' => 'تصميم مطبوعات']);
    $busy = designer($s);
    $light = designer($s);
    foreach (['IN_DESIGN', 'IN_DESIGN', 'REVISION_REQUESTED'] as $st) {
        itemFor($s)->update(['designer_id' => $busy->id, 'design_state' => $st]);
    }
    foreach (['NEW', 'AWAITING_APPROVAL', 'AWAITING_APPROVAL', 'AWAITING_APPROVAL'] as $st) {
        itemFor($s)->update(['designer_id' => $light->id, 'design_state' => $st]);
    }
    expect(svc()->assignItem(itemFor($s))?->id)->toBe($light->id);
});

it('breaks ties by the oldest assignment (round robin)', function () {
    $s = DesignerSpecialty::create(['name' => 'تصميم مطبوعات']);
    $a = designer($s);
    $b = designer($s);
    $first = svc()->assignItem(itemFor($s));
    $second = svc()->assignItem(itemFor($s));
    expect($first->id)->not->toBe($second->id);
});

it('is idempotent and driven by the OrderCreated outbox event', function () {
    $s = DesignerSpecialty::create(['name' => 'تصميم مطبوعات']);
    $d = designer($s);
    $item = itemFor($s);
    app(Outbox::class)->record('OrderCreated', $item->order, ['order_id' => $item->order_id]);
    app(Outbox::class)->dispatchPending();
    app(Outbox::class)->record('OrderCreated', $item->order, ['order_id' => $item->order_id]);
    app(Outbox::class)->dispatchPending();
    expect($item->refresh()->designer_id)->toBe($d->id)->and(DB::table('item_assignment_history')->where('order_item_id', $item->id)->count())->toBe(1);
});

it('manual reassignment rejects unqualified designers and keeps history', function () {
    $print = DesignerSpecialty::create(['name' => 'تصميم مطبوعات']);
    $ad = DesignerSpecialty::create(['name' => 'تصميم إعلاني']);
    $ok = designer($print);
    $bad = designer($ad);
    $item = itemFor($print);
    $admin = User::factory()->admin()->create();
    expect(fn () => svc()->assignManually($admin, $item, $bad))->toThrow(BusinessException::class);
    svc()->assignManually($admin, $item, $ok, 'إعادة توزيع');
    expect($item->refresh()->designer_id)->toBe($ok->id)->and(DB::table('item_assignment_history')->where('mode', 'MANUAL')->count())->toBe(1);
});
