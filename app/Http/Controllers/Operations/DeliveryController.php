<?php

namespace App\Http\Controllers\Operations;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Orders\OrderStatusLabels;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** الطباعة والتسليم (S-059): طوابير التنفيذ. الانتقالات عبر AdvanceOrder (POST /orders/{id}/{step}). */
class DeliveryController extends Controller
{
    private const TABS = ['printing' => [OrderStatus::IN_PRINTING], 'pickup' => [OrderStatus::READY_FOR_PICKUP], 'delivery' => [OrderStatus::READY_FOR_DELIVERY], 'out' => [OrderStatus::OUT_FOR_DELIVERY], 'done' => [OrderStatus::COMPLETED]];

    public function index(Request $request): Response
    {
        Gate::authorize('orders.view');
        $tab = array_key_exists((string) $request->query('tab'), self::TABS) ? $request->query('tab') : 'printing';
        $u = $request->user();
        $counts = [];
        foreach (self::TABS as $k => $st) {
            $counts[$k] = Order::whereIn('status', array_map(fn ($s) => $s->value, $st))->count();
        }
        $rows = Order::with('customer:id,name,phone_display')->whereIn('status', array_map(fn ($s) => $s->value, self::TABS[$tab]))
            ->when($request->query('q'), fn ($b, $t) => $b->where(fn ($w) => $w->where('order_number', 'like', "%{$t}%")->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$t}%"))))
            ->when(in_array($request->query('method'), ['PICKUP', 'DELIVERY'], true), fn ($b) => $b->where('delivery_method', $request->query('method')))
            ->oldest('updated_at')->paginate(15)->withQueryString()->through(fn (Order $o) => [
                'id' => $o->id, 'number' => $o->order_number, 'customer' => $o->customer->name, 'phone' => $o->customer->phone_display, 'method' => $o->delivery_method,
                'address' => $o->delivery_address, 'updated_at' => $o->updated_at?->toIso8601String(), 'status' => $o->status->value,
            ]);

        return Inertia::render('operations/delivery', [
            'orders' => $rows, 'tab' => $tab, 'counts' => $counts, 'filters' => $request->only(['q', 'method']),
            'statusLabels' => app(OrderStatusLabels::class)->all(),
            'can' => ['printing' => (bool) $u->hasPermission('orders.printing.complete'), 'delivery' => (bool) $u->hasPermission('orders.delivery.update'), 'complete' => (bool) $u->hasPermission('orders.complete')],
        ]);
    }
}
