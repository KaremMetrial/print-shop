<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\PricingTier;
use App\Models\Product;
use App\Services\Pricing\PricingService;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** POST /pricing/quote — عرض سعر فقط (ليس أوردرًا). السيرفر هو المرجع النهائي للأرقام (§30.7). */
class PricingQuoteController extends Controller
{
    public function __invoke(Request $request, PricingService $pricing): JsonResponse
    {
        abort_unless($request->user()->hasPermission('products.view'), 403);
        $v = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.options' => ['array'],
            'discount_type' => ['nullable', 'in:NONE,FIXED,PERCENT'],
            'discount_value' => ['nullable'],
            'delivery_fee' => ['nullable', 'integer', 'min:0'],
        ]);
        $tier = isset($v['customer_id']) ? PricingTier::find(Customer::find($v['customer_id'])->pricing_tier_id) : PricingTier::default();

        // الخصم لا يُحتسب لمن لا يملك صلاحيته (§3.8/§4.6)
        $type = $v['discount_type'] ?? 'NONE';
        if ($type !== 'NONE') {
            Gate::forUser($request->user())->authorize('orders.discount.apply');
        }
        $items = [];
        foreach ($v['items'] as $it) {
            $items[] = $pricing->quoteItem(Product::findOrFail($it['product_id']), $it['options'] ?? [], (int) $it['quantity'], $tier);
        }
        $order = $pricing->quoteOrder($items, $type, $v['discount_value'] ?? 0, Money::minor((int) ($v['delivery_fee'] ?? 0)));

        return response()->json(['success' => true, 'data' => $order->toArray()]);
    }
}
