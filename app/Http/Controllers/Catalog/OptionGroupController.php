<?php

namespace App\Http\Controllers\Catalog;

use App\Actions\Catalog\SaveOptionGroup;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductOptionGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** S-035 — إدارة خيارات المنتج */
class OptionGroupController extends Controller
{
    public function edit(Request $request, Product $product, ?ProductOptionGroup $group = null): Response
    {
        Gate::authorize('view', $product);
        abort_if($group && $group->product_id !== $product->id, 404);
        $group?->load('values');

        return Inertia::render('products/options', [
            'product' => ['id' => $product->id, 'name' => $product->name],
            'group' => $group ? [
                'id' => $group->id, 'name' => $group->name, 'code' => $group->code, 'selection_type' => $group->selection_type, 'is_required' => $group->is_required, 'sort_order' => $group->sort_order, 'is_active' => $group->is_active,
                'values' => $group->values->map(fn ($v) => ['id' => $v->id, 'name' => $v->name, 'unit_price_addition' => $v->unit_price_addition->minor, 'sort_order' => $v->sort_order, 'is_active' => $v->is_active])->values(),
            ] : null,
            'can' => ['manage' => Gate::forUser($request->user())->allows('manageOptions', Product::class)],
        ]);
    }

    public function save(Request $request, Product $product, SaveOptionGroup $action, ?ProductOptionGroup $group = null): RedirectResponse
    {
        Gate::authorize('manageOptions', Product::class);
        abort_if($group && $group->product_id !== $product->id, 404);
        $v = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:40', 'regex:/^[A-Za-z0-9_]+$/', Rule::unique('product_option_groups', 'code')->where('product_id', $product->id)->ignore($group?->id)],
            'selection_type' => ['required', Rule::in(['SINGLE', 'MULTIPLE'])],
            'is_required' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'values' => ['required', 'array', 'min:1'],
            'values.*.id' => ['nullable', 'integer'],
            'values.*.name' => ['required', 'string', 'max:100'],
            'values.*.unit_price_addition' => ['required', 'integer', 'min:0', 'max:100000000'],
            'values.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'values.*.is_active' => ['sometimes', 'boolean'],
        ], ['values.required' => 'أضف قيمة واحدة على الأقل.', 'values.*.name.required' => 'اسم الخيار مطلوب.', 'code.regex' => 'الكود بحروف إنجليزية وأرقام فقط.'], ['name' => 'اسم المجموعة', 'code' => 'كود المجموعة']);
        $g = $action->handle($request->user(), $product, $v, $group);

        return redirect()->route('products.options.edit', [$product, $g])->with('success', 'تم حفظ مجموعة الخيارات.');
    }
}
