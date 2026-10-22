<?php

namespace App\Http\Controllers\Operations;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Orders\OrderStatusLabels;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** التقارير (S-060/061): أرقام مشتقة من المصدر الوحيد للحقيقة (الأوردرات/التخصيصات). المالي لمن يملك reports.financial.view. */
class ReportsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        [$from, $to, $ops, $fin] = $this->reportData($request);

        return Inertia::render('operations/reports', ['from' => $from, 'to' => $to, 'ops' => $ops, 'fin' => $fin, 'statusLabels' => app(OrderStatusLabels::class)->all()]);
    }

    public function export(Request $request): \Illuminate\Http\Response
    {
        [$from, $to, $ops, $fin] = $this->reportData($request);
        $rows = [['القسم', 'المؤشر', 'القيمة']];

        if ($ops !== null) {
            $rows[] = ['تشغيلي', 'أوردرات منشأة', $ops['created']];
            $rows[] = ['تشغيلي', 'أوردرات مكتملة', $ops['completed']];
            $rows[] = ['تشغيلي', 'أوردرات ملغاة', $ops['cancelled']];
            foreach ($ops['by_status'] as $status => $count) {
                $rows[] = ['تشغيلي', 'حسب الحالة — '.app(OrderStatusLabels::class)->label(OrderStatus::from($status)), $count];
            }
        }

        if ($fin !== null) {
            $rows[] = ['مالي', 'قيمة الأوردرات (قروش)', $fin['orders_value']];
            $rows[] = ['مالي', 'المحصّل (قروش)', $fin['collected']];
            $rows[] = ['مالي', 'مستردات مستحقة (قروش)', $fin['refunds_due']];
            foreach ($fin['by_method'] as $method => $amount) {
                $rows[] = ['مالي', 'المحصّل حسب طريقة الدفع — '.(PaymentMethod::labels()[$method] ?? $method).' (قروش)', $amount];
            }
        }

        $stream = fopen('php://temp', 'r+');
        foreach ($rows as $row) {
            fputcsv($stream, $row);
        }
        rewind($stream);
        $csv = "\xEF\xBB\xBF".stream_get_contents($stream);
        fclose($stream);

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=pbms-report-{$from}-{$to}.csv",
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /** @return array{0: string, 1: string, 2: array{created: int, by_status: array<string, int>, completed: int, cancelled: int}|null, 3: array{orders_value: int, collected: int, refunds_due: int, by_method: array<string, int>}|null} */
    private function reportData(Request $request): array
    {
        $user = $request->user();
        abort_unless($user->hasAnyPermission(['reports.operational.view', 'reports.financial.view']), 403);
        $dates = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ]);
        $from = $dates['from'] ?? now()->subDays(29)->toDateString();
        $to = $dates['to'] ?? now()->toDateString();
        if ($from > $to) {
            throw ValidationException::withMessages(['from' => 'تاريخ البداية يجب أن يسبق تاريخ النهاية أو يساويه.']);
        }
        $range = [$from.' 00:00:00', $to.' 23:59:59'];
        $ops = null;
        if ($user->hasPermission('reports.operational.view')) {
            $ops = [
                'created' => Order::whereBetween('created_at', $range)->count(),
                'by_status' => Order::whereBetween('created_at', $range)->selectRaw('status, count(*) n')->groupBy('status')->pluck('n', 'status')->all(),
                'completed' => Order::whereBetween('completed_at', $range)->count(),
                'cancelled' => Order::whereBetween('cancelled_at', $range)->count(),
            ];
        }
        $fin = null;
        if ($user->hasPermission('reports.financial.view')) {
            $fin = [
                'orders_value' => (int) Order::whereBetween('created_at', $range)->where('status', '!=', 'CANCELLED')->sum('grand_total'),
                'collected' => (int) DB::table('payments')->where('status', 'CONFIRMED')->whereBetween('received_at', $range)->sum('amount'),
                'refunds_due' => (int) DB::table('refund_obligations')->sum('amount_due') - (int) DB::table('refund_payouts')->sum('amount'),
                'by_method' => DB::table('payments')->where('status', 'CONFIRMED')->whereBetween('received_at', $range)->selectRaw('method, sum(amount) total')->groupBy('method')->pluck('total', 'method')->all(),
            ];
        }

        return [$from, $to, $ops, $fin];
    }
}
