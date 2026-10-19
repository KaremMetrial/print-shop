<?php

use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\DesignVersion;
use App\Models\File;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Design\DesignService;

function ds(): DesignService
{
    return app(DesignService::class);
}
function designFile(): File
{
    return File::create([
        'storage_key' => 'k/'.uniqid(), 'disk' => 'local', 'original_filename' => 'p.pdf', 'mime_type' => 'application/pdf', 'size_bytes' => 10,
        'category' => 'design_preview', 'uploaded_by_type' => 'staff', 'uploaded_by_id' => 1, 'checksum' => str_repeat('a', 64),
    ]);
}
/** @return array{0: Order, 1: list<OrderItem>, 2: User} */
function designOrder(int $items = 2): array
{
    $d = User::factory()->designer()->create();
    $o = Order::factory()->create();
    $list = [];
    for ($i = 0; $i < $items; $i++) {
        $p = Product::factory()->create();
        $list[] = $o->items()->create([
            'product_id' => $p->id, 'product_snapshot' => ['id' => $p->id, 'name' => $p->name], 'options_snapshot' => [], 'quantity' => 10, 'base_unit_price' => 100,
            'unit_price' => 100, 'item_total' => 1000, 'designer_id' => $d->id,
        ]);
    }

    return [$o, $list, $d];
}
function submitted(User $d, OrderItem $item): DesignVersion
{
    ds()->start($d, $item);
    $v = ds()->createVersion($d, $item);
    ds()->setFiles($d, $v, [designFile()->id]);

    return ds()->submit($d, $v->refresh());
}

it('walks NEW → IN_DESIGN → AWAITING_APPROVAL with full files only', function () {
    [, [$a], $d] = designOrder(1);
    expect(fn () => ds()->createVersion($d, $a))->toThrow(BusinessException::class); // لم يبدأ
    ds()->start($d, $a);
    $v = ds()->createVersion($d, $a);
    expect(fn () => ds()->submit($d, $v))->toThrow(BusinessException::class); // بلا ملفات (BR-019)
    ds()->setFiles($d, $v, [designFile()->id]);
    $v = ds()->submit($d, $v->refresh());
    expect($v->status)->toBe('SUBMITTED')->and($a->refresh()->design_state)->toBe('AWAITING_APPROVAL');
});

it('only the assigned designer can act (BR-014/071)', function () {
    [, [$a]] = designOrder(1);
    $other = User::factory()->designer()->create();
    expect(fn () => ds()->start($other, $a))->toThrow(BusinessException::class);
});

it('moves to IN_PRINTING only when every active item is approved (BR-030)', function () {
    [$o, [$a, $b], $d] = designOrder(2);
    $va = submitted($d, $a);
    $vb = submitted($d, $b);
    ds()->approve('customer', 1, $va, $va->manifest_revision);
    expect($o->refresh()->status)->toBe(OrderStatus::DESIGN_STAGE);
    ds()->approve('customer', 1, $vb, $vb->manifest_revision);
    expect($o->refresh()->status)->toBe(OrderStatus::IN_PRINTING)->and($o->printing_started_at)->not->toBeNull();
});

it('ignores soft-cancelled items when deciding printing readiness', function () {
    [$o, [$a, $b], $d] = designOrder(2);
    $b->update(['cancelled_at' => now()]);
    $va = submitted($d, $a);
    ds()->approve('customer', 1, $va, $va->manifest_revision);
    expect($o->refresh()->status)->toBe(OrderStatus::IN_PRINTING);
});

it('rejects a stale approval after the files changed (TC race)', function () {
    [, [$a], $d] = designOrder(1);
    $v = submitted($d, $a);
    $seen = $v->manifest_revision;
    // الإرسال يجعل النسخة SUBMITTED؛ تغيير الملفات بعده غير مسموح إلا بنسخة جديدة، لذا نحاكي تغيير الـmanifest
    $v->update(['manifest_revision' => $seen + 1]);
    expect(fn () => ds()->approve('customer', 1, $v->refresh(), $seen))->toThrow(BusinessException::class);
    expect($a->refresh()->design_state)->toBe('AWAITING_APPROVAL');
});

it('approved versions are immutable and cannot be approved twice (BR-021)', function () {
    [, [$a, $b], $d] = designOrder(2);
    $v = submitted($d, $a);
    ds()->approve('customer', 1, $v, $v->manifest_revision);
    expect(fn () => ds()->setFiles($d, $v->refresh(), [designFile()->id]))->toThrow(BusinessException::class);
    expect(fn () => ds()->approve('customer', 1, $v->refresh(), $v->manifest_revision))->toThrow(BusinessException::class);
});

it('revision request returns the item to design without limit and a new version supersedes the old (BR-024/025)', function () {
    [, [$a], $d] = designOrder(1);
    for ($i = 0; $i < 3; $i++) {
        $v = $i === 0 ? submitted($d, $a) : (function () use ($d, $a) {
            $n = ds()->createVersion($d, $a);
            ds()->setFiles($d, $n, [designFile()->id]);

            return ds()->submit($d, $n->refresh());
        })();
        ds()->requestRevision($a, 'customer', 1, 'عدل اللون');
        expect($a->refresh()->design_state)->toBe('REVISION_REQUESTED');
    }
    expect(DesignVersion::where('order_item_id', $a->id)->count())->toBe(3)->and(DesignVersion::where('order_item_id', $a->id)->where('status', 'SUPERSEDED')->count())->toBe(2);
});

it('reopens only before printing, with a reason, by authorized staff (BR-029)', function () {
    [$o, [$a, $b], $d] = designOrder(2);
    $va = submitted($d, $a);
    ds()->approve('customer', 1, $va, $va->manifest_revision);
    $admin = User::factory()->admin()->create();
    $de = User::factory()->dataEntry()->create();
    expect(fn () => ds()->reopen($de, $a->refresh(), 'x'))->toThrow(BusinessException::class);
    expect(fn () => ds()->reopen($admin, $a->refresh(), ''))->toThrow(BusinessException::class);
    ds()->reopen($admin, $a->refresh(), 'العميل غيّر رأيه');
    expect($a->refresh()->design_state)->toBe('REVISION_REQUESTED')->and($a->approved_version_id)->toBeNull();
    // بعد بدء الطباعة: ممنوع
    $vb = submitted($d, $b);
    $va2 = ds()->createVersion($d, $a);
    ds()->setFiles($d, $va2, [designFile()->id]);
    $va2 = ds()->submit($d, $va2->refresh());
    ds()->approve('customer', 1, $vb, $vb->manifest_revision);
    ds()->approve('customer', 1, $va2, $va2->manifest_revision);
    expect($o->refresh()->status)->toBe(OrderStatus::IN_PRINTING);
    expect(fn () => ds()->reopen($admin, $a->refresh(), 'متأخر'))->toThrow(BusinessException::class);
});

it('blocks design actions on cancelled or printing orders', function () {
    [$o, [$a], $d] = designOrder(1);
    $o->update(['status' => OrderStatus::CANCELLED]);
    expect(fn () => ds()->start($d, $a))->toThrow(BusinessException::class);
});
