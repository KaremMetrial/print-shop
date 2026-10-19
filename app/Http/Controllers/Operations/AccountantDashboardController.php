<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Payment;
use App\Services\Finance\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** S-009 — لوحة الحسابات: ما يحتاج قرارًا الآن (إثباتات)، آخر التحصيلات، الاستردادات والمديونيات. بيانات حقيقية فقط. */
class AccountantDashboardController extends Controller
{
    private const METHODS = ['CASH' => 'نقدًا', 'BANK_TRANSFER' => 'تحويل بنكي', 'WALLET' => 'محفظة إلكترونية', 'CARD' => 'بطاقة'];

    public function __invoke(Request $request, PaymentService $svc): Response
    {
        abort_unless($request->user()->hasAnyPermission(['payments.view_all', 'payments.proofs.review', 'dashboard.financial.view']), 403);
        $canProofs = $request->user()->hasPermission('payments.proofs.review');

        return Inertia::render('operations/accountant-dashboard', [
            'can_proofs' => $canProofs,
            'proofs' => ! $canProofs ? [] : DB::table('payment_proofs as p')->join('orders as o', 'o.id', '=', 'p.order_id')->join('customers as c', 'c.id', '=', 'p.customer_id')->where('p.status', 'PENDING')
                ->orderBy('p.id')->limit(5)->get(['p.id', 'p.claimed_amount', 'p.method', 'p.created_at', 'o.order_number', 'c.name'])
                ->map(fn ($r) => ['id' => $r->id, 'customer' => $r->name, 'order' => $r->order_number, 'amount_minor' => (int) $r->claimed_amount, 'method' => self::METHODS[$r->method] ?? $r->method, 'at' => Carbon::parse($r->created_at)->toIso8601String()])->all(),
            'proofs_total' => $canProofs ? DB::table('payment_proofs')->where('status', 'PENDING')->count() : 0,
            'payments' => Payment::with('customer:id,name')->where('status', 'CONFIRMED')->latest('id')->limit(5)->get()->map(fn (Payment $p) => ['id' => $p->id, 'number' => $p->number, 'customer' => $p->customer->name, 'amount_minor' => $p->amount->minor, 'method' => self::METHODS[$p->method] ?? $p->method, 'at' => $p->received_at->toIso8601String()])->all(),
            'refunds' => DB::table('refund_obligations as r')->join('orders as o', 'o.id', '=', 'r.order_id')->join('customers as c', 'c.id', '=', 'r.customer_id')->get(['r.id', 'r.amount_due', 'o.order_number', 'c.name'])
                ->map(fn ($r) => ['id' => $r->id, 'customer' => $r->name, 'order' => $r->order_number, 'remaining_minor' => (int) $r->amount_due - (int) DB::table('refund_payouts')->where('obligation_id', $r->id)->sum('amount')])
                ->filter(fn ($r) => $r['remaining_minor'] > 0)->take(5)->values()->all(),
            'receivables' => Customer::orderBy('name')->get()->map(fn (Customer $c) => ['id' => $c->id, 'name' => $c->name, 'due_minor' => $svc->customerDue($c)])->filter(fn ($r) => $r['due_minor'] > 0)->sortByDesc('due_minor')->take(5)->values()->all(),
        ]);
    }
}
