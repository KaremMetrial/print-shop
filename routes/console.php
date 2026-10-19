<?php

use App\Actions\Orders\AdvanceOrder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('outbox:dispatch')->everyMinute()->withoutOverlapping();
Schedule::call(fn () => app(AdvanceOrder::class)->autoComplete())->everyFiveMinutes()->name('orders:auto-complete')->withoutOverlapping();
