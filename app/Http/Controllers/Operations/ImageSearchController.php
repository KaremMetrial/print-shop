<?php

namespace App\Http\Controllers\Operations;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\File;
use App\Services\Files\FileAccessRegistry;
use App\Services\Search\ImageHasher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/** S-063 البحث بالصورة · S-064 مقارنة. الصورة المرفوعة مؤقتة (30 دقيقة) لا تُربط بأوردر أو عميل. الترتيب يقترح مرشحين فقط. */
class ImageSearchController extends Controller
{
    private const MAX_DISTANCE = 44; // من 128: أبعد من ذلك = غير مشابه عمليًا

    private const TMP = 'imgsearch-tmp';

    public function form(Request $request): Response
    {
        $this->authorizeUse($request);

        return Inertia::render('operations/image-search', ['mode' => 'form']);
    }

    public function search(Request $request, ImageHasher $hasher): Response|RedirectResponse
    {
        $this->authorizeUse($request);
        $d = $request->validate(['image' => ['required', 'file', 'mimetypes:image/png,image/jpeg,image/webp', 'max:10240'], 'archived' => ['nullable', 'boolean']], [
            'image.required' => 'اختر صورة للبحث.', 'image.mimetypes' => 'الصيغ المدعومة: PNG وJPEG وWebP.', 'image.max' => 'الحد الأقصى للصورة 10 ميجابايت.',
        ]);
        $file = $request->file('image');
        $token = Str::uuid()->toString();
        $failed = false;
        $results = [];
        try {
            $h = $hasher->hash($file->getRealPath());
            abort_if($h === null, 422);
            Storage::disk('local')->putFileAs(self::TMP, $file, $request->user()->id.'-'.$token); // مؤقت للمقارنة فقط
            $results = $this->rank($h, (bool) ($d['archived'] ?? false), $request, $hasher);
        } catch (\Throwable $e) {
            report($e);
            $failed = true;
        }

        return Inertia::render('operations/image-search', ['mode' => 'results', 'token' => $failed ? null : $token, 'archived' => (bool) ($d['archived'] ?? false), 'failed' => $failed, 'results' => $results]);
    }

    public function compare(Request $request): Response
    {
        $this->authorizeUse($request);
        $row = DB::table('image_search_index as x')->join('orders as o', 'o.id', '=', 'x.order_id')->join('customers as c', 'c.id', '=', 'o.customer_id')->join('order_items as i', 'i.id', '=', 'x.order_item_id')
            ->where('x.file_id', (int) $request->query('file'))->first(['x.file_id', 'o.id as oid', 'o.order_number', 'c.name', 'i.id as iid', 'i.product_snapshot']);
        $token = (string) $request->query('q');
        $ok = $row && $this->validToken($request, $token) && $request->user()->hasPermission('orders.view') && $this->canPreview((int) $row->file_id, $request);

        return Inertia::render('operations/image-search', [
            'mode' => 'compare', 'token' => $token,
            'candidate' => $row ? ['file_id' => $row->file_id, 'available' => $ok, 'order' => $row->order_number, 'order_id' => $row->oid, 'item_id' => $row->iid, 'customer' => $row->name, 'product' => json_decode($row->product_snapshot, true)['name'] ?? ''] : null,
        ]);
    }

    public function query(Request $request, string $token): HttpResponse
    {
        $this->authorizeUse($request);
        abort_unless($this->validToken($request, $token), 404);
        $path = self::TMP.'/'.$request->user()->id.'-'.$token;

        return response(Storage::disk('local')->get($path), 200, ['Content-Type' => Storage::disk('local')->mimeType($path) ?: 'image/jpeg', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff', 'Content-Security-Policy' => "default-src 'none'; sandbox"]);
    }

    private function authorizeUse(Request $request): void
    {
        Gate::authorize('search.image.use');
        abort_unless($request->user()->hasPermission('orders.view'), 403);
    }

    private function validToken(Request $request, string $token): bool
    {
        return Str::isUuid($token) && Storage::disk('local')->exists(self::TMP.'/'.$request->user()->id.'-'.$token);
    }

    private function canPreview(int $fileId, Request $request): bool
    {
        $f = File::find($fileId);

        return $f !== null && app(FileAccessRegistry::class)->canView($f, $request->user());
    }

    /**
     * @param  array{dhash: string, ahash: string}  $h
     * @return list<array<string, mixed>>
     */
    private function rank(array $h, bool $archived, Request $request, ImageHasher $hasher): array
    {
        $q = DB::table('image_search_index as x')->join('orders as o', 'o.id', '=', 'x.order_id')->join('customers as c', 'c.id', '=', 'o.customer_id')->join('order_items as i', 'i.id', '=', 'x.order_item_id')
            ->when(! $archived, fn ($b) => $b->whereNotIn('o.status', [OrderStatus::COMPLETED->value, OrderStatus::CANCELLED->value]))
            ->whereNull('i.cancelled_at')
            ->get(['x.file_id', 'x.dhash', 'x.ahash', 'o.id as oid', 'o.order_number', 'o.status', 'c.name', 'i.id as iid', 'i.product_snapshot']);
        $scored = [];
        foreach ($q as $r) {
            $dist = $hasher->distance($h['dhash'], $h['ahash'], $r->dhash, $r->ahash);
            if ($dist <= self::MAX_DISTANCE) {
                $scored[] = ['dist' => $dist, 'r' => $r];
            }
        }
        usort($scored, fn ($a, $b) => $a['dist'] <=> $b['dist']);

        return array_map(fn ($s) => [
            'file_id' => $s['r']->file_id, 'similarity' => (int) round((1 - $s['dist'] / 128) * 100), 'order' => $s['r']->order_number, 'order_id' => $s['r']->oid, 'item_id' => $s['r']->iid,
            'customer' => $s['r']->name, 'product' => json_decode($s['r']->product_snapshot, true)['name'] ?? '', 'status' => OrderStatus::from($s['r']->status)->label(),
            'preview' => $this->canPreview((int) $s['r']->file_id, $request),
        ], array_slice($scored, 0, 12));
    }
}
