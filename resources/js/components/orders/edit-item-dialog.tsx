import { PenInput, PenTextarea } from '@/components/pen/form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

/** تعديل كمية وملاحظات بند قبل الطباعة. السعر يُعاد حسابه بالسيرفر. */
export function EditItemDialog({
    orderId,
    item,
    onClose,
}: {
    orderId: number;
    item: { id: number; label: string; quantity: number; notes: string | null };
    onClose: () => void;
}) {
    const [qty, setQty] = useState(String(item.quantity));
    const [notes, setNotes] = useState(item.notes ?? '');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    const save = () => {
        if (!Number(qty) || Number(qty) < 1) return setErr('أدخل كمية صحيحة.');
        setBusy(true);
        router.patch(
            `/orders/${orderId}/items/${item.id}`,
            { quantity: Number(qty), notes: notes || null },
            {
                headers: { 'Idempotency-Key': key.current },
                preserveScroll: true,
                onFinish: () => setBusy(false),
                onSuccess: onClose,
                onError: (e) => setErr(Object.values(e)[0] as string),
            },
        );
    };
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[460px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] font-[700] text-[var(--ink)]">تعديل البند</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] text-[var(--muted-foreground)]">
                    {item.label} — تغيير الكمية يعيد حساب سعر البند والأوردر.
                </DialogDescription>
                <PenInput
                    v3
                    label="الكمية"
                    value={qty}
                    inputMode="numeric"
                    error={err || undefined}
                    onChange={(e) => {
                        setQty(e.target.value.replace(/\D/g, ''));
                        setErr('');
                    }}
                />
                <PenTextarea v3 label="ملاحظات البند" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="flex w-full justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[34px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_12px] text-[12px] font-[600] text-[var(--ink)] [outline:1px_solid_var(--border)]"
                    >
                        الرجوع
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={save}
                        className="flex h-[34px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_12px] text-[12px] font-[600] text-white disabled:opacity-60"
                    >
                        حفظ التعديل
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
