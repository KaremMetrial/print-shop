<?php

namespace App\Services\Chat;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Events\ItemChatMessageSent;
use App\Exceptions\BusinessException;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\Design\DesignService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * شات البند (BR-014/023/024/027/035/070). الشات يُقفل باعتماد البند أو دخول الأوردر الطباعة.
 * رسالة العميل أثناء «بانتظار الاعتماد» = طلب تعديل (BR-024). الإرسال idempotent بـclient_message_id.
 */
class ChatService
{
    public function __construct(private DesignService $design) {}

    public function isLocked(OrderItem $item): bool
    {
        $o = Order::find($item->order_id);

        return $item->approved_at !== null || $item->cancelled_at !== null || ! $o || $o->status !== OrderStatus::DESIGN_STAGE;
    }

    /** @return list<array<string, mixed>> */
    public function list(OrderItem $item, int $afterId = 0): array
    {
        return DB::table('item_chat_messages')->where('order_item_id', $item->id)->where('id', '>', $afterId)->orderBy('id')->limit(200)->get()
            ->map(fn ($m) => ['id' => $m->id, 'sender' => $m->sender_type, 'label' => $m->sender_label, 'body' => $m->body, 'at' => Carbon::parse($m->created_at)->toIso8601String(), 'client_id' => $m->client_message_id])->all();
    }

    /** @return array<string, mixed> */
    public function send(OrderItem $item, string $senderType, ?int $senderId, string $label, string $body, string $clientId): array
    {
        $body = trim($body);
        if ($body === '' || mb_strlen($body) > 2000) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'اكتب رسالة (حتى 2000 حرف).');
        }
        if ($this->isLocked($item)) {
            throw new BusinessException(ErrorCode::CHAT_LOCKED);
        }

        return DB::transaction(function () use ($item, $senderType, $senderId, $label, $body, $clientId) {
            try {
                $id = DB::table('item_chat_messages')->insertGetId(['order_item_id' => $item->id, 'sender_type' => $senderType, 'sender_id' => $senderId, 'sender_label' => $label, 'body' => $body, 'client_message_id' => $clientId, 'created_at' => now()]);
            } catch (QueryException) {
                $dup = DB::table('item_chat_messages')->where('order_item_id', $item->id)->where('client_message_id', $clientId)->first();
                abort_if($dup === null, 500);

                return ['id' => $dup->id, 'duplicate' => true];
            }
            if (in_array($senderType, ['customer', 'link'], true) && $item->design_state === 'AWAITING_APPROVAL') {
                $this->design->requestRevision($item, $senderType, $senderId ?? 0, $body);
            }
            DB::afterCommit(fn () => ItemChatMessageSent::dispatch($item->id, $id));

            return ['id' => $id, 'duplicate' => false];
        });
    }

    /** يحدد دور المستخدم في شات البند: [يقرأ، يرسل، التسمية]. المصمم المسند فقط يرد كمصمم؛ الإدارة تشارك بصلاحية؛ الإدخال يقرأ فقط (BR-070). */
    public function staffAccess(User $u, OrderItem $item): array
    {
        $assigned = $item->designer_id === $u->id;
        if ($u->isDesigner()) {
            return [$assigned && $u->hasPermission('design.chat.read'), $assigned && $u->hasPermission('design.chat.send_as_designer'), 'المصمم'];
        }
        $read = $u->hasPermission('design.chat.read');

        return [$read, $read && $u->hasPermission('design.chat.admin_participate') && ! in_array($u->roleEnum()?->value, ['DATA_ENTRY'], true), 'الإدارة'];
    }
}
