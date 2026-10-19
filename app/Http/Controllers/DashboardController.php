<?php

namespace App\Http\Controllers;

use App\Support\PenFixtures;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $u = $request->user();
        $canFinance = $u->hasPermission('dashboard.financial.view');

        // أرقام حقيقية: لا توجد وحدات أوردرات/تصميم/مالية بعد → أصفار (تُربط بالمراحل 4–9).
        $data = [
            'user_first_name' => explode(' ', trim($u->name))[0],
            'now' => now()->toIso8601String(),
            'urgent' => null,
            'kpis' => ['pending_requests' => 0, 'unassigned_items' => 0, 'follow_up' => 0, 'revisions' => 0, 'awaiting_approval' => 0, 'in_printing' => 0, 'ready' => 0],
            'summary' => ['awaiting_approval' => 0, 'in_design' => 0, 'out_for_delivery' => 0, 'completed' => 0, 'pickup' => 0, 'delivery' => 0],
            'finance' => $canFinance ? ['collected_today' => 0, 'collected_week' => 0, 'receivables' => 0, 'order_value_today' => 0, 'refund_due' => 0] : null,
            'alerts' => [],
            'actions' => ['total' => 0, 'items' => []],
            'recent' => [],
            'branch' => 'الفرع الرئيسي',
        ];

        // بيانات عينة الـpen للمقارنة البصرية فقط (local) — لا تُستعمل خارج بيئة التطوير.
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $data = array_replace($data, PenFixtures::dashboard());
        }

        return Inertia::render('dashboard', $data);
    }
}
