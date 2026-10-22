import { PageTabs } from '@/components/pen/page-tabs';
import { PenBreadcrumb, PenFilterMenu, PenPagination } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed, formatTime } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

type Tab = 'PENDING' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED';
interface Row {
    id: number;
    number: string;
    customer: string;
    submitted_at: string;
    items_count: number;
    total_minor: number;
    status: string;
    status_label: string;
    reviewer: string | null;
}
interface Props {
    requests: { data: Row[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    tab: Tab;
    filters: Record<string, string>;
    counts: Record<Tab, number>;
    reviewers: { id: number; name: string }[];
    customers: { id: number; name: string }[];
}

const TABS: [Tab, string, number][] = [
    ['PENDING', 'بانتظار المراجعة', 146],
    ['IN_REVIEW', 'قيد المراجعة', 122],
    ['ACCEPTED', 'المقبولة', 100],
    ['REJECTED', 'المرفوضة', 107],
];
const pill: Record<string, [string, string]> = { PENDING: ['#FFF3D9', '#895A0D'], IN_REVIEW: ['#E8F1FF', '#2563EB'], ACCEPTED: ['#E7F6EC', '#15803D'], REJECTED: ['#FDECEC', '#B42318'] };
const th = 'flex h-[48px] shrink-0 items-center text-right text-[12px] leading-[normal] font-[600] text-[#475569]';
const td = 'flex h-[68px] shrink-0 items-center text-right text-[12px] leading-[17px] font-[400] text-[var(--ink)]';

/** S-019 — طلبات الأوردرات (pendev: QBHwi). أقدم طلب أولًا (BR-067). */
export default function OrderRequestsIndex({ requests, tab, filters, counts, reviewers, customers }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const go = (next: Record<string, string | undefined>) => router.get('/order-requests', { tab, ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    const pending = counts.PENDING;
    return (
        <AppLayout active="/order-requests">
            <Head title="طلبات الأوردرات" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'طلبات الأوردرات']} />
                <div className="flex w-full shrink-0 items-center justify-between">
                    <div className="flex h-[32px] w-fit shrink-0 items-center rounded-[16px] bg-[#E8F1FF] p-[0px_12px]">
                        <div className="text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{pending === 1 ? 'طلب واحد بانتظار المراجعة' : `${pending} طلبات بانتظار المراجعة`}</div>
                    </div>
                    <h1 className="flex-1 text-right text-[28px] leading-[42px] font-[700] text-[var(--ink)]">طلبات الأوردرات</h1>
                </div>
                <form
                    role="search"
                    onSubmit={(e) => {
                        e.preventDefault();
                        go({ q: q || undefined });
                    }}
                    className="flex h-[46px] w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]"
                >
                    <Icon name="search" className="h-[18px] w-[18px] shrink-0" color="var(--muted-foreground)" />
                    <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الطلب أو اسم العميل" aria-label="بحث" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[21px] font-[400] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                </form>
                <PageTabs label="حالات الطلبات" value={tab} onChange={(k) => go({ tab: k })} tabs={TABS.map(([key, label]) => ({ key, label: `${label} (${counts[key]})` }))} />
                <div className="flex w-full shrink-0 justify-end gap-[8px]">
                    <PenFilterMenu
                        label="الفترة الزمنية"
                        value={filters.period ?? ''}
                        options={[{ value: '', label: 'الكل' }, { value: 'today', label: 'اليوم' }, { value: 'week', label: 'آخر 7 أيام' }, { value: 'month', label: 'آخر 30 يومًا' }]}
                        onChange={(v) => go({ period: v || undefined })}
                    />
                    <PenFilterMenu
                        label="العميل"
                        value={filters.customer ?? ''}
                        options={[{ value: '', label: 'العميل' }, ...customers.map((c) => ({ value: String(c.id), label: c.name }))]}
                        onChange={(v) => go({ customer: v || undefined })}
                    />
                    <PenFilterMenu
                        label="الموظف المسؤول"
                        value={filters.reviewer ?? ''}
                        options={[{ value: '', label: 'الموظف المسؤول' }, ...reviewers.map((c) => ({ value: String(c.id), label: c.name }))]}
                        onChange={(v) => go({ reviewer: v || undefined })}
                    />
                </div>
                <div className="flex w-full min-w-0 shrink-0 flex-col overflow-x-auto rounded-[10px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex h-[47.5px] w-full shrink-0 items-center bg-[var(--background)] p-[0px_16px]">
                        <div className={`${th} w-[120px]`}>الإجراءات</div>
                        <div className={`${th} w-[90px]`}>المراجع</div>
                        <div className={`${th} w-[130px] justify-end`}>الحالة</div>
                        <div className={`${th} w-[135px]`}>الإجمالي المبدئي</div>
                        <div className={`${th} w-[80px]`}>عدد البنود</div>
                        <div className={`${th} w-[190px]`}>تاريخ الإرسال</div>
                        <div className={`${th} flex-1`}>اسم العميل</div>
                        <div className={`${th} w-[140px]`}>رقم الطلب</div>
                    </div>
                    {requests.data.length === 0 && <div className="w-full p-[32px] text-center text-[13px] text-[var(--muted-foreground)]">لا توجد طلبات في هذا التبويب.</div>}
                    {requests.data.map((r) => (
                        <div key={r.id} className="flex h-[67.5px] w-full shrink-0 items-center bg-[var(--surface)] p-[0px_16px]">
                            <div className={`${td} w-[120px]`}>
                                <Link href={`/order-requests/${r.id}`} className="flex h-[34px] w-fit shrink-0 items-center rounded-[7px] bg-[var(--surface)] p-[0px_12px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                    عرض التفاصيل
                                </Link>
                            </div>
                            <div className={`${td} w-[90px]`}>{r.reviewer ?? 'لم يبدأ'}</div>
                            <div className={`${td} w-[130px] justify-end`}>
                                <div className="flex h-[28px] w-fit shrink-0 items-center rounded-[14px] p-[0px_8px]" style={{ background: pill[r.status][0] }}>
                                    <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: pill[r.status][1] }}>{r.status_label}</div>
                                </div>
                            </div>
                            <div className={`${td} w-[135px]`}>{formatMoneyFixed(r.total_minor)}</div>
                            <div className={`${td} w-[80px]`}>{r.items_count}</div>
                            <div className={`${td} w-[190px]`}>{`${formatDate(r.submitted_at)}، ${formatTime(r.submitted_at).replace(/^0/, '')}`}</div>
                            <div className={`${td} flex-1`}>{r.customer}</div>
                            <div className={`${td} w-[140px] font-[700] text-[var(--primary)]`}>{r.number}</div>
                        </div>
                    ))}
                </div>
                <PenPagination page={requests.current_page} pages={requests.last_page} summary={requests.total === 0 ? 'لا توجد نتائج' : `عرض ${requests.from}–${requests.to} من ${requests.total} طلب`} onPage={(p) => go({ page: String(p) })} />
            </div>
        </AppLayout>
    );
}
