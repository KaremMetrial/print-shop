import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { PenSelect } from '@/components/pen/form';
import { formatMoneyFixed } from '@/lib/money';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

const fld =
    'h-[46px] w-full rounded-[10px] bg-[var(--background)] p-[0px_14px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus:[outline:2px_solid_var(--primary)]';
const toMinor = (v: string) => Math.round(parseFloat(v.replace(/[^\d.]/g, '') || '0') * 100);

function Shell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]" onClick={onClose}>
            <div
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
                className="flex w-[460px] max-w-full flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[24px] text-right"
            >
                <div className="text-[18px] leading-[28px] font-[700] text-[var(--ink)]">{title}</div>
                {children}
            </div>
        </div>
    );
}
const Actions = ({ onClose, busy, label, disabled }: { onClose: () => void; busy: boolean; label: string; disabled?: boolean }) => (
    <div className="flex justify-end gap-[12px]">
        <button
            type="button"
            onClick={onClose}
            className="h-[40px] rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[14px] [outline:1px_solid_var(--border)]"
        >
            إلغاء
        </button>
        <button
            type="submit"
            disabled={busy || disabled}
            className="h-[40px] rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-[14px] font-[600] text-white disabled:opacity-60"
        >
            {label}
        </button>
    </div>
);

/** تسجيل دفعة: عامة (FIFO) أو مخصصة لأوردر. الخادم يمنع الزيادة عن المستحق (BR-052). */
export function PaymentDialog({
    onClose,
    customers,
    customerId,
    order,
}: {
    onClose: () => void;
    customers?: { id: number; name: string }[];
    customerId?: number;
    order?: { id: number; number: string; remaining_minor: number };
}) {
    const [cid, setCid] = useState(String(customerId ?? ''));
    const [amount, setAmount] = useState(order ? String(order.remaining_minor / 100) : '');
    const { enabled } = usePaymentMethods();
    const [method, setMethod] = useState(Object.keys(enabled)[0] ?? 'CASH');
    const [ref, setRef] = useState('');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    return (
        <Shell title={order ? `تسجيل دفعة للأوردر ${order.number}` : 'تسجيل دفعة'} onClose={onClose}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setBusy(true);
                    router.post(
                        '/accounting/payments',
                        {
                            customer_id: Number(cid),
                            amount_minor: toMinor(amount),
                            method,
                            order_id: order?.id ?? null,
                            reference: ref || null,
                        } as never,
                        { headers: { 'Idempotency-Key': key.current }, preserveScroll: true, onFinish: () => setBusy(false), onSuccess: onClose },
                    );
                }}
                className="flex flex-col gap-[12px]"
            >
                {!customerId && (
                    <PenSelect
                        label="العميل"
                        value={cid}
                        placeholder="اختر العميل"
                        options={customers?.map((c) => ({ value: String(c.id), label: c.name })) ?? []}
                        onValueChange={setCid}
                    />
                )}
                {order && (
                    <div className="text-[13px] text-[var(--muted-foreground)]">
                        المتبقي على الأوردر: {formatMoneyFixed(order.remaining_minor)} — لا يُقبل أكثر منه.
                    </div>
                )}
                {!order && <div className="text-[12px] text-[var(--muted-foreground)]">الدفعة العامة تُوزَّع على أقدم المستحقات أولًا.</div>}
                <input
                    aria-label="المبلغ (ج.م)"
                    inputMode="decimal"
                    placeholder="المبلغ بالجنيه"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={fld}
                />
                <PenSelect
                    label="طريقة الدفع"
                    value={method}
                    placeholder="اختر طريقة الدفع"
                    options={Object.entries(enabled).map(([value, label]) => ({ value, label }))}
                    onValueChange={setMethod}
                />
                <input
                    aria-label="مرجع العملية"
                    placeholder="مرجع العملية (اختياري)"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className={fld}
                />
                <Actions onClose={onClose} busy={busy} label="تسجيل الدفعة" disabled={!cid || toMinor(amount) < 1} />
            </form>
        </Shell>
    );
}

/** نموذج سبب (تصحيح مبلغ / إلغاء دفعة / رد مبلغ). */
export function ReasonDialog({
    title,
    url,
    onClose,
    withAmount,
    initialAmount,
    label,
    reasonLabel = 'السبب (إلزامي)',
    withMethod,
}: {
    title: string;
    url: string;
    onClose: () => void;
    withAmount?: boolean;
    initialAmount?: number;
    label: string;
    reasonLabel?: string;
    withMethod?: boolean;
}) {
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount / 100) : '');
    const [reason, setReason] = useState('');
    const { enabled } = usePaymentMethods();
    const [method, setMethod] = useState(Object.keys(enabled)[0] ?? 'CASH');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    return (
        <Shell title={title} onClose={onClose}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setBusy(true);
                    const body: Record<string, unknown> = withMethod ? { notes: reason || null, method } : { reason };
                    if (withAmount) body.amount_minor = toMinor(amount);
                    router.post(url, body as never, {
                        headers: { 'Idempotency-Key': key.current },
                        preserveScroll: true,
                        onFinish: () => setBusy(false),
                        onSuccess: onClose,
                    });
                }}
                className="flex flex-col gap-[12px]"
            >
                {withAmount && (
                    <input aria-label="المبلغ (ج.م)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={fld} />
                )}
                {withMethod && (
                    <PenSelect
                        label="طريقة الرد"
                        value={method}
                        placeholder="اختر طريقة الرد"
                        options={Object.entries(enabled).map(([value, label]) => ({ value, label }))}
                        onValueChange={setMethod}
                    />
                )}
                <textarea
                    aria-label={reasonLabel}
                    placeholder={reasonLabel}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-[90px] w-full resize-none rounded-[10px] bg-[var(--background)] p-[14px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)]"
                />
                <Actions
                    onClose={onClose}
                    busy={busy}
                    label={label}
                    disabled={(!withMethod && reason.trim().length < 3) || (withAmount && toMinor(amount) < 1)}
                />
            </form>
        </Shell>
    );
}
