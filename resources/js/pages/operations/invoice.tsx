import { ConfirmDialog } from '@/components/confirm-dialog';
import { InvoiceSheet, type InvoiceData } from '@/components/invoice/invoice-sheet';
import AppLayout from '@/layouts/app-layout';
import { idemHeaders } from '@/lib/idempotency';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const btn = 'flex h-[40px] w-[130px] items-center justify-center rounded-[8px] text-[13px]';

/** S-057 — معاينة الفاتورة (للموظف). pendev: d68hLN */
export default function Invoice({ invoice, can }: { invoice: InvoiceData; can: { issue: boolean } }) {
    const [ask, setAsk] = useState(false);
    const [busy, setBusy] = useState(false);
    return (
        <AppLayout active="/invoices">
            <Head title={`الفاتورة ${invoice.number}`} />
            <ConfirmDialog
                open={ask}
                onOpenChange={setAsk}
                title="إلغاء الفاتورة"
                description="ستُلغى الفاتورة ويبقى سجلها محفوظًا، ويمكن إصدار بديلة لنفس الأوردر."
                confirmLabel="إلغاء الفاتورة"
                danger
                reasonLabel="سبب الإلغاء"
                reasonRequired
                processing={busy}
                onConfirm={(reason) => {
                    setBusy(true);
                    router.post(`/invoices/${invoice.id}/void`, { reason }, { headers: idemHeaders(), preserveScroll: true, onFinish: () => { setBusy(false); setAsk(false); } });
                }}
            />
            <div className="flex w-full flex-col">
                <div className="flex min-h-[75.5px] w-full flex-wrap items-center justify-between gap-[10px] p-[12px_0px] [border-bottom:1px_solid_var(--border)]">
                    <div className="flex items-center gap-[10px]">
                        <Link href={`/orders/${invoice.order_id}?tab=payments`} className={`${btn} bg-[var(--surface)] text-[#334155] [outline:1px_solid_var(--border)]`}>العودة</Link>
                        <a href={`/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer" className={`${btn} bg-[var(--surface)] text-[#334155] [outline:1px_solid_var(--border)]`}>تنزيل PDF</a>
                        <button type="button" onClick={() => window.print()} className={`${btn} bg-[var(--primary)] font-[700] text-white`}>طباعة</button>
                        {can.issue && invoice.status === 'ISSUED' && <button type="button" onClick={() => setAsk(true)} className={`${btn} bg-[var(--surface)] text-[#B42318] [outline:1px_solid_var(--border)]`}>إلغاء الفاتورة</button>}
                    </div>
                    <div className="text-right text-[20px] font-[700] text-[var(--ink)]">معاينة الفاتورة</div>
                </div>
                <div className="flex w-full justify-center p-[16px] lg:p-[28px]">
                    <InvoiceSheet invoice={invoice} />
                </div>
            </div>
        </AppLayout>
    );
}
