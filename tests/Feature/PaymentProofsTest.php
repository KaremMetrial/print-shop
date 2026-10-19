<?php

use App\Actions\Orders\CreateOrder;
use App\Models\Customer;
use App\Models\OrderLink;
use App\Models\Product;
use App\Models\User;
use App\Services\Orders\OrderLinkService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

function proofSetup(): array
{
    Storage::fake(config('files.disk'));
    $a = User::factory()->superAdmin()->create();
    $o = app(CreateOrder::class)->handle($a, ['customer_id' => Customer::factory()->create()->id, 'items' => [['product_id' => Product::factory()->create()->id, 'quantity' => 1]]]);
    $svc = app(OrderLinkService::class);

    return [$a, $o, basename($svc->url($o->link ?? OrderLink::where('order_id', $o->id)->firstOrFail()))];
}
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

it('keeps a customer proof pending without touching balances until approved', function () {
    [$a, $o, $token] = proofSetup();
    $f = UploadedFile::fake()->createWithContent('t.png', base64_decode(PNG));
    $this->post("/l/{$token}/proofs", ['file' => $f, 'amount_minor' => $o->grand_total->minor, 'method' => 'BANK_TRANSFER'], ['Idempotency-Key' => 'p1'])->assertRedirect();
    expect(DB::table('payment_proofs')->where('status', 'PENDING')->count())->toBe(1)->and(DB::table('payments')->count())->toBe(0);
    $id = DB::table('payment_proofs')->value('id');
    $this->actingAs($a)->post("/accounting/proofs/{$id}/approve", [], ['Idempotency-Key' => 'a1'])->assertRedirect();
    expect(DB::table('payments')->where('amount', $o->grand_total->minor)->count())->toBe(1)->and(DB::table('payment_proofs')->value('status'))->toBe('APPROVED');
    $this->postJson("/accounting/proofs/{$id}/approve", [], ['Idempotency-Key' => 'a2'])->assertStatus(409);
});

it('rejects with a mandatory reason and stays out of accounting', function () {
    [$a, $o, $token] = proofSetup();
    $this->post("/l/{$token}/proofs", ['file' => UploadedFile::fake()->createWithContent('t.png', base64_decode(PNG)), 'amount_minor' => 100, 'method' => 'CASH'], ['Idempotency-Key' => 'p2']);
    $id = DB::table('payment_proofs')->value('id');
    $this->actingAs($a)->post("/accounting/proofs/{$id}/reject", ['reason' => ''], ['Idempotency-Key' => 'r0'])->assertSessionHasErrors('reason');
    $this->post("/accounting/proofs/{$id}/reject", ['reason' => 'صورة غير واضحة'], ['Idempotency-Key' => 'r1'])->assertRedirect();
    expect(DB::table('payment_proofs')->value('status'))->toBe('REJECTED')->and(DB::table('payments')->count())->toBe(0);
});

it('rejects non-image files, restricts the queue to reviewers', function () {
    [$a, , $token] = proofSetup();
    $bad = UploadedFile::fake()->createWithContent('x.png', '<?php echo 1;');
    $this->postJson("/l/{$token}/proofs", ['file' => $bad, 'amount_minor' => 100, 'method' => 'CASH'], ['Idempotency-Key' => 'b1'])->assertStatus(422);
    $this->actingAs(User::factory()->designer()->create())->get('/accounting/proofs')->assertForbidden();
    $this->actingAs($a)->get('/accounting/proofs')->assertOk()->assertInertia(fn ($p) => $p->component('operations/proofs'));
});
