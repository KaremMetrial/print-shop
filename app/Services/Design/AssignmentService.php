<?php

namespace App\Services\Design;

use App\Enums\DesignerAvailability;
use App\Enums\ErrorCode;
use App\Enums\Role as RoleEnum;
use App\Exceptions\BusinessException;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\DB;

/**
 * إسناد المصممين (BR-014…017): تخصص المنتج ← متاح فقط ← أقل شغل نشط ← كاسر تعادل (الأقدم إسنادًا ثم الأصغر id).
 * الشغل النشط = بنود قيد التصميم/التعديل فقط؛ الجديدة والمنتظرة لموافقة العميل لا تُحتسب (BR-016).
 */
class AssignmentService
{
    public const ACTIVE_STATES = ['IN_DESIGN', 'REVISION_REQUESTED'];

    public function __construct(private AuditService $audit) {}

    /** يسند كل بنود الأوردر غير المسندة. يرجع عدد المسند. المصمم غير المؤهل لا يُسند أبدًا (BR-017). */
    public function assignOrder(Order $order): int
    {
        $n = 0;
        foreach ($order->activeItems()->whereNull('designer_id')->get() as $item) {
            if ($this->assignItem($item)) {
                $n++;
            }
        }

        return $n;
    }

    public function assignItem(OrderItem $item): ?User
    {
        return DB::transaction(function () use ($item) {
            $item = OrderItem::whereKey($item->id)->lockForUpdate()->firstOrFail();
            if ($item->designer_id) {
                return null; // idempotent
            }
            $designer = $this->pick($item->product_snapshot['required_specialty_id'] ?? null);
            if (! $designer) {
                return null; // يبقى «غير مُسند» ويظهر كإجراء مطلوب
            }
            $this->record($item, $designer, 'AUTO', null, null);

            return $designer;
        });
    }

    /** إسناد/إعادة إسناد يدوي: يرفض غير المؤهل أو غير المتاح (BR-017). */
    public function assignManually(User $actor, OrderItem $item, User $designer, ?string $reason = null): OrderItem
    {
        if ($designer->roleEnum() !== RoleEnum::Designer || $designer->status !== 'ACTIVE') {
            throw new BusinessException(ErrorCode::NO_QUALIFIED_DESIGNER);
        }
        $spec = $item->product_snapshot['required_specialty_id'] ?? null;
        if ($spec && ! $designer->specialties()->whereKey($spec)->exists()) {
            throw new BusinessException(ErrorCode::NO_QUALIFIED_DESIGNER);
        }

        return DB::transaction(function () use ($actor, $item, $designer, $reason) {
            $item = OrderItem::whereKey($item->id)->lockForUpdate()->firstOrFail();
            $this->record($item, $designer, 'MANUAL', $reason, $actor);

            return $item->refresh();
        });
    }

    private function record(OrderItem $item, User $designer, string $mode, ?string $reason, ?User $by): void
    {
        $old = $item->designer_id;
        $item->update(['designer_id' => $designer->id]);
        DB::table('item_assignment_history')->insert([
            'order_item_id' => $item->id, 'designer_id' => $designer->id, 'mode' => $mode, 'reason' => $reason, 'assigned_by' => $by?->id, 'created_at' => now(),
        ]);
        $this->audit->record($old ? 'item.designer_changed' : 'item.designer_assigned', $item, ['designer_id' => $old], ['designer_id' => $designer->id, 'mode' => $mode], $reason);
    }

    private function pick(?int $specialtyId): ?User
    {
        $q = User::query()->where('status', 'ACTIVE')
            ->whereHas('role', fn ($r) => $r->where('code', RoleEnum::Designer->value))
            ->whereExists(fn ($e) => $e->select(DB::raw(1))->from('designer_availability')->whereColumn('designer_availability.designer_id', 'users.id')->where('status', DesignerAvailability::Available->value));
        if ($specialtyId) {
            $q->whereExists(fn ($e) => $e->select(DB::raw(1))->from('designer_specialty_memberships')->whereColumn('designer_specialty_memberships.designer_id', 'users.id')->where('specialty_id', $specialtyId));
        }
        $candidates = $q->get();
        if ($candidates->isEmpty()) {
            return null;
        }
        $active = DB::table('order_items')->whereIn('designer_id', $candidates->pluck('id'))->whereNull('cancelled_at')->whereIn('design_state', self::ACTIVE_STATES)
            ->select('designer_id', DB::raw('count(*) c'))->groupBy('designer_id')->pluck('c', 'designer_id');
        $last = DB::table('item_assignment_history')->whereIn('designer_id', $candidates->pluck('id'))->select('designer_id', DB::raw('max(id) m'))->groupBy('designer_id')->pluck('m', 'designer_id');

        return $candidates->sortBy([
            fn (User $a, User $b) => ($active[$a->id] ?? 0) <=> ($active[$b->id] ?? 0),
            fn (User $a, User $b) => ($last[$a->id] ?? 0) <=> ($last[$b->id] ?? 0),
            fn (User $a, User $b) => $a->id <=> $b->id,
        ])->first();
    }
}
