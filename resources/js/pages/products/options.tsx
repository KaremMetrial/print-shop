import { PenInput, PenSelect } from '@/components/pen/form';
import { PenAction11, PenBreadcrumb, PenButton, PenStatusFixed } from '@/components/pen/primitives';
import { cardTitle } from '@/components/pen/product-shell';
import AppLayout from '@/layouts/app-layout';
import { formatMoneyFixed } from '@/lib/money';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

type Val = {
    id?: number;
    name: string;
    unit_price_addition: number;
    sort_order: number;
    is_active: boolean;
};
interface Props {
    product: { id: number; name: string };
    group: { id: number; name: string; code: string; selection_type: string; is_required: boolean; sort_order: number; is_active: boolean; values: Val[] } | null;
    can: { manage: boolean };
}
const th = 'shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]';
const toMinor = (v: string) => Math.round(parseFloat(v.replace(/[^\d.]/g, '') || '0') * 100);

/** S-035 — إدارة خيارات المنتج (pendev: xE9uj). القيم لا تُحذف بل تُعطَّل حفاظًا على تاريخ الأوردرات. */
export default function ProductOptions({ product, group, can }: Props) {
    const { data, setData, post, patch, processing, errors: fe, transform } = useForm({
        name: group?.name ?? '',
        code: group?.code ?? '',
        selection_type: group?.selection_type ?? 'SINGLE',
        is_required: group ? (group.is_required ? 'yes' : 'no') : 'yes',
        sort_order: String(group?.sort_order ?? 1),
        values: (group?.values ?? [{ name: '', unit_price_addition: 0, sort_order: 1, is_active: true }]) as Val[],
    });
    const errors = fe as Record<string, string | undefined>;
    const [editing, setEditing] = useState<number | null>(group ? null : 0);
    const setVal = (i: number, patchv: Partial<Val>) => setData('values', data.values.map((v, k) => (k === i ? { ...v, ...patchv } : v)));
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({ ...d, is_required: d.is_required === 'yes', sort_order: Number(d.sort_order || 0), is_active: group?.is_active ?? true }));
        if (group) patch(`/products/${product.id}/options/${group.id}`);
        else post(`/products/${product.id}/options`);
    };

    return (
        <AppLayout>
            <Head title="إدارة خيارات المنتج" />
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'المنتجات', href: '/products' }, 'إدارة خيارات المنتج']} />
            <div className="flex w-full shrink-0 flex-col gap-[4px]">
                <h1 className="w-full text-right text-[28px] leading-[45px] font-[700] text-[var(--ink)]">إدارة خيارات المنتج</h1>
                <div className="w-full text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">المنتجات {'>'} {product.name} {'>'} خيارات المنتج</div>
            </div>
            <form onSubmit={submit} noValidate className="contents">
                <div className="flex w-full shrink-0 flex-col gap-[16px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className={cardTitle}>مجموعة الخيارات: {data.name || 'جديدة'}</div>
                    <PenInput v3 label="اسم مجموعة الخيارات" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} readOnly={!can.manage} />
                    <PenInput v3 label="كود المجموعة" ltr value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} error={errors.code} readOnly={!can.manage} />
                    <PenSelect v3 label="نوع الاختيار" options={[{ value: 'SINGLE', label: 'اختيار واحد' }, { value: 'MULTIPLE', label: 'اختيارات متعددة' }]} value={data.selection_type} onValueChange={(v) => setData('selection_type', v)} disabled={!can.manage} />
                    <PenSelect v3 label="الحقل إجباري" options={[{ value: 'yes', label: 'نعم' }, { value: 'no', label: 'لا' }]} value={data.is_required} onValueChange={(v) => setData('is_required', v)} disabled={!can.manage} />
                    <PenInput v3 label="ترتيب العرض" inputMode="numeric" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} error={errors.sort_order} readOnly={!can.manage} />
                </div>

                <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex h-[44px] w-full shrink-0 items-center gap-[12px] bg-[var(--surface-subtle)] p-[0px_14px]">
                        <div className={`${th} w-[120px]`}>الإجراءات</div>
                        <div className={`${th} w-[90px]`}>ترتيب العرض</div>
                        <div className={`${th} w-[76px]`}>الحالة</div>
                        <div className={`${th} w-[150px]`}>الزيادة على سعر الوحدة</div>
                        <div className={`${th} flex-1`}>اسم الخيار</div>
                    </div>
                    {errors.values && <div className="p-3 text-right text-[12px] text-[var(--danger)]">{errors.values}</div>}
                    {data.values.map((v, i) => (
                        <div key={v.id ?? `n${i}`} className="flex w-full shrink-0 flex-col [border-bottom:1px_solid_var(--border)] last:border-b-0">
                            <div className="flex h-[63.5px] w-full shrink-0 items-center gap-[12px] p-[0px_14px]">
                                <div className="flex w-[120px] shrink-0 items-center gap-[6px]">
                                    {can.manage && (
                                        <PenAction11 onClick={() => setEditing(editing === i ? null : i)}>{editing === i ? 'إغلاق' : 'تعديل'}</PenAction11>
                                    )}
                                </div>
                                <div className="w-[90px] shrink-0 text-center text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{v.sort_order}</div>
                                <div className="flex w-[76px] shrink-0 justify-center">
                                    <PenStatusFixed on={v.is_active} />
                                </div>
                                <div className="w-[150px] shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--ink)]">+{formatMoneyFixed(v.unit_price_addition)}</div>
                                <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{v.name || 'خيار جديد'}</div>
                            </div>
                            {editing === i && can.manage && (
                                <div className="flex w-full shrink-0 items-end gap-[12px] bg-[var(--background)] p-[14px]">
                                    <PenAction11 onClick={() => setVal(i, { is_active: !v.is_active })}>{v.is_active ? 'تعطيل' : 'تفعيل'}</PenAction11>
                                    <PenInput v3 label="الزيادة (ج.م)" dir="ltr" inputMode="decimal" value={(v.unit_price_addition / 100).toFixed(2)} onChange={(e) => setVal(i, { unit_price_addition: toMinor(e.target.value) })} wrapperClassName="w-[160px]" />
                                    <PenInput v3 label="الترتيب" inputMode="numeric" value={String(v.sort_order)} onChange={(e) => setVal(i, { sort_order: Number(e.target.value) || 0 })} wrapperClassName="w-[100px]" />
                                    <PenInput v3 label="اسم الخيار" value={v.name} onChange={(e) => setVal(i, { name: e.target.value })} error={errors[`values.${i}.name`]} wrapperClassName="flex-1" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {can.manage && (
                    <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                        <PenAction11
                            onClick={() => {
                                setData('values', [...data.values, { name: '', unit_price_addition: 0, sort_order: data.values.length + 1, is_active: true }]);
                                setEditing(data.values.length);
                            }}
                        >
                            إضافة قيمة
                        </PenAction11>
                        <PenButton type="submit" disabled={processing}>
                            حفظ التغييرات
                        </PenButton>
                    </div>
                )}
            </form>
        </AppLayout>
    );
}
