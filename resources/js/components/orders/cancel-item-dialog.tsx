import { PenTextarea } from '@/components/pen/form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

const btn =
    'flex h-[34px] w-fit shrink-0 items-center justify-center rounded-[8px] p-[0px_12px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap [outline-offset:-0.5px] disabled:opacity-60';

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
            { headers: { 'Idempotency-Key': key.current }, preserveScroll: true, onFinish: () => setBusy(false), onSuccess: onClose },
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
                        className={`${btn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}
                    >
                        الرجوع
                    </button>
                    <button type="button" disabled={busy} onClick={submit} className={`${btn} bg-[#DC2626] text-white`}>
                        تأكيد إلغاء البند
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
