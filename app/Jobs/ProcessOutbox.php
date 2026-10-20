<?php

namespace App\Jobs;

use App\Services\Outbox\Outbox;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/** يعالج الـOutbox فور الـcommit (بدل انتظار المجدول كل دقيقة) فتصل الإشعارات لحظيًا. المجدول يبقى شبكة أمان. */
class ProcessOutbox implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $uniqueFor = 5;

    public function handle(Outbox $outbox): void
    {
        $outbox->dispatchPending(200);
    }
}
