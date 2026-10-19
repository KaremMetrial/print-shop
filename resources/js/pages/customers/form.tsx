import { PenInput, PenSelect, PenTextarea } from '@/components/pen/form';
import { PenBreadcrumb } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Customer {
    id: number;
    name: string;
    phone: string;
    address: string | null;
    pricing_tier_id: number;
    notification_mode: string;
    notes: string | null;
}
interface Opt {
    value: string;
    label: string;
}

/** S-023 — إضافة/تعديل عميل (pendev: YjRKg). فحص تكرار الهاتف لحظيًا دون دمج آلي (§40.1). */
export default function CustomerForm({ customer, tiers, notificationModes, defaultTierId }: { customer: Customer | null; tiers: { id: number; name: string }[]; notificationModes: Opt[]; defaultTierId: number }) {
    const edit = !!customer;
    const { data, setData, post, patch, processing, errors: formErrors, transform } = useForm({
        name: customer?.name ?? '',
        phone: customer?.phone ?? '',
        address: customer?.address ?? '',
        pricing_tier_id: String(customer?.pricing_tier_id ?? defaultTierId),
        notification_mode: customer?.notification_mode ?? 'MANUAL',
        notes: customer?.notes ?? '',
    });
    const errors = formErrors as Record<string, string | undefined>;
    const [dup, setDup] = useState<{ id: number; name: string } | null>(null);
    useEffect(() => {
        if (data.phone.replace(/\D/g, '').length < 10) return setDup(null);
        const t = setTimeout(() => {
            fetch(`/customers/check-phone?phone=${encodeURIComponent(data.phone)}${customer ? `&ignore=${customer.id}` : ''}`, { headers: { Accept: 'application/json' } })
                .then((r) => r.json())
                .then((j) => setDup(j.duplicate))
                .catch(() => setDup(null));
        }, 350);
        return () => clearTimeout(t);
    }, [data.phone, customer]);

    const title = edit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد';
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({ ...d, pricing_tier_id: Number(d.pricing_tier_id) }));
        if (edit) patch(`/customers/${customer.id}`);
        else post('/customers');
    };
    const phoneError = errors.phone_normalized ?? errors.phone ?? (dup ? 'رقم الهاتف مسجل بالفعل' : undefined);

    return (
        <AppLayout>
            <Head title={title} />
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'العملاء', href: '/customers' }, title]} />
            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                <div className="flex flex-1 flex-col gap-[4px]">
                    <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">{title}</h1>
                </div>
            </div>

            <form onSubmit={submit} noValidate className="flex w-full shrink-0 flex-col gap-[24px] rounded-[12px] bg-[var(--surface)] p-[28px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">البيانات الأساسية</div>
                <PenInput v3 label="اسم العميل *" placeholder="أدخل اسم العميل" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                <PenInput v3 label="رقم الهاتف *" placeholder="أدخل رقم الهاتف" inputMode="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={phoneError} hint="سيتم التحقق من عدم تكرار الرقم." />
                {dup && (
                    <div className="flex w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--warning-soft)] p-[12px_16px]">
                        <Link href={`/customers/${dup.id}`} className="flex h-[32px] w-fit shrink-0 items-center rounded-[8px] bg-[var(--surface)] p-[0px_10px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            <span className="text-[12px] font-[600] whitespace-nowrap text-[var(--ink)]">عرض العميل</span>
                        </Link>
                        <div className="flex flex-1 flex-col">
                            <div className="w-full text-right text-[14px] leading-[22px] font-[700] text-[var(--warning-text)]">رقم الهاتف مسجل بالفعل</div>
                            <div className="w-full text-right text-[13px] leading-[21px] text-[var(--warning-text)]">هذا الرقم مرتبط بالعميل «{dup.name}».</div>
                        </div>
                    </div>
                )}
                <PenTextarea v3 label="العنوان" placeholder="أدخل العنوان — اختياري" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                <div className="h-[1px] w-full shrink-0 bg-[var(--border)]" />
                <div className="w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">إعدادات العميل</div>
                <PenSelect v3 label="شريحة السعر" options={tiers.map((t) => ({ value: String(t.id), label: t.name }))} value={data.pricing_tier_id} onValueChange={(v) => setData('pricing_tier_id', v)} error={errors.pricing_tier_id} />
                <PenSelect v3 label="طريقة الإشعار" options={notificationModes} value={data.notification_mode} onValueChange={(v) => setData('notification_mode', v)} error={errors.notification_mode} />
                <PenTextarea v3 label="ملاحظات داخلية" placeholder="أضف ملاحظة — اختياري" value={data.notes} onChange={(e) => setData('notes', e.target.value)} error={errors.notes} />
                <div className="flex w-full shrink-0 items-center justify-end gap-[12px] p-[20px_0px_0px_0px]">
                    <Link href={edit ? `/customers/${customer.id}` : '/customers'} className="flex h-[46px] w-fit shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface)] p-[0px_16px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]">
                        <span className="text-left text-[14px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">إلغاء</span>
                    </Link>
                    <button type="submit" disabled={processing || !!dup} className="flex h-[46px] w-fit shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary)] p-[0px_16px] disabled:opacity-60">
                        <span className="text-left text-[14px] leading-[normal] font-[600] whitespace-nowrap text-[var(--surface)]">{edit ? 'حفظ التغييرات' : 'حفظ العميل'}</span>
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
