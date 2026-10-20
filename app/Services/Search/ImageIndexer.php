<?php

namespace App\Services\Search;

use App\Models\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** يفهرس صور نسخ التصميم (PNG/JPEG/WebP). فشل الفهرسة لا يكسر دورة التصميم (BR: البحث خدمة مساندة). */
class ImageIndexer
{
    public function __construct(private ImageHasher $hasher) {}

    public function indexVersion(int $versionId): int
    {
        $n = 0;
        $rows = DB::table('design_version_files as f')->join('design_versions as v', 'v.id', '=', 'f.design_version_id')->join('order_items as i', 'i.id', '=', 'v.order_item_id')
            ->where('f.design_version_id', $versionId)->get(['f.file_id', 'i.id as item_id', 'i.order_id']);
        foreach ($rows as $r) {
            $n += $this->indexFile((int) $r->file_id, (int) $r->item_id, (int) $r->order_id) ? 1 : 0;
        }

        return $n;
    }

    public function indexFile(int $fileId, int $itemId, int $orderId): bool
    {
        try {
            $file = File::find($fileId);
            if (! $file || ! in_array($file->mime_type, ImageHasher::SUPPORTED, true)) {
                return false;
            }
            $h = $this->hasher->hash(Storage::disk($file->disk)->path($file->storage_key));
            if (! $h) {
                return false;
            }
            DB::table('image_search_index')->updateOrInsert(['file_id' => $fileId], ['order_item_id' => $itemId, 'order_id' => $orderId, 'dhash' => $h['dhash'], 'ahash' => $h['ahash'], 'created_at' => now(), 'updated_at' => now()]);

            return true;
        } catch (\Throwable $e) {
            report($e);

            return false;
        }
    }
}
