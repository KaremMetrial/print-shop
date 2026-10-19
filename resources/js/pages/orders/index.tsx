import { PenBadge, PenBreadcrumb, PenButton, PenFilterMenu, PenPageHeader, PenPagination, PenRowAction, type BadgeTone } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Row {
    id: number;
    number: string;
    customer: string;
    phone: string;
    status: string;
    status_label: string;
    delivery_method: 'PICKUP' | 'DELIVERY';
    items_count: number;
    grand_total_minor: number;
    created_at: string;
}
interface Props {
    orders: { data: Row[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    filters: Record<string, string>;
    statuses: { value: string; label: string }[];
    can: { create: boolean };
    total: number;
}

const tone = (s: string): BadgeTone => ({ DESIGN_STAGE: 'amber', IN_PRINTING: 'blue', READY_FOR_PICKUP: 'green', READY_FOR_DELIVERY: 'green', OUT_FOR_DELIVERY: 'violet', COMPLETED: 'gray', CANCELLED: 'red' })[s] as BadgeTone;
const cell = 'shrink-0 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]';
const th = 'shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]';

/** S-010 — قائمة الأوردرات: لا يوجد frame في الـpen؛ مبنية على قالب «قائمة» وجدول «Orders — canonical V2» (انظر docs/11-ui-deviations.md). */
export default function OrdersIndex({ orders, filters, statuses, can, total }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const go = (next: Record<string, string | undefined>) => router.get('/orders', { ...filters, page: undefined, ...next }, { preserveState: true, replace: true });
    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <AppLayout active="/orders">
            <Head title="الأوردرات" />
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'الأوردرات']} />
            <PenPageHeader title="الأوردرات" subtitle={`${total} أوردرًا`}>
                {can.create && <PenButton href="/orders/create">إنشاء أوردر جديد</PenButton>}
            </PenPageHeader>
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ q: q || undefined });
                }}
                className="flex h-[52px] w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]"
            >
                <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الأوردر أو اسم العميل" aria-label="بحث في الأوردرات" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                <button type="submit" aria-label="بحث">
                    <Icon name="search" className="h-[20px] w-[20px] shrink-0" color="var(--primary)" />
                </button>
            </form>
            <div className="flex w-full shrink-0 items-center gap-[12px]">
                <PenButton
                    variant="secondary"
                    onClick={() => {
                        setQ('');
                        router.get('/orders');
                    }}
                    disabled={!hasFilters}
                >
                    مسح
                </PenButton>
                <PenFilterMenu label="التسليم" value={filters.delivery ?? ''} onChange={(v) => go({ delivery: v || undefined })} options={[{ value: '', label: 'الكل' }, { value: 'PICKUP', label: 'استلام' }, { value: 'DELIVERY', label: 'توصيل' }]} />
                <PenFilterMenu label="الحالة" value={filters.status ?? ''} onChange={(v) => go({ status: v || undefined })} options={[{ value: '', label: 'الكل' }, ...statuses]} />
            </div>
            <div className="w-full text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">{orders.total === 0 ? 'لا توجد نتائج' : `عرض ${orders.from}–${orders.to} من ${orders.total} أوردرًا`}</div>

            <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[10px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="flex h-[43.5px] w-full shrink-0 items-center gap-[10px] bg-[var(--surface-subtle)] p-[0px_16px] [border-bottom:1px_solid_var(--border)]">
                    <div className={`${th} w-[110px]`}>الإجراءات</div>
                    <div className={`${th} w-[110px]`}>تاريخ الإنشاء</div>
                    <div className={`${th} w-[120px]`}>الإجمالي</div>
                    <div className={`${th} w-[70px]`}>البنود</div>
                    <div className={`${th} w-[100px]`}>التسليم</div>
                    <div className={`${th} w-[130px]`}>الحالة</div>
                    <div className={`${th} flex-1`}>العميل</div>
                    <div className={`${th} w-[110px]`}>رقم الأوردر</div>
                </div>
                {orders.data.length === 0 && (
                    <div className="flex flex-col items-center gap-[4px] p-[40px] text-center">
                        <div className="text-[15px] font-[700] text-[var(--ink)]">{hasFilters ? 'لا توجد نتائج' : 'لا توجد أوردرات حتى الآن.'}</div>
                        <div className="text-[13px] text-[var(--muted-foreground)]">{hasFilters ? 'لا توجد نتائج مطابقة لبحثك.' : 'أنشئ أول أوردر للبدء.'}</div>
                    </div>
                )}
                {orders.data.map((o) => (
                    <div key={o.id} className="flex h-[67.5px] w-full shrink-0 items-center gap-[10px] bg-[var(--surface)] p-[0px_16px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                        <div className="flex w-[110px] shrink-0 items-center justify-end">
                            <PenRowAction href={`/orders/${o.id}`}>عرض الأوردر</PenRowAction>
                        </div>
                        <div className={`${cell} w-[110px]`}>{formatDate(o.created_at)}</div>
                        <div className={`${cell} w-[120px] font-[600]`}>{formatMoney(o.grand_total_minor)}</div>
                        <div className={`${cell} w-[70px]`}>{o.items_count}</div>
                        <div className={`${cell} w-[100px]`}>{o.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام'}</div>
                        <div className="flex w-[130px] shrink-0 flex-col items-end">
                            <PenBadge tone={tone(o.status)}>{o.status_label}</PenBadge>
                        </div>
                        <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{o.customer}</div>
                        <div className={`${cell} w-[110px] font-[600]`}>{o.number}</div>
                    </div>
                ))}
            </div>
            <PenPagination page={orders.current_page} pages={orders.last_page} summary={`عرض ${orders.from ?? 0}–${orders.to ?? 0} من ${orders.total} • صفحة ${orders.current_page} من ${orders.last_page}`} onPage={(p) => router.get('/orders', { ...filters, page: p }, { preserveState: true })} />
        </AppLayout>
    );
}
