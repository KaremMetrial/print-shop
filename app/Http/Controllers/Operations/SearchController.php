<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** البحث العام (S-062): كل مجموعة تُعرض فقط لمن يملك صلاحية عرضها. LIKE مفهرس الآن؛ FULLTEXT لاحقًا مع حجم البيانات. */
class SearchController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $q = trim((string) $request->query('q'));
        $u = $request->user();
        $res = ['orders' => [], 'customers' => [], 'items' => [], 'products' => []];
        if (mb_strlen($q) >= 2) {
            if ($u->hasPermission('orders.view')) {
                $res['orders'] = Order::with('customer:id,name')->where(fn ($w) => $w->where('order_number', 'like', "%{$q}%")->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$q}%")))->latest('id')->limit(10)->get()
                    ->map(fn (Order $o) => ['id' => $o->id, 'title' => $o->order_number, 'sub' => $o->customer->name, 'status' => $o->status->label(), 'href' => "/orders/{$o->id}"])->all();
                $res['items'] = OrderItem::with('order:id,order_number')->where('product_snapshot->name', 'like', "%{$q}%")->latest('id')->limit(10)->get()
                    ->map(fn (OrderItem $i) => ['id' => $i->id, 'title' => $i->code(), 'sub' => $i->product_snapshot['name'], 'status' => $i->order->order_number, 'href' => "/orders/{$i->order_id}?tab=items"])->all();
            }
            if ($u->hasPermission('customers.view')) {
                $res['customers'] = Customer::search($q)->limit(10)->get()->map(fn (Customer $c) => ['id' => $c->id, 'title' => $c->name, 'sub' => $c->phone_display, 'status' => $c->code(), 'href' => "/customers/{$c->id}"])->all();
            }
            if ($u->hasPermission('products.view')) {
                $res['products'] = Product::where('name', 'like', "%{$q}%")->limit(10)->get()->map(fn (Product $p) => ['id' => $p->id, 'title' => $p->name, 'sub' => $p->is_active ? 'نشط' : 'غير نشط', 'status' => '', 'href' => "/products/{$p->id}"])->all();
            }
        }

        return Inertia::render('operations/search', ['q' => $q, 'results' => $res]);
    }
}
