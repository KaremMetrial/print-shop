<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** إشعار موظف جديد → قناته الخاصة (App.Models.User.{id}). يُبث فورًا بدون انتظار طابور. */
class StaffNotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $userId, public int $id, public string $title, public ?string $body, public ?string $link, public string $type, public int $unread) {}

    /** @return list<PrivateChannel> */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("App.Models.User.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return ['id' => $this->id, 'title' => $this->title, 'body' => $this->body, 'link' => $this->link, 'type' => $this->type, 'unread' => $this->unread];
    }
}
