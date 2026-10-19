<?php

namespace App\Http\Controllers\Customers;

use App\Actions\Customers\SaveCustomer;
use App\Enums\NotificationMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customers\CustomerRequest;
use App\Models\Customer;
use App\Models\PricingTier;
use App\Services\Finance\PaymentService;
use App\Support\PenFixtures;
use App\Support\PhoneNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Customer::class);
        $u = $request->user();
        $showBalance = $u->hasPermission('customers.view_balance');

        $q = Customer::query()->with('pricingTier:id,name')->withCount('orders')->search($request->query('q'))->latest('created_at')->latest('id');
        if ($tier = $request->query('tier')) {
            $q->where('pricing_tier_id', $tier);
        }
        if (in_array($request->query('access'), ['enabled', 'disabled'], true)) {
            $q->where('platform_access_enabled', $request->query('access') === 'enabled');
        }
        if ($showBalance && in_array($request->query('balance'), ['due', 'clear'], true)) {
            $q->whereRaw("((select coalesce(sum(o.grand_total),0) from orders o where o.customer_id = customers.id and o.status <> 'CANCELLED') - (select coalesce(sum(a.amount),0) from payment_allocations a join payments p on p.id = a.payment_id join orders o2 on o2.id = a.order_id where p.status = 'CONFIRMED' and o2.customer_id = customers.id and o2.status <> 'CANCELLED')) ".($request->query('balance') === 'due' ? '> 0' : '<= 0'));
        }
        if ($days = (int) $request->query('added')) {
            $q->where('created_at', '>=', now()->subDays($days));
        }

        $rows = $q->paginate(15)->withQueryString()->through(fn (Customer $c) => [
            'id' => $c->id, 'code' => $c->code(), 'name' => $c->name, 'phone' => $c->phone_display,
            'tier' => $c->pricingTier->name, 'platform_access' => $c->platform_access_enabled,
            'orders_count' => $c->orders_count,
            // الرصيد لا يُرسل أصلًا لمن لا يملك الصلاحية (تقليل سطح التسريب)
            ...($showBalance ? ['balance_minor' => $this->payments->customerDue($c)] : []),
            'created_at' => $c->created_at?->toIso8601String(),
        ]);

        $payload = [
            'customers' => $rows,
            'filters' => $request->only(['q', 'tier', 'access', 'added']),
            'tiers' => PricingTier::where('is_active', true)->get(['id', 'name']),
            'can' => ['create' => $u->hasPermission('customers.create'), 'balance' => $showBalance],
            'total' => Customer::count(),
            'now' => now()->toIso8601String(),
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $payload = array_replace($payload, PenFixtures::customers());
        }

        return Inertia::render('customers/index', $payload);
    }

    public function create(): Response
    {
        Gate::authorize('create', Customer::class);

        return Inertia::render('customers/form', ['customer' => null] + $this->formOptions());
    }

    public function store(CustomerRequest $request, SaveCustomer $action): RedirectResponse
    {
        $customer = $action->handle($request->user(), $request->validated());

        return redirect()->route('customers.show', $customer)->with('success', 'تم حفظ العميل بنجاح.');
    }

    public function show(Request $request, Customer $customer): Response
    {
        Gate::authorize('view', $customer);
        $customer->load('pricingTier:id,name', 'creator:id,name', 'credential');

        return Inertia::render('customers/show', [
            'customer' => $this->profile($customer, $request) + [
                'address' => $customer->address,
                'notes' => $customer->notes,
                'notification_label' => $customer->notification_mode->label(),
                'created_by' => $customer->creator?->name,
                'created_at' => $customer->created_at?->toIso8601String(),
            ],
            // ملخص النشاط يُربط بالأوردرات (مرحلة 4)
            'summary' => ['orders_total' => 0, 'orders_active' => 0, 'last_order_at' => null],
            'access' => ['last_login_at' => $customer->credential?->last_login_at?->toIso8601String()],
        ]);
    }

    public function edit(Customer $customer): Response
    {
        Gate::authorize('update', $customer);

        return Inertia::render('customers/form', [
            'customer' => ['id' => $customer->id, 'name' => $customer->name, 'phone' => $customer->phone_display, 'address' => $customer->address,
                'pricing_tier_id' => $customer->pricing_tier_id, 'notification_mode' => $customer->notification_mode->value, 'notes' => $customer->notes],
        ] + $this->formOptions());
    }

    public function update(CustomerRequest $request, Customer $customer, SaveCustomer $action): RedirectResponse
    {
        $action->handle($request->user(), $request->validated(), $customer);

        return redirect()->route('customers.show', $customer)->with('success', 'تم حفظ تعديلات '.$customer->fresh()->name.'.');
    }

    /** فحص تكرار الهاتف لحظيًا (S-023): يعرض السجل الحالي دون دمج آلي. */
    public function checkPhone(Request $request): JsonResponse
    {
        Gate::authorize('create', Customer::class);
        $n = PhoneNormalizer::normalize((string) $request->query('phone'));
        $dup = $n ? Customer::where('phone_normalized', $n)->when($request->query('ignore'), fn ($q, $id) => $q->where('id', '!=', $id))->first() : null;

        return response()->json(['valid' => $n !== null, 'duplicate' => $dup ? ['id' => $dup->id, 'name' => $dup->name] : null]);
    }

    /** @return array<string, mixed> */
    public function profile(Customer $c, Request $request): array
    {
        $u = $request->user();

        return [
            'id' => $c->id, 'code' => $c->code(), 'name' => $c->name, 'phone' => $c->phone_display, 'tier' => $c->pricingTier->name,
            'platform_access' => $c->platform_access_enabled, 'created_at' => $c->created_at?->toIso8601String(),
            'can' => [
                'update' => $u->hasPermission('customers.update'),
                'access' => $u->hasPermission('customers.platform_access.manage') || $u->hasPermission('customers.password_reset.handle'),
                'financial' => $u->hasPermission('customers.view_ledger') || $u->hasPermission('customers.view_balance'),
                'payments' => $u->hasPermission('payments.view_all') || $u->hasPermission('payments.create'),
                'refunds' => $u->hasPermission('refunds.view'),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function formOptions(): array
    {
        return [
            'tiers' => PricingTier::where('is_active', true)->get(['id', 'name']),
            'notificationModes' => collect(NotificationMode::cases())->map(fn ($m) => ['value' => $m->value, 'label' => $m->label()])->values(),
            'defaultTierId' => PricingTier::default()->id,
        ];
    }
}
