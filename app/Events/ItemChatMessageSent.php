<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/** بث رسالة شات بند على قناة خاصة (تُتحقق صلاحيتها في routes/channels.php). المحتوى لا يُبث — فقط معرّف لإعادة الجلب. */
class ItemChatMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $itemId, public int $messageId) {}

    /** @return list<PrivateChannel> */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("item-chat.{$this->itemId}")];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
