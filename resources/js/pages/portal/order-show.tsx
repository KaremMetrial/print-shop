import { ProofDialog } from '@/components/finance/proof-dialog';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { CustomerMobileShell, iso, mArrowBack, mBtnPrimary, mCard, mMoney } from '@/components/shell/customer-mobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { idemHeaders } from '@/lib/idempotency';
import { Icon } from '@/pen/icon';
import { formatDate, formatMoneyFixed } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    order: {
        id: number;
        number: string;
        status: string;
        created_at: string;
        delivery_method: string;
        delivery_address: string | null;
        delivery_fee_minor: number;
        grand_total_minor: number;
        has_invoice: boolean;
        paid_minor: number;
        remaining_minor: number;
        items: { id: number; name: string; quantity: number; state: string; approved: boolean; total_minor: number; version_no?: number | null }[];
        payments: { number: string; at: string; amount_minor: number }[];
    };
}
const card = 'flex w-full flex-col gap-[10px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)]';
const STATE: Record<string, string> = { NEW: 'قيد الإعداد', IN_DESIGN: 'قيد التصميم', REVISION_REQUESTED: 'يتم التعديل', AWAITING_APPROVAL: 'بانتظار اعتمادك', APPROVED: 'معتمد' };
const KV = ({ k, v }: { k: string; v: string }) => (
    <div className="flex w-full justify-between text-[14px]">
        <b>{v}</b>
        <span className="text-[var(--muted-foreground)]">{k}</span>
    </div>
);

/** S-085 — تفاصيل الأوردر للعميل المسجّل: بنود، مدفوعات، تسليم. */
const ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
const ctl = 'flex h-[46px] w-full items-center justify-between gap-[12px] rounded-[10px] bg-[#F8FAFC] p-[0px_14px] [outline:1px_solid_#CBD5E1] [outline-offset:-0.5px] focus-within:[outline:2px_solid_#2563EB]';
const val = 'min-w-0 flex-1 bg-transparent text-right text-[15px] leading-[23px] font-[400] text-[#0F172A] outline-none placeholder:text-[#64748B]';
const lbl = 'w-full text-right text-[14px] leading-[21px] font-[600] text-[#475569]';
const stateText = (i: { state: string; approved: boolean }) => (i.state === 'AWAITING_APPROVAL' ? 'بانتظار اعتمادك' : i.approved || i.state === 'APPROVED' ? 'معتمد' : i.state === 'REVISION_REQUESTED' ? 'يتم التعديل' : i.state === 'IN_DESIGN' ? 'قيد التنفيذ · لا معاينة رسمية بعد' : 'قيد الإعداد');

/** ورقة إرسال إثبات الدفع (M-A13): نفس نقطة النهاية/القيود كحوار سطح المكتب؛ لا يُحتسب إلا بعد تأكيد المحاسب. */
function MobileProofSheet({ url, order, remaining, onClose }: { url: string; order: string; remaining: number; onClose: () => void }) {
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
        <CustomerMobileShell title="تفاصيل الأوردر" lead={<button type="button" onClick={onClose} aria-label="رجوع">{mArrowBack}</button>} leadSide="right">
            <div className="w-full text-right text-[15px] leading-[normal] font-[400] text-[#64748B]">{`${iso(order)} · المتبقي ${mMoney(remaining)}`}</div>
            <div className="flex w-full flex-col items-end gap-[14px] rounded-[20px] bg-white p-[20px_16px_24px_16px]">
                <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">إرسال إثبات دفع</div>
                <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">{`المتبقي الآن ${mMoney(remaining)}`}</div>
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
                        <select dir="rtl" value={method} onChange={(e) => setMethod(e.target.value)} className={`${val} cursor-pointer appearance-none`} style={{ color: method ? '#0F172A' : '#64748B' }}>
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
                <button type="button" onClick={() => setNoteOpen((o) => !o)} className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                    إضافة ملاحظة ⌄
                </button>
                {noteOpen && <input dir="rtl" placeholder="رقم العملية / ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} className="h-[46px] w-full rounded-[10px] bg-[#F8FAFC] p-[0px_14px] text-right text-[15px] outline-none [outline:1px_solid_#CBD5E1]" />}
                {err && <div role="alert" className="w-full text-right text-[13px] text-[#DC2626]">{err}</div>}
                <button type="button" disabled={busy} onClick={submit} className={`${mBtnPrimary} disabled:opacity-60`}>
                    إرسال الإثبات
                </button>
                <button type="button" onClick={onClose} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB]">
                    إلغاء
                </button>
            </div>
        </CustomerMobileShell>
    );
}

export default function PortalOrderShow({ order: o, pen }: Props & { pen?: { proof: boolean } }) {
    const [proof, setProof] = useState(pen?.proof ?? false);
    const isMobile = useIsMobile();
    const first = o.items.find((i) => i.state === 'AWAITING_APPROVAL');
    const mobile = proof ? (
        <MobileProofSheet url={`/portal/orders/${o.id}/proofs`} order={o.number} remaining={o.remaining_minor} onClose={() => setProof(false)} />
    ) : (
        <CustomerMobileShell title="تفاصيل الأوردر" tab="orders" lead={mArrowBack} leadSide="right">
            <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">{iso(o.number)}</div>
            <div className="w-full text-right text-[15px] leading-[normal] font-[700] text-[#2563EB]">{o.status}</div>
            {first && (
                <div className={mCard}>
                    <div className="w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]">تصميم بانتظار موافقتك</div>
                    <div className="w-full text-right text-[15px] leading-[normal] font-[400] text-[#334155]">{`${first.name} · النسخة ${ORD[(first.version_no ?? 1) - 1] ?? iso(first.version_no)}`}</div>
                    <Link href={`/portal/orders/${o.id}/items/${first.id}`} className={mBtnPrimary}>
                        راجع التصميم
                    </Link>
                </div>
            )}
            <div className={mCard}>
                <div className="w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]">بنود الأوردر</div>
                {o.items.map((i) => (
                    <Link key={i.id} href={`/portal/orders/${o.id}/items/${i.id}`} className={`w-full text-right text-[14px] leading-[normal] font-[400] ${i.state === 'AWAITING_APPROVAL' ? 'text-[#334155]' : 'text-[#64748B]'}`}>
                        {`${i.name} · ${stateText(i)}`}
                    </Link>
                ))}
            </div>
            <div className={mCard}>
                <div className="w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]">ملخص المبلغ</div>
                <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#334155]">{`الإجمالي ${mMoney(o.grand_total_minor)} · المدفوع ${mMoney(o.paid_minor)}`}</div>
                <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">المتبقي عليك</div>
                <div className="w-full text-right text-[30px] leading-[normal] font-[700] text-[#0F172A]">{mMoney(o.remaining_minor)}</div>
                {o.remaining_minor > 0 && (
                    <button type="button" onClick={() => setProof(true)} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB]">
                        إرسال إثبات دفع
                    </button>
                )}
            </div>
            <div className={mCard}>
                <div className="w-full text-right text-[16px] leading-[normal] font-[700] text-[#0F172A]">{o.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'}</div>
                <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">
                    {o.delivery_method === 'DELIVERY' ? `${o.delivery_address ?? ''} · الرسوم ${mMoney(o.delivery_fee_minor)}` : 'سنخبرك عندما يصبح الأوردر جاهزًا.'}
                </div>
            </div>
            {o.has_invoice ? (
                <Link href={`/portal/orders/${o.id}/invoice`} className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                    عرض الفاتورة
                </Link>
            ) : (
                <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">الفاتورة غير متاحة بعد.</div>
            )}
        </CustomerMobileShell>
    );
    return (
        <CustomerLayout mobile={mobile}>
            <Head title={`الأوردر ${o.number}`} />
            <div className="flex w-full flex-col gap-[4px]">
                <h1 className="text-right text-[28px] leading-[40px] font-[700]">الأوردر {o.number}</h1>
                <div className="text-right text-[14px] text-[var(--muted-foreground)]">{o.status} • {formatDate(o.created_at)}</div>
            </div>
            <div className={card}>
                <div className="text-right text-[18px] font-[700]">البنود</div>
                {o.items.map((i) => (
                    <div key={i.id} className="flex w-full items-center justify-between p-[8px_0px] [border-bottom:1px_solid_var(--border)]">
                        {i.state === 'AWAITING_APPROVAL' ? (
                            <Link href={`/portal/orders/${o.id}/items/${i.id}`} className="flex h-[38px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_14px] text-[13px] font-[600] text-white">
                                راجع التصميم
                            </Link>
                        ) : (
                            <Link href={`/portal/orders/${o.id}/items/${i.id}`} className="text-[13px] font-[600] text-[var(--primary)]">
                                عرض التصميم
                            </Link>
                        )}
                        <span className="text-[13px]">{formatMoneyFixed(i.total_minor)}</span>
                        <span className="text-[13px] text-[var(--muted-foreground)]">{STATE[i.state] ?? i.state}</span>
                        <span className="text-[13px]">الكمية: {i.quantity.toLocaleString('en-US')}</span>
                        <b className="text-[15px]">{i.name}</b>
                    </div>
                ))}
            </div>
            <div className="flex w-full flex-col gap-[16px] lg:flex-row">
                <div className={`${card} flex-1`}>
                    <div className="text-right text-[18px] font-[700]">ملخص الدفع</div>
                    <KV k="الإجمالي" v={formatMoneyFixed(o.grand_total_minor)} />
                    <KV k="المدفوع المؤكد" v={formatMoneyFixed(o.paid_minor)} />
                    <KV k="المتبقي عليك" v={formatMoneyFixed(o.remaining_minor)} />
                    {o.has_invoice && (
                        <Link href={`/portal/orders/${o.id}/invoice`} className="text-right text-[13px] font-[700] text-[var(--primary)]">عرض الفاتورة الداخلية</Link>
                    )}
                    {o.remaining_minor > 0 && (
                        <button type="button" onClick={() => setProof(true)} className="text-right text-[13px] font-[700] text-[var(--primary)]">إرسال إثبات دفع</button>
                    )}
                    {proof && isMobile === false && <ProofDialog url={`/portal/orders/${o.id}/proofs`} remainingMinor={o.remaining_minor} onClose={() => setProof(false)} />}
                    {o.payments.map((p) => (
                        <div key={p.number} className="flex justify-between text-[12px] text-[var(--muted-foreground)]">
                            <span>{formatMoneyFixed(p.amount_minor)}</span>
                            <span>{p.number} • {formatDate(p.at)}</span>
                        </div>
                    ))}
                </div>
                <div className={`${card} flex-1`}>
                    <div className="text-right text-[18px] font-[700]">التسليم</div>
                    <KV k="الطريقة" v={o.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'} />
                    {o.delivery_method === 'DELIVERY' && <KV k="العنوان" v={o.delivery_address ?? '—'} />}
                    {o.delivery_method === 'DELIVERY' && <KV k="الرسوم" v={formatMoneyFixed(o.delivery_fee_minor)} />}
                </div>
            </div>
        </CustomerLayout>
    );
}
