import { PenBreadcrumb, PenButton, PenFilterMenu, PenPagination, PenRowAction } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Row {
    id: number;
    name: string;
    category: string;
    price_minor: number;
    min_qty: number | null;
    active: boolean;
    specialty: string | null;
    updated_at: string | null;
}
interface Props {
    products: { data: Row[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number };
    filters: Record<string, string>;
    categories: { id: number; name: string }[];
    specialties: { id: number; name: string }[];
    counts: { total: number; active: number };
    can: { manage: boolean };
}
const th = 'shrink-0 text-right text-[11px] leading-[18px] font-[600] text-[var(--text-secondary)]';
const td = 'shrink-0 text-right text-[11px] leading-[18px] font-[400] text-[var(--ink)]';

/** S-033 — قائمة المنتجات (pendev: hxHrw) */
export default function ProductsIndex({ products, filters, categories, specialties, counts, can }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const go = (n: Record<string, string | undefined>) => router.get('/products', { ...filters, page: undefined, ...n }, { preserveState: true, preserveScroll: true, replace: true });
    return (
        <AppLayout>
            <Head title="المنتجات" />
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'المنتجات', 'قائمة المنتجات']} />
            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                {can.manage && (
                    <div className="flex w-fit shrink-0 items-center gap-[12px]">
                        <PenButton href="/products/create">إضافة منتج</PenButton>
                    </div>
                )}
                <div className="flex flex-1 flex-col gap-[3px]">
                    <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">المنتجات</h1>
                    <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                        {counts.total} منتجات إجمالًا • {counts.active} منتجات نشطة
                    </div>
                </div>
            </div>
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ q: q || undefined });
                }}
                className="flex h-[52px] w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]"
            >
                <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المنتج" aria-label="بحث" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[22px] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                <button type="submit" aria-label="بحث">
                    <Icon name="search" className="h-[20px] w-[20px]" color="var(--primary)" />
                </button>
            </form>
            <div className="flex w-full shrink-0 items-center gap-[12px]">
                <PenFilterMenu label="تخصص المصمم" value={filters.specialty ?? ''} onChange={(v) => go({ specialty: v || undefined })} options={[{ value: '', label: 'الكل' }, ...specialties.map((s) => ({ value: String(s.id), label: s.name }))]} />
                <PenFilterMenu label="حالة المنتج" value={filters.status ?? ''} onChange={(v) => go({ status: v || undefined })} options={[{ value: '', label: 'الكل' }, { value: 'active', label: 'نشط' }, { value: 'inactive', label: 'غير نشط' }]} />
                <PenFilterMenu label="التصنيف" value={filters.category ?? ''} onChange={(v) => go({ category: v || undefined })} options={[{ value: '', label: 'الكل' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]} />
            </div>
            <div className="flex w-full min-w-0 shrink-0 flex-col overflow-x-auto rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="flex h-[44px] w-full shrink-0 items-center gap-[8px] bg-[var(--surface-subtle)] p-[0px_14px]">
                    <div className={`${th} w-[220px]`}>الإجراءات</div>
                    <div className={`${th} w-[110px]`}>آخر تحديث</div>
                    <div className={`${th} w-[140px]`}>تخصص المصمم</div>
                    <div className={`${th} w-[84px]`}>الحالة</div>
                    <div className={`${th} w-[80px]`}>الحد الأدنى</div>
                    <div className={`${th} w-[100px]`}>السعر الأساسي</div>
                    <div className={`${th} w-[120px]`}>التصنيف</div>
                    <div className={`${th} flex-1`}>اسم المنتج</div>
                </div>
                {products.data.length === 0 && <div className="p-8 text-center text-[13px] text-[var(--muted-foreground)]">لا توجد منتجات مطابقة.</div>}
                {products.data.map((p) => (
                    <div key={p.id} className="flex h-[67.5px] w-full shrink-0 items-center gap-[8px] p-[0px_14px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                        <div className="flex w-[220px] shrink-0 items-center gap-[6px]">
                            {can.manage && <PenRowAction href={`/products/${p.id}/edit`}>تعديل</PenRowAction>}
                            <PenRowAction href={`/products/${p.id}/${can.manage ? 'specs' : 'edit'}`}>عرض</PenRowAction>
                        </div>
                        <div className={`${td} w-[110px]`}>{p.updated_at ? formatDate(p.updated_at) : '—'}</div>
                        <div className={`${td} w-[140px]`}>{p.specialty ?? '—'}</div>
                        <div className="flex h-[27px] w-[84px] shrink-0 flex-col items-end justify-center gap-[10px]">
                            <span className={`flex h-[27px] w-[64px] items-center justify-center rounded-[8px] ${p.active ? 'bg-[var(--success-soft)]' : 'bg-[var(--surface-subtle)]'}`}>
                                <span className={`text-left text-[11px] leading-[normal] font-[600] whitespace-nowrap ${p.active ? 'text-[#15803D]' : 'text-[var(--text-secondary)]'}`}>{p.active ? 'نشط' : 'غير نشط'}</span>
                            </span>
                        </div>
                        <div className={`${td} w-[80px]`}>{p.min_qty ?? '—'}</div>
                        <div className={`${td} w-[100px] font-[600]`}>{formatMoneyFixed(p.price_minor)}</div>
                        <div className={`${td} w-[120px]`}>{p.category}</div>
                        <div className="flex-1 text-right text-[12px] leading-[19px] font-[600] text-[var(--ink)]">{p.name}</div>
                    </div>
                ))}
            </div>
            <PenPagination page={products.current_page} pages={products.last_page} summary={`عرض ${products.from ?? 0}–${products.to ?? 0} من ${products.total} • صفحة ${products.current_page} من ${products.last_page}`} onPage={(p) => router.get('/products', { ...filters, page: p }, { preserveState: true, preserveScroll: true })} />
        </AppLayout>
    );
}
