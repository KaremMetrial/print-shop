<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** التقارير (S-060/061): أرقام مشتقة من المصدر الوحيد للحقيقة (الأوردرات/التخصيصات). المالي لمن يملك reports.financial.view. */
class ReportsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()->hasAnyPermission(['reports.operational.view', 'reports.financial.view']), 403);
        $from = $request->query('from') ?: now()->subDays(29)->toDateString();
        $to = $request->query('to') ?: now()->toDateString();
        $range = [$from.' 00:00:00', $to.' 23:59:59'];
        $ops = null;
        if ($request->user()->hasPermission('reports.operational.view')) {
            $ops = [
                'created' => Order::whereBetween('created_at', $range)->count(),
                'by_status' => Order::whereBetween('created_at', $range)->selectRaw('status, count(*) n')->groupBy('status')->pluck('n', 'status'),
                'completed' => Order::whereBetween('completed_at', $range)->count(),
                'cancelled' => Order::whereBetween('cancelled_at', $range)->count(),
            ];
        }
        $fin = null;
        if ($request->user()->hasPermission('reports.financial.view')) {
            $fin = [
                'orders_value' => (int) Order::whereBetween('created_at', $range)->where('status', '!=', 'CANCELLED')->sum('grand_total'),
                'collected' => (int) DB::table('payments')->where('status', 'CONFIRMED')->whereBetween('received_at', $range)->sum('amount'),
                'refunds_due' => (int) DB::table('refund_obligations')->sum('amount_due') - (int) DB::table('refund_payouts')->sum('amount'),
                'by_method' => DB::table('payments')->where('status', 'CONFIRMED')->whereBetween('received_at', $range)->selectRaw('method, sum(amount) total')->groupBy('method')->pluck('total', 'method'),
            ];
        }

        return Inertia::render('operations/reports', ['from' => $from, 'to' => $to, 'ops' => $ops, 'fin' => $fin]);
    }
}
