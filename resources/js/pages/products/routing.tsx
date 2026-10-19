import { PenSelect } from '@/components/pen/form';
import { PenAction11, PenBadge, PenButton } from '@/components/pen/primitives';
import { cardTitle, formCard, ProductShell, type ProductHead } from '@/components/pen/product-shell';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';

/** S-034 — توزيع التصميم (pendev: WCn4U). التخصص يحدد المصممين المؤهلين للمهام (BR-015/017). */
export default function ProductRouting({ product, specialty_id, specialties, can }: { product: ProductHead; specialty_id: number | null; specialties: { id: number; name: string }[]; can: { manage: boolean } }) {
    const { data, setData, patch, processing, errors, transform } = useForm({ required_specialty_id: specialty_id ? String(specialty_id) : '' });
    const sel = specialties.find((s) => String(s.id) === data.required_specialty_id);
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({ required_specialty_id: d.required_specialty_id || null }));
        patch(`/products/${product.id}/routing`);
    };
    return (
        <AppLayout>
            <Head title="توزيع التصميم" />
            <ProductShell product={product} active="routing">
                <form onSubmit={submit} noValidate className="contents">
                    <div className={formCard}>
                        <div className={cardTitle}>توزيع التصميم</div>
                        <PenSelect v3 label="التخصص المطلوب" placeholder="بدون تخصص مطلوب" options={[{ value: '', label: 'بدون تخصص مطلوب' }, ...specialties.map((s) => ({ value: String(s.id), label: s.name }))]} value={data.required_specialty_id} onValueChange={(v) => setData('required_specialty_id', v)} error={errors.required_specialty_id} disabled={!can.manage} />
                        <div className={`flex w-full shrink-0 items-center gap-[12px] rounded-[10px] p-[14px] ${sel ? 'bg-[var(--success-soft)]' : 'bg-[var(--surface-subtle)]'}`}>
                            <PenBadge tone={sel ? 'green' : 'gray'}>{sel ? 'متاح' : 'غير محدد'}</PenBadge>
                            <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">حالة التخصص</div>
                        </div>
                        <div className="w-full text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">يحدد التخصص المصممين المؤهلين لاستلام مهام هذا المنتج.</div>
                        <div className="flex w-full shrink-0 flex-col gap-[16px] rounded-[12px] bg-[var(--background)] p-[18px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">التخصص المحدد</div>
                            <div className="w-full text-right text-[20px] leading-[32px] font-[700] text-[var(--ink)]">{sel?.name ?? '—'}</div>
                        </div>
                    </div>
                    {can.manage && (
                        <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                            <PenAction11 href={`/products/${product.id}/edit`}>إلغاء</PenAction11>
                            <PenButton type="submit" disabled={processing}>
                                حفظ التغييرات
                            </PenButton>
                        </div>
                    )}
                </form>
            </ProductShell>
        </AppLayout>
    );
}
