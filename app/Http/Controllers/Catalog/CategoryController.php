<?php

namespace App\Http\Controllers\Catalog;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\Audit\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** تصنيفات المنتجات: عرض/إضافة/إعادة تسمية/تفعيل. لا حذف (التصنيف مرتبط بمنتجات وتاريخ). */
class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('products.view');

        return Inertia::render('products/categories', [
            'categories' => ProductCategory::orderBy('sort_order')->orderBy('name')->get()->map(fn (ProductCategory $c) => ['id' => $c->id, 'name' => $c->name, 'active' => $c->is_active, 'sort' => $c->sort_order, 'products' => Product::where('category_id', $c->id)->count()]),
            'can' => ['manage' => (bool) $request->user()->hasPermission('products.manage')],
        ]);
    }

    public function save(Request $request, AuditService $audit, ?ProductCategory $category = null): RedirectResponse
    {
        Gate::authorize('products.manage');
        $d = $request->validate(['name' => ['required', 'string', 'max:100', Rule::unique('product_categories', 'name')->ignore($category?->id)], 'sort' => ['nullable', 'integer', 'min:0', 'max:9999']], ['name.unique' => 'اسم التصنيف مستخدم بالفعل.', 'name.required' => 'اسم التصنيف مطلوب.']);
        $new = ['name' => trim($d['name']), 'sort_order' => (int) ($d['sort'] ?? $category->sort_order ?? 0)];
        if ($category) {
            $old = $category->only(['name', 'sort_order']);
            $category->update($new);
            $audit->record('category.updated', $category, $old, $new);
        } else {
            $category = ProductCategory::create($new);
            $audit->record('category.created', $category, [], $new);
        }

        return back()->with('success', 'تم حفظ التصنيف.');
    }

    public function toggle(Request $request, ProductCategory $category, AuditService $audit): RedirectResponse
    {
        Gate::authorize('products.manage');
        if ($category->is_active && Product::where('category_id', $category->id)->where('is_active', true)->exists()) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'لا يمكن إيقاف تصنيف يحتوي منتجات نشطة. أوقف منتجاته أولًا.');
        }
        $category->update(['is_active' => ! $category->is_active]);
        $audit->record('category.toggled', $category, [], ['is_active' => $category->is_active]);

        return back()->with('success', $category->is_active ? 'تم تفعيل التصنيف.' : 'تم إيقاف التصنيف.');
    }
}
