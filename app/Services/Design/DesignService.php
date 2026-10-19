<?php

namespace App\Services\Design;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\DesignVersion;
use App\Models\File;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Outbox\Outbox;
use Illuminate\Support\Facades\DB;

/**
 * دورة التصميم لكل بند (BR-018…030): Start → نسخة (ملفات كاملة) → Submit → اعتماد العميل (مستقل لكل بند) → آخر بند معتمد = In Printing.
 * النسخة المعتمدة immutable (BR-021). الاعتماد يتحقق من manifest_revision لمنع اعتماد نسخة تغيّرت للتو (stale).
 */
class DesignService
{
    public function __construct(private AuditService $audit, private Outbox $outbox) {}

    public function start(User $designer, OrderItem $item): OrderItem
    {
        return DB::transaction(function () use ($designer, $item) {
            $item = $this->lockItem($item);
            $this->guardOwner($designer, $item);
            if ($item->design_state !== 'NEW') {
                throw new BusinessException(ErrorCode::INVALID_ORDER_TRANSITION, 'لا يمكن بدء التصميم في الحالة الحالية.');
            }
            $item->update(['design_state' => 'IN_DESIGN']);
            $this->event($item, null, 'started', $designer);
            $this->audit->record('item.design_started', $item, ['design_state' => 'NEW'], ['design_state' => 'IN_DESIGN']);

            return $item;
        });
    }

    /** نسخة جديدة (مسودة). تُسمح فقط بعد بدء التصميم أو طلب تعديل، وبدون مسودة مفتوحة. */
    public function createVersion(User $designer, OrderItem $item): DesignVersion
    {
        return DB::transaction(function () use ($designer, $item) {
            $item = $this->lockItem($item);
            $this->guardOwner($designer, $item);
            if (! in_array($item->design_state, ['IN_DESIGN', 'REVISION_REQUESTED'], true)) {
                throw new BusinessException(ErrorCode::INVALID_ORDER_TRANSITION, 'ابدأ التصميم أولًا.');
            }
            if (DesignVersion::where('order_item_id', $item->id)->where('status', 'DRAFT')->exists()) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'توجد نسخة غير مُرسلة بالفعل.');
            }
            $v = DesignVersion::create(['order_item_id' => $item->id, 'version_no' => (int) DesignVersion::where('order_item_id', $item->id)->max('version_no') + 1, 'created_by' => $designer->id]);
            $this->event($item, $v, 'version_created', $designer);

            return $v;
        });
    }

    /**
     * يضبط ملفات النسخة غير المعتمدة (BR-019/020). كل تغيير يرفع manifest_revision.
     *
     * @param  list<int>  $fileIds
     */
    public function setFiles(User $designer, DesignVersion $version, array $fileIds): DesignVersion
    {
        return DB::transaction(function () use ($designer, $version, $fileIds) {
            $version = DesignVersion::whereKey($version->id)->lockForUpdate()->firstOrFail();
            $item = $this->lockItem($version->item);
            $this->guardOwner($designer, $item);
            if ($version->isImmutable()) {
                throw new BusinessException(ErrorCode::DESIGN_ALREADY_APPROVED);
            }
            $fileIds = array_values(array_unique($fileIds));
            $files = File::whereIn('id', $fileIds)->where('category', 'design_preview')->get();
            if ($files->count() !== count($fileIds)) {
                throw new BusinessException(ErrorCode::FILE_ACCESS_DENIED);
            }
            DB::table('design_version_files')->where('design_version_id', $version->id)->delete();
            foreach ($fileIds as $i => $fid) {
                DB::table('design_version_files')->insert(['design_version_id' => $version->id, 'file_id' => $fid, 'sort_order' => $i]);
                File::whereKey($fid)->whereNull('parent_id')->update(['parent_type' => 'design_version', 'parent_id' => $version->id]);
            }
            $version->update(['manifest_revision' => $version->manifest_revision + 1]);
            $this->event($item, $version, 'files_changed', $designer);

            return $version->refresh();
        });
    }

    /** إرسال النسخة للعميل: لازم ملفات كاملة (BR-019). */
    public function submit(User $designer, DesignVersion $version): DesignVersion
    {
        return DB::transaction(function () use ($designer, $version) {
            $version = DesignVersion::whereKey($version->id)->lockForUpdate()->firstOrFail();
            $item = $this->lockItem($version->item);
            $this->guardOwner($designer, $item);
            if ($version->status !== 'DRAFT') {
                throw new BusinessException(ErrorCode::DESIGN_ALREADY_APPROVED);
            }
            if (! DB::table('design_version_files')->where('design_version_id', $version->id)->exists()) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'أضف ملفات التصميم الكاملة قبل الإرسال.');
            }
            DesignVersion::where('order_item_id', $item->id)->where('status', 'SUBMITTED')->update(['status' => 'SUPERSEDED']);
            $version->update(['status' => 'SUBMITTED', 'submitted_at' => now()]);
            $item->update(['design_state' => 'AWAITING_APPROVAL']);
            $this->event($item, $version, 'submitted', $designer);
            $this->audit->record('item.design_submitted', $item, [], ['version' => $version->version_no]);
            $this->outbox->record('DesignSubmitted', $item, ['item_id' => $item->id, 'version_id' => $version->id]);

            return $version->refresh();
        });
    }

    /**
     * اعتماد العميل (أو مفوّض عبر رابط الأوردر). `$seenRevision` هو manifest_revision الذي رآه العميل (stale check).
     * إن كان هذا آخر بند نشط يُنقل الأوردر إلى In Printing في نفس المعاملة (BR-026/030).
     */
    public function approve(string $actorType, int $actorId, DesignVersion $version, int $seenRevision): DesignVersion
    {
        return DB::transaction(function () use ($actorType, $actorId, $version, $seenRevision) {
            $version = DesignVersion::whereKey($version->id)->lockForUpdate()->firstOrFail();
            $item = $this->lockItem($version->item);
            $order = Order::whereKey($item->order_id)->lockForUpdate()->firstOrFail();
            if ($order->status !== OrderStatus::DESIGN_STAGE || $item->cancelled_at) {
                throw new BusinessException($order->status === OrderStatus::CANCELLED ? ErrorCode::ORDER_CANCELLED : ErrorCode::ORDER_LOCKED_FOR_PRINTING);
            }
            if ($version->status === 'APPROVED') {
                throw new BusinessException(ErrorCode::DESIGN_ALREADY_APPROVED);
            }
            if ($version->status !== 'SUBMITTED' || $version->manifest_revision !== $seenRevision) {
                throw new BusinessException(ErrorCode::DESIGN_VERSION_STALE);
            }
            $version->update(['status' => 'APPROVED', 'approved_at' => now(), 'approved_by_type' => $actorType, 'approved_by_id' => $actorId]);
            $item->update(['design_state' => 'APPROVED', 'approved_version_id' => $version->id, 'approved_at' => now()]);
            $this->event($item, $version, 'approved', null, $actorType, $actorId);
            $this->audit->record('item.design_approved', $item, [], ['version' => $version->version_no, 'by' => $actorType]);

            $pending = OrderItem::where('order_id', $order->id)->whereNull('cancelled_at')->whereNull('approved_at')->exists();
            if (! $pending) {
                $this->startPrinting($order);
            }

            return $version->refresh();
        });
    }

    /** العميل يطلب تعديلًا (عبر الشات): يعيد البند لمرحلة التعديل بدون حد (BR-024/025). */
    public function requestRevision(OrderItem $item, string $actorType, int $actorId, ?string $note = null): OrderItem
    {
        return DB::transaction(function () use ($item, $actorType, $actorId, $note) {
            $item = $this->lockItem($item);
            if ($item->design_state !== 'AWAITING_APPROVAL') {
                throw new BusinessException(ErrorCode::INVALID_ORDER_TRANSITION);
            }
            $item->update(['design_state' => 'REVISION_REQUESTED']);
            $this->event($item, null, 'revision_requested', null, $actorType, $actorId, $note);

            return $item;
        });
    }

    /** إعادة فتح تصميم معتمد: Admin/SA فقط قبل بدء الطباعة وبسبب موثق (BR-029). */
    public function reopen(User $actor, OrderItem $item, string $reason): OrderItem
    {
        if (! $actor->hasPermission('design.approval.reopen')) {
            throw new BusinessException(ErrorCode::DESIGN_REOPEN_FORBIDDEN);
        }
        if (trim($reason) === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'سبب إعادة الفتح إلزامي.');
        }

        return DB::transaction(function () use ($actor, $item, $reason) {
            $item = $this->lockItem($item);
            $order = Order::whereKey($item->order_id)->lockForUpdate()->firstOrFail();
            if ($order->status !== OrderStatus::DESIGN_STAGE || $item->design_state !== 'APPROVED') {
                throw new BusinessException(ErrorCode::DESIGN_REOPEN_FORBIDDEN);
            }
            $item->update(['design_state' => 'REVISION_REQUESTED', 'approved_version_id' => null, 'approved_at' => null]);
            $this->event($item, null, 'reopened', $actor, null, null, $reason);
            $this->audit->record('item.design_reopened', $item, ['design_state' => 'APPROVED'], ['design_state' => 'REVISION_REQUESTED'], $reason);

            return $item;
        });
    }

    private function startPrinting(Order $order): void
    {
        $order->update(['status' => OrderStatus::IN_PRINTING, 'printing_started_at' => now()]);
        $this->audit->record('order.status_changed', $order, ['status' => 'DESIGN_STAGE'], ['status' => 'IN_PRINTING']);
        $this->outbox->record('PrintingStarted', $order, ['order_id' => $order->id]);
    }

    private function lockItem(OrderItem $item): OrderItem
    {
        return OrderItem::whereKey($item->id)->lockForUpdate()->firstOrFail();
    }

    private function guardOwner(User $designer, OrderItem $item): void
    {
        if ($item->designer_id !== $designer->id) {
            throw new BusinessException(ErrorCode::INSUFFICIENT_PERMISSION);
        }
        $order = Order::findOrFail($item->order_id);
        if ($order->status !== OrderStatus::DESIGN_STAGE) {
            throw new BusinessException($order->status === OrderStatus::CANCELLED ? ErrorCode::ORDER_CANCELLED : ErrorCode::ORDER_LOCKED_FOR_PRINTING);
        }
    }

    private function event(OrderItem $item, ?DesignVersion $v, string $type, ?User $user = null, ?string $actorType = null, ?int $actorId = null, ?string $note = null): void
    {
        DB::table('design_events')->insert([
            'order_item_id' => $item->id, 'design_version_id' => $v?->id, 'type' => $type, 'actor_type' => $user ? 'staff' : $actorType, 'actor_id' => $user ? $user->id : $actorId, 'note' => $note, 'created_at' => now(),
        ]);
    }
}
