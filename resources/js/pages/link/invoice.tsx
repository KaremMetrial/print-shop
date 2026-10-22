import { InvoiceSheet, type InvoiceData } from '@/components/invoice/invoice-sheet';
import { LinkLayout } from '@/components/shell/link-layout';
import { Head, Link } from '@inertiajs/react';

/** S-094 — معاينة الفاتورة عبر رابط الأوردر (عرض فقط). */
export default function LinkInvoice({ token, order, invoice }: { token: string; order: { number: string; customer: string }; invoice: InvoiceData | null }) {
    return (
        <LinkLayout orderRef={order}>
            <Head title="الفاتورة" />
            <div className="flex w-full flex-col items-end gap-[14px] p-[16px] lg:p-[24px_48px]">
                <div className="flex w-full flex-wrap items-center justify-between gap-[10px]">
                    <div className="flex items-center gap-[10px]">
                        <Link href={`/l/${token}`} className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[13px] font-[700] text-[var(--primary)]">العودة إلى الأوردر</Link>
                        {invoice && <a href={`/l/${token}/invoice/pdf`} target="_blank" rel="noreferrer" className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-[13px] font-[700] text-white">تنزيل PDF</a>}
                    </div>
                    <h1 className="text-right text-[22px] font-[700] text-[var(--ink)]">الفاتورة</h1>
                </div>
                {invoice ? <div className="flex w-full justify-center"><InvoiceSheet invoice={invoice} /></div> : <div className="w-full rounded-[12px] bg-[var(--surface)] p-[32px] text-center text-[14px] text-[var(--muted-foreground)]">لم تُصدر فاتورة لهذا الأوردر بعد.</div>}
            </div>
        </LinkLayout>
    );
}
