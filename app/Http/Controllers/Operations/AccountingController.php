<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Finance\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** المحاسبة (S-051..058): التحصيلات، المديونيات، المستردات. كل العمليات عبر PaymentService (معاملة + قفل + تدقيق). */
class AccountingController extends Controller
{
    private const METHODS = ['CASH' => 'نقدًا', 'BANK_TRANSFER' => 'تحويل بنكي', 'WALLET' => 'محفظة إلكترونية', 'CARD' => 'بطاقة'];

    public function index(Request $request, PaymentService $svc): Response
    {
        $u = $request->user();
        abort_unless($u->hasAnyPermission(['payments.view_all', 'payments.view_summary', 'refunds.view']), 403);
        $tab = in_array($request->query('tab'), ['receivables', 'refunds'], true) ? $request->query('tab') : 'payments';
        $props = ['tab' => $tab, 'methods' => self::METHODS, 'filters' => $request->only(['q', 'method', 'status']), 'can' => [
            'create' => (bool) $u->hasPermission('payments.create'), 'correct' => (bool) $u->hasPermission('payments.correct'), 'refund' => (bool) $u->hasPermission('refunds.record'),
        ]];
        if ($tab === 'payments') {
            abort_unless($u->hasPermission('payments.view_all'), 403);
            $props['payments'] = Payment::with('customer:id,name')
                ->when($request->query('q'), fn ($b, $t) => $b->where(fn ($w) => $w->where('number', 'like', "%{$t}%")->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$t}%"))))
                ->when(array_key_exists((string) $request->query('method'), self::METHODS), fn ($b) => $b->where('method', $request->query('method')))
                ->when(in_array($request->query('status'), ['CONFIRMED', 'VOIDED'], true), fn ($b) => $b->where('status', $request->query('status')))
                ->latest('id')->paginate(15)->withQueryString()->through(fn (Payment $p) => [
                    'id' => $p->id, 'number' => $p->number, 'customer' => $p->customer->name, 'customer_id' => $p->customer_id, 'amount_minor' => $p->amount->minor, 'method' => self::METHODS[$p->method] ?? $p->method,
                    'status' => $p->status, 'at' => $p->received_at->toIso8601String(), 'target' => $p->target_order_id ? Order::whereKey($p->target_order_id)->value('order_number') : null,
                ]);
            $props['customers'] = $u->hasPermission('payments.create') ? Customer::orderBy('name')->limit(300)->get(['id', 'name']) : [];
        }
        if ($tab === 'receivables') {
            $rows = Customer::orderBy('name')->get()->map(fn (Customer $c) => ['id' => $c->id, 'name' => $c->name, 'phone' => $c->phone_display, 'due_minor' => $svc->customerDue($c)])->filter(fn ($r) => $r['due_minor'] > 0)->sortByDesc('due_minor')->values();
            $props['receivables'] = $rows;
            $props['total_due_minor'] = $rows->sum('due_minor');
        }
        if ($tab === 'refunds') {
            abort_unless($u->hasPermission('refunds.view'), 403);
            $props['refunds'] = DB::table('refund_obligations')->join('orders', 'orders.id', '=', 'refund_obligations.order_id')->join('customers', 'customers.id', '=', 'refund_obligations.customer_id')
                ->select('refund_obligations.id', 'refund_obligations.amount_due', 'orders.order_number', 'customers.name as customer')->orderByDesc('refund_obligations.id')->get()
                ->map(fn ($r) => ['id' => $r->id, 'order' => $r->order_number, 'customer' => $r->customer, 'due_minor' => (int) $r->amount_due, 'paid_minor' => (int) DB::table('refund_payouts')->where('obligation_id', $r->id)->sum('amount')])
                ->map(fn ($r) => $r + ['remaining_minor' => $r['due_minor'] - $r['paid_minor']])->values();
        }

        return Inertia::render('operations/accounting', $props);
    }

    public function store(Request $request, PaymentService $svc): RedirectResponse
    {
        $d = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'], 'amount_minor' => ['required', 'integer', 'min:1'], 'method' => ['required', Rule::in(array_keys(self::METHODS))],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'], 'reference' => ['nullable', 'string', 'max:100'], 'notes' => ['nullable', 'string', 'max:500'],
        ], ['amount_minor.min' => 'قيمة الدفعة يجب أن تكون أكبر من صفر.']);
        $svc->record($request->user(), Customer::findOrFail($d['customer_id']), (int) $d['amount_minor'], $d['method'], ($d['order_id'] ?? null) ? Order::findOrFail($d['order_id']) : null, $d['reference'] ?? null, $d['notes'] ?? null);

        return back()->with('success', 'تم تسجيل الدفعة وتخصيصها.');
    }

    public function correct(Request $request, Payment $payment, PaymentService $svc): RedirectResponse
    {
        $d = $request->validate(['amount_minor' => ['required', 'integer', 'min:1'], 'reason' => ['required', 'string', 'max:255']], ['reason.required' => 'سبب التصحيح إلزامي.']);
        $svc->correct($request->user(), $payment, (int) $d['amount_minor'], $d['reason']);

        return back()->with('success', 'تم تصحيح الدفعة.');
    }

    public function void(Request $request, Payment $payment, PaymentService $svc): RedirectResponse
    {
        $d = $request->validate(['reason' => ['required', 'string', 'max:255']], ['reason.required' => 'سبب الإلغاء إلزامي.']);
        $svc->void($request->user(), $payment, $d['reason']);

        return back()->with('success', 'تم إلغاء الدفعة.');
    }

    public function payout(Request $request, int $id, PaymentService $svc): RedirectResponse
    {
        $d = $request->validate(['amount_minor' => ['required', 'integer', 'min:1'], 'method' => ['required', Rule::in(array_keys(self::METHODS))], 'notes' => ['nullable', 'string', 'max:255']]);
        $svc->payout($request->user(), $id, (int) $d['amount_minor'], $d['method'], $d['notes'] ?? null);

        return back()->with('success', 'تم تسجيل رد المبلغ.');
    }
}
