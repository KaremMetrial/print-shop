<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Order;
use App\Services\Finance\InvoiceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** S-056/057 الفواتير: قائمة، معاينة، PDF، إصدار من الأوردر، إلغاء بسبب. (D7: داخلية وليست ضريبية). */
class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('invoices.view');
        $status = in_array($request->query('status'), ['ISSUED', 'VOIDED'], true) ? $request->query('status') : null;
        $rows = Invoice::with('customer:id,name', 'order:id,order_number')
            ->when($status, fn ($b, $s) => $b->where('status', $s))
            ->when($request->query('q'), fn ($b, $t) => $b->where(fn ($w) => $w->where('number', 'like', "%{$t}%")->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$t}%"))->orWhereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$t}%"))))
            ->latest('id')->paginate(15)->withQueryString()->through(fn (Invoice $i) => [
                'id' => $i->id, 'number' => $i->number, 'order' => $i->order->order_number, 'order_id' => $i->order_id, 'customer' => $i->customer->name, 'status' => $i->status,
                'total_minor' => (int) $i->snapshot['grand_total_minor'], 'at' => $i->issued_at->toIso8601String(),
            ]);

        return Inertia::render('operations/invoices', ['invoices' => $rows, 'filters' => $request->only(['q', 'status'])]);
    }

    public function show(Request $request, Invoice $invoice, InvoiceService $svc): Response
    {
        Gate::authorize('invoices.view');

        return Inertia::render('operations/invoice', ['invoice' => $svc->payload($invoice), 'can' => ['issue' => (bool) $request->user()->hasPermission('invoices.issue')]]);
    }

    public function pdf(Invoice $invoice, InvoiceService $svc): HttpResponse
    {
        Gate::authorize('invoices.view');

        return response($svc->pdf($invoice), 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'inline; filename="invoice-'.$invoice->number.'.pdf"']);
    }

    public function issue(Request $request, Order $order, InvoiceService $svc): RedirectResponse
    {
        $inv = $svc->issue($request->user(), $order);

        return redirect()->route('invoices.show', $inv)->with('success', 'تم إصدار الفاتورة.');
    }

    public function void(Request $request, Invoice $invoice, InvoiceService $svc): RedirectResponse
    {
        $d = $request->validate(['reason' => ['required', 'string', 'max:500']], ['reason.required' => 'سبب إلغاء الفاتورة إلزامي.']);
        $svc->void($request->user(), $invoice, $d['reason']);

        return back()->with('success', 'تم إلغاء الفاتورة.');
    }
}
