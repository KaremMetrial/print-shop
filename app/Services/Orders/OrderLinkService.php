<?php

namespace App\Services\Orders;

use App\Models\Order;
use App\Models\OrderLink;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

/** رابط الأوردر الخاص (BR-004..006): token عشوائي 48 حرفًا، يُخزَّن hash للبحث ونسخة مشفّرة للموظف. يُغلق عند الاكتمال/الإلغاء. */
class OrderLinkService
{
    public function __construct(private AuditService $audit) {}

    public function create(Order $order): OrderLink
    {
        $token = Str::random(48);

        return OrderLink::create(['order_id' => $order->id, 'token_hash' => hash('sha256', $token), 'token_encrypted' => Crypt::encryptString($token), 'status' => 'ACTIVE']);
    }

    public function findActive(string $token): ?OrderLink
    {
        $link = OrderLink::where('token_hash', hash('sha256', $token))->first();
        if (! $link || $link->status !== 'ACTIVE' || $link->order->status->isFinal()) {
            return null;
        }

        return $link;
    }

    public function url(OrderLink $link): string
    {
        return url('/l/'.Crypt::decryptString($link->token_encrypted));
    }

    /** إعادة الإنشاء: تُبطل الرابط القديم فورًا (token جديد). */
    public function regenerate(User $actor, OrderLink $link): OrderLink
    {
        $token = Str::random(48);
        $link->update(['token_hash' => hash('sha256', $token), 'token_encrypted' => Crypt::encryptString($token), 'status' => 'ACTIVE', 'last_regenerated_at' => now(), 'suspended_at' => null]);
        $this->audit->record('order_link.regenerated', $link->order, [], []);

        return $link;
    }

    public function suspend(User $actor, OrderLink $link): void
    {
        $link->update(['status' => 'SUSPENDED', 'suspended_at' => now()]);
        $this->audit->record('order_link.suspended', $link->order);
    }

    public function reactivate(User $actor, OrderLink $link): void
    {
        if ($link->order->status->isFinal()) {
            return;
        }
        $link->update(['status' => 'ACTIVE', 'suspended_at' => null]);
        $this->audit->record('order_link.reactivated', $link->order);
    }

    public function closeFor(Order $order): void
    {
        OrderLink::where('order_id', $order->id)->where('status', '!=', 'CLOSED')->update(['status' => 'CLOSED', 'closed_at' => now()]);
    }
}
