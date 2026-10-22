<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRequest;
use App\Services\Finance\PaymentService;
use App\Services\Orders\OrderStatusLabels;
use App\Services\Settings\Settings;
use App\Support\PenFixtures;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $u = $request->user();
        $canFinance = $u->hasPermission('dashboard.financial.view');

        $items = OrderItem::query()->whereNull('cancelled_at')->whereHas('order', fn ($o) => $o->where('status', 'DESIGN_STAGE'));
        $orders = fn (string ...$st) => Order::whereIn('status', $st)->count();
        $period = in_array($request->query('period'), ['today', 'week', 'month'], true) ? $request->query('period') : 'today';
        $from = match ($period) {
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            default => now()->startOfDay(),
        };
        $todayStart = now()->startOfDay();
        $openActions = DB::table('staff_actions')->where('status', '!=', 'DONE');
        $late = Order::where('status', 'DESIGN_STAGE')->where('created_at', '<', now()->subDays(3))->count();
        $unassigned = (clone $items)->whereNull('designer_id')->count();

        $data = [
            'user_first_name' => explode(' ', trim($u->name))[0],
            'now' => now()->toIso8601String(),
            'period' => $period,
            'urgent' => ($late + $unassigned) > 0 ? ['late' => $late, 'unassigned' => $unassigned] : null,
            'kpis' => [
                'pending_requests' => OrderRequest::where('status', 'PENDING')->count(), 'unassigned_items' => $unassigned,
                'follow_up' => (clone $openActions)->count(), 'revisions' => (clone $items)->where('design_state', 'REVISION_REQUESTED')->count(),
                'awaiting_approval' => (clone $items)->where('design_state', 'AWAITING_APPROVAL')->count(), 'in_printing' => $orders('IN_PRINTING'),
                'ready' => $orders('READY_FOR_PICKUP', 'READY_FOR_DELIVERY'),
            ],
            'summary' => [
                'awaiting_approval' => (clone $items)->where('design_state', 'AWAITING_APPROVAL')->count(), 'in_design' => (clone $items)->where('design_state', 'IN_DESIGN')->count(),
                'out_for_delivery' => $orders('OUT_FOR_DELIVERY'), 'completed' => Order::where('status', 'COMPLETED')->where('completed_at', '>=', $from)->count(),
                'pickup' => Order::whereNotIn('status', ['COMPLETED', 'CANCELLED'])->where('delivery_method', 'PICKUP')->count(),
                'delivery' => Order::whereNotIn('status', ['COMPLETED', 'CANCELLED'])->where('delivery_method', 'DELIVERY')->count(),
            ],
            'finance' => $canFinance ? [
                'collected_today' => (int) DB::table('payments')->where('status', 'CONFIRMED')->where('received_at', '>=', $from)->sum('amount'),
                'collected_week' => (int) DB::table('payments')->where('status', 'CONFIRMED')->where('received_at', '>=', now()->startOfWeek())->sum('amount'),
                'receivables' => app(PaymentService::class)->totalReceivables(),
                'order_value_today' => (int) Order::where('created_at', '>=', $from)->where('status', '!=', 'CANCELLED')->sum('grand_total'),
                'refund_due' => (int) DB::table('refund_obligations')->sum('amount_due') - (int) DB::table('refund_payouts')->sum('amount'),
            ] : null,
            'alerts' => $late > 0 ? [['title' => 'أوردرات متأخرة في التصميم', 'tone' => 'warn', 'text' => "{$late} أوردر مضى عليه أكثر من 3 أيام في مرحلة التصميم."]] : [],
            'actions' => [
                'total' => (clone $openActions)->count(),
                'items' => (clone $openActions)->orderBy('created_at')->limit(3)->get()->map(fn ($a) => ['title' => $a->title, 'sub' => trim(($a->customer ?? '').' • '.($a->order_ref ?? ''), ' •'), 'href' => '/actions'])->all(),
            ],
            'recent' => Order::with('customer:id,name')->latest('id')->limit(5)->get()->map(fn (Order $o) => [
                'id' => $o->id, 'no' => $o->order_number, 'subject' => $o->customer->name, 'status' => app(OrderStatusLabels::class)->label($o->status),
                'tone' => match ($o->status->value) {
                    'DESIGN_STAGE' => 'design', 'IN_PRINTING' => 'info', 'CANCELLED' => 'danger', 'COMPLETED' => 'neutral', default => 'ok'
                },
                'due' => $this->due($o), 'total_minor' => $o->grand_total->minor, 'href' => "/orders/{$o->id}",
            ])->all(),
            'branch' => app(Settings::class)->get('shop.branch'),
            'statusLabels' => app(OrderStatusLabels::class)->all(),
        ];

        // بيانات عينة الـpen للمقارنة البصرية فقط (local) — لا تُستعمل خارج بيئة التطوير.
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $data = array_replace($data, PenFixtures::dashboard());
        }

        return Inertia::render('dashboard', $data);
    }

    private function due(Order $o): string
    {
        $m = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        $d = ($o->created_at ?? now())->copy()->addDays((int) ($o->printing_eta_days ?? 0));

        return $d->day.' '.$m[$d->month - 1];
    }
}
