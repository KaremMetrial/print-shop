import { PenBadge, PenBreadcrumb, PenButton, PenFilterMenu, PenPageHeader, PenPagination, PenRowAction } from '@/components/pen/primitives';
import { tierTone } from '@/components/pen/customer-shell';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, formatTime } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Row {
    id: number;
    code: string;
    name: string;
    phone: string;
    tier: string;
    platform_access: boolean;
    orders_count: number;
    balance_minor?: number;
    created_at: string;
}
interface Props {
    customers: { data: Row[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    filters: Record<string, string>;
    tiers: { id: number; name: string }[];
    can: { create: boolean; balance: boolean };
    total: number;
    now: string;
}

const cellMuted = 'shrink-0 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]';
const th = 'shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]';

/** S-022 — قائمة العملاء (pendev: Kngwu). */
export default function CustomersIndex({ customers, filters, tiers, can, total, now }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const go = (next: Record<string, string | undefined>) => router.get('/customers', { ...filters, page: undefined, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    const d = new Date(now);
    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <AppLayout>
            <Head title="العملاء" />
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'العملاء']} />
            <PenPageHeader title="العملاء" subtitle={`${total} عميلًا`}>
                {can.create && <PenButton href="/customers/create">إضافة عميل جديد</PenButton>}
            </PenPageHeader>

            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ q: q || undefined });
                }}
                className="flex h-[52px] w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]"
            >
                <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم العميل أو رقم الهاتف" aria-label="بحث في العملاء" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                <button type="submit" aria-label="بحث">
                    <Icon name="search" className="h-[20px] w-[20px] shrink-0" color="var(--primary)" />
                </button>
            </form>

            <div className="flex w-full shrink-0 items-center gap-[12px]">
                <PenButton
                    variant="secondary"
                    onClick={() => {
                        setQ('');
                        router.get('/customers');
                    }}
                    disabled={!hasFilters}
                >
                    مسح
                </PenButton>
                <PenFilterMenu label="تاريخ الإضافة" value={filters.added ?? ''} onChange={(v) => go({ added: v || undefined })} options={[{ value: '', label: 'الكل' }, { value: '1', label: 'اليوم' }, { value: '7', label: 'آخر 7 أيام' }, { value: '30', label: 'آخر 30 يومًا' }, { value: '90', label: 'آخر 90 يومًا' }]} />
                {can.balance && <PenFilterMenu label="الرصيد المستحق" value={filters.balance ?? ''} onChange={(v) => go({ balance: v || undefined })} options={[{ value: '', label: 'الكل' }, { value: 'due', label: 'عليه رصيد' }, { value: 'clear', label: 'بدون رصيد' }]} />}
                <PenFilterMenu label="دخول المنصة" value={filters.access ?? ''} onChange={(v) => go({ access: v || undefined })} options={[{ value: '', label: 'الكل' }, { value: 'enabled', label: 'مفعّل' }, { value: 'disabled', label: 'غير مفعّل' }]} />
                <PenFilterMenu label="شريحة السعر" value={filters.tier ?? ''} onChange={(v) => go({ tier: v || undefined })} options={[{ value: '', label: 'الكل' }, ...tiers.map((t) => ({ value: String(t.id), label: t.name }))]} />
            </div>

            <div className="flex w-full shrink-0 items-center gap-[12px]">
                <div className="h-[20px] w-[300px] shrink-0 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">آخر تحديث اليوم، {formatTime(d)}</div>
                <div className="flex-1 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                    {customers.total === 0 ? 'لا توجد نتائج' : `عرض ${customers.from}–${customers.to} من ${customers.total} عميلًا`}
                </div>
            </div>

            <div className="flex w-full min-w-0 shrink-0 flex-col overflow-x-auto rounded-[10px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="flex h-[43.5px] w-full shrink-0 items-center gap-[10px] bg-[var(--surface-subtle)] p-[0px_16px] [border-bottom:1px_solid_var(--border)]">
                    <div className={`${th} w-[190px]`}>الإجراءات</div>
                    <div className={`${th} w-[110px]`}>تاريخ الإضافة</div>
                    {can.balance && <div className={`${th} w-[112px]`}>الرصيد المستحق</div>}
                    <div className={`${th} w-[82px]`}>عدد الأوردرات</div>
                    <div className={`${th} w-[106px]`}>دخول المنصة</div>
                    <div className={`${th} w-[100px]`}>شريحة السعر</div>
                    <div className={`${th} w-[128px]`}>رقم الهاتف</div>
                    <div className={`${th} flex-1`}>اسم العميل</div>
                </div>
                {customers.data.length === 0 && (
                    <div className="flex flex-col items-center gap-[4px] p-[40px] text-center">
                        <div className="text-[15px] font-[700] text-[var(--ink)]">{hasFilters ? 'لا توجد نتائج' : 'لا يوجد عملاء حتى الآن.'}</div>
                        <div className="text-[13px] text-[var(--muted-foreground)]">{hasFilters ? 'لا توجد نتائج مطابقة لبحثك.' : 'أضف أول عميل للبدء.'}</div>
                    </div>
                )}
                {customers.data.map((c) => (
                    <div key={c.id} className="flex h-[67.5px] w-full shrink-0 items-center gap-[10px] bg-[var(--surface)] p-[0px_16px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                        <div className="flex w-[190px] shrink-0 items-center justify-end gap-[8px]">
                            <PenRowAction href={`/orders/create?customer=${c.id}`}>إنشاء أوردر</PenRowAction>
                            <PenRowAction href={`/customers/${c.id}`}>عرض العميل</PenRowAction>
                        </div>
                        <div className={`${cellMuted} w-[110px]`}>{formatDate(c.created_at)}</div>
                        {can.balance && <div className={`${cellMuted} w-[112px] font-[600] ${(c.balance_minor ?? 0) > 0 ? 'text-[#B45309]' : 'text-[#15803D]'}`}>{formatMoney(c.balance_minor ?? 0)}</div>}
                        <div className={`${cellMuted} w-[82px]`}>{c.orders_count}</div>
                        <div className="flex w-[106px] shrink-0 flex-col items-end">
                            <PenBadge tone={c.platform_access ? 'green' : 'gray'}>{c.platform_access ? 'مفعّل' : 'غير مفعّل'}</PenBadge>
                        </div>
                        <div className="flex w-[100px] shrink-0 flex-col items-end">
                            <PenBadge tone={tierTone(c.tier)}>{c.tier}</PenBadge>
                        </div>
                        <div className={`${cellMuted} w-[128px]`}>
                            <bdi dir="ltr">{c.phone}</bdi>
                        </div>
                        <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{c.name}</div>
                    </div>
                ))}
            </div>

            <PenPagination page={customers.current_page} pages={customers.last_page} summary={`عرض ${customers.from ?? 0}–${customers.to ?? 0} من ${customers.total} • صفحة ${customers.current_page} من ${customers.last_page}`} onPage={(p) => router.get('/customers', { ...filters, page: p }, { preserveState: true, preserveScroll: true })} />
        </AppLayout>
    );
}
