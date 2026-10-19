import { PenInput } from '@/components/pen/form';
import { PenAction11, PenButton } from '@/components/pen/primitives';
import { cardTitle, formCard, ProductShell, type ProductHead } from '@/components/pen/product-shell';
import AppLayout from '@/layouts/app-layout';
import { formatMoneyFixed } from '@/lib/money';
import { Head, useForm } from '@inertiajs/react';

const toMinor = (v: string) => Math.round(parseFloat(v.replace(/[^\d.]/g, '') || '0') * 100);

/** S-034 — التسعير (pendev: Fn6Qe). الأسعار تُخزَّن بالقروش؛ لا تؤثر على الأوردرات القديمة. */
export default function ProductPricing({ product, price_minor, min_qty, example_addition_minor, can }: { product: ProductHead; price_minor: number; min_qty: number | null; example_addition_minor: number; can: { manage: boolean } }) {
    const { data, setData, patch, processing, errors: fe, transform } = useForm({ price: (price_minor / 100).toFixed(2), minimum_quantity: min_qty ? String(min_qty) : '' });
    const errors = fe as Record<string, string | undefined>;
    const base = toMinor(data.price);
    const qty = min_qty ?? 1000;
    const std = base + example_addition_minor;
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({ base_unit_price: toMinor(d.price), minimum_quantity: d.minimum_quantity ? Number(d.minimum_quantity) : null }));
        patch(`/products/${product.id}/pricing`);
    };
    const Row = ({ k, v, color = 'text-[var(--ink)]' }: { k: string; v: string; color?: string }) => (
        <div className="flex h-[33.5px] w-full shrink-0 items-center gap-[12px] p-[6px_0px] [border-bottom:1px_solid_var(--border)]">
            <div className={`flex-1 text-right text-[14px] leading-[22px] font-[700] ${color}`}>{v}</div>
            <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{k}</div>
        </div>
    );
    return (
        <AppLayout>
            <Head title="تسعير المنتج" />
            <ProductShell product={product} active="pricing">
                <form onSubmit={submit} noValidate className={formCard}>
                    <div className={cardTitle}>تسعير المنتج</div>
                    <PenInput v3 label="السعر الأساسي للوحدة" inputMode="decimal" dir="ltr" value={data.price} onChange={(e) => setData('price', e.target.value)} error={errors.base_unit_price} readOnly={!can.manage} />
                    <PenInput v3 label="الحد الأدنى للكمية" inputMode="numeric" value={data.minimum_quantity} onChange={(e) => setData('minimum_quantity', e.target.value)} error={errors.minimum_quantity} readOnly={!can.manage} placeholder="بدون حد أدنى" />
                    <div className="flex w-full shrink-0 flex-col gap-[10px] rounded-[12px] bg-[var(--background)] p-[18px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                        <div className="w-full text-right text-[15px] leading-[24px] font-[700] text-[var(--ink)]">مثال تسعير {product.name}</div>
                        <Row k="السعر الأساسي" v={formatMoneyFixed(base)} />
                        <Row k="أعلى زيادة خيارات لكل وحدة" v={`+${formatMoneyFixed(example_addition_minor)}`} color="text-[var(--primary)]" />
                        <Row k="سعر الوحدة القياسي" v={formatMoneyFixed(std)} color="text-[#15803D]" />
                        <Row k="الكمية" v={String(qty)} />
                        <Row k="الإجمالي القياسي" v={formatMoneyFixed(std * qty)} />
                        <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">تُحسب الزيادات على سعر كل وحدة.</div>
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
