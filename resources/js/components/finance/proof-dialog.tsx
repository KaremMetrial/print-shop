import { PenInput, PenSelect } from '@/components/pen/form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

const btn = 'flex h-[38px] items-center justify-center rounded-[8px] p-[0px_14px] text-[13px] font-[600] disabled:opacity-60';

/** رفع إثبات دفع من العميل (رابط/بوابة). لا يُحتسب كدفعة إلا بعد تأكيد المحاسب. */
export function ProofDialog({ url, remainingMinor, onClose }: { url: string; remainingMinor: number; onClose: () => void }) {
    const [amount, setAmount] = useState(remainingMinor > 0 ? String(remainingMinor / 100) : '');
    const { enabled } = usePaymentMethods();
    const [method, setMethod] = useState(Object.keys(enabled)[0] ?? 'CASH');
    const [ref, setRef] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    const pick = useRef<HTMLInputElement>(null);
    const submit = () => {
        if (!file || !Number(amount)) return setErr('اختر صورة الإثبات وأدخل المبلغ.');
        setBusy(true);
        router.post(url, { file, amount_minor: Math.round(Number(amount) * 100), method, reference: ref || null } as never, {
            forceFormData: true,
            headers: { 'Idempotency-Key': key.current },
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: onClose,
            onError: (e) => setErr(Object.values(e)[0] as string),
        });
    };
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[480px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] font-[700] text-[var(--ink)]">إرسال إثبات دفع</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] text-[var(--muted-foreground)]">
                    ارفع صورة التحويل (صورة أو PDF حتى 10 ميجا). سيُراجعه فريق المحاسبة ولن يُحتسب إلا بعد التأكيد.
                </DialogDescription>
                <PenInput
                    v3
                    label="المبلغ المحوَّل (ج.م)"
                    value={amount}
                    inputMode="decimal"
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                />
                <PenSelect
                    v3
                    label="طريقة الدفع"
                    value={method}
                    options={Object.entries(enabled).map(([value, label]) => ({ value, label }))}
                    onValueChange={setMethod}
                />
                <PenInput v3 label="رقم العملية / المرجع (اختياري)" value={ref} onChange={(e) => setRef(e.target.value)} />
                <input
                    ref={pick}
                    type="file"
                    hidden
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    aria-label="ملف الإثبات"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex w-full items-center gap-[10px]">
                    <button
                        type="button"
                        onClick={() => pick.current?.click()}
                        className="flex h-[40px] shrink-0 items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-[13px] font-[600] text-[var(--ink)] [outline:1px_solid_var(--border)]"
                    >
                        اختيار ملف
                    </button>
                    <div className="min-w-0 flex-1 truncate text-right text-[13px] text-[var(--muted-foreground)]">
                        {file ? file.name : 'لم يتم اختيار ملف'}
                    </div>
                </div>
                {err && (
                    <div role="alert" className="w-full text-right text-[12px] text-[#DC2626]">
                        {err}
                    </div>
                )}
                <div className="flex w-full justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`${btn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}
                    >
                        إلغاء
                    </button>
                    <button type="button" disabled={busy} onClick={submit} className={`${btn} bg-[var(--primary)] text-white`}>
                        إرسال الإثبات
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
