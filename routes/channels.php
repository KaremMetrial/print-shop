<?php

use App\Models\OrderItem;
use App\Models\User;
use App\Services\Chat\ChatService;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// شات البند: المصمم المسند أو موظف بصلاحية قراءة الشات فقط (يُعاد التحقق عند كل اشتراك فيعمل مع reassign)
Broadcast::channel('item-chat.{itemId}', function ($user, $itemId) {
    $item = OrderItem::find($itemId);
    if (! $item || ! $user instanceof User) {
        return false;
    }

    return app(ChatService::class)->staffAccess($user, $item)[0];
});
