<?php

namespace App\Events;

use App\Models\OutboxEvent;

/**
 * يُطلَق بعد commit للأحداث الحرجة. المستمعون لازم يكونوا idempotent
 * (استعمل $event->outbox->id كمفتاح dedupe، مثل actions.dedupe_key).
 */
class OutboxEventPublished
{
    public function __construct(public OutboxEvent $outbox) {}
}
