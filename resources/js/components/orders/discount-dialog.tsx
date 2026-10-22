import { PenInput, PenSelect } from '@/components/pen/form';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { idemHeaders } from '@/lib/idempotency';
import { formatMoneyFixed } from '@/lib/money';
import { router } from '@inertiajs/react';
import { useState } from 'react';

/** S-038 — حوار الخصم: نسبة أو مبلغ ثابت أو بدون. المعاينة تقريبية والحساب النهائي بالسيرفر (BR-056/057). */
export function DiscountDialog({ orderId, subtotalMinor, type, value, onClose }: { orderId: number; subtotalMinor: number; type: string; value: string; onClose: () => void }) {
    const [t, setT] = useState(type || 'NONE');
    const [v, setV] = useState(value && value !== '0' ? value : '');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const n = Number(v) || 0;
    const preview = t === 'PERCENT' ? Math.round((subtotalMinor * Math.min(n, 100)) / 100) : t === 'FIXED' ? Math.min(Math.round(n * 100), subtotalMinor) : 0;
    const save = () => {
        if (t !== 'NONE' && (!n || n < 0)) return setErr('أدخل قيمة خصم صحيحة.');
        if (t === 'PERCENT' && n > 100) return setErr('نسبة الخصم لا تتجاوز 100%.');
        setBusy(true);
        router.patch(`/orders/${orderId}/discount`, { discount_type: t, discount_value: t === 'FIXED' ? Math.round(n * 100) : n } as never, { headers: idemHeaders(), preserveScroll: true, onFinish: () => setBusy(false), onSuccess: onClose, onError: (e) => setErr(Object.values(e)[0] as string) });
    };
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[460px] max-w-[95vw] gap-[14px] rounded-[12px] p-[20px]" dir="ltr">
                <DialogTitle className="w-full text-right text-[20px] font-[700] text-[var(--ink)]">تطبيق خصم</DialogTitle>
                <DialogDescription className="w-full text-right text-[13px] text-[var(--muted-foreground)]">يُطبَّق على إجمالي البنود ويُعاد حساب إجمالي الأوردر. التغيير مُدقَّق.</DialogDescription>
                <PenSelect v3 label="نوع الخصم" value={t} options={[{ value: 'NONE', label: 'بدون خصم' }, { value: 'PERCENT', label: 'نسبة مئوية %' }, { value: 'FIXED', label: 'مبلغ ثابت (ج.م)' }]} onValueChange={(x) => { setT(x); setErr(''); }} />
                {t !== 'NONE' && <PenInput v3 label={t === 'PERCENT' ? 'النسبة %' : 'المبلغ (ج.م)'} value={v} inputMode="decimal" error={err || undefined} onChange={(e) => { setV(e.target.value.replace(/[^\d.]/g, '')); setErr(''); }} />}
                {t === 'NONE' && err && <div role="alert" className="w-full text-right text-[12px] text-[#DC2626]">{err}</div>}
                <div className="w-full rounded-[8px] bg-[var(--background)] p-[10px_12px] text-right text-[13px] text-[var(--ink)]">{`قيمة الخصم المتوقعة: ${formatMoneyFixed(preview)} من ${formatMoneyFixed(subtotalMinor)}`}</div>
                <div className="flex w-full justify-end gap-[12px]">
                    <button type="button" onClick={onClose} className="flex h-[34px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_12px] text-[12px] font-[600] text-[var(--ink)] [outline:1px_solid_var(--border)]">الرجوع</button>
                    <button type="button" disabled={busy} onClick={save} className="flex h-[34px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_12px] text-[12px] font-[600] text-white disabled:opacity-60">تطبيق الخصم</button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
