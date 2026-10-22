import { PenInput, PenSelect, PenSwitch } from '@/components/pen/form';
import { PenAction11, PenBadge, PenBreadcrumb, PenButton } from '@/components/pen/primitives';
import { cardTitle, formCard } from '@/components/pen/product-shell';
import AppLayout from '@/layouts/app-layout';
import { formatMoneyFixed } from '@/lib/money';
import { Head, useForm } from '@inertiajs/react';

interface Product {
    id: number;
    name: string;
    default_minor: number;
    custom_minor: number | null;
}
interface Props {
    tier: { id: number; name: string; mode: string; discount_percentage: string | null; is_active: boolean; is_default: boolean } | null;
    mode: string;
    products: Product[];
    can: { manage: boolean };
}
const toMinor = (v: string) => Math.round(parseFloat(v.replace(/[^\d.]/g, '') || '0') * 100);

/** S-037-A/B — تعديل شريحة السعر: نسبة مئوية / سعر أساسي مخصص (pendev: qj4Bx / rYnLi) */
export default function TierForm({ tier, mode, products, can }: Props) {
    const { data, setData, post, patch, processing, errors: fe, transform } = useForm({
        name: tier?.name ?? '',
        mode: tier?.mode ?? mode,
        discount_percentage: String(Number(tier?.discount_percentage ?? 0)),
        is_active: tier?.is_active ?? true,
        prices: Object.fromEntries(products.map((p) => [p.id, p.custom_minor !== null ? (p.custom_minor / 100).toFixed(2) : ''])) as Record<number, string>,
    });
    const errors = fe as Record<string, string | undefined>;
    const pct = data.mode === 'PERCENTAGE';
    const sample = products[0];
    const base = sample?.default_minor ?? 0;
    const additions = 50;
    const std = base + additions;
    const final = pct ? Math.round(std - (std * Math.round(parseFloat(data.discount_percentage || '0') * 100)) / 10000) : (data.prices[sample?.id] ? toMinor(data.prices[sample.id]) : base) + additions;
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({
            ...d,
            discount_percentage: d.mode === 'PERCENTAGE' ? d.discount_percentage : null,
            prices: d.mode === 'FIXED_BASE' ? Object.entries(d.prices).filter(([, v]) => v !== '').map(([id, v]) => ({ product_id: Number(id), base_unit_price_override: toMinor(v) })) : [],
        }));
        if (tier) patch(`/pricing/${tier.id}`);
        else post('/pricing');
    };
    const title = pct ? 'تعديل شريحة السعر — نسبة مئوية' : 'تعديل شريحة السعر — سعر أساسي مخصص';
    const Row = ({ k, v, color = 'text-[var(--ink)]' }: { k: string; v: string; color?: string }) => (
        <div className="flex h-[37.5px] w-full shrink-0 items-center gap-[12px] p-[7px_0px] [border-bottom:1px_solid_var(--border)]">
            <div className={`flex-1 text-right text-[15px] leading-[24px] font-[700] ${color}`}>{v}</div>
            <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{k}</div>
        </div>
    );
    return (
        <AppLayout>
            <Head title={tier ? 'تعديل شريحة السعر' : 'إضافة شريحة سعر'} />
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'التسعير', href: '/pricing' }, title]} />
            <form onSubmit={submit} noValidate className="contents">
                <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                    {can.manage && (
                        <div className="flex w-fit shrink-0 items-center gap-[12px]">
                            <PenButton type="submit" disabled={processing}>
                                حفظ التغييرات
                            </PenButton>
                            <PenAction11 href="/pricing">إلغاء</PenAction11>
                        </div>
                    )}
                    <div className="flex flex-1 flex-col gap-[3px]">
                        <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">{tier ? 'تعديل شريحة السعر' : 'إضافة شريحة سعر'}</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                            {data.name || 'جديدة'} • {pct ? 'خصم بالنسبة المئوية' : 'سعر أساسي مخصص'}
                        </div>
                        <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                            <PenBadge tone={data.is_active ? 'green' : 'gray'}>{data.is_active ? 'نشطة' : 'غير نشطة'}</PenBadge>
                        </div>
                    </div>
                </div>

                <div className={formCard} style={{ gap: 16 }}>
                    <div className={cardTitle}>بيانات الشريحة</div>
                    <PenInput v3 label="اسم الشريحة" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} readOnly={!can.manage} />
                    <PenSelect v3 label="طريقة التسعير" options={[{ value: 'PERCENTAGE', label: 'خصم بالنسبة المئوية' }, { value: 'FIXED_BASE', label: 'سعر أساسي مخصص' }]} value={data.mode} onValueChange={(v) => setData('mode', v)} disabled={!can.manage || !!tier} />
                    {pct && <PenInput v3 label="خصم بالنسبة المئوية" inputMode="decimal" dir="ltr" value={data.discount_percentage} onChange={(e) => setData('discount_percentage', e.target.value)} error={errors.discount_percentage} readOnly={!can.manage} />}
                    <div className="flex w-full shrink-0 flex-col gap-[5px]">
                        <div className="w-full text-right text-[12px] leading-[19px] font-[600] text-[var(--ink)]">حالة الشريحة</div>
                        <div className="flex h-[44px] w-full shrink-0 items-center justify-end">
                            <PenSwitch checked={data.is_active} onChange={(v) => setData('is_active', v)} label={data.is_active ? 'نشط' : 'غير نشط'} disabled={!can.manage || tier?.is_default} />
                        </div>
                    </div>
                </div>

                {!pct && (
                    <div id="products" className="flex w-full min-w-0 shrink-0 flex-col overflow-x-auto rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                        <div className="flex w-full shrink-0 flex-col items-center justify-center gap-[10px] p-[12px_10px]">
                            <div className="w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">أسعار المنتجات</div>
                        </div>
                        <div className="flex h-[44px] w-full shrink-0 items-center gap-[12px] bg-[var(--surface-subtle)] p-[0px_14px]">
                            <div className="w-[160px] shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]">الإجراءات</div>
                            <div className="w-[180px] shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]">السعر الأساسي المخصص</div>
                            <div className="w-[180px] shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]">السعر الأساسي الافتراضي</div>
                            <div className="flex-1 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]">اسم المنتج</div>
                        </div>
                        {products.map((p) => (
                            <div key={p.id} className="flex h-[63.5px] w-full shrink-0 items-center gap-[12px] p-[0px_14px] [border-bottom:1px_solid_var(--border)] last:border-b-0">
                                <div className="w-[160px] shrink-0">{data.prices[p.id] !== '' && can.manage && <PenAction11 onClick={() => setData('prices', { ...data.prices, [p.id]: '' })} width={160}>إزالة التخصيص</PenAction11>}</div>
                                <div className="w-[180px] shrink-0">
                                    <input dir="ltr" disabled={!can.manage} inputMode="decimal" value={data.prices[p.id]} placeholder="—" onChange={(e) => setData('prices', { ...data.prices, [p.id]: e.target.value })} className="h-[40px] w-[150px] rounded-[8px] bg-[var(--background)] p-[0px_10px] text-right text-[13px] font-[600] text-[var(--ink)] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus:[outline:2px_solid_var(--primary)]" />
                                </div>
                                <div className="w-[180px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">{formatMoneyFixed(p.default_minor)}</div>
                                <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{p.name}</div>
                            </div>
                        ))}
                    </div>
                )}

                {sample && (
                    <div className={formCard} style={{ gap: 10 }}>
                        <div className={cardTitle}>معاينة السعر</div>
                        <Row k="السعر الأساسي" v={formatMoneyFixed(base)} />
                        <Row k="إضافات الخيارات" v={formatMoneyFixed(additions)} />
                        <Row k={pct ? 'سعر الوحدة قبل الخصم' : 'سعر الوحدة القياسي'} v={formatMoneyFixed(std)} />
                        {pct && <Row k="خصم بالنسبة المئوية" v={`${Number(data.discount_percentage || 0)}%`} color="text-[#B45309]" />}
                        <Row k={pct ? 'سعر الوحدة بعد الخصم' : 'سعر الوحدة النهائي'} v={formatMoneyFixed(final)} color="text-[#15803D]" />
                        <Row k="الكمية" v="1000" />
                        <Row k={pct ? 'الإجمالي بعد الخصم' : 'الإجمالي النهائي'} v={formatMoneyFixed(final * 1000)} color="text-[var(--primary)]" />
                        <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">المعاينة بمنتج «{sample.name}». التعديل يطبَّق على الأوردرات الجديدة فقط.</div>
                    </div>
                )}
            </form>
        </AppLayout>
    );
}
