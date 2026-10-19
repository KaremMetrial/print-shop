import { PaymentDialog, ReasonDialog } from '@/components/finance/payment-dialog';
import { DataGrid, ListHead, Pill, RowBtn, SearchBox, TabsBar } from '@/components/pen/lists';
import { PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed, formatTime } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Pay {
    id: number;
    number: string;
    customer: string;
    customer_id: number;
    amount_minor: number;
    method: string;
    status: 'CONFIRMED' | 'VOIDED';
    at: string;
    target: string | null;
}
interface Props {
    tab: 'payments' | 'receivables' | 'refunds';
    methods: Record<string, string>;
    filters: Record<string, string>;
    can: { create: boolean; correct: boolean; refund: boolean };
    payments?: { data: Pay[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    customers?: { id: number; name: string }[];
    receivables?: { id: number; name: string; phone: string; due_minor: number }[];
    total_due_minor?: number;
    refunds?: { id: number; order: string; customer: string; due_minor: number; paid_minor: number; remaining_minor: number }[];
}
type Dlg = { kind: 'new' } | { kind: 'correct' | 'void'; p: Pay } | { kind: 'payout'; r: NonNullable<Props['refunds']>[number] } | { kind: 'collect'; cid: number };

/** S-051 التحصيلات · S-054 المديونيات · S-055/056 المستردات · S-058 التصحيح المالي. الأرقام من PaymentService فقط. */
export default function Accounting({ tab, filters, can, payments, customers, receivables, total_due_minor, refunds }: Props) {
    const [dlg, setDlg] = useState<Dlg | null>(null);
    const go = (n: Record<string, string | undefined>) => router.get('/accounting', { tab, ...filters, ...n }, { preserveState: true });
    const close = () => setDlg(null);
    return (
        <AppLayout active="/accounting">
            <Head title="المحاسبة" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead
                    crumbs={[{ label: 'الرئيسية', href: '/dashboard' }, 'المحاسبة']}
                    title="المحاسبة"
                    subtitle="التحصيلات والمديونيات والمستردات."
                    actions={can.create && tab === 'payments' ? <button type="button" onClick={() => setDlg({ kind: 'new' })} className="flex h-[46px] items-center rounded-[10px] bg-[var(--primary)] p-[0px_18px] text-[14px] font-[600] text-white">تسجيل دفعة</button> : undefined}
                />
                <TabsBar
                    value={tab}
                    onChange={(t) => router.get('/accounting', { tab: t })}
                    tabs={[
                        ['payments', 'التحصيلات'],
                        ['receivables', 'المديونيات'],
                        ['refunds', 'المستردات'],
                    ]}
                />
                {tab === 'payments' && payments && (
                    <>
                        <div className="flex w-full items-center gap-[12px]">
                            <select aria-label="الحالة" value={filters.status ?? ''} onChange={(e) => go({ status: e.target.value || undefined })} className="h-[46px] rounded-[10px] bg-[var(--background)] p-[0px_14px] text-[14px] [outline:1px_solid_var(--control-border)]">
                                <option value="">كل الحالات</option>
                                <option value="CONFIRMED">مؤكدة</option>
                                <option value="VOIDED">ملغاة</option>
                            </select>
                            <SearchBox value={filters.q ?? ''} onSubmit={(q) => go({ q: q || undefined })} placeholder="ابحث برقم الدفعة أو اسم العميل" />
                        </div>
                        <DataGrid
                            empty="لا توجد دفعات مطابقة."
                            rows={payments.data}
                            cols={[
                                {
                                    h: 'الإجراءات',
                                    w: 230,
                                    cell: (p) =>
                                        p.status === 'CONFIRMED' && can.correct ? (
                                            <div className="flex gap-[6px]">
                                                <RowBtn onClick={() => setDlg({ kind: 'correct', p })}>تصحيح</RowBtn>
                                                <RowBtn onClick={() => setDlg({ kind: 'void', p })}>إلغاء الدفعة</RowBtn>
                                            </div>
                                        ) : null,
                                },
                                { h: 'الحالة', w: 90, cell: (p) => (p.status === 'CONFIRMED' ? <Pill bg="#E6F5EA" fg="#237A4B">مؤكدة</Pill> : <Pill bg="#FEF0F0" fg="#B42318">ملغاة</Pill>) },
                                { h: 'التخصيص', w: 100, cell: (p) => p.target ?? 'عامة (FIFO)' },
                                { h: 'طريقة الدفع', w: 110, cell: (p) => p.method },
                                { h: 'المبلغ', w: 110, cell: (p) => <b>{formatMoneyFixed(p.amount_minor)}</b> },
                                { h: 'التاريخ', w: 150, cell: (p) => `${formatDate(p.at)}، ${formatTime(p.at)}` },
                                { h: 'العميل', cell: (p) => p.customer },
                                { h: 'رقم الدفعة', w: 100, cell: (p) => <Link href={`/accounting/payments/${p.id}`}><b>{p.number}</b></Link> },
                            ]}
                        />
                        <PenPagination page={payments.current_page} pages={payments.last_page} summary={`عرض ${payments.from ?? 0}–${payments.to ?? 0} من ${payments.total}`} onPage={(p) => go({ page: String(p) })} />
                    </>
                )}
                {tab === 'receivables' && receivables && (
                    <>
                        <div className="w-full text-right text-[14px] text-[var(--muted-foreground)]">إجمالي المديونيات: <b className="text-[var(--ink)]">{formatMoneyFixed(total_due_minor ?? 0)}</b></div>
                        <DataGrid
                            empty="لا توجد مديونيات."
                            rows={receivables}
                            cols={[
                                { h: 'الإجراءات', w: 170, cell: (r) => (can.create ? <RowBtn primary onClick={() => setDlg({ kind: 'collect', cid: r.id })}>تحصيل</RowBtn> : null) },
                                { h: 'المستحق', w: 140, cell: (r) => <b className="text-[#B45309]">{formatMoneyFixed(r.due_minor)}</b> },
                                { h: 'الهاتف', w: 140, cell: (r) => <bdi dir="ltr">{r.phone}</bdi> },
                                { h: 'العميل', cell: (r) => r.name },
                            ]}
                        />
                    </>
                )}
                {tab === 'refunds' && refunds && (
                    <DataGrid
                        empty="لا توجد مستردات."
                        rows={refunds}
                        cols={[
                            { h: 'الإجراءات', w: 170, cell: (r) => (can.refund && r.remaining_minor > 0 ? <RowBtn primary onClick={() => setDlg({ kind: 'payout', r })}>تسجيل رد مبلغ</RowBtn> : <Pill bg="#E6F5EA" fg="#237A4B">تم الرد</Pill>) },
                            { h: 'المتبقي للرد', w: 130, cell: (r) => <b className="text-[#B45309]">{formatMoneyFixed(r.remaining_minor)}</b> },
                            { h: 'المردود', w: 120, cell: (r) => formatMoneyFixed(r.paid_minor) },
                            { h: 'المستحق', w: 120, cell: (r) => formatMoneyFixed(r.due_minor) },
                            { h: 'العميل', cell: (r) => r.customer },
                            { h: 'الأوردر', w: 100, cell: (r) => r.order },
                        ]}
                    />
                )}
            </div>
            {dlg?.kind === 'new' && <PaymentDialog onClose={close} customers={customers} />}
            {dlg?.kind === 'collect' && <PaymentDialog onClose={close} customerId={dlg.cid} />}
            {dlg?.kind === 'correct' && <ReasonDialog title={`تصحيح الدفعة ${dlg.p.number}`} url={`/accounting/payments/${dlg.p.id}/correct`} onClose={close} withAmount initialAmount={dlg.p.amount_minor} label="حفظ التصحيح" reasonLabel="سبب التصحيح (إلزامي)" />}
            {dlg?.kind === 'void' && <ReasonDialog title={`إلغاء الدفعة ${dlg.p.number}`} url={`/accounting/payments/${dlg.p.id}/void`} onClose={close} label="تأكيد الإلغاء" reasonLabel="سبب الإلغاء (إلزامي)" />}
            {dlg?.kind === 'payout' && <ReasonDialog title={`رد مبلغ — ${dlg.r.order}`} url={`/accounting/refunds/${dlg.r.id}/payout`} onClose={close} withAmount withMethod initialAmount={dlg.r.remaining_minor} label="تسجيل الرد" reasonLabel="ملاحظات (اختياري)" />}
        </AppLayout>
    );
}
