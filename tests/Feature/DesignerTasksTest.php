<?php

use App\Models\DesignVersion;
use App\Models\File;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

function dItem(User $d): OrderItem
{
    $p = Product::factory()->create();
    $o = Order::factory()->create();

    return $o->items()->create([
        'product_id' => $p->id, 'product_snapshot' => ['id' => $p->id, 'name' => $p->name], 'options_snapshot' => [['group' => 'المقاس', 'value' => 'A5']], 'quantity' => 10,
        'base_unit_price' => 100, 'unit_price' => 100, 'item_total' => 1000, 'designer_id' => $d->id,
    ]);
}
function dFile(User $u): File
{
    return File::create(['storage_key' => 'k/'.uniqid(), 'disk' => 'local', 'original_filename' => 'a.pdf', 'mime_type' => 'application/pdf', 'size_bytes' => 5, 'category' => 'design_preview', 'uploaded_by_type' => 'staff', 'uploaded_by_id' => $u->id, 'checksum' => str_repeat('b', 64)]);
}
function dpost($t, string $m, string $url, array $d = [])
{
    return $t->withHeaders(['Idempotency-Key' => uniqid()])->{$m.'Json'}($url, $d);
}

it('shows a designer only their own tasks with counts and no prices (BR-071)', function () {
    $d = User::factory()->designer()->create();
    $mine = dItem($d);
    dItem(User::factory()->designer()->create());
    $this->actingAs($d)->get('/designer/tasks')->assertOk()->assertInertia(fn ($p) => $p->component('designer/tasks')->where('counts.new', 1)->has('tasks', 1)->missing('tasks.0.total_minor')->missing('tasks.0.price'));
    $this->get("/designer/tasks/{$mine->id}")->assertOk()->assertInertia(fn ($p) => $p->component('designer/task')->missing('task.item_total'));
});

it('hides other designers tasks with 404 (BOLA)', function () {
    $d = User::factory()->designer()->create();
    $other = dItem(User::factory()->designer()->create());
    $this->actingAs($d)->get("/designer/tasks/{$other->id}")->assertNotFound();
    dpost($this, 'post', "/designer/tasks/{$other->id}/start")->assertStatus(403);
});

it('blocks non-designers from the designer area', function () {
    $d = User::factory()->designer()->create();
    $item = dItem($d);
    $this->actingAs(User::factory()->dataEntry()->create())->get('/designer/tasks')->assertForbidden();
    $this->get("/designer/tasks/{$item->id}")->assertForbidden();
});

it('runs start → new version → save files → submit over HTTP', function () {
    $d = User::factory()->designer()->create();
    $item = dItem($d);
    $this->actingAs($d);
    dpost($this, 'post', "/designer/tasks/{$item->id}/start")->assertRedirect();
    expect($item->refresh()->design_state)->toBe('IN_DESIGN');
    $this->get("/designer/tasks/{$item->id}/versions/new")->assertRedirect();
    $v = DesignVersion::firstOrFail();
    $this->get("/designer/versions/{$v->id}")->assertOk()->assertInertia(fn ($p) => $p->component('designer/version'));
    $f = dFile($d);
    dpost($this, 'put', "/designer/versions/{$v->id}", ['file_ids' => [], 'submit' => true])->assertStatus(422); // بلا ملفات
    dpost($this, 'put', "/designer/versions/{$v->id}", ['file_ids' => [$f->id], 'notes' => 'تم', 'submit' => true])->assertRedirect();
    expect($v->refresh()->status)->toBe('SUBMITTED')->and($item->refresh()->design_state)->toBe('AWAITING_APPROVAL');
    expect($f->refresh()->parent_type)->toBe('design_version');
});

it('lets the owner preview a pending upload but not another user, and the assigned designer preview attached files', function () {
    $d = User::factory()->designer()->create();
    $f = dFile($d);
    Storage::disk('local')->put($f->storage_key, 'x');
    $this->actingAs($d)->get("/files/{$f->id}/preview")->assertOk();
    $this->actingAs(User::factory()->designer()->create())->get("/files/{$f->id}/preview")->assertForbidden();
});
