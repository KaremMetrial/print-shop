<?php

namespace App\Http\Controllers\Catalog;

use App\Actions\Catalog\SaveTier;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\PricingTier;
use App\Models\Product;
use App\Models\TierProductPrice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** S-036/S-037 — شرائح الأسعار */
class TierController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);
        $q = PricingTier::query()->orderByDesc('is_default')->orderBy('name');
        if ($s = trim((string) $request->query('q'))) {
            $q->where('name', 'like', "%{$s}%");
        }
        if (in_array($request->query('status'), ['active', 'inactive'], true)) {
            $q->where('is_active', $request->query('status') === 'active');
        }
        if (in_array($request->query('mode'), ['PERCENTAGE', 'FIXED_BASE'], true)) {
            $q->where('mode', $request->query('mode'));
        }
        $rows = $q->paginate(15)->withQueryString()->through(fn (PricingTier $t) => [
            'id' => $t->id, 'name' => $t->name, 'mode' => $t->mode, 'percent' => $t->discount_percentage, 'active' => $t->is_active, 'default' => $t->is_default,
            'customers' => Customer::where('pricing_tier_id', $t->id)->count(),
            'products' => $t->mode === 'FIXED_BASE' ? TierProductPrice::where('tier_id', $t->id)->count() : Product::where('is_active', true)->count(),
        ]);

        return Inertia::render('tiers/index', ['tiers' => $rows, 'filters' => $request->only(['q', 'status', 'mode']), 'activeCount' => PricingTier::where('is_active', true)->count(), 'can' => ['manage' => Gate::forUser($request->user())->allows('manageTiers', Product::class)]]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('manageTiers', Product::class);

        return $this->form(null, $request->query('mode') === 'FIXED_BASE' ? 'FIXED_BASE' : 'PERCENTAGE');
    }

    public function edit(PricingTier $tier): Response
    {
        Gate::authorize('viewAny', Product::class);

        return $this->form($tier, $tier->mode);
    }

    public function save(Request $request, SaveTier $action, ?PricingTier $tier = null): RedirectResponse
    {
        Gate::authorize('manageTiers', Product::class);
        $v = $request->validate([
            'name' => ['required', 'string', 'max:80', Rule::unique('pricing_tiers', 'name')->ignore($tier?->id)],
            'mode' => ['required', Rule::in(['PERCENTAGE', 'FIXED_BASE'])],
            'discount_percentage' => ['required_if:mode,PERCENTAGE', 'nullable', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['required', 'boolean'],
            'prices' => ['array'],
            'prices.*.product_id' => ['required', 'exists:products,id'],
            'prices.*.base_unit_price_override' => ['required', 'integer', 'min:0', 'max:100000000'],
        ], ['name.required' => 'اسم الشريحة مطلوب.', 'name.unique' => 'اسم الشريحة مستخدم بالفعل.', 'discount_percentage.max' => 'النسبة بين 0 و100.'], ['name' => 'اسم الشريحة', 'discount_percentage' => 'نسبة الخصم']);
        $t = $action->handle($request->user(), $v, $tier);

        return redirect()->route('tiers.edit', $t)->with('success', 'تم حفظ شريحة السعر. تُطبَّق على الأوردرات الجديدة فقط.');
    }

    private function form(?PricingTier $tier, string $mode): Response
    {
        $prices = $tier ? TierProductPrice::where('tier_id', $tier->id)->pluck('base_unit_price_override', 'product_id') : collect();

        return Inertia::render('tiers/form', [
            'tier' => $tier ? ['id' => $tier->id, 'name' => $tier->name, 'mode' => $tier->mode, 'discount_percentage' => $tier->discount_percentage, 'is_active' => $tier->is_active, 'is_default' => $tier->is_default] : null,
            'mode' => $mode,
            'products' => Product::where('is_active', true)->orderBy('name')->get(['id', 'name', 'base_unit_price'])->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'default_minor' => $p->base_unit_price->minor, 'custom_minor' => $prices[$p->id] ?? null]),
            'can' => ['manage' => Gate::forUser(request()->user())->allows('manageTiers', Product::class)],
        ]);
    }
}
