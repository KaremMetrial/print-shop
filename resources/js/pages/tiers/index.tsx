import { PenBreadcrumb, PenButton, PenAction11, PenFilterMenu, PenPagination, PenStatusFixed } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { Icon } from '@/pen/icon';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Tier {
    id: number;
    name: string;
    mode: string;
    percent: string | null;
    active: boolean;
    default: boolean;
    customers: number;
    products: number;
}
const th = 'shrink-0 text-right text-[11px] leading-[18px] font-[600] text-[var(--text-secondary)]';
const td = 'shrink-0 text-right text-[11px] leading-[18px] font-[400] text-[var(--ink)]';

/** S-036 — شرائح الأسعار (pendev: d50eC) */
export default function TiersIndex({ tiers: tierPage, filters, activeCount, can }: { tiers: { data: Tier[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number }; filters: Record<string, string>; activeCount: number; can: { manage: boolean } }) {
    const tiers = tierPage.data;
    const [q, setQ] = useState(filters.q ?? '');
    const go = (n: Record<string, string | undefined>) => router.get('/pricing', { ...filters, ...n }, { preserveState: true, preserveScroll: true, replace: true });
    return (
        <AppLayout>
            <Head title="شرائح الأسعار" />
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'التسعير', 'شرائح الأسعار']} />
            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                <div className="flex flex-1 flex-col gap-[3px]">
                    <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">شرائح الأسعار</h1>
                    <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">{activeCount} شرائح أسعار نشطة</div>
                </div>
            </div>
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ q: q || undefined });
                }}
                className="flex h-[52px] w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--surface)] p-[0px_16px] [outline:1px_solid_#93C5FD] [outline-offset:-0.5px]"
            >
                <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الشريحة" aria-label="بحث" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[22px] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                <button type="submit" aria-label="بحث">
                    <Icon name="search" className="h-[20px] w-[20px]" color="var(--primary)" />
                </button>
            </form>
            <div className="flex w-full shrink-0 items-center gap-[12px]">
                <PenFilterMenu label="الحالة" value={filters.status ?? ''} onChange={(v) => go({ status: v || undefined })} options={[{ value: '', label: 'الكل' }, { value: 'active', label: 'نشط' }, { value: 'inactive', label: 'غير نشط' }]} />
                <PenFilterMenu label="طريقة التسعير" value={filters.mode ?? ''} onChange={(v) => go({ mode: v || undefined })} options={[{ value: '', label: 'الكل' }, { value: 'PERCENTAGE', label: 'خصم بالنسبة المئوية' }, { value: 'FIXED_BASE', label: 'سعر أساسي مخصص' }]} />
            </div>
            <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="flex h-[44px] w-full shrink-0 items-center justify-end gap-[8px] bg-[var(--surface-subtle)] p-[0px_14px]">
                    <div className={`${th} w-[240px]`}>الإجراءات</div>
                    <div className={`${th} w-[100px]`}>الحالة</div>
                    <div className={`${th} w-[100px]`}>عدد العملاء</div>
                    <div className={`${th} w-[100px]`}>المنتجات المهيأة</div>
                    <div className={`${th} w-[100px]`}>التسعير</div>
                    <div className={`${th} w-[150px]`}>طريقة التسعير</div>
                    <div className={`${th} w-[180px]`}>اسم الشريحة</div>
                </div>
                {tiers.length === 0 && <div className="p-8 text-center text-[13px] text-[var(--muted-foreground)]">لا توجد شرائح مطابقة.</div>}
                {tiers.map((t) => (
                    <div key={t.id} className="flex h-[67.5px] w-full shrink-0 items-center justify-end gap-[8px] p-[0px_14px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                        <div className="flex w-[300px] shrink-0 items-center justify-end gap-[6px]">
                            <PenAction11 href={`/pricing/${t.id}/edit#products`} width={92}>
                                عرض المنتجات
                            </PenAction11>
                            {can.manage && (
                                <PenAction11 href={`/pricing/${t.id}/edit`} width={92}>
                                    تعديل
                                </PenAction11>
                            )}
                        </div>
                        <div className="flex w-[100px] shrink-0 justify-end">
                            <PenStatusFixed on={t.active} />
                        </div>
                        <div className={`${td} w-[100px]`}>{t.customers}</div>
                        <div className={`${td} w-[100px]`}>{t.products}</div>
                        <div className={`${td} w-[100px] font-[600]`}>{t.mode === 'PERCENTAGE' ? `${Number(t.percent ?? 0)}%` : 'مخصص'}</div>
                        <div className={`${td} w-[150px]`}>{t.mode === 'PERCENTAGE' ? 'خصم بالنسبة المئوية' : 'سعر أساسي مخصص'}</div>
                        <div className="w-[180px] shrink-0 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{t.name}</div>
                    </div>
                ))}
            </div>
            {tierPage.last_page > 1 && <PenPagination page={tierPage.current_page} pages={tierPage.last_page} summary={`عرض ${tierPage.from ?? 0}–${tierPage.to ?? 0} من ${tierPage.total} شريحة`} onPage={(p) => go({ page: String(p) })} />}
            {can.manage && (
                <div className="flex w-full shrink-0 justify-start">
                    <PenButton href="/pricing/create">إضافة شريحة سعر</PenButton>
                </div>
            )}
        </AppLayout>
    );
}
