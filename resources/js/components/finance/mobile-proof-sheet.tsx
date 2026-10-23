import { mBtnPrimary, iso, mMoney } from '@/components/shell/customer-mobile';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { idemHeaders } from '@/lib/idempotency';
import { Icon } from '@/pen/icon';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const ctl = 'flex h-[46px] w-full items-center justify-between gap-[12px] rounded-[10px] bg-[#F8FAFC] p-[0px_14px] [outline:1px_solid_#CBD5E1] [outline-offset:-0.5px] focus-within:[outline:2px_solid_#2563EB]';
const val = 'min-w-0 flex-1 bg-transparent text-right text-[15px] leading-[23px] font-[400] text-[#0F172A] outline-none placeholder:text-[#64748B]';
const lbl = 'w-full text-right text-[14px] leading-[21px] font-[600] text-[#475569]';

/** ورقة إرسال إثبات الدفع (M-A13): نفس نقطة النهاية/القيود كحوار سطح المكتب؛ لا يُحتسب إلا بعد تأكيد المحاسب. */
export function MobileProofSheetBody({ url, order, remaining, onClose, colon }: { url: string; order: string; remaining: number; onClose: () => void; colon?: boolean }) {
    const { enabled } = usePaymentMethods();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState('');
    const [noteOpen, setNoteOpen] = useState(false);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = () => {
        if (!file || !Number(amount) || !method) return setErr('أدخل المبلغ واختر الطريقة وصورة الإثبات.');
        setBusy(true);
        router.post(url, { file, amount_minor: Math.round(Number(amount) * 100), method, reference: note || null } as never, {
            forceFormData: true,
            headers: idemHeaders(),
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: onClose,
            onError: (e) => setErr(Object.values(e)[0] as string),
        });
    };
    return (
        <>
            <div className="w-full text-right text-[15px] leading-[1.874] font-[400] text-[#64748B]">{`${iso(order)} · المتبقي ${mMoney(remaining)}`}</div>
            <div className="flex w-full flex-col items-end gap-[14px] rounded-[20px] bg-white p-[20px_16px_24px_16px]">
                <div className="w-full text-right text-[22px] leading-[1.874] font-[700] text-[#0F172A]">إرسال إثبات دفع</div>
                <div className="w-full text-right text-[14px] leading-[1.874] font-[400] text-[#475569]">{`المتبقي الآن${colon ? ':' : ''} ${mMoney(remaining)}`}</div>
                <label className="flex w-full flex-col gap-[6px]">
                    <span className={lbl}>المبلغ المدفوع</span>
                    <div className={ctl}>
                        <input dir="rtl" inputMode="decimal" placeholder="أدخل المبلغ · ج.م" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} className={val} />
                    </div>
                </label>
                <label className="flex w-full flex-col gap-[6px]">
                    <span className={lbl}>طريقة الدفع</span>
                    <div className={ctl}>
                        <Icon name="chevron-down" className="h-[16px] w-[16px] shrink-0" color="#64748B" />
                        <select dir="rtl" value={method} onChange={(e) => setMethod(e.target.value)} className={`${val} cursor-pointer appearance-none`}>
                            <option value="">اختر طريقة مفعّلة</option>
                            {Object.entries(enabled).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </div>
                </label>
                <label className="flex w-full flex-col gap-[6px]">
                    <span className={lbl}>صورة إثبات الدفع</span>
                    <div className={`${ctl} cursor-pointer`}>
                        <Icon name="upload" className="h-[16px] w-[16px] shrink-0" color="#64748B" />
                        <span className="min-w-0 flex-1 truncate text-right text-[15px] leading-[23px] text-[#64748B]">{file ? file.name : 'إضافة صورة الإثبات'}</span>
                        <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" aria-label="ملف الإثبات" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    </div>
                </label>
                <button type="button" onClick={() => setNoteOpen((o) => !o)} className="w-full text-right text-[14px] leading-[1.874] font-[700] text-[#2563EB]">
                    إضافة ملاحظة ⌄
                </button>
                {noteOpen && <input dir="rtl" placeholder="رقم العملية / ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} className="h-[46px] w-full rounded-[10px] bg-[#F8FAFC] p-[0px_14px] text-right text-[15px] outline-none [outline:1px_solid_#CBD5E1]" />}
                {err && <div role="alert" className="w-full text-right text-[13px] text-[#DC2626]">{err}</div>}
                <button type="button" disabled={busy} onClick={submit} className={`${mBtnPrimary} disabled:opacity-60`}>
                    إرسال الإثبات
                </button>
                <button type="button" onClick={onClose} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[1.874] font-[700] text-[#2563EB]">
                    إلغاء
                </button>
            </div>
        </>
    );
}

