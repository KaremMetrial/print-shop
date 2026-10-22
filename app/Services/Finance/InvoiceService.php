<?php

namespace App\Services\Finance;

use App\Enums\ErrorCode;
use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Settings\Settings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Mpdf\Mpdf;

/** إصدار/إلغاء الفاتورة الداخلية. تُصدر بعد دخول الأوردر الطباعة (الأسعار نهائية) ولا تُصدر لأوردر ملغي. فاتورة سارية واحدة لكل أوردر. */
class InvoiceService
{
    public function __construct(private AuditService $audit, private PaymentService $payments, private Settings $settings) {}

    public function issue(User $actor, Order $order): Invoice
    {
        Gate::forUser($actor)->authorize('invoices.issue');

        return DB::transaction(function () use ($actor, $order) {
            $order = Order::with('customer', 'items')->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if (in_array($order->status, [OrderStatus::DESIGN_STAGE, OrderStatus::CANCELLED], true)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, $order->status === OrderStatus::CANCELLED ? 'لا تُصدر فاتورة لأوردر ملغي.' : 'تُصدر الفاتورة بعد اعتماد كل التصميمات ودخول الأوردر الطباعة.');
            }
            if (Invoice::where('active_order_id', $order->id)->exists()) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'يوجد فاتورة سارية لهذا الأوردر. ألغها أولًا لإصدار بديلة.');
            }
            $c = $order->customer;
            $inv = Invoice::create([
                'order_id' => $order->id, 'customer_id' => $c->id, 'active_order_id' => $order->id, 'issued_by' => $actor->id,
                'snapshot' => [
                    'shop' => ['name' => $this->settings->get('shop.name'), 'branch' => $this->settings->get('shop.branch'), 'phone' => $this->settings->get('shop.phone')],
                    'order_number' => $order->order_number,
                    'customer' => ['name' => $c->name, 'phone' => $c->phone_display, 'address' => $order->delivery_address ?: $c->address],
                    'items' => $order->items->whereNull('cancelled_at')->values()->map(fn ($i) => [
                        'name' => $i->product_snapshot['name'], 'specs' => collect($i->options_snapshot)->pluck('value')->implode(' • '), 'quantity' => $i->quantity,
                        'unit_minor' => $i->unit_price->minor, 'total_minor' => $i->item_total->minor,
                    ])->all(),
                    'subtotal_minor' => $order->subtotal->minor, 'discount_minor' => $order->discount_amount->minor, 'delivery_fee_minor' => $order->delivery_fee->minor,
                    'grand_total_minor' => $order->grand_total->minor, 'paid_minor' => $this->payments->paid($order), 'delivery_method' => $order->delivery_method,
                ],
            ]);
            $this->audit->record('invoice.issued', $order, [], ['invoice_id' => $inv->id, 'number' => $inv->number, 'grand_total_minor' => $order->grand_total->minor]);

            return $inv;
        });
    }

    public function void(User $actor, Invoice $invoice, string $reason): Invoice
    {
        Gate::forUser($actor)->authorize('invoices.issue');
        if (trim($reason) === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'سبب إلغاء الفاتورة إلزامي.');
        }

        return DB::transaction(function () use ($actor, $invoice, $reason) {
            $invoice = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            if ($invoice->status !== 'ISSUED') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 'الفاتورة ملغاة بالفعل.');
            }
            $invoice->update(['status' => 'VOIDED', 'active_order_id' => null, 'void_reason' => mb_substr($reason, 0, 500), 'voided_by' => $actor->id, 'voided_at' => now()]);
            $this->audit->record('invoice.voided', $invoice->order, [], ['invoice_id' => $invoice->id, 'number' => $invoice->number], $reason);

            return $invoice;
        });
    }

    /** @return array<string, mixed> بيانات العرض (صفحة/PDF) من اللقطة الثابتة. */
    public function payload(Invoice $i): array
    {
        return [
            'id' => $i->id, 'number' => $i->number, 'status' => $i->status, 'status_label' => $i->status === 'ISSUED' ? 'سارية' : 'ملغاة',
            'issued_at' => $i->issued_at->toIso8601String(), 'void_reason' => $i->void_reason, 'order_id' => $i->order_id, 'snapshot' => $i->snapshot,
        ];
    }

    public function pdf(Invoice $i): string
    {
        $pdf = new Mpdf(['mode' => 'utf-8', 'format' => 'A4', 'default_font' => 'dejavusans', 'tempDir' => storage_path('app/mpdf')]);
        $pdf->autoScriptToLang = true;
        $pdf->autoLangToFont = true;
        $pdf->SetDirectionality('rtl');
        $pdf->WriteHTML(view('pdf.invoice', ['i' => $this->payload($i)])->render());

        return $pdf->Output('', 'S');
    }
}
