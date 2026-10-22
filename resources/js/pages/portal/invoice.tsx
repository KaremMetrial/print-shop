import { InvoiceSheet, type InvoiceData } from '@/components/invoice/invoice-sheet';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { Head, Link } from '@inertiajs/react';

/** S-094 — معاينة الفاتورة للعميل المسجّل (عرض فقط). */
export default function PortalInvoice({ order, invoice }: { order: { id: number; number: string }; invoice: InvoiceData | null }) {
    return (
        <CustomerLayout>
            <Head title={`فاتورة ${order.number}`} />
            <div className="flex w-full flex-wrap items-center justify-between gap-[10px]">
                <div className="flex items-center gap-[10px]">
                    <Link href={`/portal/orders/${order.id}`} className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[13px] text-[#334155] [outline:1px_solid_var(--border)]">العودة</Link>
                    {invoice && <a href={`/portal/orders/${order.id}/invoice/pdf`} target="_blank" rel="noreferrer" className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-[13px] font-[700] text-white">تنزيل PDF</a>}
                </div>
                <h1 className="text-right text-[22px] font-[700] text-[var(--ink)]">الفاتورة</h1>
            </div>
            {invoice ? <div className="flex w-full justify-center"><InvoiceSheet invoice={invoice} /></div> : <div className="rounded-[12px] bg-[var(--surface)] p-[32px] text-center text-[14px] text-[var(--muted-foreground)] [outline:1px_solid_var(--border)]">لم تُصدر فاتورة لهذا الأوردر بعد.</div>}
        </CustomerLayout>
    );
}
