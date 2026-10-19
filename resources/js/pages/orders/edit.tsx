import { PenInput, PenSelect, PenTextarea } from '@/components/pen/form';
import { PenBreadcrumb } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, formatTime } from '@/lib/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useRef, type ReactNode } from 'react';

interface Props {
    order: {
        id: number;
        number: string;
        status_label: string;
        customer: { id: number; name: string; phone_display: string };
        updated_at: string;
        delivery_method: 'PICKUP' | 'DELIVERY';
        delivery_address: string | null;
        eta_days: number | null;
        notes: string | null;
        subtotal_minor?: number;
        discount_minor?: number;
        delivery_fee_minor?: number;
        grand_total_minor?: number;
        paid_minor?: number;
        remaining_minor?: number;
    };
    items: { id: number; label: string; quantity: number; status: 'APPROVED' | 'PENDING' | 'CANCELLED'; total_minor?: number }[];
    approval: { approved: number; total: number };
    can: { items: boolean; price: boolean };
}

const panel = 'flex w-full shrink-0 flex-col rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const btn34 = 'flex h-[34px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface)] p-[0px_12px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]';
const Sum = ({ k, v, c = 'var(--ink)', big }: { k: string; v: ReactNode; c?: string; big?: boolean }) => (
    <div className="flex w-full shrink-0 items-center gap-[12px] [border-bottom:1px_solid_var(--border)]" style={{ height: big ? 37.5 : 30.5, padding: big ? '8px 0px' : '5px 0px' }}>
        <div className="flex-1 text-right" style={{ color: c, fontSize: big ? 14 : 13, lineHeight: big ? '22px' : '21px', fontWeight: big ? 400 : 700 }}>
            {v}
        </div>
        <div className="flex-1 text-right" style={{ color: big ? 'var(--ink)' : 'var(--muted-foreground)', fontSize: big ? 14 : 11, lineHeight: big ? '22px' : '18px' }}>
            {k}
        </div>
    </div>
);
const Ref = ({ k, v }: { k: string; v: string }) => (
    <div className="flex h-[32.5px] w-full shrink-0 items-center gap-[12px] p-[6px_0px] [border-bottom:1px_solid_var(--border)]">
        <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{v}</div>
        <div className="flex-1 text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{k}</div>
    </div>
);
const toMinor = (v: string) => Math.round(parseFloat(v.replace(/[^\d.]/g, '') || '0') * 100);

/** S-015 — تعديل الأوردر (pendev: Cd7FX). الأسعار تُعاد من السيرفر عند الحفظ. */
export default function OrderEdit({ order: o, items, approval, can }: Props) {
    const key = useRef(crypto.randomUUID());
    const { data, setData, patch, processing, errors, transform } = useForm({
        delivery_method: o.delivery_method,
        delivery_address: o.delivery_address ?? '',
        fee: o.delivery_fee_minor ? String(o.delivery_fee_minor / 100) : '',
        eta: String(o.eta_days ?? ''),
        notes: o.notes ?? '',
    });
    const e = errors as Record<string, string | undefined>;
    const delivery = data.delivery_method === 'DELIVERY';
    const submit = (ev: React.FormEvent) => {
        ev.preventDefault();
        transform((d) => ({ delivery_method: d.delivery_method, delivery_address: delivery ? d.delivery_address : null, delivery_fee: delivery ? toMinor(d.fee) : 0, printing_eta_days: d.eta ? Number(d.eta) : null, notes: d.notes || null }));
        patch(`/orders/${o.id}`, { headers: { 'Idempotency-Key': key.current } });
    };
    const upd = new Date(o.updated_at);
    const price = can.price && o.grand_total_minor !== undefined;

    return (
        <AppLayout active="/orders">
            <Head title={`تعديل الأوردر ${o.number}`} />
            <form onSubmit={submit} noValidate className="flex w-full shrink-0 flex-col gap-[18px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'الأوردرات', href: '/orders' }, `تعديل ${o.number}`]} />
                <div className="flex w-full shrink-0 justify-between gap-[12px]">
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[26px] leading-[36px] font-[700] text-[var(--ink)]">تعديل الأوردر</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                            {o.number} • {o.customer.name}
                        </div>
                        <div className="w-full text-right text-[12px] leading-[19px] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`مسؤول مصرح  •  آخر تحديث: ${formatDate(upd)}، ${formatTime(upd).replace(/^0/, '')}`}</div>
                    </div>
                    <div className="flex w-fit shrink-0 flex-col items-end gap-[8px]">
                        <div className="flex w-fit shrink-0 items-center rounded-[8px] bg-[#FEF3C7] p-[4px_10px]">
                            <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap text-[#92400E]">{o.status_label}</div>
                        </div>
                        <div className="w-[130px] text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">{o.customer.phone_display}</div>
                    </div>
                </div>

                <div className="w-full text-right text-[19px] leading-[30px] font-[700] text-[var(--ink)]">بيانات العميل</div>
                <div className="flex w-full shrink-0 flex-col gap-[14px] rounded-[12px] bg-[var(--background)] p-[14px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <Ref k="اسم العميل" v={o.customer.name} />
                    <Ref k="رقم الهاتف" v={o.customer.phone_display} />
                    <Ref k="معرّف العميل" v={`CUS-${String(o.customer.id).padStart(4, '0')}`} />
                </div>

                <div className={`${panel} gap-[14px] p-[18px]`}>
                    <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                        {can.items && (
                            <Link href={`/orders/${o.id}/items/create`} className={btn34}>
                                إضافة بند
                            </Link>
                        )}
                        <div className="flex-1 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                            {items.length} بنود • {approval.approved} من {approval.total} معتمدة
                        </div>
                    </div>
                    {items.map((i, n) => (
                        <div key={i.id} className="flex h-[49.5px] w-full shrink-0 items-center gap-[12px] p-[8px_0px] [border-bottom:1px_solid_var(--border)]">
                            <Link href={`/orders/${o.id}/items/${i.id}`} className={btn34}>
                                {i.status === 'APPROVED' ? 'إعادة فتح' : 'تعديل'}
                            </Link>
                            <div className="w-[190px] shrink-0 text-right text-[12px] leading-[19px] font-[600]" style={{ color: i.status === 'APPROVED' ? '#15803D' : '#92400E' }}>
                                {i.status === 'APPROVED' ? 'معتمد • إعادة فتح قبل التعديل' : 'بانتظار اعتماد العميل'}
                            </div>
                            <div className="w-[110px] shrink-0 text-right text-[14px] leading-[22px] font-[600] text-[var(--ink)]">{i.total_minor !== undefined ? formatMoney(i.total_minor) : ''}</div>
                            <div className="w-[100px] shrink-0 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{i.quantity}</div>
                            <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{i.label.replace(/^البند \d+ — /, '')}</div>
                            <div className="w-[80px] shrink-0 text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">البند {String(n + 1).padStart(2, '0')}</div>
                        </div>
                    ))}
                </div>

                <div className="flex w-full shrink-0 items-start gap-[14px]">
                    <div className={`${panel} flex-1 gap-[14px] p-[18px]`}>
                        <div className="w-full text-right text-[17px] leading-[27px] font-[700] text-[var(--ink)]">التسليم والطباعة</div>
                        <PenSelect v3 label="طريقة التسليم" value={data.delivery_method} options={[{ value: 'PICKUP', label: 'استلام من المطبعة' }, { value: 'DELIVERY', label: 'توصيل' }]} onValueChange={(v) => setData('delivery_method', v as 'PICKUP' | 'DELIVERY')} />
                        {delivery && <PenInput v3 label="عنوان التوصيل" value={data.delivery_address} onChange={(ev) => setData('delivery_address', ev.target.value)} error={e.delivery_address} />}
                        {delivery && <PenInput v3 label="رسوم التوصيل" inputMode="decimal" value={data.fee} onChange={(ev) => setData('fee', ev.target.value)} />}
                        <PenInput v3 label="مدة الطباعة" inputMode="numeric" value={data.eta} onChange={(ev) => setData('eta', ev.target.value.replace(/[^\d]/g, ''))} />
                    </div>
                    <div className={`${panel} flex-1 gap-[14px] p-[18px]`}>
                        <div className="w-full text-right text-[17px] leading-[27px] font-[700] text-[var(--ink)]">ملاحظات وملخص السعر</div>
                        <PenTextarea v3 label="ملاحظات عامة" value={data.notes} onChange={(ev) => setData('notes', ev.target.value)} />
                        {price && (
                            <>
                                <Sum k="إجمالي البنود" v={formatMoney(o.subtotal_minor ?? 0)} />
                                <Sum k="الخصم" v={formatMoney(o.discount_minor ?? 0)} c="#B45309" />
                                <Sum k="رسوم التوصيل" v={formatMoney(o.delivery_fee_minor ?? 0)} />
                                <Sum k="الإجمالي النهائي" v={formatMoney(o.grand_total_minor ?? 0)} c="#2563EB" />
                                <Sum k="المدفوع المؤكد" v={formatMoney(o.paid_minor ?? 0)} c="#15803D" />
                                <Sum k="المتبقي" v={formatMoney(o.remaining_minor ?? 0)} big />
                                {(o.paid_minor ?? 0) > 0 && <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[#92400E]">تعديل السعر للمسؤول أو المدير الأعلى فقط. لا يمكن خفض الإجمالي عن {formatMoney(o.paid_minor ?? 0)} المدفوعة.</div>}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                    <button type="button" onClick={() => router.get(`/orders/${o.id}`)} className={btn34}>
                        إلغاء
                    </button>
                    <button type="submit" disabled={processing} className="flex h-[34px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--primary)] p-[0px_12px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-white [outline:1px_solid_var(--primary)] [outline-offset:-0.5px] disabled:opacity-60">
                        حفظ التغييرات
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
