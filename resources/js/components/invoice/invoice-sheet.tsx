import { formatDate, formatMoneyFixed, formatTime } from '@/lib/money';

export interface InvoiceData {
    id: number;
    number: string;
    status: 'ISSUED' | 'VOIDED';
    status_label: string;
    issued_at: string;
    void_reason: string | null;
    order_id: number;
    snapshot: {
        shop: { name: string; branch: string; phone: string };
        order_number: string;
        customer: { name: string; phone: string; address: string | null };
        items: { name: string; specs: string; quantity: number; unit_minor: number; total_minor: number }[];
        subtotal_minor: number;
        discount_minor: number;
        delivery_fee_minor: number;
        grand_total_minor: number;
        paid_minor: number;
    };
}

/** ورقة الفاتورة (S-057 / S-094): تُطبع الورقة فقط. فاتورة داخلية وليست ضريبية (D7). */
export function InvoiceSheet({ invoice: i }: { invoice: InvoiceData }) {
    const s = i.snapshot;
    const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
        <div className={`flex w-full justify-between text-[14px] ${bold ? 'text-[16px] font-[700] text-[var(--ink)]' : 'text-[#334155]'}`}>
            <span>{v}</span>
            <span>{k}</span>
        </div>
    );
    return (
        <div id="invoice-sheet" dir="rtl" className="flex w-[790px] max-w-full flex-col gap-[18px] rounded-[2px] bg-[var(--surface)] p-[24px] text-right lg:p-[40px]">
            <div className="flex w-full flex-col gap-[6px]">
                <div className="text-[22px] font-[700] text-[var(--ink)]">{s.shop.name}</div>
                <div className="text-[12px] text-[#475569]">{[s.shop.branch, s.shop.phone].filter(Boolean).join(' • ') || 'بيانات التواصل تظهر عند توافرها في إعدادات المطبعة'}</div>
                <div className="text-[25px] font-[700] text-[var(--ink)]">{`فاتورة أوردر ${s.order_number}`}</div>
                <div className="text-[12px] text-[var(--primary)]">{`${i.number} • ${formatDate(i.issued_at)}، ${formatTime(i.issued_at)} • ${i.status_label}${i.status === 'VOIDED' && i.void_reason ? ` — ${i.void_reason}` : ''}`}</div>
            </div>
            <div className="flex w-full flex-col gap-[6px] rounded-[6px] bg-[var(--background)] p-[14px]">
                <div className="text-[16px] font-[700] text-[var(--ink)]">بيانات العميل</div>
                <div className="text-[13px] whitespace-pre-line text-[#475569]">{`${s.customer.name}\n${s.customer.phone}${s.customer.address ? `\n${s.customer.address}` : ''}`}</div>
            </div>
            <div className="flex w-full flex-col gap-[8px]">
                <div className="flex w-full justify-between text-[13px] font-[700] text-[#475569]">
                    <span className="w-[110px] text-left">الإجمالي</span>
                    <span className="w-[100px] text-left">سعر الوحدة</span>
                    <span className="w-[70px]">الكمية</span>
                    <span className="flex-1">المنتج</span>
                </div>
                {s.items.map((it, n) => (
                    <div key={n} className="flex w-full justify-between text-[13px] text-[var(--ink)]">
                        <span className="w-[110px] text-left">{formatMoneyFixed(it.total_minor)}</span>
                        <span className="w-[100px] text-left">{formatMoneyFixed(it.unit_minor)}</span>
                        <span className="w-[70px]">{it.quantity}</span>
                        <span className="flex-1">
                            {it.name}
                            {it.specs && <span className="block text-[11px] text-[var(--muted-foreground)]">{it.specs}</span>}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex w-full flex-col gap-[6px] rounded-[6px] bg-[var(--background)] p-[16px]">
                <div className="text-[17px] font-[700] text-[var(--ink)]">ملخص الفاتورة</div>
                <Row k="إجمالي البنود" v={formatMoneyFixed(s.subtotal_minor)} />
                <Row k="الخصم" v={formatMoneyFixed(s.discount_minor)} />
                <Row k="رسوم التوصيل" v={formatMoneyFixed(s.delivery_fee_minor)} />
                <Row bold k="الإجمالي النهائي" v={formatMoneyFixed(s.grand_total_minor)} />
                <Row k="المدفوع المؤكد وقت الإصدار" v={formatMoneyFixed(s.paid_minor)} />
                <Row k="المتبقي وقت الإصدار" v={formatMoneyFixed(Math.max(0, s.grand_total_minor - s.paid_minor))} />
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)]">هذه وثيقة فاتورة داخلية وليست فاتورة ضريبية، ولا تمثل إثبات دفع. عند الطباعة أو PDF تُطبع الورقة فقط.</div>
        </div>
    );
}
