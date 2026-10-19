<?php

namespace App\Console\Commands;

use App\Services\Outbox\Outbox;
use Illuminate\Console\Command;

class DispatchOutbox extends Command
{
    protected $signature = 'outbox:dispatch {--limit=100}';

    protected $description = 'معالجة أحداث الـOutbox المعلّقة';

    public function handle(Outbox $outbox): int
    {
        $n = $outbox->dispatchPending((int) $this->option('limit'));
        $this->info("تمت معالجة {$n} حدث.");

        return self::SUCCESS;
    }
}
