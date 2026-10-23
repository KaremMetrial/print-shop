<?php

namespace App\Actions\Orders;

use App\Enums\ErrorCode;
use App\Enums\OrderRequestStatus;
use App\Exceptions\BusinessException;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Notifications\NotificationService;
use App\Services\Pricing\PricingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/** دورة مراجعة طلب الأوردر: بدء المراجعة (حجز ذري) ← حفظ التعديلات ← قبول/رفض (BR-008…012). */
class ReviewOrderRequest
{
    public function __construct(private AuditService $audit, private CreateOrder $createOrder, private PricingService $pricing) {}

    /** حجز ذري: UPDATE شرطي يضمن نجاح موظف واحد فقط (BR-010). */
    public function start(User $actor, OrderRequest $request): OrderRequest
    {
        Gate::forUser($actor)->authorize('order_requests.review');

        return DB::transaction(function () use ($actor, $request) {
            $claimed = OrderRequest::whereKey($request->id)->where('status', OrderRequestStatus::PENDING)
                ->update(['status' => OrderRequestStatus::IN_REVIEW, 'reviewer_id' => $actor->id, 'review_started_at' => now()]);
            if (! $claimed) {
                $fresh = OrderRequest::findOrFail($request->id);
                throw new BusinessException($fresh->status->isFinal() ? ErrorCode::REQUEST_ALREADY_DECIDED : ErrorCode::REQUEST_ALREADY_CLAIMED);
            }
            $request->refresh();
            $this->audit->record('order_request.review_started', $request, ['status' => 'PENDING'], ['status' => 'IN_REVIEW', 'reviewer_id' => $actor->id]);

            return $request;
        });
    }

    /** D4: إدارة تفكّ حجز مراجعة موظف غائب (يعود الطلب «بانتظار المراجعة») ويُسجَّل في التدقيق. */
    public function release(User $actor, OrderRequest $request): OrderRequest
    {
        Gate::forUser($actor)->authorize('order_requests.accept');

        return DB::transaction(function () use ($actor, $request) {
            $r = OrderRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            if ($r->status->isFinal()) {
                throw new BusinessException(ErrorCode::REQUEST_ALREADY_DECIDED);
            }
            if ($r->status !== OrderRequestStatus::IN_REVIEW) {
                throw new BusinessException(ErrorCode::REQUEST_ALREADY_CLAIMED);
            }
            $old = $r->reviewer_id;
            $r->forceFill(['status' => OrderRequestStatus::PENDING, 'reviewer_id' => null, 'review_started_at' => null])->save();
            $this->audit->record('order_request.review_released', $r, ['status' => 'IN_REVIEW', 'reviewer_id' => $old], ['status' => 'PENDING', 'released_by' => $actor->id]);

            return $r;
        });
    }

    /**
     * @param  list<array{id: int, quantity: int, options?: array<int|string, list<int>>}>  $items  التعديلات (الكمية/المواصفات)
     */
    public function saveEdits(User $actor, OrderRequest $request, array $items): OrderRequest
    {
        Gate::forUser($actor)->authorize('order_requests.review');

        return DB::transaction(function () use ($actor, $request, $items) {
            $request = $this->lockActive($actor, $request);
            $changes = [];
            foreach ($items as $row) {
                $item = $request->items()->findOrFail($row['id']);
                $before = ['quantity' => $item->quantity, 'options' => $item->options];
                $newQty = (int) $row['quantity'];
                $product = Product::findOrFail($item->product_id);
                // يتحقق من MOQ والمواصفات بنفس محرك التسعير
                $this->pricing->quoteItem($product, $row['options'] ?? $item->options, $newQty, $request->customer->pricingTier);
                $item->update(['quantity' => $newQty, 'options' => $row['options'] ?? $item->options]);
                if ($before['quantity'] !== $newQty || $before['options'] !== ($row['options'] ?? $item->options)) {
                    $changes[] = ['item_id' => $item->id, 'old' => $before, 'new' => ['quantity' => $newQty]];
                }
            }
            if ($changes) {
                $this->audit->record('order_request.edited', $request, [], ['changes' => $changes]);
            }

            return $request->refresh();
        });
    }

    public function accept(User $actor, OrderRequest $request): OrderRequest
    {
        Gate::forUser($actor)->authorize('order_requests.accept');

        return DB::transaction(function () use ($actor, $request) {
            $request = $this->lockActive($actor, $request);
            $request->load('items', 'customer');
            $order = $this->createOrder->handle($actor, [
                'customer_id' => $request->customer_id, 'source' => 'ACCEPTED_REQUEST', 'delivery_method' => $request->delivery_method,
                'delivery_address' => $request->delivery_address, 'notes' => $request->notes,
                'items' => $request->items->map(fn ($i) => ['product_id' => $i->product_id, 'quantity' => $i->quantity, 'options' => $i->options, 'notes' => $i->notes])->all(),
            ]);
            $request->update(['status' => OrderRequestStatus::ACCEPTED, 'decided_at' => now(), 'decided_by' => $actor->id, 'order_id' => $order->id]);
            app(NotificationService::class)->resolveByKey("request:{$request->id}", $actor, 'تم قبول الطلب');
            $this->audit->record('order_request.accepted', $request, ['status' => 'IN_REVIEW'], ['status' => 'ACCEPTED', 'order_id' => $order->id]);

            return $request;
        });
    }

    public function reject(User $actor, OrderRequest $request, string $reason): OrderRequest
    {
        Gate::forUser($actor)->authorize('order_requests.reject');
        if (trim($reason) === '') {
            throw new BusinessException(ErrorCode::REJECT_REASON_REQUIRED);
        }

        return DB::transaction(function () use ($actor, $request, $reason) {
            $request = $this->lockActive($actor, $request);
            $request->update(['status' => OrderRequestStatus::REJECTED, 'decided_at' => now(), 'decided_by' => $actor->id, 'reject_reason' => trim($reason)]);
            app(NotificationService::class)->resolveByKey("request:{$request->id}", $actor, 'تم رفض الطلب');
            $this->audit->record('order_request.rejected', $request, ['status' => 'IN_REVIEW'], ['status' => 'REJECTED'], trim($reason));

            return $request;
        });
    }

    /** يقفل الصف ويتأكد أنه قيد المراجعة  بواسطة نفس الموظف. */
    private function lockActive(User $actor, OrderRequest $request): OrderRequest
    {
        $r = OrderRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
        if ($r->status->isFinal()) {
            throw new BusinessException(ErrorCode::REQUEST_ALREADY_DECIDED);
        }
        if ($r->status !== OrderRequestStatus::IN_REVIEW || $r->reviewer_id !== $actor->id) {
            throw new BusinessException(ErrorCode::REQUEST_ALREADY_CLAIMED);
        }

        return $r;
    }
}
