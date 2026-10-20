<?php

namespace App\Console\Commands;

use App\Services\Search\ImageIndexer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class IndexImages extends Command
{
    protected $signature = 'search:index-images';

    protected $description = 'فهرسة صور نسخ التصميم الحالية للبحث بالصورة (آمن لإعادة التشغيل)';

    public function handle(ImageIndexer $indexer): int
    {
        $n = 0;
        foreach (DB::table('design_versions')->whereIn('status', ['SUBMITTED', 'APPROVED', 'SUPERSEDED'])->pluck('id') as $id) {
            $n += $indexer->indexVersion((int) $id);
        }
        $this->info("تمت فهرسة {$n} صورة.");

        return self::SUCCESS;
    }
}
