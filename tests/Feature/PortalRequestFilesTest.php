<?php

use App\Models\Customer;
use App\Models\File;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(fn () => Storage::fake(config('files.disk')));

/** @return array{0: Customer, 1: string} */
function loggedPortalCustomer($t, string $phone = '01011112222'): array
{
    $c = Customer::factory()->create(['phone_normalized' => $phone, 'phone_display' => $phone]);
    $pw = app(App\Actions\Customers\ManagePlatformAccess::class)->enable($c);
    $t->post('/portal/login', ['phone' => $phone, 'password' => $pw])->assertRedirect('/portal');

    return [$c->refresh(), $pw];
}

function png(string $name = 'logo-reference.png'): UploadedFile
{
    return UploadedFile::fake()->image($name, 40, 40);
}

it('lets a customer upload a reference file and attach it to a request item; staff can open it', function () {
    [$c] = loggedPortalCustomer($this);
    $product = Product::factory()->create(['is_active' => true, 'minimum_quantity' => 1]);

    $up = $this->post('/portal/files', ['file' => png()], ['Accept' => 'application/json'])->assertCreated()->json('data');
    expect($up['name'])->toBe('logo-reference.png');

    $this->post('/portal/requests', [
        'delivery_method' => 'PICKUP',
        'items' => [['product_id' => $product->id, 'quantity' => 10, 'file_ids' => [$up['id']]]],
    ], ['Idempotency-Key' => 'rf-1'])->assertRedirect();

    $req = OrderRequest::where('customer_id', $c->id)->firstOrFail();
    $file = File::findOrFail($up['id']);
    expect($file->parent_type)->toBe('order_request_item')->and($file->parent_id)->toBe($req->items->first()->id);

    auth('web')->logout();
    $staff = User::factory()->superAdmin()->create();
    $this->actingAs($staff)->get("/order-requests/{$req->id}")->assertInertia(fn ($p) => $p->where('items.0.files.0.name', 'logo-reference.png'));
    $this->get("/files/{$file->id}/preview")->assertOk();
});

it('refuses to attach another customer\'s file or a file that is already attached', function () {
    $other = Customer::factory()->create();
    $foreign = File::create(['storage_key' => 'files/x/foreign', 'disk' => 'local', 'original_filename' => 'f.png', 'mime_type' => 'image/png', 'size_bytes' => 1, 'category' => 'customer_reference', 'uploaded_by_type' => 'customer', 'uploaded_by_id' => $other->id, 'checksum' => str_repeat('a', 64)]);
    [$c] = loggedPortalCustomer($this, '01033334444');
    $product = Product::factory()->create(['is_active' => true, 'minimum_quantity' => 1]);

    $this->post('/portal/requests', ['delivery_method' => 'PICKUP', 'items' => [['product_id' => $product->id, 'quantity' => 5, 'file_ids' => [$foreign->id]]]], ['Idempotency-Key' => 'rf-2'])->assertRedirect();

    expect($foreign->fresh()->parent_type)->toBeNull();
});

it('rejects non-image/pdf uploads from the portal', function () {
    loggedPortalCustomer($this);
    $this->post('/portal/files', ['file' => UploadedFile::fake()->create('x.exe', 10, 'application/x-msdownload')], ['Accept' => 'application/json'])->assertStatus(422);
});
