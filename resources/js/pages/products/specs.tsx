import { PenAction11, PenBadge } from '@/components/pen/primitives';
import { ProductShell, type ProductHead } from '@/components/pen/product-shell';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

interface Group {
    id: number;
    name: string;
    selection_type: string;
    required: boolean;
    active: boolean;
    values: string[];
}
const th = 'shrink-0 text-right text-[11px] leading-[18px] font-[600] text-[var(--text-secondary)]';

/** S-034 — المواصفات (pendev: UZ6XL) */
export default function ProductSpecs({ product, groups, can }: { product: ProductHead; groups: Group[]; can: { manage: boolean } }) {
    return (
        <AppLayout>
            <Head title="مواصفات المنتج" />
            <ProductShell product={product} active="specs">
                <div className="flex w-full min-w-0 shrink-0 flex-col overflow-x-auto rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex h-[44px] w-full shrink-0 items-center gap-[12px] bg-[var(--surface-subtle)] p-[0px_16px]">
                        <div className={`${th} w-[92px]`}>الإجراءات</div>
                        <div className={`${th} w-[480px]`}>القيم المتاحة</div>
                        <div className={`${th} w-[90px]`}>الحالة</div>
                        <div className={`${th} w-[80px]`}>إجباري</div>
                        <div className={`${th} w-[160px]`}>نوع الاختيار</div>
                        <div className={`${th} flex-1`}>مجموعة المواصفات</div>
                    </div>
                    {groups.length === 0 && <div className="p-8 text-center text-[13px] text-[var(--muted-foreground)]">لا توجد مواصفات بعد.</div>}
                    {groups.map((g) => (
                        <div key={g.id} className="flex h-[65.5px] w-full shrink-0 items-center gap-[12px] p-[0px_16px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                            <div className="w-[92px] shrink-0">{can.manage && <PenAction11 href={`/products/${product.id}/options/${g.id}/edit`} width={92}>تعديل</PenAction11>}</div>
                            <div className="w-[480px] shrink-0 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{g.values.join(' • ')}</div>
                            <div className="flex w-[90px] shrink-0 justify-center">
                                <PenBadge tone={g.active ? 'green' : 'gray'}>{g.active ? 'نشطة' : 'معطّلة'}</PenBadge>
                            </div>
                            <div className="w-[80px] shrink-0 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{g.required ? 'نعم' : 'لا'}</div>
                            <div className="w-[160px] shrink-0 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{g.selection_type === 'SINGLE' ? 'اختيار واحد' : 'اختيارات متعددة'}</div>
                            <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{g.name}</div>
                        </div>
                    ))}
                </div>
                {can.manage && (
                    <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                        <PenAction11 href={`/products/${product.id}/options/create`}>إضافة مجموعة مواصفات</PenAction11>
                    </div>
                )}
            </ProductShell>
        </AppLayout>
    );
}
