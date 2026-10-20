import { CustomerShell, type CustomerHead } from '@/components/pen/customer-shell';
import { DataGrid, Pill, RowBtn } from '@/components/pen/lists';
import { PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, formatMoneyFixed } from '@/lib/money';
import { Head, router } from '@inertiajs/react';

interface Pg<T> {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}
interface Props {
    tab: 'orders' | 'financial' | 'payments' | 'refunds';
    customer: CustomerHead;
    orders?: Pg<{ id: number; number: string; status: string; status_label: string; items: number; created_at: string | null; total_minor?: number }>;
    price?: boolean;
    summary?: { orders_total_minor: number; paid_minor: number; due_minor: number; refund_due_minor: number; refund_paid_minor: number };
    ledger?: { at: string; type: string; order: string | null; debit_minor: number; credit_minor: number; balance_minor: number; ref: string }[];
    can_ledger?: boolean;
    payments?: Pg<{ id: number; number: string; amount_minor: number; method: string; status: string; at: string; target: string | null }>;
    refunds?: { id: number; ref: string; order: string; due_minor: number; paid_minor: number; remaining_minor: number }[];
}
const META = {
    orders: ['أوردرات العميل', 'S-025', 'أوردرات العميل ومراحلها.'],
    financial: ['الملخص المالي', 'S-026', 'نظرة مالية على حساب العميل وحركات كشف الحساب.'],
    payments: ['مدفوعات العميل', 'S-027', 'سجل مدفوعات العميل.'],
    refunds: ['استردادات العميل', 'S-030', 'التزامات الاسترداد والمبالغ المردودة.'],
} as const;
const Card = ({ k, v, bg, fg }: { k: string; v: string; bg: string; fg: string }) => (
    <div className="flex flex-1 flex-col gap-[4px] rounded-[12px] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]" style={{ background: bg }}>
        <div className="w-full text-right text-[12px] leading-[19px] text-[var(--muted-foreground)]">{k}</div>
        <div className="w-full text-right text-[20px] leading-[32px] font-[700]" style={{ color: fg }}>{v}</div>
    </div>
);
const pager = (p: Pg<unknown>) => <PenPagination page={p.current_page} pages={p.last_page} summary={`عرض ${p.from ?? 0}–${p.to ?? 0} من ${p.total}`} onPage={(n) => router.get(window.location.pathname, { page: n }, { preserveState: true, preserveScroll: true })} />;

/** S-025/026/027/030 — تبويبات ملف العميل المالية. pendev: Hri2c / WDiqf / Lxd8z / oodXi */
export default function CustomerFinance({ tab, customer, orders, price, summary, ledger, can_ledger, payments, refunds }: Props) {
    const [title, , sub] = META[tab];
    return (
        <AppLayout active="/customers">
            <Head title={`${title} — ${customer.name}`} />
            <CustomerShell customer={customer} active={tab} title={title} subtitle={sub} crumb={title}>
                {tab === 'orders' && orders && (
                    <>
                        <DataGrid
                            empty="لا توجد أوردرات لهذا العميل."
                            rows={orders.data}
                            cols={[
                                { h: 'الإجراء', w: 120, cell: (o) => <RowBtn href={`/orders/${o.id}`}>عرض</RowBtn> },
                                { h: 'الحالة', w: 150, cell: (o) => <Pill bg="#EFF6FF" fg="#1D4ED8">{o.status_label}</Pill> },
                                ...(price ? [{ h: 'الإجمالي', w: 120, cell: (o: NonNullable<Props['orders']>['data'][number]) => <b>{formatMoneyFixed(o.total_minor ?? 0)}</b> }] : []),
                                { h: 'البنود', w: 80, cell: (o) => o.items },
                                { h: 'التاريخ', w: 130, cell: (o) => (o.created_at ? formatDate(o.created_at) : '—') },
                                { h: 'رقم الأوردر', cell: (o) => <b>{o.number}</b> },
                            ]}
                        />
                        {pager(orders)}
                    </>
                )}
                {tab === 'financial' && summary && (
                    <>
                        <div className="flex w-full gap-[14px]">
                            <Card k="إجمالي قيمة الأوردرات" v={formatMoney(summary.orders_total_minor)} bg="#fff" fg="#0F172A" />
                            <Card k="مدفوعات مؤكدة" v={formatMoney(summary.paid_minor)} bg="#F0FDF4" fg="#15803D" />
                            <Card k="الرصيد المستحق" v={formatMoney(summary.due_minor)} bg="#FFFBEB" fg="#B45309" />
                            <Card k="استرداد مستحق" v={formatMoney(summary.refund_due_minor)} bg="#FEF2F2" fg="#B91C1C" />
                            <Card k="استرداد مدفوع" v={formatMoney(summary.refund_paid_minor)} bg="#F1F5F9" fg="#475569" />
                        </div>
                        <div className="w-full text-right text-[12px] text-[#B91C1C]">الاسترداد المستحق منفصل عن مديونية العميل ولا يُخصم من الرصيد المستحق حتى تنفيذ عملية الاسترداد.</div>
                        {can_ledger && (
                            <>
                                <div className="w-full text-right text-[18px] font-[700] text-[var(--ink)]">معاينة كشف الحساب — آخر 5 حركات</div>
                                <DataGrid
                                    empty="لا توجد حركات مالية."
                                    rows={(ledger ?? []).map((l, i) => ({ ...l, id: i }))}
                                    cols={[
                                        { h: 'الرصيد / المرجع', cell: (l) => `رصيد ${formatMoney(l.balance_minor)} • ${l.ref}` },
                                        { h: 'دائن', w: 116, cell: (l) => (l.credit_minor ? <span style={{ color: '#15803D' }}>{formatMoney(l.credit_minor)}</span> : '—') },
                                        { h: 'مدين', w: 116, cell: (l) => (l.debit_minor ? <span style={{ color: '#B45309' }}>{formatMoney(l.debit_minor)}</span> : '—') },
                                        { h: 'الأوردر', w: 112, cell: (l) => l.order ?? '—' },
                                        { h: 'نوع الحركة', w: 140, cell: (l) => l.type },
                                        { h: 'التاريخ', w: 130, cell: (l) => formatDate(l.at) },
                                    ]}
                                />
                            </>
                        )}
                    </>
                )}
                {tab === 'payments' && payments && (
                    <>
                        <DataGrid
                            empty="لا توجد مدفوعات."
                            rows={payments.data}
                            cols={[
                                { h: 'الإجراء', w: 120, cell: (p) => <RowBtn href={`/accounting/payments/${p.id}`}>التفاصيل</RowBtn> },
                                { h: 'الحالة', w: 90, cell: (p) => (p.status === 'CONFIRMED' ? <Pill bg="#E6F5EA" fg="#237A4B">مؤكدة</Pill> : <Pill bg="#FEF0F0" fg="#B42318">ملغاة</Pill>) },
                                { h: 'التخصيص', w: 110, cell: (p) => p.target ?? 'عامة (FIFO)' },
                                { h: 'طريقة الدفع', w: 120, cell: (p) => p.method },
                                { h: 'المبلغ', w: 120, cell: (p) => <b>{formatMoneyFixed(p.amount_minor)}</b> },
                                { h: 'التاريخ', w: 130, cell: (p) => formatDate(p.at) },
                                { h: 'رقم الدفعة', cell: (p) => <b>{p.number}</b> },
                            ]}
                        />
                        {pager(payments)}
                    </>
                )}
                {tab === 'refunds' && refunds && (
                    <DataGrid
                        empty="لا توجد التزامات استرداد."
                        rows={refunds}
                        cols={[
                            { h: 'المتبقي رده', w: 130, cell: (r) => <b>{formatMoneyFixed(r.remaining_minor)}</b> },
                            { h: 'المردود', w: 130, cell: (r) => formatMoneyFixed(r.paid_minor) },
                            { h: 'المستحق', w: 130, cell: (r) => formatMoneyFixed(r.due_minor) },
                            { h: 'الأوردر', w: 130, cell: (r) => r.order },
                            { h: 'المرجع', cell: (r) => <b>{r.ref}</b> },
                        ]}
                    />
                )}
            </CustomerShell>
        </AppLayout>
    );
}
