import { DataGrid, ListHead, RowBtn } from '@/components/pen/lists';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed, formatTime } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface Props {
    can_proofs: boolean;
    proofs: { id: number; customer: string; order: string; amount_minor: number; method: string; at: string }[];
    proofs_total: number;
    payments: { id: number; number: string; customer: string; amount_minor: number; method: string; at: string }[];
    refunds: { id: number; customer: string; order: string; remaining_minor: number }[];
    receivables: { id: number; name: string; due_minor: number }[];
}
const Head2 = ({ title, href, link }: { title: string; href: string; link: string }) => (
    <div className="flex w-full items-center justify-between gap-[12px]">
        <Link href={href} className="flex h-[44px] items-center rounded-[9px] bg-[var(--surface)] p-[0px_16px] text-[14px] font-[600] text-[var(--primary)]">{link}</Link>
        <div className="flex-1 text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">{title}</div>
    </div>
);
const Box = ({ children, bg = 'var(--surface)' }: { children: ReactNode; bg?: string }) => (
    <div className="flex flex-1 flex-col gap-[12px] rounded-[12px] p-[20px]" style={{ background: bg }}>{children}</div>
);

/** S-009 — لوحة الحسابات. pendev: MVRs5 (بيانات حقيقية؛ أقسام فارغة تعرض حالة «لا يوجد»). */
export default function AccountantDashboard({ can_proofs, proofs, proofs_total, payments, refunds, receivables }: Props) {
    return (
        <AppLayout active="/accounting/dashboard">
            <Head title="لوحة الحسابات" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead crumbs={[{ label: 'المحاسبة', href: '/accounting' }, 'لوحة الحسابات']} title="لوحة الحسابات" subtitle="متابعة التحصيلات والمديونيات والعمليات المالية التي تحتاج مراجعة." />
                {can_proofs && (
                    <div className="flex w-full flex-col gap-[12px] rounded-[12px] bg-[#EFF6FF] p-[16px]">
                        <Head2 title={`إثباتات الدفع بانتظار المراجعة (${proofs_total})`} href="/accounting/proofs" link="عرض كل الإثباتات" />
                        <DataGrid
                            empty="لا توجد إثباتات بانتظار المراجعة."
                            rows={proofs}
                            cols={[
                                { h: 'الإجراء', w: 184, cell: () => <RowBtn primary href="/accounting/proofs">مراجعة الإثبات</RowBtn> },
                                { h: 'وقت الإرسال', w: 240, cell: (p) => `${formatDate(p.at)}، ${formatTime(p.at)}` },
                                { h: 'طريقة الدفع', w: 170, cell: (p) => p.method },
                                { h: 'مبلغ الإثبات', w: 140, cell: (p) => <b>{formatMoneyFixed(p.amount_minor)}</b> },
                                { h: 'الأوردر', w: 140, cell: (p) => p.order },
                                { h: 'العميل', w: 230, cell: (p) => p.customer },
                            ]}
                        />
                    </div>
                )}
                <Head2 title="أحدث التحصيلات" href="/accounting" link="عرض كل التحصيلات" />
                <DataGrid
                    empty="لا توجد تحصيلات مؤكدة بعد."
                    rows={payments}
                    cols={[
                        { h: 'تاريخ التأكيد', w: 326, cell: (p) => `${formatDate(p.at)}، ${formatTime(p.at)}` },
                        { h: 'طريقة الدفع', w: 200, cell: (p) => p.method },
                        { h: 'المبلغ', w: 170, cell: (p) => <b>{formatMoneyFixed(p.amount_minor)}</b> },
                        { h: 'العميل', w: 285, cell: (p) => p.customer },
                        { h: 'رقم العملية', cell: (p) => <Link href={`/accounting/payments/${p.id}`}>{p.number}</Link> },
                    ]}
                />
                <div className="flex w-full gap-[16px]">
                    <Box>
                        <Head2 title="استردادات بانتظار الصرف" href="/accounting?tab=refunds" link="عرض الكل" />
                        {refunds.length === 0 && <div className="text-right text-[13px] text-[var(--muted-foreground)]">لا توجد استردادات مستحقة.</div>}
                        {refunds.map((r) => (
                            <div key={r.id} className="flex justify-between text-[13px] text-[var(--ink)]">
                                <b>{formatMoneyFixed(r.remaining_minor)}</b>
                                <span>{`${r.customer} • ${r.order}`}</span>
                            </div>
                        ))}
                    </Box>
                    <Box>
                        <Head2 title="أعلى المديونيات" href="/accounting?tab=receivables" link="عرض الكل" />
                        {receivables.length === 0 && <div className="text-right text-[13px] text-[var(--muted-foreground)]">لا توجد مديونيات.</div>}
                        {receivables.map((r) => (
                            <div key={r.id} className="flex justify-between text-[13px] text-[var(--ink)]">
                                <b>{formatMoneyFixed(r.due_minor)}</b>
                                <Link href={`/customers/${r.id}/financial`}>{r.name}</Link>
                            </div>
                        ))}
                    </Box>
                </div>
            </div>
        </AppLayout>
    );
}
