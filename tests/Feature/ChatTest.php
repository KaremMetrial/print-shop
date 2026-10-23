<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Chat\ChatService;
use App\Services\Orders\OrderLinkService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

function chatItem(string $state = 'IN_DESIGN'): array
{
    $d = User::factory()->designer()->create();
    $o = Order::factory()->create();
    $p = Product::factory()->create();
    $it = $o->items()->create(['product_id' => $p->id, 'product_snapshot' => ['name' => 'x'], 'options_snapshot' => [], 'quantity' => 1, 'base_unit_price' => 1, 'unit_price' => 1, 'item_total' => 1, 'designer_id' => $d->id, 'design_state' => $state]);
    $svc = app(OrderLinkService::class);
    $link = $svc->create($o);

    return [$it, $d, $o, basename($svc->url($link))];
}

it('lets the assigned designer and the link customer exchange messages', function () {
    [$it, $d, , $token] = chatItem();
    $this->actingAs($d)->postJson("/chat/items/{$it->id}", ['body' => 'أهلًا', 'client_id' => 'a1'])->assertCreated();
    $this->postJson("/l/{$token}/items/{$it->id}/chat", ['body' => 'شكرًا', 'client_id' => 'b1'])->assertCreated();
    $r = $this->getJson("/chat/items/{$it->id}")->assertOk();
    expect($r->json('data'))->toHaveCount(2)->and($r->json('data.0.label'))->toBe('المصمم')->and($r->json('meta.can_send'))->toBeTrue();
    expect($this->getJson("/l/{$token}/items/{$it->id}/chat?after=".$r->json('data.0.id'))->json('data'))->toHaveCount(1);
});

it('is idempotent on retry with the same client id', function () {
    [$it, $d] = chatItem();
    $this->actingAs($d);
    $a = $this->postJson("/chat/items/{$it->id}", ['body' => 'x', 'client_id' => 'same'])->json('data');
    $b = $this->postJson("/chat/items/{$it->id}", ['body' => 'x', 'client_id' => 'same'])->json('data');
    expect($b['duplicate'])->toBeTrue()->and($b['id'])->toBe($a['id'])->and(DB::table('item_chat_messages')->count())->toBe(1);
});

it('hides other designers chats and lets data entry read but not send (BR-070/071)', function () {
    [$it] = chatItem();
    $this->actingAs(User::factory()->designer()->create())->getJson("/chat/items/{$it->id}")->assertNotFound();
    $de = User::factory()->dataEntry()->create();
    $this->actingAs($de)->getJson("/chat/items/{$it->id}")->assertOk()->assertJsonPath('meta.can_send', false);
    $this->postJson("/chat/items/{$it->id}", ['body' => 'x', 'client_id' => 'z'])->assertForbidden();
});

it('treats a customer message on a submitted design as a revision request (BR-024)', function () {
    [$it, , , $token] = chatItem('AWAITING_APPROVAL');
    $this->postJson("/l/{$token}/items/{$it->id}/chat", ['body' => 'عدّل اللون', 'client_id' => 'c1'])->assertCreated();
    expect($it->refresh()->design_state)->toBe('REVISION_REQUESTED');
});

it('locks the chat when the item is approved or the order enters printing (BR-027/035)', function () {
    [$it, $d, $o, $token] = chatItem();
    $it->update(['approved_at' => now(), 'design_state' => 'APPROVED']);
    $this->actingAs($d)->postJson("/chat/items/{$it->id}", ['body' => 'x', 'client_id' => 'l1'])->assertStatus(409)->assertJsonPath('error.code', 'CHAT_LOCKED');
    $this->getJson("/chat/items/{$it->id}")->assertJsonPath('meta.locked', true);
    [$it2, $d2, $o2] = chatItem();
    $o2->update(['status' => OrderStatus::IN_PRINTING]);
    $this->actingAs($d2)->postJson("/chat/items/{$it2->id}", ['body' => 'x', 'client_id' => 'l2'])->assertStatus(409);
});

it('does not let a link customer reach another order item chat', function () {
    [, , , $token] = chatItem();
    [$other] = chatItem();
    $this->getJson("/l/{$token}/items/{$other->id}/chat")->assertNotFound();
});

it('rejects empty or oversized messages and authorizes the channel only for the assigned designer', function () {
    [$it, $d] = chatItem();
    $this->actingAs($d)->postJson("/chat/items/{$it->id}", ['body' => '   ', 'client_id' => 'e1'])->assertStatus(422);
    $cs = app(ChatService::class);
    expect($cs->staffAccess($d, $it)[0])->toBeTrue()->and($cs->staffAccess(User::factory()->designer()->create(), $it)[0])->toBeFalse();
});

it('supports image and voice attachments in the item chat for both sides', function () {
    Storage::fake(config('files.disk'));
    [$it, $d, , $token] = chatItem();
    $img = UploadedFile::fake()->image('ref.png', 20, 20);
    // WAV صغير حقيقي (رأس RIFF) ليمر فحص المحتوى
    $wav = UploadedFile::fake()->createWithContent('voice.wav', 'RIFF'.pack('V', 36).'WAVEfmt '.pack('VvvVVvv', 16, 1, 1, 8000, 8000, 1, 8).'data'.pack('V', 0));

    $this->post("/l/{$token}/items/{$it->id}/chat", ['client_id' => 'f1', 'file' => $img], ['Accept' => 'application/json'])->assertCreated();
    $this->post("/l/{$token}/items/{$it->id}/chat", ['client_id' => 'f2', 'file' => $wav, 'body' => 'رسالة صوتية'], ['Accept' => 'application/json'])->assertCreated();
    $this->post("/l/{$token}/items/{$it->id}/chat", ['client_id' => 'f3'], ['Accept' => 'application/json'])->assertStatus(422); // لا نص ولا ملف

    $list = $this->actingAs($d)->getJson("/chat/items/{$it->id}")->assertOk()->json('data');
    expect($list[0]['file']['kind'])->toBe('image')->and($list[1]['file']['kind'])->toBe('audio');
    $this->get("/files/{$list[0]['file']['id']}/preview")->assertOk();

    auth('web')->logout();
    $this->get("/l/{$token}/files/{$list[0]['file']['id']}")->assertOk();
    // رابط أوردر آخر لا يصل لمرفق هذا الأوردر
    [, , , $other] = chatItem();
    $this->get("/l/{$other}/files/{$list[0]['file']['id']}")->assertNotFound();
    // مصمم غير مسند لا يرى المرفق
    $this->actingAs(User::factory()->designer()->create())->get("/files/{$list[0]['file']['id']}/preview")->assertForbidden();
});
