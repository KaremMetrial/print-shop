import { CustomerLayout } from '@/components/shell/customer-layout';
import { PenSelect } from '@/components/pen/form';
import { formatMoneyFixed } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

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
    minimum_quantity: number | null;
    groups: Group[];
}
interface Line {
    uid: number;
    product_id: number | null;
    quantity: string;
    options: Record<number, number[]>;
    notes: string;
}
const xsrf = () => decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '');
let seq = 1;
const blank = (): Line => ({ uid: seq++, product_id: null, quantity: '', options: {}, notes: '' });
const fld = 'h-[46px] w-full rounded-[10px] bg-[var(--background)] p-[0px_14px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus:[outline:2px_solid_var(--primary)]';
const card = 'flex w-full flex-col gap-[12px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';

/** S-082 — إنشاء طلب أوردر (يُراجَع من المطبعة ولا يصبح أوردرًا تلقائيًا — BR-008). السعر المعروض تقديري من الخادم. */
export default function RequestCreate({ products, address }: { products: Product[]; address: string | null }) {
    const [lines, setLines] = useState<Line[]>([blank()]);
    const [method, setMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
    const [addr, setAddr] = useState(address ?? '');
    const [notes, setNotes] = useState('');
    const [total, setTotal] = useState<number | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const key = useRef(crypto.randomUUID());
    const ready = lines.filter((l) => l.product_id && Number(l.quantity) > 0);
    const patch = (uid: number, p: Partial<Line>) => setLines((x) => x.map((l) => (l.uid === uid ? { ...l, ...p } : l)));

    useEffect(() => {
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
        router.post('/portal/requests', { delivery_method: method, delivery_address: method === 'DELIVERY' ? addr : null, notes: notes || null, items: ready.map((l) => ({ product_id: l.product_id, quantity: Number(l.quantity), options: l.options, notes: l.notes || null })) } as never, { headers: { 'Idempotency-Key': crypto.randomUUID() }, onFinish: () => setBusy(false), onError: (e) => setErr(Object.values(e)[0] as string) });
    };
    const ok = ready.length === lines.length && (method === 'PICKUP' || addr.trim().length > 3);

    return (
        <CustomerLayout>
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
