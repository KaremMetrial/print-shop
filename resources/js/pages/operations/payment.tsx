import { PenBreadcrumb } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, formatTime } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';

export interface PayData {
    payment: { id: number; number: string; status: string; status_label: string; customer: { id: number; name: string; phone: string }; original_minor: number; confirmed_minor: number; amount_minor: number; method: string; by: string | null; at: string; reference: string | null; notes: string | null; void_reason: string | null };
    allocations: { id: number; ref: string; amount_minor: number; order: string; order_id: number }[];
    corrections: { id: number; type: string; old_minor: number; new_minor: number | null; reason: string; by: string | null; at: string }[];
}
const card = 'flex w-full shrink-0 flex-col rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const Cell = ({ k, v }: { k: string; v: string }) => (
    <div className="flex flex-1 flex-col gap-[3px]">
        <div className="w-full text-right text-[11px] leading-[18px] text-[var(--muted-foreground)]">{k}</div>
        <div className="w-full text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{v}</div>
    </div>
);
const th = 'flex-1 text-right text-[12px] leading-[19px] font-[600] text-[#475569]';
const td = 'flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]';

/** S-029 — تفاصيل الدفعة. pendev: dEPAe */
export default function PaymentPage({ payment: p, allocations, corrections, can }: PayData & { can: { correct: boolean; ledger: boolean } }) {
    return (
        <AppLayout active="/accounting">
            <Head title="تفاصيل الدفعة" />
            <div className="flex w-full shrink-0 flex-col gap-[20px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'المحاسبة', href: '/accounting' }, 'تفاصيل الدفعة']} />
                <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                    <div className="flex items-center gap-[12px]">
                        {can.ledger && <Link href={`/customers/${p.customer.id}`} className="flex h-[32px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_10px] text-[11px] font-[600] text-[var(--ink)] [outline:1px_solid_var(--border)]">عرض كشف الحساب</Link>}
                        {can.correct && p.status === 'CONFIRMED' && <Link href="/accounting" className="flex h-[32px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_10px] text-[11px] font-[600] text-[var(--ink)] [outline:1px_solid_var(--border)]">تصحيح الدفعة</Link>}
                        <Link href={`/accounting/payments/${p.id}/receipt`} className="flex h-[46px] items-center rounded-[10px] bg-[var(--primary)] p-[0px_16px] text-[14px] font-[600] text-white">طباعة الإيصال</Link>
                    </div>
                    <div className="flex flex-1 flex-col gap-[3px]">
                        <h1 className="w-full text-right text-[28px] leading-[45px] font-[700] text-[var(--ink)]">تفاصيل الدفعة</h1>
                        <div className="w-full text-right text-[13px] leading-[21px] text-[var(--muted-foreground)]">{`${p.number} • ${p.status_label}`}</div>
                    </div>
                </div>
                <div className={`${card} gap-[16px] p-[20px]`}>
                    <div className="flex w-full gap-[20px]">
                        <Cell k="العميل" v={p.customer.name} />
                        <Cell k="المبلغ الأصلي" v={formatMoney(p.original_minor)} />
                        <Cell k="المبلغ المؤكد" v={formatMoney(p.confirmed_minor)} />
                        <Cell k="طريقة الدفع" v={p.method} />
                    </div>
                    <div className="flex w-full gap-[20px]">
                        <Cell k="سجّلها" v={p.by ?? '—'} />
                        <Cell k="وقت التسجيل" v={`${formatDate(p.at, { year: false })}، ${formatTime(p.at)}`} />
                        <Cell k="المرجع" v={p.reference ?? '—'} />
                        <Cell k="ملاحظات" v={p.notes ?? '—'} />
                    </div>
                    {p.void_reason && <div className="w-full text-right text-[12px] text-[#B91C1C]">{`سبب الإلغاء: ${p.void_reason}`}</div>}
                </div>
                <div className={card}>
                    <div className="w-full p-[14px_16px] text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">توزيع الدفعة</div>
                    <div className="flex h-[44px] w-full items-center gap-[12px] bg-[#F1F5F9] p-[0px_16px]">
                        <div className={th}>مرجع التوزيع</div>
                        <div className={th}>المبلغ الموزع</div>
                        <div className={th}>الأوردر</div>
                    </div>
                    {allocations.map((a) => (
                        <div key={a.id} className="flex h-[62px] w-full items-center gap-[12px] p-[0px_16px] [border-top:1px_solid_var(--border)]">
                            <div className={td}>{a.ref}</div>
                            <div className={td}>{formatMoney(a.amount_minor)}</div>
                            <Link href={`/orders/${a.order_id}`} className={`${td} text-[var(--primary)]`}>{a.order}</Link>
                        </div>
                    ))}
                </div>
                <div className={card}>
                    <div className="flex w-full items-center gap-[12px] p-[14px_16px]">
                        <div className="flex-1 text-right text-[11px] leading-[18px] text-[var(--muted-foreground)]">لا يمكن حذف السجل المالي المؤكد.</div>
                        <div className="flex-1 text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">سجل التصحيحات</div>
                    </div>
                    {corrections.length === 0 ? (
                        <div className="flex h-[58px] w-full items-center bg-[var(--background)] p-[0px_16px] text-right text-[13px] text-[var(--muted-foreground)]">لا توجد تصحيحات على هذه الدفعة.</div>
                    ) : (
                        corrections.map((c) => (
                            <div key={c.id} className="flex min-h-[58px] w-full items-center gap-[12px] p-[8px_16px] [border-top:1px_solid_var(--border)]">
                                <div className="flex-1 text-right text-[12px] text-[var(--muted-foreground)]">{`${formatDate(c.at)} • ${c.by ?? '—'}`}</div>
                                <div className="flex-1 text-right text-[13px] text-[var(--ink)]">{c.reason}</div>
                                <div className={td}>{`${c.type}: ${formatMoney(c.old_minor)}${c.new_minor !== null ? ` ← ${formatMoney(c.new_minor)}` : ''}`}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
