<?php

namespace App\Http\Controllers\Orders;

use App\Actions\Orders\ReviewOrderRequest;
use App\Enums\OrderRequestStatus;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\OrderRequest;
use App\Models\OrderRequestItem;
use App\Models\User;
use App\Services\Pricing\PricingService;
use App\Support\PenFixtures;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OrderRequestController extends Controller
{
    private const ACTIONS = [
        'order_request.submitted' => 'تم إرسال الطلب', 'order_request.review_started' => 'بدء المراجعة', 'order_request.edited' => 'حفظ تعديلات الطلب',
        'order_request.accepted' => 'قبول الطلب', 'order_request.rejected' => 'رفض الطلب',
    ];

    public function index(Request $request): Response
    {
        Gate::authorize('order_requests.view');
        $tab = OrderRequestStatus::tryFrom((string) $request->query('tab')) ?? OrderRequestStatus::PENDING;
        $q = OrderRequest::query()->with('customer:id,name', 'reviewer:id,name')->withCount('items')
            ->where('status', $tab)
            ->when($request->query('q'), fn ($b, $t) => $b->where(fn ($w) => $w->where('request_number', 'like', "%{$t}%")->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$t}%"))))
            ->when($request->query('reviewer'), fn ($b, $id) => $b->where('reviewer_id', $id))
            ->when($request->query('customer'), fn ($b, $id) => $b->where('customer_id', $id))
            ->oldest('submitted_at');

        $rows = $q->paginate(15)->withQueryString()->through(function (OrderRequest $r) {
            $items = $r->items()->with('product')->get();

            return [
                'id' => $r->id, 'number' => $r->request_number, 'customer' => $r->customer->name, 'submitted_at' => $r->submitted_at->toIso8601String(),
                'items_count' => $r->items_count, 'total_minor' => $this->total($r, $items->all()), 'status' => $r->status->value, 'status_label' => $r->status->label(),
                'reviewer' => $r->reviewer?->name,
            ];
        });
        $counts = OrderRequest::selectRaw('status, count(*) c')->groupBy('status')->pluck('c', 'status');

        $props = [
            'requests' => $rows, 'tab' => $tab->value, 'filters' => $request->only(['q', 'reviewer', 'customer']),
            'counts' => collect(OrderRequestStatus::cases())->mapWithKeys(fn ($s) => [$s->value => (int) ($counts[$s->value] ?? 0)])->all(),
            'reviewers' => User::whereIn('id', OrderRequest::whereNotNull('reviewer_id')->select('reviewer_id'))->get(['id', 'name']),
            'customers' => OrderRequest::with('customer:id,name')->get()->pluck('customer')->unique('id')->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->values(),
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::orderRequestIndex());
            $props['requests'] = $props['requests']->through(fn ($r) => ['total_minor' => 236000] + $r);
        }

        return Inertia::render('order-requests/index', $props);
    }

    public function show(Request $request, OrderRequest $orderRequest, PricingService $pricing): Response
    {
        Gate::authorize('order_requests.view');
        $orderRequest->load('customer.pricingTier', 'reviewer', 'items.product.optionGroups.values', 'order');
        $tier = $orderRequest->customer->pricingTier;
        $uid = $request->user()->id;

        $items = $orderRequest->items->values()->map(function (OrderRequestItem $i, int $n) use ($orderRequest) {
            $q = $this->quote($orderRequest, $i);

            return [
                'id' => $i->id, 'label' => 'البند '.str_pad((string) ($n + 1), 2, '0', STR_PAD_LEFT).' — '.$i->product->name, 'product' => $i->product->name, 'product_id' => $i->product_id,
                'quantity' => $i->quantity, 'original_quantity' => $i->original_quantity, 'unit_minor' => $q['unit'], 'total_minor' => $q['total'], 'specs' => $q['specs'],
                'notes' => $i->notes, 'options' => $i->options,
            ];
        });
        $subtotal = $items->sum('total_minor');
        $original = $orderRequest->items->sum(fn ($i) => $this->quote($orderRequest, $i, $i->original_quantity)['total']);
        $log = AuditLog::where('entity_type', $orderRequest->getMorphClass())->where('entity_id', $orderRequest->id)->oldest('id')->get();
        $edited = $orderRequest->items->filter(fn ($i) => $i->quantity !== $i->original_quantity)->values();

        $props = [
            'req' => [
                'id' => $orderRequest->id, 'number' => $orderRequest->request_number, 'status' => $orderRequest->status->value, 'status_label' => $orderRequest->status->label(),
                'submitted_at' => $orderRequest->submitted_at->toIso8601String(), 'decided_at' => $orderRequest->decided_at?->toIso8601String(),
                'reviewer' => $orderRequest->reviewer?->name, 'review_started_at' => $orderRequest->review_started_at?->toIso8601String(),
                'delivery_method' => $orderRequest->delivery_method, 'delivery_address' => $orderRequest->delivery_address, 'notes' => $orderRequest->notes,
                'reject_reason' => $orderRequest->reject_reason, 'order' => $orderRequest->order ? ['id' => $orderRequest->order->id, 'number' => $orderRequest->order->order_number] : null,
                'mine' => $orderRequest->reviewer_id === $uid,
            ],
            'customer' => [
                'id' => $orderRequest->customer->id, 'code' => $orderRequest->customer->code(), 'name' => $orderRequest->customer->name, 'phone' => $orderRequest->customer->phone_normalized,
                'tier' => $tier->name, 'tier_discount' => $tier->mode === 'PERCENTAGE' ? (string) (float) $tier->discount_percentage : null, 'registered' => $orderRequest->customer->platform_access_enabled,
            ],
            'items' => $items->all(), 'subtotal_minor' => $subtotal, 'original_total_minor' => $original,
            'edits' => $edited->map(fn ($i) => ['item' => $i->product->name, 'field' => 'الكمية', 'old' => $i->original_quantity, 'new' => $i->quantity])->all(),
            'log' => $log->map(fn (AuditLog $l) => [
                'id' => $l->id, 'at' => $l->created_at->toIso8601String(), 'action' => self::ACTIONS[$l->action] ?? $l->action,
                'actor' => $l->actor_id ? User::find($l->actor_id)?->name : 'العميل',
            ])->all(),
            'can' => [
                'review' => (bool) $request->user()->hasPermission('order_requests.review'), 'accept' => (bool) $request->user()->hasPermission('order_requests.accept'),
                'reject' => (bool) $request->user()->hasPermission('order_requests.reject'),
            ],
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::orderRequest($orderRequest->status->value));
            $props['req'] = array_replace($props['req'], [
                'number' => 'REQ-0186', 'submitted_at' => '2026-10-14T10:20:00+03:00', 'review_started_at' => $props['req']['review_started_at'] ? '2026-10-14T11:00:00+03:00' : null,
                'decided_at' => $props['req']['decided_at'] ? '2026-10-14T11:18:00+03:00' : null,
            ]);
            if ($props['req']['order']) {
                $props['req']['order']['number'] = 'ORD-0153';
            }
        }

        return Inertia::render('order-requests/show', $props);
    }

    public function start(Request $request, OrderRequest $orderRequest, ReviewOrderRequest $action): RedirectResponse
    {
        $action->start($request->user(), $orderRequest);

        return back()->with('success', 'بدأت مراجعة الطلب وأصبح محجوزًا لك.');
    }

    public function save(Request $request, OrderRequest $orderRequest, ReviewOrderRequest $action): RedirectResponse
    {
        $data = $request->validate(['items' => ['required', 'array', 'min:1'], 'items.*.id' => ['required', 'integer'], 'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'], 'items.*.options' => ['nullable', 'array']]);
        $action->saveEdits($request->user(), $orderRequest, $data['items']);

        return back()->with('success', 'تم حفظ تعديلات الطلب.');
    }

    public function accept(Request $request, OrderRequest $orderRequest, ReviewOrderRequest $action): RedirectResponse
    {
        $r = $action->accept($request->user(), $orderRequest);

        return redirect()->route('orders.show', $r->order_id)->with('success', 'تم قبول الطلب وإنشاء الأوردر.');
    }

    public function reject(Request $request, OrderRequest $orderRequest, ReviewOrderRequest $action): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']], ['reason.required' => 'يجب كتابة سبب الرفض.']);
        $action->reject($request->user(), $orderRequest, $data['reason']);

        return redirect()->route('order-requests.show', $orderRequest)->with('success', 'تم رفض الطلب.');
    }

    /** @return array{unit: int, total: int, specs: string} */
    private function quote(OrderRequest $r, OrderRequestItem $i, ?int $qty = null): array
    {
        try {
            $q = app(PricingService::class)->quoteItem($i->product, $i->options, $qty ?? $i->quantity, $r->customer->pricingTier);
        } catch (BusinessException) {
            // طلب بمواصفات ناقصة: يُعرض بالسعر الأساسي حتى يكملها المراجع ولا تنهار الصفحة
            $unit = $i->product->base_unit_price->minor;

            return ['unit' => $unit, 'total' => $unit * ($qty ?? $i->quantity), 'specs' => ''];
        }

        return ['unit' => $q->finalUnit->minor, 'total' => $q->itemTotal->minor, 'specs' => collect($q->optionsSnapshot)->pluck('value')->implode(' • ')];
    }

    /** @param list<OrderRequestItem> $items */
    private function total(OrderRequest $r, array $items): int
    {
        $sum = 0;
        foreach ($items as $i) {
            $sum += $this->quote($r, $i)['total'];
        }

        return $sum;
    }
}
