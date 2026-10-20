import { PageTabs } from '@/components/pen/page-tabs';
import { PenBreadcrumb } from '@/components/pen/primitives';
import { type ReactNode } from 'react';

export interface ProductHead {
    id: number;
    name: string;
    category: string;
    active: boolean;
}

const TABS: [string, string, string][] = [
    ['activity', 'سجل النشاط', '/activity'],
    ['routing', 'توزيع التصميم', '/routing'],
    ['pricing', 'التسعير', '/pricing'],
    ['specs', 'المواصفات', '/specs'],
    ['basic', 'البيانات الأساسية', '/edit'],
];
const TITLES: Record<string, string> = { basic: 'البيانات الأساسية', specs: 'المواصفات', pricing: 'التسعير', routing: 'توزيع التصميم', activity: 'سجل النشاط' };

/** غلاف محرر المنتج (S-034): عنوان + تبويبات (pen: Product editor tabs) */
export function ProductShell({ product, active, children, title = 'تعديل المنتج' }: { product: ProductHead | null; active: string; children: ReactNode; title?: string }) {
    const base = product ? `/products/${product.id}` : '';
    return (
        <>
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'المنتجات', href: '/products' }, `محرر المنتج — ${TITLES[active]}`]} />
            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                <div className="flex flex-1 flex-col gap-[3px]">
                    <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">{product ? title : 'إضافة منتج'}</h1>
                    {product && (
                        <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                            {product.name} • {product.category}
                        </div>
                    )}
                </div>
            </div>
            {product && (
                <PageTabs label="أقسام المنتج" value={active} tabs={TABS.map(([key, label, suffix]) => ({ key, label, href: base + suffix }))} />
            )}
            {children}
        </>
    );
}

export const formCard = 'flex w-full shrink-0 flex-col gap-[18px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
export const cardTitle = 'w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]';
