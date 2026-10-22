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
use App\Support\Money;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * المدفوعات (BR-049…056): حساب مالي موحد للعميل. دفعة عامة تتوزع FIFO على أقدم المستحقات، ودفعة مخصصة لأوردر بعينه.
 * لا overpayment ولا رصيد دائن. Σ التخصيصات = مبلغ الدفعة دائمًا. كل العمليات داخل معاملة بقفل الأوردرات.
 */
class PaymentService
{
    public function __construct(private AuditService $audit) {}

    /** المتبقي على أوردر = الإجمالي − المخصص (الملغي = صفر BR-044). */
    public function due(Order $o): int
    {
        if ($o->status === OrderStatus::CANCELLED) {
            return 0;
        }

        return max(0, $o->grand_total->minor - $this->paid($o));
    }

    public function paid(Order $o): int
    {
        return (int) DB::table('payment_allocations')->join('payments', 'payments.id', '=', 'payment_allocations.payment_id')
            ->where('payment_allocations.order_id', $o->id)->where('payments.status', 'CONFIRMED')->sum('payment_allocations.amount');
    }

    /** إجمالي مستحقات العميل على أوردراته النشطة. */
    public function customerDue(Customer $c): int
    {
        return (int) $this->receivableOrdersQuery()->where('o.customer_id', $c->id)->sum(DB::raw($this->dueExpression()));
    }

    /** إجمالي المستحقات النشطة لكل العملاء باستعلام تجميعي واحد. */
    public function totalReceivables(): int
    {
        return (int) $this->receivableOrdersQuery()->sum(DB::raw($this->dueExpression()));
    }

    /** @return Collection<int, \stdClass> */
    public function customerReceivables(): Collection
    {
        $due = $this->dueExpression();

        return $this->receivableOrdersQuery()->join('customers as c', 'c.id', '=', 'o.customer_id')
            ->select('c.id', 'c.name', 'c.phone_display')
            ->selectRaw("SUM($due) as due_minor")
            ->groupBy('c.id', 'c.name', 'c.phone_display')
            ->havingRaw("SUM($due) > 0")
            ->orderByDesc('due_minor')
            ->get();
    }

    private function receivableOrdersQuery(): Builder
    {
        $paid = DB::table('payment_allocations as pa')->join('payments as p', 'p.id', '=', 'pa.payment_id')
            ->where('p.status', 'CONFIRMED')->select('pa.order_id')->selectRaw('SUM(pa.amount) as paid_minor')->groupBy('pa.order_id');

        return DB::table('orders as o')->leftJoinSub($paid, 'paid', fn ($join) => $join->on('paid.order_id', '=', 'o.id'))
            ->where('o.status', '!=', OrderStatus::CANCELLED->value);
    }

    private function dueExpression(): string
    {
        return 'GREATEST(o.grand_total - COALESCE(paid.paid_minor, 0), 0)';
    }

    public function record(User $actor, Customer $customer, int $amountMinor, string $method, ?Order $target = null, ?string $reference = null, ?string $notes = null): Payment
    {
        Gate::forUser($actor)->authorize('payments.create');
        if ($amountMinor < 1) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'قيمة الدفعة يجب أن تكون أكبر من صفر.');
        }

        return DB::transaction(function () use ($actor, $customer, $amountMinor, $method, $target, $reference, $notes) {
            if ($target && $target->customer_id !== $customer->id) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'الأوردر لا يخص هذا العميل.');
            }
            $plan = $this->plan($customer, $amountMinor, $target);
            $p = Payment::create(['customer_id' => $customer->id, 'amount' => $amountMinor, 'method' => $method, 'target_order_id' => $target?->id, 'reference' => $reference, 'notes' => $notes, 'received_by' => $actor->id, 'received_at' => now()]);
            $this->write($p, $plan);
            $this->audit->record('payment.recorded', $p, [], ['amount_minor' => $amountMinor, 'target' => $target?->id, 'allocations' => $plan]);

            return $p->load('allocations');
        });
    }

    /**
     * تصحيح المبلغ (Admin/Accountant فقط BR-054): يعيد التخصيص بنفس القواعد دون الدفعة نفسها، مع سجل تعديل.
     */
    public function correct(User $actor, Payment $payment, int $newAmountMinor, string $reason): Payment
    {
        Gate::forUser($actor)->authorize('payments.correct');
        if (trim($reason) === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'سبب التصحيح إلزامي.');
        }

        return DB::transaction(function () use ($actor, $payment, $newAmountMinor, $reason) {
            $p = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if ($p->status !== 'CONFIRMED') {
                throw new BusinessException(ErrorCode::PAYMENT_ALREADY_PROCESSED);
            }
            $old = $p->amount->minor;
            DB::table('payment_allocations')->where('payment_id', $p->id)->delete();
            $p->update(['amount' => $newAmountMinor]);
            $plan = $this->plan($p->customer, $newAmountMinor, $p->target_order_id ? Order::find($p->target_order_id) : null);
            $this->write($p, $plan);
            DB::table('payment_adjustments')->insert(['payment_id' => $p->id, 'type' => 'AMOUNT', 'old_amount' => $old, 'new_amount' => $newAmountMinor, 'reason' => $reason, 'adjusted_by' => $actor->id, 'created_at' => now()]);
            $this->audit->record('payment.corrected', $p, ['amount_minor' => $old], ['amount_minor' => $newAmountMinor], $reason);

            return $p->refresh();
        });
    }

    public function void(User $actor, Payment $payment, string $reason): Payment
    {
        Gate::forUser($actor)->authorize('payments.correct');
        if (trim($reason) === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'سبب الإلغاء إلزامي.');
        }

        return DB::transaction(function () use ($actor, $payment, $reason) {
            $p = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if ($p->status !== 'CONFIRMED') {
                throw new BusinessException(ErrorCode::PAYMENT_ALREADY_PROCESSED);
            }
            $p->update(['status' => 'VOIDED', 'voided_at' => now(), 'void_reason' => $reason]);
            DB::table('payment_adjustments')->insert(['payment_id' => $p->id, 'type' => 'VOID', 'old_amount' => $p->amount->minor, 'new_amount' => null, 'reason' => $reason, 'adjusted_by' => $actor->id, 'created_at' => now()]);
            $this->audit->record('payment.voided', $p, ['status' => 'CONFIRMED'], ['status' => 'VOIDED'], $reason);

            return $p;
        });
    }

    /**
     * خطة التخصيص: لا تتجاوز المتبقي أبدًا. مخصصة → أوردر واحد؛ عامة → FIFO على الأقدم.
     *
     * @return list<array{order_id: int, amount: int}>
     */
    private function plan(Customer $customer, int $amount, ?Order $target): array
    {
        if ($target) {
            $o = Order::whereKey($target->id)->lockForUpdate()->firstOrFail();
            $this->guardPayable($o);
            if ($amount > $this->due($o)) {
                throw new BusinessException(ErrorCode::PAYMENT_EXCEEDS_DUE);
            }

            return [['order_id' => $o->id, 'amount' => $amount]];
        }
        $plan = [];
        $left = $amount;
        foreach (Order::where('customer_id', $customer->id)->whereNotIn('status', [OrderStatus::CANCELLED->value])->orderBy('created_at')->orderBy('id')->lockForUpdate()->get() as $o) {
            if ($left === 0) {
                break;
            }
            $due = $this->due($o);
            if ($due === 0) {
                continue;
            }
            $take = min($due, $left);
            $plan[] = ['order_id' => $o->id, 'amount' => $take];
            $left -= $take;
        }
        if ($left > 0) {
            throw new BusinessException(ErrorCode::PAYMENT_EXCEEDS_DUE); // لا رصيد دائن (BR-052)
        }

        return $plan;
    }

    private function guardPayable(Order $o): void
    {
        if ($o->status === OrderStatus::CANCELLED) {
            throw new BusinessException(ErrorCode::ORDER_CANCELLED);
        }
    }

    /** @param list<array{order_id: int, amount: int}> $plan */
    private function write(Payment $p, array $plan): void
    {
        if (array_sum(array_column($plan, 'amount')) !== $p->amount->minor) {
            throw new BusinessException(ErrorCode::SERVER_ERROR); // invariant: Σ allocations = amount
        }
        foreach ($plan as $row) {
            DB::table('payment_allocations')->insert(['payment_id' => $p->id, 'order_id' => $row['order_id'], 'amount' => $row['amount'], 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    /** ينفذ عند إلغاء أوردر مدفوع: المدفوع يصبح Refund Due (BR-045/047). */
    public function openRefundObligation(Order $order): void
    {
        $paid = $this->paid($order);
        if ($paid > 0) {
            DB::table('refund_obligations')->updateOrInsert(['order_id' => $order->id], ['customer_id' => $order->customer_id, 'amount_due' => $paid, 'created_at' => now(), 'updated_at' => now()]);
            $this->audit->record('refund.obligation_opened', $order, [], ['amount_due_minor' => $paid]);
        }
    }

    public function payout(User $actor, int $obligationId, int $amountMinor, string $method, ?string $notes = null): int
    {
        Gate::forUser($actor)->authorize('refunds.record');

        return DB::transaction(function () use ($actor, $obligationId, $amountMinor, $method, $notes) {
            $ob = DB::table('refund_obligations')->where('id', $obligationId)->lockForUpdate()->first();
            abort_if($ob === null, 404);
            $paidOut = (int) DB::table('refund_payouts')->where('obligation_id', $obligationId)->sum('amount');
            if ($amountMinor < 1 || $paidOut + $amountMinor > $ob->amount_due) {
                throw new BusinessException(ErrorCode::REFUND_EXCEEDS_DUE);
            }
            $id = DB::table('refund_payouts')->insertGetId(['obligation_id' => $obligationId, 'amount' => $amountMinor, 'method' => $method, 'notes' => $notes, 'paid_by' => $actor->id, 'paid_at' => now()]);
            $this->audit->record('refund.paid', null, [], ['obligation_id' => $obligationId, 'amount_minor' => $amountMinor]);

            return $id;
        });
    }

    public function total(Money $a, Money $b): Money
    {
        return $a->add($b);
    }
}
