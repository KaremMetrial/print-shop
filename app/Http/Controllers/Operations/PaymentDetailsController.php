<?php

namespace App\Http\Controllers\Operations;

use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use App\Services\Settings\Settings;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Mpdf\Mpdf;

/** S-029 تفاصيل الدفعة + S-029-R01 إيصال الدفع (مبلغ مستلم مؤكد وليس فاتورة). السجل المالي لا يُحذف. */
class PaymentDetailsController extends Controller
{
    public function show(Request $request, Payment $payment): Response
    {
        return Inertia::render('operations/payment', $this->data($request, $payment) + ['can' => [
            'correct' => (bool) $request->user()->hasPermission('payments.correct'),
            'ledger' => (bool) $request->user()->hasPermission('customers.view_ledger'),
        ]]);
    }

    public function receipt(Request $request, Payment $payment): Response
    {
        return Inertia::render('operations/payment-receipt', $this->data($request, $payment) + ['shop' => app(Settings::class)->get('shop.name')]);
    }

    public function receiptPdf(Request $request, Payment $payment): HttpResponse
    {
        $d = $this->data($request, $payment) + ['shop' => app(Settings::class)->get('shop.name'), 'methods' => PaymentMethod::labels()];
        $pdf = new Mpdf(['mode' => 'utf-8', 'format' => 'A4', 'default_font' => 'dejavusans', 'tempDir' => storage_path('app/mpdf')]);
        $pdf->autoScriptToLang = true;
        $pdf->autoLangToFont = true;
        $pdf->SetDirectionality('rtl');
        $pdf->WriteHTML(view('pdf.payment-receipt', $d)->render());

        return response($pdf->Output('', 'S'), 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'inline; filename="receipt-'.$payment->number.'.pdf"']);
    }

    /** @return array<string, mixed> */
    private function data(Request $request, Payment $payment): array
    {
        abort_unless($request->user()->hasPermission('payments.view_all'), 403);
        $payment->load('customer:id,name,phone_normalized');
        $adj = DB::table('payment_adjustments')->where('payment_id', $payment->id)->oldest('id')->get();
        $original = $adj->isNotEmpty() ? (int) $adj->first()->old_amount : $payment->amount->minor;

        return [
            'payment' => [
                'id' => $payment->id, 'number' => $payment->number, 'status' => $payment->status, 'status_label' => $payment->status === 'CONFIRMED' ? 'مؤكدة' : 'ملغاة',
                'customer' => ['id' => $payment->customer->id, 'name' => $payment->customer->name, 'phone' => $payment->customer->phone_normalized],
                'original_minor' => $original, 'confirmed_minor' => $payment->status === 'CONFIRMED' ? $payment->amount->minor : 0, 'amount_minor' => $payment->amount->minor,
                'method' => PaymentMethod::labels()[$payment->method] ?? $payment->method, 'by' => $payment->received_by ? User::find($payment->received_by)?->name : null,
                'at' => $payment->received_at->toIso8601String(), 'reference' => $payment->reference, 'notes' => $payment->notes, 'void_reason' => $payment->void_reason,
            ],
            'allocations' => DB::table('payment_allocations')->join('orders', 'orders.id', '=', 'payment_allocations.order_id')->where('payment_id', $payment->id)
                ->get(['payment_allocations.id', 'payment_allocations.amount', 'orders.order_number', 'orders.id as order_id'])
                ->map(fn ($r) => ['id' => $r->id, 'ref' => 'ALLOC-'.str_pad((string) $r->id, 4, '0', STR_PAD_LEFT), 'amount_minor' => (int) $r->amount, 'order' => $r->order_number, 'order_id' => $r->order_id])->all(),
            'corrections' => $adj->map(fn ($a) => ['id' => $a->id, 'type' => $a->type === 'VOID' ? 'إلغاء' : 'تعديل المبلغ', 'old_minor' => (int) $a->old_amount, 'new_minor' => $a->new_amount === null ? null : (int) $a->new_amount, 'reason' => $a->reason, 'by' => $a->adjusted_by ? User::find($a->adjusted_by)?->name : null, 'at' => Carbon::parse($a->created_at)->toIso8601String()])->all(),
        ];
    }
}
