<?php

use App\Actions\Orders\CancelOrder;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\Finance\PaymentService;
use App\Services\Pricing\PricingService;
use App\Support\Money;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

function ps(): PaymentService
{
    return app(PaymentService::class);
}
function acct(): User
{
    return User::factory()->admin()->create();
}
function payOrder(Customer $c, int $total, string $at = 'now'): Order
{
    return Order::factory()->create(['customer_id' => $c->id, 'subtotal' => $total, 'grand_total' => $total, 'created_at' => $at]);
}

it('allocates a general payment FIFO to the oldest dues (BR-050)', function () {
    $c = Customer::factory()->create();
    $a = payOrder($c, 1000, '2026-01-01');
    $b = payOrder($c, 2000, '2026-01-02');
    $p = ps()->record(acct(), $c, 1500, 'CASH');
    expect(ps()->paid($a))->toBe(1000)->and(ps()->paid($b))->toBe(500)->and($p->allocations->sum('amount'))->toBe(1500);
    expect($p->number)->toStartWith('PAY-');
});

it('targeted payment goes only to the chosen order and cannot exceed its due (BR-051/052)', function () {
    $c = Customer::factory()->create();
    $a = payOrder($c, 1000, '2026-01-01');
    $b = payOrder($c, 2000, '2026-01-02');
    ps()->record(acct(), $c, 800, 'CASH', $b);
    expect(ps()->paid($a))->toBe(0)->and(ps()->paid($b))->toBe(800);
    expect(fn () => ps()->record(acct(), $c, 1300, 'CASH', $b))->toThrow(BusinessException::class);
    expect(ps()->paid($b))->toBe(800);
});

it('rejects overpayment of the whole account — no credit balance (BR-052)', function () {
    $c = Customer::factory()->create();
    payOrder($c, 1000);
    expect(fn () => ps()->record(acct(), $c, 1001, 'CASH'))->toThrow(BusinessException::class);
    expect(Payment::count())->toBe(0);
    ps()->record(acct(), $c, 1000, 'CASH');
    expect(ps()->customerDue($c))->toBe(0);
});

it('keeps Σ allocations = payment amount and paid ≤ grand total always', function () {
    $c = Customer::factory()->create();
    $o = payOrder($c, 1000);
    foreach ([300, 300, 400] as $x) {
        ps()->record(acct(), $c, $x, 'CASH');
    }
    expect(ps()->paid($o))->toBe(1000);
    foreach (Payment::all() as $p) {
        expect((int) DB::table('payment_allocations')->where('payment_id', $p->id)->sum('amount'))->toBe($p->amount->minor);
    }
    expect(fn () => ps()->record(acct(), $c, 1, 'CASH'))->toThrow(BusinessException::class);
});

it('corrects a payment with reason and re-allocates; data entry cannot correct (BR-053/054)', function () {
    $c = Customer::factory()->create();
    $a = payOrder($c, 1000, '2026-01-01');
    $b = payOrder($c, 1000, '2026-01-02');
    $p = ps()->record(acct(), $c, 1500, 'CASH');
    $de = User::factory()->dataEntry()->create();
    expect(fn () => ps()->correct($de, $p, 900, 'خطأ'))->toThrow(AuthorizationException::class);
    expect(fn () => ps()->correct(acct(), $p, 900, ''))->toThrow(BusinessException::class);
    ps()->correct(acct(), $p, 900, 'تصحيح الإدخال');
    expect(ps()->paid($a))->toBe(900)->and(ps()->paid($b))->toBe(0);
    expect(DB::table('payment_adjustments')->count())->toBe(1);
    ps()->void(acct(), $p->refresh(), 'دفعة مكررة');
    expect(ps()->paid($a))->toBe(0);
    expect(fn () => ps()->void(acct(), $p->refresh(), 'x'))->toThrow(BusinessException::class);
});

it('opens a refund obligation when a paid order is cancelled and allows partial then full payouts (BR-045..048)', function () {
    $c = Customer::factory()->create();
    $o = payOrder($c, 1000);
    ps()->record(acct(), $c, 600, 'CASH');
    app(CancelOrder::class)->handle(acct(), $o, 'طلب العميل');
    $ob = DB::table('refund_obligations')->where('order_id', $o->id)->first();
    expect((int) $ob->amount_due)->toBe(600)->and(ps()->due($o->refresh()))->toBe(0);
    ps()->payout(acct(), $ob->id, 200, 'CASH');
    expect(fn () => ps()->payout(acct(), $ob->id, 500, 'CASH'))->toThrow(BusinessException::class);
    ps()->payout(acct(), $ob->id, 400, 'CASH');
    expect(fn () => ps()->payout(acct(), $ob->id, 1, 'CASH'))->toThrow(BusinessException::class);
    expect((int) DB::table('refund_payouts')->where('obligation_id', $ob->id)->sum('amount'))->toBe(600);
});

it('cannot pay a cancelled order and does not carry money to a new order (BR-047)', function () {
    $c = Customer::factory()->create();
    $o = payOrder($c, 1000);
    $o->update(['status' => OrderStatus::CANCELLED]);
    expect(fn () => ps()->record(acct(), $c, 100, 'CASH', $o))->toThrow(BusinessException::class);
    $n = payOrder($c, 500);
    expect(ps()->paid($n))->toBe(0);
});

it('lets price edits respect paid amount (BR-056)', function () {
    $c = Customer::factory()->create();
    $o = payOrder($c, 1000);
    ps()->record(acct(), $c, 800, 'CASH');
    $res = app(PricingService::class);
    expect(fn () => $res->totals(Money::minor(500), 'NONE', 0, Money::zero(), Money::minor($o->paidMinor())))->toThrow(BusinessException::class);
});
