<?php

use App\Models\File;
use App\Models\User;
use App\Services\Files\FileAccessRegistry;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    $this->user = User::factory()->create();
});

it('stores an allowed image privately with a hash and no public key', function () {
    $r = $this->actingAs($this->user)->postJson('/files', ['file' => UploadedFile::fake()->image('logo.png'), 'category' => 'design_preview'])->assertCreated();

    $f = File::first();
    expect($f->mime_type)->toBe('image/png')->and($f->checksum)->toHaveLength(64)
        ->and($r->json('data'))->not->toHaveKeys(['storage_key', 'disk', 'checksum']);
    Storage::disk('local')->assertExists($f->storage_key);
});

it('rejects a script disguised as an image (real content type is checked)', function () {
    $evil = UploadedFile::fake()->createWithContent('shell.png', '<?php echo "pwn"; ?>');
    $this->actingAs($this->user)->postJson('/files', ['file' => $evil, 'category' => 'design_preview'])
        ->assertStatus(422)->assertJsonPath('error.code', 'FILE_TYPE_NOT_ALLOWED');
    expect(File::count())->toBe(0);
});

it('rejects svg/html and oversized files and unknown categories', function () {
    $svg = UploadedFile::fake()->createWithContent('a.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    $this->actingAs($this->user)->postJson('/files', ['file' => $svg, 'category' => 'chat_attachment'])->assertStatus(422);

    $big = UploadedFile::fake()->create('big.pdf', 11 * 1024, 'application/pdf');
    $this->actingAs($this->user)->postJson('/files', ['file' => $big, 'category' => 'payment_proof'])->assertStatus(422);

    $this->actingAs($this->user)->postJson('/files', ['file' => UploadedFile::fake()->image('a.png'), 'category' => 'nope'])->assertStatus(422);
});

it('denies preview and download by default (default deny)', function () {
    $this->actingAs($this->user)->postJson('/files', ['file' => UploadedFile::fake()->image('a.png'), 'category' => 'design_preview']);
    $f = File::first();
    $f->update(['parent_type' => 'unregistered_parent', 'parent_id' => 1]); // مربوط بكيان بلا قاعدة وصول مسجّلة
    $this->actingAs($this->user)->get("/files/{$f->id}/preview")->assertForbidden();
    $this->actingAs($this->user)->getJson("/files/{$f->id}/download")->assertForbidden()->assertJsonPath('error.code', 'FILE_ACCESS_DENIED');
});

it('serves preview-only when the parent rule allows view but not download', function () {
    $this->actingAs($this->user)->postJson('/files', ['file' => UploadedFile::fake()->image('a.png'), 'category' => 'design_preview']);
    $f = File::first();
    $f->update(['parent_type' => 'design_version', 'parent_id' => 1]);
    app(FileAccessRegistry::class)->register('design_version', view: fn () => true, download: fn () => false);

    $this->actingAs($this->user)->get("/files/{$f->id}/preview")->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('Content-Type', 'image/png');
    $this->actingAs($this->user)->getJson("/files/{$f->id}/download")->assertForbidden();
});

it('requires authentication', function () {
    $this->post('/files')->assertRedirect('/login');
});
