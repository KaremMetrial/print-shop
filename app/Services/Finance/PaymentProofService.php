<?php

namespace App\Services\Finance;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Files\FileService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/** إثبات دفع يرفعه العميل: ادّعاء فقط ≠ دفعة مؤكدة. لا يدخل الحسابات إلا باعتماد المحاسب (يُسجَّل Payment فعلي). */
class PaymentProofService
{
    public function __construct(private FileService $files, private PaymentService $payments, private AuditService $audit) {}

    public function submit(Order $order, UploadedFile $file, int $amountMinor, string $method, ?string $reference, string $by, int $byId): int
    {
        if ($amountMinor < 1 || in_array($order->status, [OrderStatus::CANCELLED], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'تعذر إرسال إثبات لهذا الأوردر أو بهذا المبلغ.');
        }
        $stored = $this->files->store($file, 'payment_proof', [$by, $byId], 'payment_proof', null);

        return DB::transaction(function () use ($order, $stored, $amountMinor, $method, $reference, $by) {
            $id = DB::table('payment_proofs')->insertGetId([
                'order_id' => $order->id, 'customer_id' => $order->customer_id, 'file_id' => $stored->id, 'claimed_amount' => $amountMinor, 'method' => $method,
                'reference' => $reference, 'submitted_by_type' => $by, 'created_at' => now(), 'updated_at' => now(),
            ]);
            $stored->update(['parent_id' => $id]);

            return $id;
        });
    }

    public function approve(User $actor, int $proofId, ?int $amountMinor = null): Payment
    {
        Gate::forUser($actor)->authorize('payments.proofs.review');

        return DB::transaction(function () use ($actor, $proofId, $amountMinor) {
            $p = DB::table('payment_proofs')->where('id', $proofId)->lockForUpdate()->first() ?? abort(404);
            if ($p->status !== 'PENDING') {
                throw new BusinessException(ErrorCode::PAYMENT_ALREADY_PROCESSED);
            }
            $payment = $this->payments->record($actor, Customer::findOrFail($p->customer_id), $amountMinor ?? (int) $p->claimed_amount, $p->method, Order::findOrFail($p->order_id), $p->reference, 'من إثبات دفع #'.$p->id);
            DB::table('payment_proofs')->where('id', $p->id)->update(['status' => 'APPROVED', 'reviewed_by' => $actor->id, 'reviewed_at' => now(), 'payment_id' => $payment->id, 'updated_at' => now()]);
            $this->audit->record('payment_proof.approved', $payment, [], ['proof_id' => $p->id, 'amount_minor' => $payment->amount->minor]);

            return $payment;
        });
    }

    public function reject(User $actor, int $proofId, string $reason): void
    {
        Gate::forUser($actor)->authorize('payments.proofs.review');
        if (trim($reason) === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'سبب الرفض إلزامي.');
        }
        DB::transaction(function () use ($actor, $proofId, $reason) {
            $p = DB::table('payment_proofs')->where('id', $proofId)->lockForUpdate()->first() ?? abort(404);
            if ($p->status !== 'PENDING') {
                throw new BusinessException(ErrorCode::PAYMENT_ALREADY_PROCESSED);
            }
            DB::table('payment_proofs')->where('id', $p->id)->update(['status' => 'REJECTED', 'reviewed_by' => $actor->id, 'reviewed_at' => now(), 'reject_reason' => mb_substr($reason, 0, 255), 'updated_at' => now()]);
            $this->audit->record('payment_proof.rejected', Order::findOrFail($p->order_id), [], ['proof_id' => $p->id], $reason);
        });
    }
}
