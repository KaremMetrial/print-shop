<?php

namespace App\Http\Controllers\Portal;

use App\Actions\Orders\SubmitOrderRequest;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DesignVersion;
use App\Models\File;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Services\Chat\ChatService;
use App\Services\Design\DesignService;
use App\Services\Files\FileService;
use App\Services\Finance\InvoiceService;
use App\Services\Finance\PaymentProofService;
use App\Services\Finance\PaymentService;
use App\Services\Orders\OrderStatusLabels;
use App\Services\Pricing\PricingService;
use App\Support\Money;
use App\Support\PenFixtures;
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

        $props = [
            'due_minor' => $pay->customerDue($c),
            'active' => $active->take(5)->map(fn (Order $o) => ['id' => $o->id, 'number' => $o->order_number, 'status' => app(OrderStatusLabels::class)->label($o->status), 'remaining_minor' => $pay->due($o), 'total_minor' => $o->grand_total->minor])->values(),
            'awaiting' => $needs->map(fn (OrderItem $i) => ['order_id' => $i->order_id, 'item_id' => $i->id, 'name' => $i->product_snapshot['name'], 'order_number' => $active->firstWhere('id', $i->order_id)?->order_number])->values(),
            'requests' => OrderRequest::where('customer_id', $c->id)->where('status', 'PENDING')->count(),
            'recent_requests' => OrderRequest::where('customer_id', $c->id)->latest('id')->limit(2)->get()
                ->map(fn (OrderRequest $r) => ['id' => $r->id, 'number' => $r->request_number, 'status' => $r->status->label()])->values(),
            'greeting_name' => $c->name,
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::portalDashboard());
        }

        return Inertia::render('portal/dashboard', $props);
    }

    public function requests(Request $request): Response
    {
        $c = $this->me($request);
        $tab = in_array($request->query('tab'), ['PENDING', 'IN_REVIEW', 'ACCEPTED', 'REJECTED'], true) ? $request->query('tab') : 'PENDING';
        $rows = OrderRequest::where('customer_id', $c->id)->where('status', $tab)->withCount('items')->latest('id')->paginate(10)->withQueryString()
            ->through(fn (OrderRequest $r) => ['id' => $r->id, 'number' => $r->request_number, 'at' => $r->submitted_at->toIso8601String(), 'items' => $r->items_count, 'status' => $r->status->label(), 'order_id' => $r->order_id]);
        $counts = OrderRequest::where('customer_id', $c->id)->selectRaw('status, count(*) n')->groupBy('status')->pluck('n', 'status');

        $props = ['requests' => $rows, 'tab' => $tab, 'counts' => $counts, 'cards' => $this->requestCards($c)];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::portalRequests());
        }

        return Inertia::render('portal/requests', $props);
    }

    public function createRequest(Request $request): Response
    {
        $c = $this->me($request);
        $products = Product::where('is_active', true)->with(['optionGroups' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->with(['values' => fn ($v) => $v->where('is_active', true)->orderBy('sort_order')])])->orderBy('name')->get()->map(fn (Product $p) => [
            'id' => $p->id, 'name' => $p->name, 'description' => $p->description, 'minimum_quantity' => $p->minimum_quantity,
            'groups' => $p->optionGroups->map(fn ($g) => ['id' => $g->id, 'name' => $g->name, 'selection_type' => $g->selection_type, 'is_required' => $g->is_required, 'values' => $g->values->map(fn ($v) => ['id' => $v->id, 'name' => $v->name, 'addition_minor' => $v->unit_price_addition->minor])->all()])->all(),
        ]);

        $props = ['products' => $products, 'address' => $c->address];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::portalWizard((int) $request->query('step', 1)));
        }

        return Inertia::render('portal/request-create', $props);
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
            'items.*.file_ids' => ['nullable', 'array', 'max:10'], 'items.*.file_ids.*' => ['integer'],
        ], ['items.required' => 'أضف منتجًا واحدًا على الأقل.']);
        $r = $action->handle($this->me($request), $d);

        return redirect("/portal/requests/{$r->id}")->with('success', 'تم إرسال طلبك وسيراجعه فريق المطبعة قريبًا.');
    }

    public function showRequest(Request $request, OrderRequest $orderRequest): Response
    {
        $c = $this->me($request);
        abort_unless($orderRequest->customer_id === $c->id, 404);
        $orderRequest->load('items.product', 'order');

        $props = ['req' => [
            'number' => $orderRequest->request_number, 'status' => $orderRequest->status->label(), 'status_key' => $orderRequest->status->value, 'at' => $orderRequest->submitted_at->toIso8601String(),
            'delivery_method' => $orderRequest->delivery_method, 'reject_reason' => $orderRequest->reject_reason, 'order_id' => $orderRequest->order_id, 'order_number' => $orderRequest->order?->order_number,
            'total_minor' => $this->requestTotal($orderRequest, $c, app(PricingService::class)),
            'items' => $orderRequest->items->map(fn ($i) => ['name' => $i->product->name, 'quantity' => $i->quantity,
                'files' => File::where('parent_type', 'order_request_item')->where('parent_id', $i->id)->pluck('original_filename')->all()])->values(),
            // تعديلات المطبعة على الكميات أثناء المراجعة (الكمية المطلوبة → النهائية)
            'edits' => $orderRequest->items->filter(fn ($i) => $i->quantity !== $i->original_quantity)->map(fn ($i) => ['name' => $i->product->name, 'old' => $i->original_quantity, 'new' => $i->quantity])->values(),
        ]];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props['req'] = array_replace($props['req'], PenFixtures::portalRequestShow());
        }

        return Inertia::render('portal/request-show', $props);
    }

    public function orders(Request $request): Response
    {
        $c = $this->me($request);
        $tab = in_array($request->query('tab'), ['done', 'cancelled'], true) ? $request->query('tab') : 'active';
        $q = Order::where('customer_id', $c->id)->when($tab === 'active', fn ($b) => $b->whereNotIn('status', ['COMPLETED', 'CANCELLED']))->when($tab === 'done', fn ($b) => $b->where('status', 'COMPLETED'))->when($tab === 'cancelled', fn ($b) => $b->where('status', 'CANCELLED'));
        $rows = $q->latest('id')->paginate(10)->withQueryString()->through(fn (Order $o) => ['id' => $o->id, 'number' => $o->order_number, 'status' => app(OrderStatusLabels::class)->label($o->status), 'at' => $o->created_at?->toIso8601String(), 'total_minor' => $o->grand_total->minor]);

        $props = ['orders' => $rows, 'tab' => $tab, 'cards' => $this->orderCards($c), 'summary' => $this->orderSummary($c)];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::portalOrders());
        }

        return Inertia::render('portal/orders', $props);
    }

    public function showOrder(Request $request, Order $order, PaymentService $pay): Response
    {
        $this->orderOf($request, $order);
        $order->load('items');

        $props = [
            'order' => [
                'id' => $order->id, 'number' => $order->order_number, 'status' => app(OrderStatusLabels::class)->label($order->status), 'status_key' => $order->status->value, 'created_at' => $order->created_at?->toIso8601String(),
                'delivery_method' => $order->delivery_method, 'delivery_address' => $order->delivery_address, 'delivery_fee_minor' => $order->delivery_fee->minor, 'grand_total_minor' => $order->grand_total->minor,
                'has_invoice' => Invoice::where('active_order_id', $order->id)->exists(),
                'paid_minor' => $pay->paid($order), 'remaining_minor' => $pay->due($order),
                'items' => $order->items->whereNull('cancelled_at')->values()->map(fn (OrderItem $i) => ['id' => $i->id, 'name' => $i->product_snapshot['name'], 'quantity' => $i->quantity, 'state' => $i->design_state, 'approved' => (bool) $i->approved_at, 'total_minor' => $i->item_total->minor,
                    'version_no' => DesignVersion::where('order_item_id', $i->id)->whereIn('status', ['SUBMITTED', 'APPROVED'])->max('version_no')])->all(),
                'payments' => DB::table('payment_allocations')->join('payments', 'payments.id', '=', 'payment_allocations.payment_id')->where('payment_allocations.order_id', $order->id)->where('payments.status', 'CONFIRMED')->get(['payments.number', 'payments.received_at', 'payment_allocations.amount'])->map(fn ($p) => ['number' => $p->number, 'at' => Carbon::parse($p->received_at)->toIso8601String(), 'amount_minor' => (int) $p->amount])->all(),
            ],
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props['order'] = array_replace($props['order'], PenFixtures::portalOrderShow());
            $props['pen'] = ['proof' => $request->query('sheet') === 'proof'];
        }

        return Inertia::render('portal/order-show', $props);
    }

    public function item(Request $request, Order $order, OrderItem $item): Response
    {
        $this->orderOf($request, $order);
        abort_unless($item->order_id === $order->id && ! $item->cancelled_at, 404);
        $v = DesignVersion::where('order_item_id', $item->id)->whereIn('status', ['SUBMITTED', 'APPROVED'])->latest('version_no')->with('files')->first();

        $props = [
            'order' => ['id' => $order->id, 'number' => $order->order_number],
            'item' => ['id' => $item->id, 'name' => $item->product_snapshot['name'], 'quantity' => $item->quantity],
            'version' => $v ? ['id' => $v->id, 'no' => $v->version_no, 'status' => $v->status, 'revision' => $v->manifest_revision, 'files' => $v->files->map(fn (File $f) => ['id' => $f->id, 'name' => $f->original_filename, 'mime' => $f->mime_type])->all()] : null,
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::portalItem());
        }

        return Inertia::render('portal/item-preview', $props);
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
        $ok = $ok || ($file->parent_type === 'item_chat_message' && DB::table('item_chat_messages')->join('order_items', 'order_items.id', '=', 'item_chat_messages.order_item_id')->join('orders', 'orders.id', '=', 'order_items.order_id')->where('item_chat_messages.id', $file->parent_id)->where('orders.customer_id', $c->id)->exists());
        abort_unless($ok, 404);

        return Storage::disk($file->disk)->response($file->storage_key, $file->original_filename, ['Content-Type' => $file->mime_type, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store', 'Content-Security-Policy' => "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox"], 'inline');
    }

    /** رفع ملف مرجعي للطلب (قبل الإرسال): يبقى «معلّقًا» لدى العميل حتى يُربط ببند الطلب عند الإرسال. */
    public function upload(Request $request, FileService $files): JsonResponse
    {
        $request->validate(['file' => ['required', 'file']]);
        $f = $files->store($request->file('file'), 'customer_reference', ['customer', $this->me($request)->id]);

        return response()->json(['data' => ['id' => $f->id, 'name' => $f->original_filename, 'size' => $f->size_bytes]], 201);
    }

    public function account(Request $request): Response
    {
        $c = $this->me($request);

        return Inertia::render('portal/account', ['customer' => ['name' => $c->name, 'phone' => $c->phone_display, 'code' => $c->code(), 'tier' => $c->pricingTier->name, 'address' => $c->address]]);
    }

    public function chat(Request $request, Order $order, OrderItem $item): JsonResponse
    {
        $this->orderOf($request, $order);
        abort_unless($item->order_id === $order->id && ! $item->cancelled_at, 404);
        $chat = app(ChatService::class);
        if ($request->isMethod('post')) {
            $d = $request->validate(['body' => ['nullable', 'string', 'max:2000'], 'client_id' => ['required', 'string', 'max:64'], 'file' => ['nullable', 'file']]);

            return response()->json(['data' => $chat->send($item, 'customer', $this->me($request)->id, 'العميل', (string) ($d['body'] ?? ''), $d['client_id'], $request->file('file'))], 201);
        }

        return response()->json(['data' => $chat->list($item, (int) $request->query('after', 0)), 'meta' => ['locked' => $chat->isLocked($item), 'can_send' => ! $chat->isLocked($item), 'label' => 'العميل']]);
    }

    public function proof(Request $request, Order $order): RedirectResponse
    {
        $this->orderOf($request, $order);
        $d = $request->validate(['file' => ['required', 'file'], 'amount_minor' => ['required', 'integer', 'min:1', 'max:100000000'], 'method' => ['required', 'in:'.implode(',', array_keys(PaymentMethod::enabled()))], 'reference' => ['nullable', 'string', 'max:100']]);
        app(PaymentProofService::class)->submit($order, $request->file('file'), (int) $d['amount_minor'], $d['method'], $d['reference'] ?? null, 'customer', $this->me($request)->id);

        return back()->with('success', 'تم إرسال إثبات الدفع للمراجعة. لن يُحتسب إلا بعد تأكيد المطبعة.');
    }

    public function invoice(Request $request, Order $order): Response
    {
        $this->orderOf($request, $order);
        $inv = Invoice::where('active_order_id', $order->id)->first();

        return Inertia::render('portal/invoice', ['order' => ['id' => $order->id, 'number' => $order->order_number], 'invoice' => $inv ? app(InvoiceService::class)->payload($inv) : null]);
    }

    public function invoicePdf(Request $request, Order $order): \Illuminate\Http\Response
    {
        $this->orderOf($request, $order);
        $inv = Invoice::where('active_order_id', $order->id)->firstOrFail();

        return response(app(InvoiceService::class)->pdf($inv), 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'inline; filename="invoice-'.$inv->number.'.pdf"', 'Cache-Control' => 'private, no-store']);
    }

    /**
     * بطاقات «طلباتي» للموبايل (M-A08): كل الحالات، الأحدث أولًا. السعر = إجمالي الأوردر المرتبط، وإلا عرض سعر مبدئي بشريحة العميل.
     *
     * @return list<array<string, mixed>>
     */
    private function requestCards(Customer $c): array
    {
        $pricing = app(PricingService::class);

        return OrderRequest::where('customer_id', $c->id)->with(['items.product', 'order'])->latest('id')->limit(10)->get()->map(function (OrderRequest $r) use ($pricing, $c) {
            $total = $this->requestTotal($r, $c, $pricing);

            return ['id' => $r->id, 'number' => $r->request_number, 'status' => $r->status->label(), 'status_key' => $r->status->value, 'items' => $r->items->count(),
                'total_minor' => $total, 'at' => $r->submitted_at->toIso8601String(), 'order_number' => $r->order?->order_number];
        })->all();
    }

    /** إجمالي الأوردر المرتبط إن وُجد، وإلا عرض سعر مبدئي بشريحة العميل (الخادم هو المرجع). */
    private function requestTotal(OrderRequest $r, Customer $c, PricingService $pricing): ?int
    {
        if ($r->order) {
            return $r->order->grand_total->minor;
        }
        try {
            $quotes = $r->items->map(fn ($i) => $pricing->quoteItem($i->product, $i->options ?? [], (int) $i->quantity, $c->pricingTier))->all();

            return $pricing->quoteOrder($quotes, 'NONE', 0, Money::zero())->grandTotal->minor;
        } catch (\Throwable) {
            return null;
        }
    }

    /** @return list<array<string, mixed>> */
    private function orderCards(Customer $c): array
    {
        return Order::where('customer_id', $c->id)->with('items')->orderByRaw("status IN ('COMPLETED','CANCELLED')")->latest('id')->limit(10)->get()
            ->map(fn (Order $o) => ['id' => $o->id, 'number' => $o->order_number, 'status' => app(OrderStatusLabels::class)->label($o->status), 'status_key' => $o->status,
                'products' => $o->items->whereNull('cancelled_at')->map(fn (OrderItem $i) => $i->product_snapshot['name'] ?? '')->filter()->unique()->values()->all(), 'total_minor' => $o->grand_total->minor])->all();
    }

    /** @return array{active: int, done: int, cancelled: int} */
    private function orderSummary(Customer $c): array
    {
        $n = Order::where('customer_id', $c->id)->selectRaw('status, count(*) n')->groupBy('status')->pluck('n', 'status');

        return ['active' => (int) $n->except(['COMPLETED', 'CANCELLED'])->sum(), 'done' => (int) ($n['COMPLETED'] ?? 0), 'cancelled' => (int) ($n['CANCELLED'] ?? 0)];
    }
}
