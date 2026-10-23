<?php

use App\Actions\Orders\AdvanceOrder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('outbox:dispatch')->everyMinute()->withoutOverlapping();
Schedule::call(fn () => app(AdvanceOrder::class)->autoComplete())->everyFiveMinutes()->name('orders:auto-complete')->withoutOverlapping();

// الصور المؤقتة للبحث بالصورة تُحذف بعد 30 دقيقة (لا تُحفظ دائمًا)
Schedule::call(function () {
    $d = Storage::disk('local');
    foreach ($d->files('imgsearch-tmp') as $f) {
        if ($d->lastModified($f) < now()->subMinutes(30)->getTimestamp()) {
            $d->delete($f);
        }
    }
})->everyTenMinutes()->name('imgsearch:cleanup');

// D5: مفاتيح Idempotency أقدم من 7 أيام تُحذف (لا تُستخدم بعد ذلك للتكرار)
Schedule::call(fn () => DB::table('idempotency_keys')->where('created_at', '<', now()->subDays(7))->delete())->daily()->name('idempotency:prune');
