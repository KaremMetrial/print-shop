<?php

namespace App\Http\Controllers\Catalog;

use App\Actions\Catalog\SaveProduct;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DesignerSpecialty;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);
        $q = Product::query()->with(['category:id,name', 'requiredSpecialty:id,name'])->orderBy('name');
        if ($s = trim((string) $request->query('q'))) {
            $q->where('name', 'like', "%{$s}%");
        }
        if ($c = $request->query('category')) {
            $q->where('category_id', $c);
        }
        if ($sp = $request->query('specialty')) {
            $q->where('required_specialty_id', $sp);
        }
        if (in_array($request->query('status'), ['active', 'inactive'], true)) {
            $q->where('is_active', $request->query('status') === 'active');
        }
        $rows = $q->paginate(15)->withQueryString()->through(fn (Product $p) => [
            'id' => $p->id, 'name' => $p->name, 'category' => $p->category->name, 'price_minor' => $p->base_unit_price->minor,
            'min_qty' => $p->minimum_quantity, 'active' => $p->is_active, 'specialty' => $p->requiredSpecialty?->name,
            'updated_at' => $p->updated_at?->toIso8601String(),
        ]);

        return Inertia::render('products/index', [
            'products' => $rows, 'filters' => $request->only(['q', 'category', 'specialty', 'status']),
            'categories' => ProductCategory::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'specialties' => DesignerSpecialty::where('is_active', true)->get(['id', 'name']),
            'counts' => ['total' => Product::count(), 'active' => Product::where('is_active', true)->count()],
            'can' => ['manage' => $request->user()->hasPermission('products.manage')],
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('manage', Product::class);

        return Inertia::render('products/basic', ['product' => null, 'categories' => $this->categories()]);
    }

    public function store(Request $request, SaveProduct $action): RedirectResponse
    {
        Gate::authorize('manage', Product::class);
        $p = $action->handle($request->user(), $this->basics($request));

        return redirect()->route('products.pricing', $p)->with('success', 'تم إنشاء المنتج. أكمل التسعير والمواصفات.');
    }

    public function edit(Request $request, Product $product): Response
    {
        Gate::authorize('view', $product);

        return Inertia::render('products/basic', ['product' => $this->head($product) + ['description' => $product->description, 'category_id' => $product->category_id], 'categories' => $this->categories(), 'can' => ['manage' => $request->user()->hasPermission('products.manage')]]);
    }

    public function update(Request $request, Product $product, SaveProduct $action): RedirectResponse
    {
        Gate::authorize('manage', Product::class);
        $action->handle($request->user(), $this->basics($request), $product);

        return redirect()->route('products.edit', $product)->with('success', 'تم حفظ التغييرات.');
    }

    public function pricing(Request $request, Product $product): Response
    {
        Gate::authorize('view', $product);
        $product->load('optionGroups.values');
        $additions = $product->optionGroups->where('is_active', true)->sum(fn ($g) => $g->values->where('is_active', true)->max(fn ($v) => $v->unit_price_addition->minor) ?? 0);

        return Inertia::render('products/pricing', ['product' => $this->head($product), 'price_minor' => $product->base_unit_price->minor, 'min_qty' => $product->minimum_quantity, 'example_addition_minor' => (int) $additions, 'can' => ['manage' => $request->user()->hasPermission('products.manage')]]);
    }

    public function updatePricing(Request $request, Product $product, SaveProduct $action): RedirectResponse
    {
        Gate::authorize('manage', Product::class);
        $v = $request->validate(['base_unit_price' => ['required', 'integer', 'min:0', 'max:100000000'], 'minimum_quantity' => ['nullable', 'integer', 'min:1']], [], ['base_unit_price' => 'السعر الأساسي', 'minimum_quantity' => 'الحد الأدنى للكمية']);
        $action->handle($request->user(), $v, $product);

        return back()->with('success', 'تم حفظ التسعير. لا يؤثر على الأوردرات القديمة.');
    }

    public function routing(Request $request, Product $product): Response
    {
        Gate::authorize('view', $product);

        return Inertia::render('products/routing', ['product' => $this->head($product), 'specialty_id' => $product->required_specialty_id, 'specialties' => DesignerSpecialty::where('is_active', true)->get(['id', 'name']), 'can' => ['manage' => $request->user()->hasPermission('products.manage')]]);
    }

    public function updateRouting(Request $request, Product $product, SaveProduct $action): RedirectResponse
    {
        Gate::authorize('manage', Product::class);
        $v = $request->validate(['required_specialty_id' => ['nullable', 'exists:designer_specialties,id']]);
        $action->handle($request->user(), $v, $product);

        return back()->with('success', 'تم حفظ توزيع التصميم.');
    }

    public function specs(Request $request, Product $product): Response
    {
        Gate::authorize('view', $product);
        $groups = $product->optionGroups()->with('values')->get()->map(fn ($g) => [
            'id' => $g->id, 'name' => $g->name, 'selection_type' => $g->selection_type, 'required' => $g->is_required, 'active' => $g->is_active,
            'values' => $g->values->where('is_active', true)->pluck('name')->values(),
        ]);

        return Inertia::render('products/specs', ['product' => $this->head($product), 'groups' => $groups, 'can' => ['manage' => $request->user()->hasPermission('pricing.options.manage') || $request->user()->hasPermission('products.manage')]]);
    }

    public function activity(Request $request, Product $product): Response
    {
        Gate::authorize('view', $product);
        $names = User::pluck('name', 'id');
        $rows = AuditLog::where('entity_type', $product->getMorphClass())->where('entity_id', $product->id)->latest('id')->paginate(10)->through(fn (AuditLog $l) => [
            'id' => $l->id, 'action' => $l->action, 'at' => $l->created_at->toIso8601String(), 'actor' => $l->actor_id ? ($names[$l->actor_id] ?? '—') : 'النظام',
            'old' => $l->old_values, 'new' => $l->new_values,
        ]);

        return Inertia::render('products/activity', ['product' => $this->head($product), 'activity' => $rows]);
    }

    public function toggle(Request $request, Product $product, SaveProduct $action): RedirectResponse
    {
        Gate::authorize('manage', Product::class);
        $action->handle($request->user(), ['is_active' => ! $product->is_active], $product);

        return back()->with('success', $product->refresh()->is_active ? 'تم تفعيل المنتج.' : 'تم تعطيل المنتج (لا يظهر في الأوردرات الجديدة).');
    }

    /** @return array<string, mixed> */
    private function basics(Request $request): array
    {
        $v = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category_id' => ['required', 'exists:product_categories,id'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
        ], ['name.required' => 'اسم المنتج مطلوب.', 'category_id.required' => 'التصنيف مطلوب.'], ['name' => 'اسم المنتج', 'category_id' => 'التصنيف']);

        return $v;
    }

    /** @return list<array{value:string,label:string}> */
    private function categories(): array
    {
        return ProductCategory::where('is_active', true)->orderBy('sort_order')->get(['id', 'name'])->map(fn ($c) => ['value' => (string) $c->id, 'label' => $c->name])->all();
    }

    /** @return array<string, mixed> */
    public function head(Product $p): array
    {
        $p->loadMissing('category:id,name');

        return ['id' => $p->id, 'name' => $p->name, 'category' => $p->category->name, 'active' => $p->is_active, 'price_minor' => $p->base_unit_price->minor];
    }
}
