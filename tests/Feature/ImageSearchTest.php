<?php

use App\Actions\Orders\CreateOrder;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\File;
use App\Models\Product;
use App\Models\User;
use App\Services\Search\ImageHasher;
use App\Services\Search\ImageIndexer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

function makePng(string $path, int $variant): void
{
    $im = imagecreatetruecolor(120, 90);
    imagefill($im, 0, 0, imagecolorallocate($im, 250, 250, 250));
    if ($variant === 1) { // شريط أحمر أعلى + دائرة زرقاء
        imagefilledrectangle($im, 0, 0, 120, 30, imagecolorallocate($im, 220, 30, 30));
        imagefilledellipse($im, 80, 60, 40, 40, imagecolorallocate($im, 20, 40, 200));
    } else { // مربع أسود يسار + شريط سفلي
        imagefilledrectangle($im, 0, 0, 50, 90, imagecolorallocate($im, 10, 10, 10));
        imagefilledrectangle($im, 60, 70, 120, 90, imagecolorallocate($im, 30, 160, 30));
    }
    imagepng($im, $path);
}

function indexedItem(User $a, int $variant): array
{
    Storage::fake('local');
    $o = app(CreateOrder::class)->handle($a, ['customer_id' => Customer::factory()->create()->id, 'items' => [['product_id' => Product::factory()->create()->id, 'quantity' => 1]]]);
    $item = $o->items[0];
    $tmp = tempnam(sys_get_temp_dir(), 'p').'.png';
    makePng($tmp, $variant);
    $key = 'files/t/'.uniqid();
    Storage::disk('local')->put($key, file_get_contents($tmp));
    $f = File::create(['storage_key' => $key, 'disk' => 'local', 'original_filename' => 'd.png', 'mime_type' => 'image/png', 'size_bytes' => 10, 'category' => 'design_preview', 'uploaded_by_type' => 'staff', 'uploaded_by_id' => $a->id, 'checksum' => 'x']);
    $v = DB::table('design_versions')->insertGetId(['order_item_id' => $item->id, 'version_no' => 1, 'status' => 'SUBMITTED', 'created_at' => now(), 'updated_at' => now()]);
    $f->update(['parent_type' => 'design_version', 'parent_id' => $v]);
    DB::table('design_version_files')->insert(['design_version_id' => $v, 'file_id' => $f->id]);
    app(ImageIndexer::class)->indexVersion($v);

    return [$o, $item, $f, $tmp];
}

it('hashes identical images to distance 0 and different ones far apart', function () {
    $h = new ImageHasher;
    $a = tempnam(sys_get_temp_dir(), 'a').'.png';
    $b = tempnam(sys_get_temp_dir(), 'b').'.png';
    makePng($a, 1);
    makePng($b, 2);
    $x = $h->hash($a);
    $y = $h->hash($b);
    expect($h->distance($x['dhash'], $x['ahash'], $x['dhash'], $x['ahash']))->toBe(0)->and($h->distance($x['dhash'], $x['ahash'], $y['dhash'], $y['ahash']))->toBeGreaterThan(30);
});

it('ranks the matching design first and hides non-matches; query image is temporary and per-user', function () {
    $a = User::factory()->superAdmin()->create();
    [$o1, , , $tmp1] = indexedItem($a, 1);
    [$o2] = indexedItem($a, 2);
    $up = new UploadedFile($tmp1, 'q.png', 'image/png', null, true);
    $r = $this->actingAs($a)->post('/search/image', ['image' => $up], ['Accept' => 'text/html'])->assertOk();
    $res = $r->inertiaProps('results');
    expect($res)->toHaveCount(1)->and($res[0]['order'])->toBe($o1->order_number)->and($res[0]['similarity'])->toBe(100);
    $token = $r->inertiaProps('token');
    $this->get("/search/image/query/{$token}")->assertOk();
    $this->actingAs(User::factory()->superAdmin()->create())->get("/search/image/query/{$token}")->assertNotFound();
    $this->actingAs($a)->get('/search/image/compare?file='.$res[0]['file_id'].'&q='.$token)->assertOk()->assertInertia(fn ($p) => $p->where('candidate.available', true));
});

it('validates input, excludes archived orders by default and requires permission', function () {
    $a = User::factory()->superAdmin()->create();
    [$o, , , $tmp] = indexedItem($a, 1);
    $o->update(['status' => OrderStatus::COMPLETED]);
    $this->actingAs($a)->post('/search/image', ['image' => new UploadedFile($tmp, 'q.png', 'image/png', null, true)])->assertInertia(fn ($p) => $p->has('results', 0));
    $this->post('/search/image', ['image' => new UploadedFile($tmp, 'q.png', 'image/png', null, true), 'archived' => true])->assertInertia(fn ($p) => $p->has('results', 1));
    $this->post('/search/image', ['image' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])->assertStatus(422);
    $this->actingAs(User::factory()->designer()->create())->get('/search/image')->assertForbidden();
});

it('text search finds orders by number and customer and items by product name', function () {
    $a = User::factory()->superAdmin()->create();
    $c = Customer::factory()->create(['name' => 'شركة النجمة']);
    $p = Product::factory()->create(['name' => 'بروشور فاخر']);
    $o = app(CreateOrder::class)->handle($a, ['customer_id' => $c->id, 'items' => [['product_id' => $p->id, 'quantity' => 1]]]);
    $this->actingAs($a);
    $this->get('/search?q='.$o->order_number)->assertInertia(fn ($x) => $x->has('results.orders', 1));
    $this->get('/search?q='.urlencode('النجمة'))->assertInertia(fn ($x) => $x->has('results.orders', 1)->has('results.customers', 1));
    $this->get('/search?q='.urlencode('بروشور'))->assertInertia(fn ($x) => $x->has('results.items', 1)->has('results.products', 1));
});
