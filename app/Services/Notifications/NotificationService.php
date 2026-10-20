<?php

namespace App\Services\Notifications;

use App\Events\StaffNotificationCreated;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * إشعارات الموظفين داخل النظام + مركز الإجراءات. الإجراء له dedupe_key فلا يتكرر لنفس الحدث (listeners idempotent).
 */
class NotificationService
{
    /** @param list<string> $permissions المستلمون = من يملك أيًا منها (فعّال فقط) */
    public function notify(array $permissions, string $type, string $title, ?string $body = null, ?string $link = null, ?int $actionId = null): int
    {
        $n = 0;
        foreach (User::where('status', 'ACTIVE')->get() as $u) {
            foreach ($permissions as $perm) {
                if ($u->hasPermission($perm)) {
                    $nid = DB::table('staff_notifications')->insertGetId(['user_id' => $u->id, 'type' => $type, 'title' => $title, 'body' => $body, 'link' => $link, 'action_id' => $actionId, 'created_at' => now()]);
                    $uid = $u->id;
                    DB::afterCommit(fn () => $this->broadcast($uid, $nid, $title, $body, $link, $type));
                    $n++;
                    break;
                }
            }
        }

        return $n;
    }

    /** بث لحظي لا يكسر العملية لو Reverb متوقف (الإشعار محفوظ في القاعدة ويظهر عند التحديث). */
    private function broadcast(int $userId, int $id, string $title, ?string $body, ?string $link, string $type): void
    {
        try {
            $unread = DB::table('staff_notifications')->where('user_id', $userId)->whereNull('read_at')->count();
            StaffNotificationCreated::dispatch($userId, $id, $title, $body, $link, $type, $unread);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** ينشئ إجراءً مفتوحًا (idempotent بالمفتاح) ويرجع معرّفه؛ null لو كان موجودًا. */
    public function openAction(string $dedupeKey, string $type, string $title, ?string $customer = null, ?string $orderRef = null, ?string $link = null): ?int
    {
        if (DB::table('staff_actions')->where('dedupe_key', $dedupeKey)->exists()) {
            return null;
        }

        return DB::table('staff_actions')->insertGetId(['dedupe_key' => $dedupeKey, 'type' => $type, 'title' => $title, 'customer' => $customer, 'order_ref' => $orderRef, 'link' => $link, 'status' => 'OPEN', 'created_at' => now(), 'updated_at' => now()]);
    }

    /** يُغلق الإجراء بسبب تنفيذ فعلي للعملية المطلوبة (وليس بالقراءة). */
    public function resolveByKey(string $dedupeKey, ?User $by = null, ?string $note = null): void
    {
        DB::table('staff_actions')->where('dedupe_key', $dedupeKey)->where('status', '!=', 'DONE')->update(['status' => 'DONE', 'completed_by' => $by?->id, 'completed_at' => now(), 'completed_note' => $note, 'updated_at' => now()]);
    }
}
