<?php

namespace App\Http\Controllers\Portal;

use App\Actions\Orders\SubmitOrderRequest;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DesignVersion;
use App\Models\File;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Services\Design\DesignService;
use App\Services\Finance\PaymentService;
use App\Services\Pricing\PricingService;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** بوابة العميل المسجّل (07-A): يرى بياناته فقط. كل استعلام مقيّد بـcustomer_id (منع BOLA). */
class PortalController extends Controller
{
    private function me(Request $r): Customer
    {
        return $r->attributes->get('portal_customer');
    }

    private function orderOf(Request $r, Order $order): Order
    {
        abort_unless($order->customer_id === $this->me($r)->id, 404);

        return $order;
    }

    public function dashboard(Request $request, PaymentService $pay): Response
    {
        $c = $this->me($request);
        $active = Order::where('customer_id', $c->id)->whereNotIn('status', ['COMPLETED', 'CANCELLED'])->latest('id')->get();
        $needs = OrderItem::whereIn('order_id', $active->pluck('id'))->where('design_state', 'AWAITING_APPROVAL')->whereNull('cancelled_at')->get();

        return Inertia::render('portal/dashboard', [
            'due_minor' => $pay->customerDue($c),
            'active' => $active->take(5)->map(fn (Order $o) => ['id' => $o->id, 'number' => $o->order_number, 'status' => $o->status->label(), 'remaining_minor' => $pay->due($o)])->values(),
            'awaiting' => $needs->map(fn (OrderItem $i) => ['order_id' => $i->order_id, 'item_id' => $i->id, 'name' => $i->product_snapshot['name']])->values(),
            'requests' => OrderRequest::where('customer_id', $c->id)->where('status', 'PENDING')->count(),
        ]);
    }

    public function requests(Request $request): Response
    {
        $c = $this->me($request);
        $tab = in_array($request->query('tab'), ['PENDING', 'IN_REVIEW', 'ACCEPTED', 'REJECTED'], true) ? $request->query('tab') : 'PENDING';
        $rows = OrderRequest::where('customer_id', $c->id)->where('status', $tab)->withCount('items')->latest('id')->paginate(10)->withQueryString()
            ->through(fn (OrderRequest $r) => ['id' => $r->id, 'number' => $r->request_number, 'at' => $r->submitted_at->toIso8601String(), 'items' => $r->items_count, 'status' => $r->status->label(), 'order_id' => $r->order_id]);
        $counts = OrderRequest::where('customer_id', $c->id)->selectRaw('status, count(*) n')->groupBy('status')->pluck('n', 'status');

        return Inertia::render('portal/requests', ['requests' => $rows, 'tab' => $tab, 'counts' => $counts]);
    }

    public function createRequest(Request $request): Response
    {
        $c = $this->me($request);
        $products = Product::where('is_active', true)->with(['optionGroups' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->with(['values' => fn ($v) => $v->where('is_active', true)->orderBy('sort_order')])])->orderBy('name')->get()->map(fn (Product $p) => [
            'id' => $p->id, 'name' => $p->name, 'minimum_quantity' => $p->minimum_quantity,
            'groups' => $p->optionGroups->map(fn ($g) => ['id' => $g->id, 'name' => $g->name, 'selection_type' => $g->selection_type, 'is_required' => $g->is_required, 'values' => $g->values->map(fn ($v) => ['id' => $v->id, 'name' => $v->name, 'addition_minor' => $v->unit_price_addition->minor])->all()])->all(),
        ]);

        return Inertia::render('portal/request-create', ['products' => $products, 'address' => $c->address]);
    }

    /** عرض سعر مبدئي بشريحة العميل نفسه (الخادم هو المرجع). */
    public function quote(Request $request, PricingService $pricing): JsonResponse
    {
        $v = $request->validate(['items' => ['required', 'array', 'min:1'], 'items.*.product_id' => ['required', 'integer', 'exists:products,id'], 'items.*.quantity' => ['required', 'integer', 'min:1'], 'items.*.options' => ['array']]);
        $tier = $this->me($request)->pricingTier;
        $items = array_map(fn ($i) => $pricing->quoteItem(Product::findOrFail($i['product_id']), $i['options'] ?? [], (int) $i['quantity'], $tier), $v['items']);

        return response()->json(['data' => $pricing->quoteOrder($items, 'NONE', 0, Money::zero())->toArray()]);
    }

    public function storeRequest(Request $request, SubmitOrderRequest $action): RedirectResponse
    {
        $d = $request->validate([
            'delivery_method' => ['required', 'in:PICKUP,DELIVERY'], 'delivery_address' => ['nullable', 'string', 'max:500'], 'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'], 'items.*.product_id' => ['required', 'integer', 'exists:products,id'], 'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'items.*.options' => ['nullable', 'array'], 'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ], ['items.required' => 'أضف منتجًا واحدًا على الأقل.']);
        $r = $action->handle($this->me($request), $d);

        return redirect("/portal/requests/{$r->id}")->with('success', 'تم إرسال طلبك وسيراجعه فريق المطبعة قريبًا.');
    }

    public function showRequest(Request $request, OrderRequest $orderRequest): Response
    {
        abort_unless($orderRequest->customer_id === $this->me($request)->id, 404);
        $orderRequest->load('items.product');

        return Inertia::render('portal/request-show', ['req' => [
            'number' => $orderRequest->request_number, 'status' => $orderRequest->status->label(), 'status_key' => $orderRequest->status->value, 'at' => $orderRequest->submitted_at->toIso8601String(),
            'delivery_method' => $orderRequest->delivery_method, 'reject_reason' => $orderRequest->reject_reason, 'order_id' => $orderRequest->order_id,
            'items' => $orderRequest->items->map(fn ($i) => ['name' => $i->product->name, 'quantity' => $i->quantity])->values(),
        ]]);
    }

    public function orders(Request $request): Response
    {
        $c = $this->me($request);
        $tab = in_array($request->query('tab'), ['done', 'cancelled'], true) ? $request->query('tab') : 'active';
        $q = Order::where('customer_id', $c->id)->when($tab === 'active', fn ($b) => $b->whereNotIn('status', ['COMPLETED', 'CANCELLED']))->when($tab === 'done', fn ($b) => $b->where('status', 'COMPLETED'))->when($tab === 'cancelled', fn ($b) => $b->where('status', 'CANCELLED'));
        $rows = $q->latest('id')->paginate(10)->withQueryString()->through(fn (Order $o) => ['id' => $o->id, 'number' => $o->order_number, 'status' => $o->status->label(), 'at' => $o->created_at?->toIso8601String(), 'total_minor' => $o->grand_total->minor]);

        return Inertia::render('portal/orders', ['orders' => $rows, 'tab' => $tab]);
    }

    public function showOrder(Request $request, Order $order, PaymentService $pay): Response
    {
        $this->orderOf($request, $order);
        $order->load('items');

        return Inertia::render('portal/order-show', [
            'order' => [
                'id' => $order->id, 'number' => $order->order_number, 'status' => $order->status->label(), 'status_key' => $order->status->value, 'created_at' => $order->created_at?->toIso8601String(),
                'delivery_method' => $order->delivery_method, 'delivery_address' => $order->delivery_address, 'delivery_fee_minor' => $order->delivery_fee->minor, 'grand_total_minor' => $order->grand_total->minor,
                'paid_minor' => $pay->paid($order), 'remaining_minor' => $pay->due($order),
                'items' => $order->items->whereNull('cancelled_at')->values()->map(fn (OrderItem $i) => ['id' => $i->id, 'name' => $i->product_snapshot['name'], 'quantity' => $i->quantity, 'state' => $i->design_state, 'approved' => (bool) $i->approved_at, 'total_minor' => $i->item_total->minor])->all(),
                'payments' => DB::table('payment_allocations')->join('payments', 'payments.id', '=', 'payment_allocations.payment_id')->where('payment_allocations.order_id', $order->id)->where('payments.status', 'CONFIRMED')->get(['payments.number', 'payments.received_at', 'payment_allocations.amount'])->map(fn ($p) => ['number' => $p->number, 'at' => Carbon::parse($p->received_at)->toIso8601String(), 'amount_minor' => (int) $p->amount])->all(),
            ],
        ]);
    }

    public function item(Request $request, Order $order, OrderItem $item): Response
    {
        $this->orderOf($request, $order);
        abort_unless($item->order_id === $order->id && ! $item->cancelled_at, 404);
        $v = DesignVersion::where('order_item_id', $item->id)->whereIn('status', ['SUBMITTED', 'APPROVED'])->latest('version_no')->with('files')->first();

        return Inertia::render('portal/item-preview', [
            'order' => ['id' => $order->id, 'number' => $order->order_number],
            'item' => ['id' => $item->id, 'name' => $item->product_snapshot['name'], 'quantity' => $item->quantity],
            'version' => $v ? ['id' => $v->id, 'no' => $v->version_no, 'status' => $v->status, 'revision' => $v->manifest_revision, 'files' => $v->files->map(fn (File $f) => ['id' => $f->id, 'name' => $f->original_filename, 'mime' => $f->mime_type])->all()] : null,
        ]);
    }

    public function approve(Request $request, Order $order, OrderItem $item, DesignService $design): RedirectResponse
    {
        $this->orderOf($request, $order);
        abort_unless($item->order_id === $order->id, 404);
        $d = $request->validate(['version_id' => ['required', 'integer'], 'revision' => ['required', 'integer']]);
        $design->approve('customer', $this->me($request)->id, DesignVersion::where('order_item_id', $item->id)->findOrFail($d['version_id']), (int) $d['revision']);

        return redirect("/portal/orders/{$order->id}")->with('success', 'تم اعتماد التصميم.');
    }

    public function file(Request $request, File $file): StreamedResponse
    {
        $c = $this->me($request);
        $ok = $file->parent_type === 'design_version' && DesignVersion::whereKey($file->parent_id)->whereIn('status', ['SUBMITTED', 'APPROVED'])->whereHas('item.order', fn ($q) => $q->where('customer_id', $c->id))->exists();
        abort_unless($ok, 404);

        return Storage::disk($file->disk)->response($file->storage_key, $file->original_filename, ['Content-Type' => $file->mime_type, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store', 'Content-Security-Policy' => "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox"], 'inline');
    }

    public function account(Request $request): Response
    {
        $c = $this->me($request);

        return Inertia::render('portal/account', ['customer' => ['name' => $c->name, 'phone' => $c->phone_display, 'code' => $c->code(), 'tier' => $c->pricingTier->name, 'address' => $c->address]]);
    }
}
