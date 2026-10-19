<?php

namespace App\Listeners;

use App\Events\OutboxEventPublished;
use App\Models\Order;
use App\Services\Design\AssignmentService;

/** يستجيب لحدث OrderCreated من الـOutbox. idempotent: البند المسند لا يُعاد إسناده. */
class AssignDesignersOnOrderCreated
{
    public function __construct(private AssignmentService $assignment) {}

    public function handle(OutboxEventPublished $e): void
    {
        if ($e->outbox->event_type !== 'OrderCreated') {
            return;
        }
        $order = Order::find($e->outbox->payload['order_id'] ?? null);
        if ($order) {
            $this->assignment->assignOrder($order);
        }
    }
}
