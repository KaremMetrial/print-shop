import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed, formatTime } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';
import type { PayData } from './payment';

const btn = 'flex h-[40px] w-[130px] items-center justify-center rounded-[8px] text-[13px]';

/** S-029-R01 — عارض إيصال الدفع. pendev: VPyNq */
export default function PaymentReceipt({ payment: p, allocations, shop }: PayData & { shop: string }) {
    return (
        <AppLayout active="/accounting">
            <Head title="إيصال الدفع" />
            <div className="flex w-full shrink-0 flex-col">
                <div className="flex h-[75.5px] w-full items-center justify-between p-[0px_28px] [border-bottom:1px_solid_var(--border)]">
                    <div className="flex items-center gap-[10px]">
                        <Link href={`/accounting/payments/${p.id}`} className={`${btn} bg-[var(--surface)] text-[#334155] [outline:1px_solid_var(--border)]`}>العودة</Link>
                        <a href={`/accounting/payments/${p.id}/receipt/pdf`} target="_blank" rel="noreferrer" className={`${btn} bg-[var(--surface)] text-[#334155] [outline:1px_solid_var(--border)]`}>تنزيل PDF</a>
                        <button type="button" onClick={() => window.print()} className={`${btn} bg-[var(--primary)] font-[700] text-white`}>طباعة</button>
                    </div>
                    <div className="text-right text-[20px] font-[700] text-[var(--ink)]">إيصال الدفع</div>
                </div>
                <div className="flex w-full justify-center p-[28px]">
                    <div className="flex w-[790px] flex-col gap-[18px] rounded-[2px] bg-[var(--surface)] p-[40px]">
                        <div className="flex w-full flex-col gap-[7px]">
                            <div className="w-full text-right text-[22px] font-[700] text-[var(--ink)]">{shop}</div>
                            <div className="w-full text-right text-[25px] font-[700] text-[var(--ink)]">إيصال دفع</div>
                            <div className="w-full text-right text-[12px] text-[var(--primary)]">{`${p.number} • ${formatDate(p.at)}، ${formatTime(p.at)}${p.status !== 'CONFIRMED' ? ' • ملغاة — الإيصال التاريخي محفوظ' : ''}`}</div>
                        </div>
                        <div className="flex w-full flex-col gap-[6px] rounded-[6px] bg-[var(--background)] p-[14px]">
                            <div className="w-full text-right text-[16px] font-[700] text-[var(--ink)]">بيانات العميل</div>
                            <div className="w-full text-right text-[13px] whitespace-pre text-[#475569]">{`${p.customer.name}\n${p.customer.phone}`}</div>
                        </div>
                        <div className="flex w-full flex-col gap-[6px] rounded-[6px] bg-[#EFF6FF] p-[16px]">
                            <div className="w-full text-right text-[16px] font-[700] text-[#1D4ED8]">المبلغ المستلم</div>
                            <div className="w-full text-right text-[28px] font-[700] text-[var(--ink)]">{formatMoneyFixed(p.amount_minor)}</div>
                            <div className="w-full text-right text-[13px] text-[#475569]">{`طريقة الدفع: ${p.method}`}</div>
                        </div>
                        <div className="flex w-full flex-col gap-[6px]">
                            <div className="w-full text-right text-[17px] font-[700] text-[var(--ink)]">توزيع الدفعة</div>
                            {allocations.map((a) => (
                                <div key={a.id} className="w-full text-right text-[14px] text-[#334155]">{`${a.order} ${formatMoneyFixed(a.amount_minor)}`}</div>
                            ))}
                        </div>
                        <div className="w-full text-right text-[12px] text-[#475569]">عند تصحيح العملية لاحقًا، يبقى الإيصال التاريخي محفوظًا وتظهر حالته: تم تصحيح العملية أو إلغاؤها.</div>
                        <div className="w-full text-right text-[11px] text-[var(--muted-foreground)]">هذا إيصال مبلغ مستلم مؤكد، وليس فاتورة أو إثبات دفع معلّق.</div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
