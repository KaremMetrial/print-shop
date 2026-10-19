import { PenInput, PenSelect, PenSwitch, PenTextarea } from '@/components/pen/form';
import { PenAction11, PenButton } from '@/components/pen/primitives';
import { cardTitle, formCard, ProductShell, type ProductHead } from '@/components/pen/product-shell';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';

interface Props {
    product: (ProductHead & { description: string | null; category_id: number }) | null;
    categories: { value: string; label: string }[];
    can?: { manage: boolean };
}

/** S-034 — محرر المنتج: البيانات الأساسية (pendev: PuR7a) */
export default function ProductBasic({ product, categories, can = { manage: true } }: Props) {
    const { data, setData, post, patch, processing, errors } = useForm({ name: product?.name ?? '', category_id: product ? String(product.category_id) : '', description: product?.description ?? '' });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) patch(`/products/${product.id}`);
        else post('/products');
    };
    return (
        <AppLayout>
            <Head title={product ? 'تعديل المنتج' : 'إضافة منتج'} />
            <ProductShell product={product} active="basic">
                <form onSubmit={submit} noValidate className={formCard}>
                    <div className={cardTitle}>بيانات المنتج</div>
                    <PenInput v3 label="اسم المنتج" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} readOnly={!can.manage} placeholder="أدخل اسم المنتج" />
                    <PenSelect v3 label="التصنيف" options={categories} value={data.category_id} onValueChange={(v) => setData('category_id', v)} error={errors.category_id} disabled={!can.manage} placeholder="اختر التصنيف" />
                    <PenTextarea v3 label="الوصف" value={data.description} onChange={(e) => setData('description', e.target.value)} error={errors.description} readOnly={!can.manage} />
                    {product && (
                        <div className="flex w-full shrink-0 flex-col gap-[5px]">
                            <div className="w-full text-right text-[12px] leading-[19px] font-[600] text-[var(--ink)]">حالة المنتج</div>
                            <div className="flex h-[44px] w-full shrink-0 items-center justify-end">
                                <PenSwitch checked={product.active} onChange={() => router.post(`/products/${product.id}/toggle`)} label={product.active ? 'نشط' : 'غير نشط'} disabled={!can.manage} />
                            </div>
                        </div>
                    )}
                    {can.manage && (
                        <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                            <PenAction11 href="/products">إلغاء</PenAction11>
                            <PenButton type="submit" disabled={processing}>
                                {product ? 'حفظ التغييرات' : 'حفظ المنتج'}
                            </PenButton>
                        </div>
                    )}
                </form>
            </ProductShell>
        </AppLayout>
    );
}
