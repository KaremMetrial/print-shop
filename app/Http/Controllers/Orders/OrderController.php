<?php

namespace App\Http\Controllers\Orders;

use App\Actions\Orders\AdvanceOrder;
use App\Actions\Orders\CancelOrder;
use App\Actions\Orders\CreateOrder;
use App\Actions\Orders\ManageOrderItems;
use App\Actions\Orders\UpdateOrder;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\OrderRequest;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\Orders\OrderPresenter;
use App\Services\Orders\OrderStatusLabels;
use App\Support\PenFixtures;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public const CANCEL_REASONS = ['طلب العميل', 'خطأ في إدخال الأوردر', 'تعذر التنفيذ', 'تكرار الأوردر', 'أخرى'];

    public function create(Request $request): Response
    {
        Gate::authorize('orders.create');
        $customer = $request->query('customer') ? Customer::with('pricingTier')->find($request->query('customer')) : null;
        $products = $this->catalog();

        $fixture = null;
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $fixture = $this->penFixture($products->all(), (int) $request->query('step', 0));
            $customer = Customer::with('pricingTier')->find(104);
        }

        return Inertia::render('orders/create', [
            'fixture' => $fixture,
            'customer' => $customer ? $this->customerCard($customer) : null,
            'products' => $products,
            'can' => ['discount' => (bool) $request->user()->hasPermission('orders.discount.apply')],
        ]);
    }

    /**
     * حالة معالج الإنشاء كما في عينة الـpen (local فقط): 3 بنود، خصم 10%، توصيل 100 ج.م، يومان.
     *
     * @param  list<array<string, mixed>>  $products
     * @return array<string, mixed>
     */
    private function penFixture(array $products, int $step): array
    {
        $by = collect($products)->keyBy('name');
        $pick = function (string $name, int $qty, array $names) use ($by): array {
            $p = $by[$name];
            $opts = [];
            foreach ($p['groups'] as $g) {
                foreach ($g['values'] as $v) {
                    if (in_array($v['name'], $names, true)) {
                        $opts[$g['id']][] = $v['id'];
                    }
                }
            }

            return ['product_id' => $p['id'], 'quantity' => (string) $qty, 'options' => $opts, 'notes' => ''];
        };

        return [
            'step' => $step,
            'items' => [
                $pick('كروت شخصية', 1000, ['9 × 5 سم', 'كوشيه 300 جم', 'ألوان كاملة', 'وجهان', 'مطفي']),
                $pick('فلاير', 500, ['A4', 'كوشيه 300 جم', 'وجه واحد']),
                $pick('بروشور', 100, ['A4', 'كوشيه 300 جم', 'وجهان', 'بدون تغليف']),
            ],
            'discount_type' => 'PERCENT', 'discount_value' => '10', 'method' => 'DELIVERY',
            'address' => '12 شارع الطيران، مدينة نصر، القاهرة', 'fee' => '100', 'eta' => '2',
        ];
    }

    public function customerSearch(Request $request): JsonResponse
    {
        Gate::authorize('orders.create');
        $q = trim((string) $request->query('q', ''));
        $digits = preg_replace('/\D+/', '', $q);
        $rows = Customer::with('pricingTier')
            ->when($q !== '', fn ($b) => $b->where(fn ($w) => $w->where('name', 'like', "%{$q}%")->when($digits !== '', fn ($x) => $x->orWhere('phone_normalized', 'like', "%{$digits}%"))))
            ->orderBy('name')->limit(8)->get();

        return response()->json(['data' => $rows->map(fn (Customer $c) => $this->customerCard($c))->values()]);
    }

    /** @return array<string, mixed> */
    private function customerCard(Customer $c): array
    {
        $t = $c->pricingTier;

        return [
            'id' => $c->id, 'code' => $c->code(), 'name' => $c->name, 'phone' => $c->phone_normalized, 'address' => $c->address,
            'tier' => $t->name, 'tier_discount' => $t->mode === 'PERCENTAGE' ? rtrim(rtrim((string) $t->discount_percentage, '0'), '.') : null,
            'platform_access' => $c->platform_access_enabled,
        ];
    }

    public function edit(Request $request, Order $order, OrderPresenter $presenter): Response
    {
        Gate::authorize('orders.update');
        $props = $presenter->detail($order, $request->user());
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::orderDetail());
        }

        return Inertia::render('orders/edit', $props + ['reasons' => self::CANCEL_REASONS]);
    }

    public function update(Request $request, Order $order, UpdateOrder $action): RedirectResponse
    {
        Gate::authorize('orders.update');
        $data = $request->validate([
            'delivery_method' => ['required', Rule::in(['PICKUP', 'DELIVERY'])],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'delivery_fee' => ['nullable', 'integer', 'min:0'],
            'printing_eta_days' => ['nullable', 'integer', 'min:1', 'max:60'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'discount_type' => ['nullable', Rule::in(['NONE', 'FIXED', 'PERCENT'])],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
        ]);
        $action->handle($request->user(), $order, $data);

        return redirect()->route('orders.show', $order)->with('success', 'تم حفظ تغييرات الأوردر.');
    }

    /** S-038 حوار الخصم: يطبّق/يغيّر/يزيل الخصم فقط (صلاحية orders.discount.apply؛ لا تغيير بعد دفعة بدون صلاحية التسعير). */
    public function discount(Request $request, Order $order, UpdateOrder $action): RedirectResponse
    {
        $d = $request->validate(['discount_type' => ['required', Rule::in(['NONE', 'FIXED', 'PERCENT'])], 'discount_value' => ['nullable', 'numeric', 'min:0']], ['discount_value.min' => 'قيمة الخصم لا تقل عن صفر.']);
        if ($d['discount_type'] === 'PERCENT' && (float) ($d['discount_value'] ?? 0) > 100) {
            throw ValidationException::withMessages(['discount_value' => 'نسبة الخصم لا تتجاوز 100%.']);
        }
        $action->handle($request->user(), $order, ['discount_type' => $d['discount_type'], 'discount_value' => $d['discount_type'] === 'NONE' ? 0 : ($d['discount_value'] ?? 0)]);

        return back()->with('success', 'تم تحديث الخصم وإعادة حساب الإجمالي.');
    }

    public function advance(Request $request, Order $order, string $step, AdvanceOrder $action): RedirectResponse
    {
        match ($step) {
            'complete-printing' => $action->completePrinting($request->user(), $order),
            'out-for-delivery' => $action->outForDelivery($request->user(), $order),
            'complete' => $action->complete($request->user(), $order),
            default => abort(404),
        };

        return back()->with('success', 'تم تحديث حالة الأوردر.');
    }

    public function cancel(Request $request, Order $order, CancelOrder $action): RedirectResponse
    {
        Gate::authorize('orders.cancel');
        $data = $request->validate(['reason' => ['required', 'string', 'max:255'], 'notes' => ['nullable', 'string', 'max:1000']], ['reason.required' => 'يجب كتابة سبب الإلغاء.']);
        $action->handle($request->user(), $order, $data['reason'], $data['notes'] ?? null);

        return redirect()->route('orders.show', $order)->with('success', 'تم إلغاء الأوردر.');
    }

    public function addItem(Request $request, Order $order, ManageOrderItems $action): RedirectResponse
    {
        $d = $request->validate(['product_id' => ['required', 'integer', 'exists:products,id'], 'quantity' => ['required', 'integer', 'min:1', 'max:1000000'], 'options' => ['nullable', 'array'], 'notes' => ['nullable', 'string', 'max:1000']]);
        $action->add($request->user(), $order, $d);

        return back()->with('success', 'تمت إضافة البند وإسناده لمصمم.');
    }

    public function updateItem(Request $request, Order $order, OrderItem $item, ManageOrderItems $action): RedirectResponse
    {
        $d = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:1000000'], 'notes' => ['nullable', 'string', 'max:1000']]);
        $action->update($request->user(), $order, $item, (int) $d['quantity'], $d['notes'] ?? null);

        return back()->with('success', 'تم تعديل البند وإعادة حساب السعر.');
    }

    public function cancelItem(Request $request, Order $order, OrderItem $item, ManageOrderItems $action): RedirectResponse
    {
        $d = $request->validate(['reason' => ['required', 'string', 'max:255']], ['reason.required' => 'يجب كتابة سبب إلغاء البند.']);
        $action->cancel($request->user(), $order, $item, $d['reason']);

        return back()->with('success', 'تم إلغاء البند.');
    }

    public function store(OrderRequest $request, CreateOrder $action): RedirectResponse
    {
        Gate::authorize('orders.create');
        $order = $action->handle($request->user(), $request->validated());

        return redirect()->route('orders.show', $order)->with('success', 'تم إنشاء الأوردر بنجاح.');
    }

    public function index(Request $request): Response
    {
        Gate::authorize('orders.view');
        $q = Order::query()->with('customer:id,name,phone_display')->withCount('activeItems')
            ->when($request->query('q'), fn ($b, $term) => $b->where(fn ($w) => $w->where('order_number', 'like', "%{$term}%")->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$term}%"))))
            ->when(OrderStatus::tryFrom((string) $request->query('status')), fn ($b, $st) => $b->where('status', $st))
            ->when(in_array($request->query('delivery'), ['PICKUP', 'DELIVERY'], true), fn ($b) => $b->where('delivery_method', $request->query('delivery')))
            ->latest('created_at')->latest('id');

        $rows = $q->paginate(15)->withQueryString()->through(fn (Order $o) => [
            'id' => $o->id, 'number' => $o->order_number, 'customer' => $o->customer->name, 'phone' => $o->customer->phone_display,
            'status' => $o->status->value, 'status_label' => app(OrderStatusLabels::class)->label($o->status), 'delivery_method' => $o->delivery_method,
            'items_count' => $o->active_items_count, 'grand_total_minor' => $o->grand_total->minor, 'created_at' => $o->created_at?->toIso8601String(),
        ]);

        return Inertia::render('orders/index', [
            'orders' => $rows, 'filters' => $request->only(['q', 'status', 'delivery']),
            'statuses' => collect(OrderStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => app(OrderStatusLabels::class)->label($s)])->all(),
            'can' => ['create' => (bool) $request->user()->hasPermission('orders.create')],
            'total' => Order::count(),
        ]);
    }

    public function show(Request $request, Order $order, OrderPresenter $presenter): Response
    {
        Gate::authorize('orders.view');
        $tab = in_array($request->query('tab'), ['items', 'payments', 'delivery', 'files', 'activity'], true) ? $request->query('tab') : 'overview';
        $props = $presenter->detail($order, $request->user());
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::orderDetail());
        }

        $catalog = ($props['can']['items'] ?? false) && $order->status === OrderStatus::DESIGN_STAGE ? $this->catalog() : [];

        return Inertia::render('orders/show', ['tab' => $tab, 'reasons' => self::CANCEL_REASONS, 'catalog' => $catalog] + $props);
    }

    /** @return Collection<int, mixed> */
    private function catalog(): Collection
    {
        return Product::where('is_active', true)->with(['optionGroups' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->with(['values' => fn ($v) => $v->where('is_active', true)->orderBy('sort_order')])])
            ->orderBy('name')->get()->map(fn (Product $p) => [
                'id' => $p->id, 'name' => $p->name, 'minimum_quantity' => $p->minimum_quantity,
                'groups' => $p->optionGroups->map(fn ($g) => [
                    'id' => $g->id, 'name' => $g->name, 'selection_type' => $g->selection_type, 'is_required' => $g->is_required,
                    'values' => $g->values->map(fn ($v) => ['id' => $v->id, 'name' => $v->name, 'addition_minor' => $v->unit_price_addition->minor])->all(),
                ])->all(),
            ]);
    }
}
