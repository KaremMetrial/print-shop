import { PenTextarea } from '@/components/pen/form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

const actionBtn =
    'flex h-[46px] w-fit shrink-0 items-center justify-center rounded-[10px] px-[16px] text-left text-[14px] leading-[22px] font-[600] whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-60';
const secondaryBtn = `${actionBtn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--control-border)] hover:bg-[var(--surface-subtle)]`;
const dangerSolidBtn = `${actionBtn} bg-[var(--danger)] text-white hover:bg-[#B91C1C]`;

/** إلغاء بند (Soft Cancel قبل الطباعة — 6.6): السبب إلزامي، يُعاد حساب إجمالي الأوردر بالسيرفر. */
export function CancelItemDialog({ orderId, item, onClose }: { orderId: number; item: { id: number; label: string }; onClose: () => void }) {
    const [reason, setReason] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    const submit = () => {
        if (!reason.trim()) return setErr('اكتب سبب إلغاء البند.');
        setBusy(true);
        router.post(
            `/orders/${orderId}/items/${item.id}/cancel`,
            { reason },
            { headers: { 'Idempotency-Key': crypto.randomUUID() }, preserveScroll: true, onFinish: () => setBusy(false), onSuccess: onClose },
        );
    };
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[440px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] leading-[30px] font-[700] text-[var(--ink)]">إلغاء البند</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] leading-[21px] text-[var(--muted-foreground)]">
                    {item.label} — لن يُحتسب ضمن قيمة الأوردر ولا ضمن شرط اعتماد البنود، ويبقى سجله محفوظًا.
                </DialogDescription>
                <PenTextarea
                    v3
                    label="سبب الإلغاء *"
                    placeholder="اكتب السبب…"
                    value={reason}
                    error={err || undefined}
                    onChange={(e) => {
                        setReason(e.target.value);
                        setErr('');
                    }}
                />
                <div className="flex w-full items-center justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className={secondaryBtn}
                    >
                        الرجوع
                    </button>
                    <button type="button" disabled={busy} onClick={submit} className={dangerSolidBtn}>
                        تأكيد إلغاء البند
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
