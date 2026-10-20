<?php

namespace App\Http\Controllers\Customers;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Finance\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** S-025 أوردرات العميل · S-026 الملخص المالي + كشف الحساب · S-027 المدفوعات · S-030 الاستردادات. كل الأرقام من PaymentService/الجداول. */
class CustomerFinanceController extends Controller
{
    public function orders(Request $request, Customer $customer, CustomerController $profile): Response
    {
        Gate::authorize('view', $customer);
        abort_unless($request->user()->hasPermission('orders.view'), 403);
        $showPrice = ! $request->user()->isDesigner();
        $rows = Order::where('customer_id', $customer->id)->withCount(['items as active_items_count' => fn ($q) => $q->whereNull('cancelled_at')])->latest('id')->paginate(10)->withQueryString()
            ->through(fn (Order $o) => ['id' => $o->id, 'number' => $o->order_number, 'status' => $o->status->value, 'status_label' => $o->status->label(), 'items' => $o->active_items_count, 'created_at' => $o->created_at?->toIso8601String()] + ($showPrice ? ['total_minor' => $o->grand_total->minor] : []));

        return Inertia::render('customers/finance', ['tab' => 'orders', 'customer' => $profile->profile($customer, $request), 'orders' => $rows, 'price' => $showPrice]);
    }

    public function financial(Request $request, Customer $customer, CustomerController $profile, PaymentService $svc): Response
    {
        Gate::authorize('view', $customer);
        $u = $request->user();
        abort_unless($u->hasPermission('customers.view_ledger') || $u->hasPermission('customers.view_balance'), 403);
        $orders = Order::where('customer_id', $customer->id)->get();
        $active = $orders->where('status', '!=', OrderStatus::CANCELLED);
        $paid = (int) $active->sum(fn (Order $o) => $svc->paid($o));
        $refDue = (int) DB::table('refund_obligations')->where('customer_id', $customer->id)->sum('amount_due');
        $refPaid = (int) DB::table('refund_payouts')->join('refund_obligations', 'refund_obligations.id', '=', 'refund_payouts.obligation_id')->where('refund_obligations.customer_id', $customer->id)->sum('refund_payouts.amount');
        $ledger = $u->hasPermission('customers.view_ledger') ? $this->ledger($customer, $orders) : [];

        return Inertia::render('customers/finance', [
            'tab' => 'financial', 'customer' => $profile->profile($customer, $request),
            'summary' => ['orders_total_minor' => (int) $active->sum(fn (Order $o) => $o->grand_total->minor), 'paid_minor' => $paid, 'due_minor' => $svc->customerDue($customer), 'refund_due_minor' => $refDue, 'refund_paid_minor' => $refPaid],
            'ledger' => array_slice(array_reverse($ledger), 0, 5), 'can_ledger' => $u->hasPermission('customers.view_ledger'),
        ]);
    }

    public function payments(Request $request, Customer $customer, CustomerController $profile): Response
    {
        Gate::authorize('view', $customer);
        abort_unless($request->user()->hasPermission('payments.view_all'), 403);
        $rows = Payment::where('customer_id', $customer->id)->latest('id')->paginate(10)->withQueryString()->through(fn (Payment $p) => [
            'id' => $p->id, 'number' => $p->number, 'amount_minor' => $p->amount->minor, 'method' => PaymentMethod::labels()[$p->method] ?? $p->method, 'status' => $p->status,
            'at' => $p->received_at->toIso8601String(), 'target' => $p->target_order_id ? Order::whereKey($p->target_order_id)->value('order_number') : null,
        ]);

        return Inertia::render('customers/finance', ['tab' => 'payments', 'customer' => $profile->profile($customer, $request), 'payments' => $rows]);
    }

    public function refunds(Request $request, Customer $customer, CustomerController $profile): Response
    {
        Gate::authorize('view', $customer);
        abort_unless($request->user()->hasPermission('refunds.view'), 403);
        $rows = DB::table('refund_obligations as r')->join('orders as o', 'o.id', '=', 'r.order_id')->where('r.customer_id', $customer->id)->orderByDesc('r.id')->get(['r.id', 'r.amount_due', 'o.order_number'])
            ->map(function ($r) {
                $paid = (int) DB::table('refund_payouts')->where('obligation_id', $r->id)->sum('amount');

                return ['id' => $r->id, 'ref' => 'REF-'.str_pad((string) $r->id, 4, '0', STR_PAD_LEFT), 'order' => $r->order_number, 'due_minor' => (int) $r->amount_due, 'paid_minor' => $paid, 'remaining_minor' => (int) $r->amount_due - $paid];
            })->all();

        return Inertia::render('customers/finance', ['tab' => 'refunds', 'customer' => $profile->profile($customer, $request), 'refunds' => $rows]);
    }

    /**
     * كشف الحساب بترتيب زمني؛ الرصيد التراكمي ينتهي عند مستحقات الأوردرات النشطة (= PaymentService::customerDue).
     *
     * @param  Collection<int, Order>  $orders
     * @return list<array<string, mixed>>
     */
    private function ledger(Customer $customer, $orders): array
    {
        $ev = [];
        foreach ($orders as $o) {
            $ev[] = ['at' => $o->created_at, 'type' => 'إصدار أوردر', 'order' => $o->order_number, 'debit' => $o->grand_total->minor, 'credit' => 0, 'delta' => $o->grand_total->minor, 'ref' => $o->order_number];
            if ($o->status === OrderStatus::CANCELLED) {
                $ev[] = ['at' => $o->updated_at, 'type' => 'إلغاء أوردر', 'order' => $o->order_number, 'debit' => 0, 'credit' => $o->grand_total->minor, 'delta' => -$o->grand_total->minor, 'ref' => $o->order_number];
            }
        }
        $cancelled = $orders->where('status', OrderStatus::CANCELLED)->pluck('id')->all();
        foreach (Payment::where('customer_id', $customer->id)->where('status', 'CONFIRMED')->with('allocations')->get() as $p) {
            $toActive = (int) $p->allocations->whereNotIn('order_id', $cancelled)->sum(fn ($a) => (int) $a->amount);
            $first = $p->allocations->first();
            $ev[] = ['at' => $p->received_at, 'type' => 'دفعة مؤكدة', 'order' => $first ? Order::whereKey($first->order_id)->value('order_number') : null, 'debit' => 0, 'credit' => $p->amount->minor, 'delta' => -$toActive, 'ref' => $p->number];
        }
        usort($ev, fn ($a, $b) => $a['at'] <=> $b['at']);
        $bal = 0;

        return array_map(function ($e) use (&$bal) {
            $bal += $e['delta'];

            return ['at' => Carbon::parse($e['at'])->toIso8601String(), 'type' => $e['type'], 'order' => $e['order'], 'debit_minor' => $e['debit'], 'credit_minor' => $e['credit'], 'balance_minor' => $bal, 'ref' => $e['ref']];
        }, $ev);
    }
}
