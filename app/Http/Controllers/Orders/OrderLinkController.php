<?php

namespace App\Http\Controllers\Orders;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Orders\OrderLinkService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** إدارة رابط الأوردر للموظف (S-017): نسخ/إيقاف مؤقت/إعادة تفعيل/إعادة إنشاء. */
class OrderLinkController extends Controller
{
    public function show(Request $request, Order $order, OrderLinkService $links): Response
    {
        Gate::authorize('orders.links.manage');
        $link = $order->link()->firstOrFail();
        $props = [
            'order' => ['id' => $order->id, 'number' => $order->order_number, 'customer' => $order->customer->name, 'phone' => $order->customer->phone_display, 'status_label' => $order->status->label(), 'created_at' => $order->created_at?->toIso8601String()],
            'link' => ['status' => $link->status, 'created_at' => $link->created_at->toIso8601String(), 'last_regenerated_at' => $link->last_regenerated_at?->toIso8601String(), 'url' => $order->status->isFinal() ? null : $links->url($link), 'closed' => $order->status->isFinal()],
        ];

        return Inertia::render('orders/link', $props);
    }

    public function act(Request $request, Order $order, string $action, OrderLinkService $links): RedirectResponse
    {
        Gate::authorize('orders.links.manage');
        $link = $order->link()->firstOrFail();
        abort_if($order->status->isFinal(), 409, 'الرابط مغلق.');
        match ($action) {
            'regenerate' => $links->regenerate($request->user(), $link),
            'suspend' => $links->suspend($request->user(), $link),
            'reactivate' => $links->reactivate($request->user(), $link),
            default => abort(404),
        };

        return back()->with('success', 'تم تحديث الرابط.');
    }
}
