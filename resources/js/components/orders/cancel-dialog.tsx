import { PenSelect, PenTextarea } from '@/components/pen/form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatMoney } from '@/lib/money';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    order: {
        id: number;
        number: string;
        status_label: string;
        customer: { name: string };
        grand_total_minor?: number;
        paid_minor?: number;
        remaining_minor?: number;
    };
    reasons: string[];
}

const actionBtn =
    'flex h-[46px] w-fit shrink-0 items-center justify-center rounded-[10px] px-[16px] text-left text-[14px] leading-[22px] font-[600] whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-60';
const secondaryBtn = `${actionBtn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--control-border)] hover:bg-[var(--surface-subtle)]`;
const dangerBtn = `${actionBtn} bg-[var(--danger-soft)] text-[var(--danger-text)] [outline:1px_solid_#FECACA] hover:bg-[#FEE2E2]`;
const dangerSolidBtn = `${actionBtn} bg-[var(--danger)] text-white hover:bg-[#B91C1C]`;
const Row = ({ k, v, c }: { k: string; v: string; c: string }) => (
    <div className="flex h-[32.5px] w-full shrink-0 items-center gap-[12px] p-[6px_0px] [border-bottom:1px_solid_var(--border)]">
        <div className="flex-1 text-right text-[13px] leading-[21px] font-[700]" style={{ color: c }}>
            {v}
        </div>
        <div className="flex-1 text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{k}</div>
    </div>
);

/** S-016 — إلغاء الأوردر (pendev: xsO6N + UKZq0): سبب إلزامي → تأكيد → نجاح. الرد المالي يظهر بحسب الصلاحية. */
export function CancelOrderDialog({ open, onOpenChange, order, reasons }: Props) {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [step, setStep] = useState<'form' | 'confirm'>('form');
    const [err, setErr] = useState(false);
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    const paid = order.paid_minor ?? 0;
    const showMoney = order.grand_total_minor !== undefined;

    const next = () => {
        if (!reason) return setErr(true);
        setErr(false);
        setStep('confirm');
    };
    const submit = () => {
        setBusy(true);
        router.post(
            `/orders/${order.id}/cancel`,
            { reason, notes },
            { headers: { 'Idempotency-Key': crypto.randomUUID() }, onFinish: () => setBusy(false), onSuccess: () => onOpenChange(false) },
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) setStep('form');
                onOpenChange(o);
            }}
        >
            <DialogContent
                className={
                    step === 'form'
                        ? 'w-[720px] max-w-[95vw] gap-[16px] rounded-[12px] p-[24px]'
                        : 'w-[440px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]'
                }
                dir="ltr"
            >
                {step === 'form' ? (
                    <>
                        <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                            <div className="w-[90px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                                {order.number}
                            </div>
                            <DialogTitle className="flex-1 text-right text-[24px] leading-[34px] font-[700] text-[var(--ink)]">
                                إلغاء الأوردر
                            </DialogTitle>
                        </div>
                        <DialogDescription className="w-full text-right text-[13px] leading-[21px] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`${order.customer.name}  •  ${order.status_label}`}</DialogDescription>
                        <PenSelect
                            v3
                            label="سبب الإلغاء *"
                            value={reason}
                            placeholder="اختر سبب الإلغاء"
                            error={err ? 'أدخل سبب الإلغاء قبل المتابعة.' : undefined}
                            options={reasons.map((r) => ({ value: r, label: r }))}
                            onValueChange={(v) => {
                                setReason(v);
                                setErr(false);
                            }}
                        />
                        <PenTextarea
                            v3
                            label="ملاحظات إضافية"
                            placeholder="اكتب ملاحظات إضافية إن وجدت…"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        {showMoney && (
                            <div className="flex w-full shrink-0 flex-col gap-[8px] rounded-[12px] bg-[var(--background)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                <div className="w-full text-right text-[16px] leading-[26px] font-[700] text-[var(--ink)]">الملخص المالي</div>
                                <Row k="إجمالي الأوردر" v={formatMoney(order.grand_total_minor ?? 0)} c="#0F172A" />
                                <Row k="المدفوعات المؤكدة" v={formatMoney(paid)} c="#15803D" />
                                <Row k="الرصيد الحالي" v={formatMoney(order.remaining_minor ?? 0)} c="#B45309" />
                                <Row k="المبلغ المتوقع رده بعد الإلغاء" v={formatMoney(paid)} c="#2563EB" />
                            </div>
                        )}
                        <div className="w-full rounded-[12px] bg-[#FEF2F2] p-[14px] text-right text-[12px] leading-[19px] font-[400] text-[#B91C1C] [outline:1px_solid_#FCA5A5] [outline-offset:-0.5px]">
                            سيتم إلغاء الأوردر وإغلاق رابط العميل وإيقاف المهام المرتبطة به.
                        </div>
                        <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className={secondaryBtn}
                            >
                                الرجوع
                            </button>
                            <button
                                type="button"
                                onClick={next}
                                className={dangerBtn}
                            >
                                تأكيد الإلغاء
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogTitle className="w-full text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">
                            تأكيد إلغاء الأوردر
                        </DialogTitle>
                        <DialogDescription className="w-full text-right text-[11px] leading-[18px] font-[400] text-[#92400E]">
                            {showMoney && paid > 0 ? `سيُصبح المتبقي صفرًا، ويُسجل ${formatMoney(paid)} مستحقًا للرد. ` : 'سيُصبح المتبقي صفرًا. '}
                            سيُغلق الرابط والمحادثات وتُوقف المهام المرتبطة بالأوردر.
                        </DialogDescription>
                        <div className="flex w-full shrink-0 justify-end gap-[12px]">
                            <button
                                type="button"
                                onClick={() => setStep('form')}
                                className={secondaryBtn}
                            >
                                الرجوع
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={busy}
                                className={dangerSolidBtn}
                            >
                                تأكيد الإلغاء
                            </button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
