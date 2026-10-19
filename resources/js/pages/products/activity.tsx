import { ProductShell, type ProductHead } from '@/components/pen/product-shell';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed, formatTime } from '@/lib/money';
import { Head } from '@inertiajs/react';

interface Item {
    id: number;
    action: string;
    at: string;
    actor: string;
    old: Record<string, unknown> | null;
    new: Record<string, unknown> | null;
}
const LABEL: Record<string, string> = {
    'product.created': 'إنشاء المنتج',
    'product.price_changed': 'تعديل السعر الأساسي',
    'product.updated': 'تحديث البيانات',
    'product.status_changed': 'تغيير حالة المنتج',
    'product.option_group_created': 'تحديث المواصفات',
    'product.option_group_updated': 'تحديث المواصفات',
};
function detail(a: Item, name: string): string {
    switch (a.action) {
        case 'product.created':
            return `تم إنشاء منتج ${name}`;
        case 'product.price_changed':
            return `تغيير السعر من ${formatMoneyFixed(Number(a.old?.base_unit_price ?? 0))} إلى ${formatMoneyFixed(Number(a.new?.base_unit_price ?? 0))}`;
        case 'product.status_changed':
            return a.new?.is_active ? 'تفعيل المنتج' : 'تعطيل المنتج';
        case 'product.option_group_created':
        case 'product.option_group_updated':
            return `تحديث مجموعة المواصفات «${String(a.new?.group ?? '')}»`;
        default:
            return 'تحديث بيانات المنتج';
    }
}
const th = 'shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]';

/** S-034 — سجل النشاط (pendev: uJOy3). للقراءة فقط. */
export default function ProductActivity({ product, activity }: { product: ProductHead; activity: { data: Item[] } }) {
    const rows = [...activity.data].reverse();
    return (
        <AppLayout>
            <Head title="سجل نشاط المنتج" />
            <ProductShell product={product} active="activity">
                <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex h-[44px] w-full shrink-0 items-center gap-[12px] bg-[var(--surface-subtle)] p-[0px_14px]">
                        <div className={`${th} flex-1`}>التفاصيل</div>
                        <div className={`${th} w-[150px]`}>الإجراء</div>
                        <div className={`${th} w-[120px]`}>الموظف</div>
                        <div className={`${th} w-[160px]`}>التاريخ</div>
                    </div>
                    {rows.length === 0 && <div className="p-8 text-center text-[13px] text-[var(--muted-foreground)]">لا يوجد نشاط مسجّل.</div>}
                    {rows.map((a) => (
                        <div key={a.id} className="flex h-[67.5px] w-full shrink-0 items-center gap-[12px] p-[0px_14px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                            <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{detail(a, product.name)}</div>
                            <div className="w-[150px] shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--ink)]">{LABEL[a.action] ?? a.action}</div>
                            <div className="w-[120px] shrink-0 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{a.actor}</div>
                            <div className="w-[160px] shrink-0 text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">
                                {formatDate(a.at)}، {formatTime(a.at)}
                            </div>
                        </div>
                    ))}
                </div>
            </ProductShell>
        </AppLayout>
    );
}
