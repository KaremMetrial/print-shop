import { idemHeaders } from '@/lib/idempotency';
import { CustomerLayout } from '@/components/shell/customer-layout';
import { CustomerMobileShell, iso, mArrowBack, mBtnPrimary, mCard } from '@/components/shell/customer-mobile';
import { Icon } from '@/pen/icon';
import { PenSelect } from '@/components/pen/form';
import { formatMoneyFixed } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import {useEffect, useState} from 'react';

interface Group {
    id: number;
    name: string;
    selection_type: 'SINGLE' | 'MULTIPLE';
    is_required: boolean;
    values: { id: number; name: string; addition_minor: number }[];
}
interface Product {
    id: number;
    name: string;
    description?: string | null;
    unit?: string;
    minimum_quantity: number | null;
    groups: Group[];
}
interface Line {
    uid: number;
    product_id: number | null;
    quantity: string;
    options: Record<number, number[]>;
    notes: string;
    files: { id: number; name: string }[];
}
const xsrf = () => decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '');
let seq = 1;
const blank = (): Line => ({ uid: seq++, product_id: null, quantity: '', options: {}, notes: '', files: [] });
const fld = 'h-[46px] w-full rounded-[10px] bg-[var(--background)] p-[0px_14px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus:[outline:2px_solid_var(--primary)]';
const card = 'flex w-full flex-col gap-[12px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';

/** S-082 — إنشاء طلب أوردر (يُراجَع من المطبعة ولا يصبح أوردرًا تلقائيًا — BR-008). السعر المعروض تقديري من الخادم. */
type PenState = { step: number; total_minor: number; lines: { product_id: number; quantity: string; options: Record<number, number[]>; files: { id: number; name: string }[] }[] };
const mLbl = 'w-full text-right text-[14px] leading-[21px] font-[600] text-[#475569]';
const mCtl = 'flex h-[46px] w-full items-center justify-between gap-[12px] rounded-[10px] bg-[#F8FAFC] p-[0px_14px] [outline:1px_solid_#CBD5E1] [outline-offset:-0.5px] focus-within:[outline:2px_solid_#2563EB]';
const mVal = 'min-w-0 flex-1 bg-transparent text-right text-[15px] leading-[23px] font-[400] text-[#0F172A] outline-none placeholder:text-[#64748B]';
const mTitle = 'w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]';
const mMuted = 'w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]';
const mOutlineBtn = 'flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB] [outline:1px_solid_#CBD5E1] [outline-offset:-0.5px]';
const STEPS = ['اختيار المنتجات', 'المواصفات والكميات', 'الملفات والملاحظات', 'طريقة الاستلام', 'راجع طلبك'];
const countWords = (n: number) => (n === 1 ? 'منتج واحد محدد' : n === 2 ? 'منتجان محددان' : `${iso(n)} منتجات محددة`);

export default function RequestCreate({ products, address, pen }: { products: Product[]; address: string | null; pen?: PenState }) {
    const [lines, setLines] = useState<Line[]>(() => (pen ? pen.lines.map((l) => ({ ...blank(), ...l })) : [blank()]));
    const [step, setStep] = useState(pen?.step ?? 1);
    const [openUid, setOpenUid] = useState<number | null>(null);
    const [notesOpen, setNotesOpen] = useState(false);
    const [method, setMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
    const [addr, setAddr] = useState(address ?? '');
    const [notes, setNotes] = useState('');
    const [total, setTotal] = useState<number | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const ready = lines.filter((l) => l.product_id && Number(l.quantity) > 0);
    const patch = (uid: number, p: Partial<Line>) => setLines((x) => x.map((l) => (l.uid === uid ? { ...l, ...p } : l)));

    useEffect(() => {
        if (pen) return setTotal(pen.total_minor);
        if (!ready.length) return setTotal(null);
        const t = setTimeout(async () => {
            const r = await fetch('/portal/requests/quote', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() }, body: JSON.stringify({ items: ready.map((l) => ({ product_id: l.product_id, quantity: Number(l.quantity), options: l.options })) }) });
            const j = await r.json();
            if (r.ok) {
                setTotal(j.data.grand_total_minor);
                setErr(null);
            } else setErr(j.error?.message ?? j.message ?? 'تعذر حساب السعر.');
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(ready)]);

    const submit = () => {
        setBusy(true);
        router.post('/portal/requests', { delivery_method: method, delivery_address: method === 'DELIVERY' ? addr : null, notes: notes || null, items: ready.map((l) => ({ product_id: l.product_id, quantity: Number(l.quantity), options: l.options, file_ids: l.files.map((f) => f.id), notes: l.notes || null })) } as never, { headers: idemHeaders(), onFinish: () => setBusy(false), onError: (e) => setErr(Object.values(e)[0] as string) });
    };
    const ok = ready.length === lines.length && (method === 'PICKUP' || addr.trim().length > 3);

    // ── معالج الموبايل (M-A03..M-A07) ──────────────────────────────────────────
    const selected = lines.filter((l) => l.product_id);
    const prod = (id: number | null) => products.find((x) => x.id === id);
    const toggleProduct = (p: Product) =>
        setLines((x) => (x.some((l) => l.product_id === p.id) ? x.filter((l) => l.product_id !== p.id) : [...x.filter((l) => l.product_id), { ...blank(), product_id: p.id, quantity: String(p.minimum_quantity ?? '') }]));
    const lineValid = (l: Line) => {
        const p = prod(l.product_id);
        return !!p && Number(l.quantity) >= (p.minimum_quantity ?? 1) && p.groups.every((g) => !g.is_required || (l.options[g.id]?.length ?? 0) > 0);
    };
    const stepOk = [selected.length > 0, selected.length > 0 && selected.every(lineValid), true, method === 'PICKUP' || addr.trim().length > 3, selected.length > 0 && ok][step - 1];
    const upload = async (uid: number, file: File | undefined) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/portal/files', { method: 'POST', headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() }, body: fd });
        const j = await r.json().catch(() => ({}));
        if (r.ok) {
            setErr(null);
            setLines((x) => x.map((l) => (l.uid === uid ? { ...l, files: [...l.files, { id: j.data.id, name: j.data.name }] } : l)));
        } else setErr(j.error?.message ?? j.message ?? 'تعذر رفع الملف.');
    };
    const nextLabel = ['التالي: المواصفات', 'التالي: الملفات', 'التالي: الاستلام', 'التالي: مراجعة الطلب'];
    const back = () => (step > 1 ? setStep(step - 1) : router.visit('/portal'));
    const qtyLine = (l: Line) => `${iso(Number(l.quantity).toLocaleString('en-US'))} ${prod(l.product_id)?.unit ?? prod(l.product_id)?.name ?? ''}`;
    const reviewCard = (title: string, target: number, body: string) => (
        <div className={mCard}>
            <div className="flex w-full items-center justify-end gap-[8px] text-right text-[16px] leading-[normal] font-[700] text-[#0F172A]">
                <button type="button" onClick={() => setStep(target)} className="text-[16px] font-[700] text-[#0F172A]">
                    {title} · تعديل
                </button>
            </div>
            <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">{body}</div>
        </div>
    );
    const mobile = (
        <CustomerMobileShell title="طلب أوردر جديد" lead={<button type="button" onClick={back} aria-label="رجوع">{mArrowBack}</button>} leadSide="right">
            <div className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">{`الخطوة ${iso(step)} من ${iso(5)}`}</div>
            <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">{STEPS[step - 1]}</div>
            <div className="flex h-[6px] w-full gap-[3px] rounded-[6px] bg-[#E2E8F0]">
                {[5, 4, 3, 2, 1].map((n) => (
                    <div key={n} className="h-[6px] flex-1 rounded-[4px]" style={{ background: n <= step ? '#2563EB' : '#E2E8F0' }} />
                ))}
            </div>
            {err && <div role="alert" className="w-full rounded-[10px] bg-[var(--danger-soft)] p-[12px_16px] text-right text-[13px] text-[var(--danger-text)]">{err}</div>}

            {step === 1 && (
                <>
                    {products.map((p) => {
                        const on = lines.some((l) => l.product_id === p.id);
                        return (
                            <div key={p.id} className={mCard}>
                                <div className={mTitle}>{p.name}</div>
                                {p.description && <div className={mMuted}>{p.description}</div>}
                                <button type="button" onClick={() => toggleProduct(p)} className={on ? mOutlineBtn : mBtnPrimary}>
                                    {on ? 'تمت الإضافة' : 'إضافة المنتج'}
                                </button>
                            </div>
                        );
                    })}
                    <div className={mCard}>
                        <div className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#334155]">
                            {selected.length === 0 ? 'لم تختر منتجات بعد' : `${countWords(selected.length)} · ${selected.map((l) => prod(l.product_id)?.name).join(selected.length === 2 ? ' و' : '، ')}`}
                        </div>
                    </div>
                </>
            )}

            {step === 2 &&
                selected.map((l, n) => {
                    const p = prod(l.product_id)!;
                    const isOpen = (openUid ?? selected[0].uid) === l.uid;
                    if (!isOpen)
                        return (
                            <button key={l.uid} type="button" onClick={() => setOpenUid(l.uid)} className={`${mCard} text-right`}>
                                <div className="w-full text-right text-[15px] leading-[normal] font-[700] text-[#334155]">{p.name} · افتح لتعديل المواصفات ⌄</div>
                                <div className={mMuted}>اضغط على {p.name} لمراجعة مواصفاته.</div>
                            </button>
                        );
                    return (
                        <div key={l.uid} className={mCard}>
                            <div className={mTitle}>{`${p.name} · البند ${iso(n + 1)} من ${iso(selected.length)}`}</div>
                            <label className="flex w-full flex-col gap-[6px]">
                                <span className={mLbl}>الكمية</span>
                                <div className={mCtl}>
                                    <input dir="rtl" inputMode="numeric" value={l.quantity ? Number(l.quantity).toLocaleString('en-US') : ''} onChange={(e) => patch(l.uid, { quantity: e.target.value.replace(/[^\d]/g, '') })} className={mVal} />
                                </div>
                                {p.minimum_quantity && Number(l.quantity) < p.minimum_quantity ? <span className="w-full text-right text-[12px] text-[#B91C1C]">الحد الأدنى {iso(p.minimum_quantity)}</span> : null}
                            </label>
                            {p.groups.map((g) =>
                                g.selection_type === 'SINGLE' ? (
                                    <label key={g.id} className="flex w-full flex-col gap-[6px]">
                                        <span className={mLbl}>{g.name}</span>
                                        <div className={mCtl}>
                                            <Icon name="chevron-down" className="h-[16px] w-[16px] shrink-0" color="#64748B" />
                                            <select dir="rtl" value={l.options[g.id]?.[0] ?? ''} onChange={(e) => patch(l.uid, { options: { ...l.options, [g.id]: e.target.value ? [Number(e.target.value)] : [] } })} className={`${mVal} cursor-pointer appearance-none`}>
                                                <option value="">اختر</option>
                                                {g.values.map((v) => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </label>
                                ) : (
                                    <div key={g.id} className="flex w-full flex-col gap-[6px]">
                                        <span className={mLbl}>{g.name}</span>
                                        <div className="flex flex-wrap justify-end gap-[8px]">
                                            {g.values.map((v) => {
                                                const on = l.options[g.id]?.includes(v.id);
                                                return (
                                                    <button key={v.id} type="button" onClick={() => patch(l.uid, { options: { ...l.options, [g.id]: on ? (l.options[g.id] ?? []).filter((x) => x !== v.id) : [...(l.options[g.id] ?? []), v.id] } })} className="h-[40px] rounded-[10px] p-[0px_14px] text-[14px] font-[600]" style={{ background: on ? '#2563EB' : '#F8FAFC', color: on ? '#fff' : '#0F172A', outline: '1px solid #CBD5E1' }}>
                                                        {v.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    );
                })}

            {step === 3 && (
                <>
                    {selected.map((l) => (
                        <div key={l.uid} className={mCard}>
                            <div className={mTitle}>{prod(l.product_id)?.name}</div>
                            <label className="flex w-full flex-col gap-[6px]">
                                <span className={mLbl}>إضافة ملف</span>
                                <div className={`${mCtl} cursor-pointer`}>
                                    <Icon name="upload" className="h-[16px] w-[16px] shrink-0" color="#64748B" />
                                    <span className="min-w-0 flex-1 text-right text-[15px] leading-[23px] text-[#64748B]">اختيار ملف من الجهاز</span>
                                    <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" onChange={(e) => { void upload(l.uid, e.target.files?.[0]); e.target.value = ''; }} />
                                </div>
                            </label>
                            {l.files.map((f) => (
                                <div key={f.id} className="flex w-full items-center justify-end gap-[8px] text-right text-[14px] leading-[normal] font-[400] text-[#334155]">
                                    <button type="button" aria-label="إزالة الملف" onClick={() => patch(l.uid, { files: l.files.filter((x) => x.id !== f.id) })} className="text-[#64748B]">✕</button>
                                    <span>{`📎 ${iso(f.name)}`}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className={mCard}>
                        <button type="button" onClick={() => setNotesOpen((o) => !o)} className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#475569]">
                            ملاحظات إضافية ⌄
                        </button>
                        {notesOpen && <textarea dir="rtl" placeholder="اكتب ملاحظاتك للمطبعة (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-[90px] w-full resize-none rounded-[10px] bg-[#F8FAFC] p-[12px] text-right text-[15px] outline-none [outline:1px_solid_#CBD5E1]" />}
                    </div>
                </>
            )}

            {step === 4 && (
                <>
                    <div className="w-full text-right text-[16px] leading-[normal] font-[700] text-[#334155]">كيف تريد استلام أوردرَك؟</div>
                    {([['PICKUP', 'استلام من المطبعة', 'سنخبرك عندما يصبح الأوردر جاهزًا للاستلام.'], ['DELIVERY', 'توصيل', 'أدخل عنوانك بعد اختيار التوصيل. ستظهر الرسوم في ملخص الطلب.']] as const).map(([v, t, d]) => (
                        <div key={v} role="button" tabIndex={0} onClick={() => setMethod(v)} onKeyDown={(e) => e.key === 'Enter' && setMethod(v)} className={`${mCard} cursor-pointer`}>
                            {method === v && <div className="flex w-fit rounded-[20px] bg-[#EFF6FF] p-[6px_11px] text-[12px] leading-[normal] font-[700] whitespace-nowrap text-[#1D4ED8]">محدد</div>}
                            <div className={mTitle}>{t}</div>
                            <div className={`w-full text-right text-[14px] leading-[normal] font-[400] ${method === v && v === 'PICKUP' ? 'text-[#475569]' : 'text-[#64748B]'}`}>{d}</div>
                            {v === 'DELIVERY' && method === 'DELIVERY' && (
                                <input aria-label="عنوان التوصيل" dir="rtl" placeholder="عنوان التوصيل" value={addr} onClick={(e) => e.stopPropagation()} onChange={(e) => setAddr(e.target.value)} className="h-[46px] w-full rounded-[10px] bg-[#F8FAFC] p-[0px_14px] text-right text-[15px] outline-none [outline:1px_solid_#CBD5E1]" />
                            )}
                        </div>
                    ))}
                </>
            )}

            {step === 5 && (
                <>
                    {reviewCard('المنتجات', 1, selected.map((l) => prod(l.product_id)?.name).join(' · '))}
                    {reviewCard('الكميات', 2, selected.map(qtyLine).join(' · '))}
                    {reviewCard('الملفات', 3, selected.flatMap((l) => l.files.map((f) => iso(f.name))).join(' · ') || 'لا توجد ملفات')}
                    {reviewCard('الاستلام', 4, method === 'PICKUP' ? 'استلام من المطبعة' : `توصيل · ${addr}`)}
                    <div className={mCard}>
                        <div className={mMuted}>إجمالي مبدئي</div>
                        <div className="w-full text-right text-[24px] leading-[normal] font-[700] text-[#0F172A]">{total === null ? '—' : `${iso((total / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))} ج.م`}</div>
                        <div className={mMuted}>تراجع المطبعة الطلب والسعر قبل قبوله.</div>
                    </div>
                </>
            )}

            <button type="button" disabled={!stepOk || busy} onClick={() => (step < 5 ? setStep(step + 1) : submit())} className={`${mBtnPrimary} disabled:opacity-60`}>
                {step < 5 ? nextLabel[step - 1] : 'إرسال الطلب للمراجعة'}
            </button>
        </CustomerMobileShell>
    );

    return (
        <CustomerLayout mobile={mobile}>
            <Head title="إنشاء طلب أوردر" />
            <h1 className="w-full text-right text-[28px] leading-[40px] font-[700]">إنشاء طلب أوردر</h1>
            <div className="w-full text-right text-[14px] text-[var(--muted-foreground)]">اختر المنتجات والمواصفات والكميات، وستراجع المطبعة طلبك قبل تحويله لأوردر.</div>
            {err && <div role="alert" className="w-full rounded-[10px] bg-[var(--danger-soft)] p-[12px_16px] text-right text-[13px] text-[var(--danger-text)]">{err}</div>}
            {lines.map((l, n) => {
                const p = products.find((x) => x.id === l.product_id);
                return (
                    <div key={l.uid} className={card}>
                        <div className="flex items-center justify-between">
                            {lines.length > 1 ? (
                                <button type="button" onClick={() => setLines((x) => x.filter((y) => y.uid !== l.uid))} className="text-[13px] font-[600] text-[var(--danger-text)]">
                                    حذف البند
                                </button>
                            ) : (
                                <span />
                            )}
                            <b className="text-[16px]">البند {n + 1}</b>
                        </div>
                        <div className="flex gap-[12px]">
                            <label className="flex flex-1 flex-col gap-[6px] text-right text-[13px] font-[600]">
                                الكمية
                                <input inputMode="numeric" value={l.quantity} onChange={(e) => patch(l.uid, { quantity: e.target.value.replace(/[^\d]/g, '') })} className={fld} />
                                {p?.minimum_quantity ? <span className="text-[11px] font-[400] text-[var(--muted-foreground)]">الحد الأدنى {p.minimum_quantity}</span> : null}
                            </label>
                            <label className="flex flex-1 flex-col gap-[6px] text-right text-[13px] font-[600]">
                                المنتج
                            <PenSelect
                                label="المنتج"
                                value={String(l.product_id ?? '')}
                                placeholder="اختر المنتج"
                                options={products.map((x) => ({ value: String(x.id), label: x.name }))}
                                onValueChange={(v) => patch(l.uid, { product_id: Number(v) || null, options: {} })}
                            />
                            </label>
                        </div>
                        {p?.groups.map((g) => (
                            <div key={g.id} className="flex flex-col gap-[6px]">
                                <span className="text-right text-[13px] font-[600]">{g.name}{g.is_required ? ' *' : ''}</span>
                                <div className="flex flex-wrap justify-end gap-[8px]">
                                    {g.values.map((v) => {
                                        const on = l.options[g.id]?.includes(v.id);
                                        return (
                                            <button key={v.id} type="button" onClick={() => patch(l.uid, { options: { ...l.options, [g.id]: g.selection_type === 'SINGLE' ? [v.id] : on ? (l.options[g.id] ?? []).filter((x) => x !== v.id) : [...(l.options[g.id] ?? []), v.id] } })} className="h-[40px] rounded-[8px] p-[0px_14px] text-[13px]" style={{ background: on ? '#EFF6FF' : '#FFFFFF', outline: `1px solid ${on ? '#2563EB' : '#E2E8F0'}`, color: on ? '#2563EB' : '#0F172A' }}>
                                                {v.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        <textarea dir="rtl" placeholder="ملاحظات على البند (اختياري)" value={l.notes} onChange={(e) => patch(l.uid, { notes: e.target.value })} className="h-[70px] w-full resize-none rounded-[10px] bg-[var(--background)] p-[12px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)]" />
                    </div>
                );
            })}
            <button type="button" onClick={() => setLines((x) => [...x, blank()])} className="h-[44px] w-fit self-end rounded-[8px] bg-[var(--surface)] p-[0px_18px] text-[14px] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)]">
                إضافة منتج آخر
            </button>
            <div className={card}>
                <b className="text-right text-[16px]">التسليم</b>
                <div className="flex justify-end gap-[8px]">
                    {([['DELIVERY', 'توصيل'], ['PICKUP', 'استلام من المطبعة']] as const).map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setMethod(v)} className="h-[40px] rounded-[8px] p-[0px_16px] text-[13px] font-[600]" style={{ background: method === v ? '#2563EB' : '#FFFFFF', color: method === v ? '#FFFFFF' : '#0F172A', outline: '1px solid #E2E8F0' }}>
                            {l}
                        </button>
                    ))}
                </div>
                {method === 'DELIVERY' && <input aria-label="عنوان التوصيل" placeholder="عنوان التوصيل" value={addr} onChange={(e) => setAddr(e.target.value)} className={fld} />}
                <textarea dir="rtl" placeholder="ملاحظات عامة (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-[80px] w-full resize-none rounded-[10px] bg-[var(--background)] p-[12px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)]" />
            </div>
            <div className="flex w-full items-center justify-between rounded-[12px] bg-[#EFF6FF] p-[16px_20px]">
                <button type="button" disabled={busy || !ok} onClick={submit} className="h-[44px] rounded-[8px] bg-[var(--primary)] p-[0px_24px] text-[14px] font-[600] text-white disabled:opacity-60">
                    إرسال الطلب
                </button>
                <div className="text-right">
                    <div className="text-[12px] text-[var(--muted-foreground)]">الإجمالي التقديري (يُؤكَّد بعد المراجعة)</div>
                    <div className="text-[22px] font-[700] text-[var(--primary)]">{total === null ? '—' : formatMoneyFixed(total)}</div>
                </div>
            </div>
        </CustomerLayout>
    );
}
