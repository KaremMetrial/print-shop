import { idemHeaders } from '@/lib/idempotency';
import { PenInput, PenSelect, PenTextarea } from '@/components/pen/form';
import { PenButton } from '@/components/pen/primitives';
import { adminNav } from '@/components/shell/nav-config';
import AppLayout from '@/layouts/app-layout';
import { formatMoney, formatMoneyFixed } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, router } from '@inertiajs/react';
import {useEffect, useMemo, useState} from 'react';

interface Group {
    id: number;
    name: string;
    selection_type: 'SINGLE' | 'MULTIPLE';
    is_required: boolean;
    values: { id: number; name: string; addition_minor: number }[];
}
interface ProductOpt {
    id: number;
    name: string;
    minimum_quantity: number | null;
    groups: Group[];
}
interface CustomerCard {
    id: number;
    code: string;
    name: string;
    phone: string;
    address: string | null;
    tier: string;
    tier_discount: string | null;
    platform_access: boolean;
}
interface Item {
    uid: number;
    product_id: number | null;
    quantity: string;
    options: Record<number, number[]>;
    notes: string;
}
interface ItemQuote {
    base_unit_minor: number;
    options_unit_minor: number;
    standard_unit_minor: number;
    final_unit_minor: number;
    item_total_minor: number;
    options: { value: string }[];
}
interface Quote {
    items: ItemQuote[];
    subtotal_minor: number;
    discount_minor: number;
    delivery_fee_minor: number;
    grand_total_minor: number;
}
interface Fixture {
    step: number;
    items: Omit<Item, 'uid'>[];
    discount_type: 'NONE' | 'FIXED' | 'PERCENT';
    discount_value: string;
    method: 'PICKUP' | 'DELIVERY';
    address: string;
    fee: string;
    eta: string;
}
interface Props {
    fixture?: Fixture | null;
    customer: CustomerCard | null;
    products: ProductOpt[];
    can: { discount: boolean };
}

const navOrders = adminNav.map((g) => ({ ...g, items: g.items.map((i) => (i.href === '/orders' ? { ...i, title: 'الأوردرات' } : i)) }));
const STEPS = ['العميل', 'البنود', 'التسعير', 'التسليم', 'المراجعة'];
const SUBTITLE = ['اختيار العميل', 'بنود الأوردر', 'مراجعة التسعير', 'التسليم ومدة الطباعة', 'مراجعة البيانات قبل إنشاء الأوردر'];
const xsrf = () => decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '');
const toMinor = (v: string) => Math.round(parseFloat(v.replace(/[^\d.]/g, '') || '0') * 100);
const num = (v: string) => parseInt(v.replace(/[^\d]/g, '') || '0', 10);
const fmtInt = (n: number) => n.toLocaleString('en-US');
let uidSeq = 1;
const blank = (): Item => ({ uid: uidSeq++, product_id: null, quantity: '', options: {}, notes: '' });

const card = 'flex flex-col rounded-[10px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const btn = 'flex h-[40px] w-fit shrink-0 items-center justify-center gap-[12px] rounded-[8px] p-[0px_18px] [outline-offset:-0.5px]';
const btnLbl = 'text-left text-[14px] leading-[normal] font-[600] whitespace-nowrap';
const small = 'flex h-[36px] w-fit shrink-0 items-center rounded-[7px] bg-[var(--surface)] p-[0px_14px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] text-left text-[13px] leading-[normal] font-[400] whitespace-nowrap text-[var(--ink)]';
const act38 = 'flex h-[38px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] text-left text-[13px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]';

function Stepper({ step }: { step: number }) {
    const nodes = [...STEPS.keys()].reverse();
    return (
        <div className={`${card} h-[56px] w-full shrink-0 flex-row items-center justify-end gap-[32px] p-[0px_32px]`}>
            {nodes.map((i) => {
                const done = i < step;
                const on = i === step;
                return (
                    <div key={i} className="contents">
                        <div className="flex h-[32px] w-fit shrink-0 items-center justify-end gap-[8px]">
                            <div className={`text-left text-[13px] leading-[normal] whitespace-nowrap ${on ? 'font-[700] text-[var(--primary)]' : done ? 'font-[400] text-[var(--ink)]' : 'font-[400] text-[var(--muted-foreground)]'}`}>{STEPS[i]}</div>
                            <div
                                className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[14px] [outline-offset:-0.5px]"
                                style={{ background: on ? '#2563EB' : done ? '#DDF2E6' : '#FFFFFF', outline: `1px solid ${on ? '#2563EB' : done ? '#8AC5A1' : '#E2E8F0'}` }}
                            >
                                <div className="text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: on ? '#FFFFFF' : done ? '#277A4B' : '#64748B' }}>
                                    {done ? '✓' : i + 1}
                                </div>
                            </div>
                        </div>
                        {i > 0 && <div className="h-[2px] flex-1" style={{ background: i <= step ? '#8AC5A1' : '#E2E8F0' }} />}
                    </div>
                );
            })}
        </div>
    );
}

const SumRow = ({ k, v, bold, blue, big }: { k: string; v: string; bold?: boolean; blue?: boolean; big?: boolean }) => (
    <div className="flex h-[41.5px] w-full shrink-0 items-center justify-between p-[8px_0px] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px]" style={{ margin: '0px 0px -0.5px 0px' }}>
        <div className={`text-left leading-[normal] whitespace-nowrap ${big ? 'text-[18px] font-[700]' : 'text-[14px] font-[600]'} ${blue ? 'text-[var(--primary)]' : 'text-[var(--ink)]'}`}>{v}</div>
        <div className={`text-left leading-[normal] whitespace-nowrap ${bold ? 'text-[15px] font-[700] text-[var(--ink)]' : 'text-[13px] font-[400] text-[var(--muted-foreground)]'}`}>{k}</div>
    </div>
);
const KV = ({ k, v }: { k: string; v: string }) => (
    <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
        <div className="flex-1 text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)]">{v}</div>
        <div className="flex-1 text-right text-[13px] leading-[20px] font-[400] text-[var(--muted-foreground)]">{k}</div>
    </div>
);
const Stmt = ({ k, v }: { k: string; v: string }) => (
    <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
        <div className="text-left text-[13px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">{v}</div>
        <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">{k}</div>
    </div>
);
const H17 = ({ title, action, onAction }: { title: string; action: string; onAction: () => void }) => (
    <div className="flex w-full shrink-0 items-center justify-between">
        <button type="button" onClick={onAction} className={act38}>
            {action}
        </button>
        <div className="flex-1 text-right text-[17px] leading-[25px] font-[700] text-[var(--ink)]">{title}</div>
    </div>
);

export default function CreateOrder({ customer: initial, products, can, fixture }: Props) {
    const [step, setStep] = useState(fixture ? fixture.step : initial ? 1 : 0);
    const [customer, setCustomer] = useState<CustomerCard | null>(initial);
    const [q, setQ] = useState('');
    const [found, setFound] = useState<CustomerCard[]>([]);
    const [items, setItems] = useState<Item[]>(() => (fixture ? fixture.items.map((i) => ({ ...i, uid: uidSeq++ })) : [blank()]));
    const [editing, setEditing] = useState<number>(items[0].uid);
    const [discType, setDiscType] = useState<'NONE' | 'FIXED' | 'PERCENT'>(fixture?.discount_type ?? 'NONE');
    const [discValue, setDiscValue] = useState(fixture?.discount_value ?? '');
    const [method, setMethod] = useState<'PICKUP' | 'DELIVERY'>(fixture?.method ?? 'PICKUP');
    const [address, setAddress] = useState(fixture?.address ?? '');
    const [fee, setFee] = useState(fixture?.fee ?? '');
    const [eta, setEta] = useState(fixture?.eta ?? '2');
    const [notes, setNotes] = useState('');
    const [quote, setQuote] = useState<Quote | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [editDiscount, setEditDiscount] = useState(false);

    const complete = items.filter((i) => i.product_id && num(i.quantity) > 0);
    const feeMinor = method === 'DELIVERY' ? toMinor(fee) : 0;
    const discountValue = discType === 'PERCENT' ? discValue || '0' : discType === 'FIXED' ? String(toMinor(discValue)) : 0;

    useEffect(() => {
        if (!customer || !complete.length) {
            setQuote(null);
            return;
        }
        const t = setTimeout(async () => {
            const res = await fetch('/pricing/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() },
                body: JSON.stringify({
                    customer_id: customer.id,
                    items: complete.map((i) => ({ product_id: i.product_id, quantity: num(i.quantity), options: i.options })),
                    discount_type: discType,
                    discount_value: discountValue,
                    delivery_fee: feeMinor,
                }),
            });
            const j = await res.json();
            if (res.ok) {
                setQuote(j.data);
                setError(null);
            } else setError(j.error?.message ?? j.message ?? 'تعذر حساب السعر.');
        }, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customer?.id, JSON.stringify(complete), discType, discValue, feeMinor]);

    useEffect(() => {
        if (q.trim().length < 1) return setFound([]);
        const t = setTimeout(async () => {
            const r = await fetch(`/orders/customer-search?q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
            if (r.ok) setFound((await r.json()).data);
        }, 200);
        return () => clearTimeout(t);
    }, [q]);

    const pickCustomer = (c: CustomerCard) => {
        setCustomer(c);
        setAddress(c.address ?? '');
        setQ('');
        setFound([]);
    };
    const quoteOf = (it: Item) => {
        const idx = complete.findIndex((c) => c.uid === it.uid);
        return idx >= 0 ? quote?.items[idx] : undefined;
    };
    const product = (it: Item) => products.find((p) => p.id === it.product_id);
    const patchItem = (uid: number, p: Partial<Item>) => setItems((xs) => xs.map((x) => (x.uid === uid ? { ...x, ...p } : x)));
    const specs = (it: Item) => {
        const names = product(it)?.groups.flatMap((g) => g.values.filter((v) => it.options[g.id]?.includes(v.id)).map((v) => v.name)) ?? [];
        return names.join(' • ');
    };
    const itemsOk = complete.length === items.length && complete.every((i) => product(i)?.groups.filter((g) => g.is_required).every((g) => i.options[g.id]?.length));
    const canNext = step === 0 ? !!customer : step === 1 ? itemsOk && !!quote : step === 3 ? method === 'PICKUP' || !!address.trim() : true;

    const submit = () => {
        if (!customer) return;
        setBusy(true);
        router.post(
            '/orders',
            {
                customer_id: customer.id,
                delivery_method: method,
                delivery_address: method === 'DELIVERY' ? address : null,
                delivery_fee: feeMinor,
                printing_eta_days: num(eta) || null,
                discount_type: discType,
                discount_value: discountValue,
                notes: notes || null,
                items: complete.map((i) => ({ product_id: i.product_id, quantity: num(i.quantity), options: i.options, notes: i.notes || null })),
            } as never,
            { headers: idemHeaders(), onFinish: () => setBusy(false), onError: (e) => setError(Object.values(e)[0] as string) },
        );
    };

    const Summary = useMemo(
        () =>
            function SummaryPanel() {
                if (step <= 1)
                    return (
                        <div className={`${card} w-[360px] shrink-0 gap-[12px] p-[20px] self-start`}>
                            <div className="w-full text-right text-[18px] leading-[28px] font-[400] text-[var(--ink)]">ملخص الأوردر</div>
                            <KV k="العميل" v={customer?.name ?? '—'} />
                            <KV k="شريحة السعر" v={customer?.tier ?? '—'} />
                            <KV k="عدد البنود" v={complete.length ? String(complete.length) : '—'} />
                            <KV k="إجمالي البنود" v={quote ? formatMoney(quote.subtotal_minor) : '—'} />
                        </div>
                    );
                return (
                    <div className={`${card} w-[360px] shrink-0 ${step === 4 ? 'gap-[5px]' : 'gap-[4px]'} p-[20px] self-start`}>
                        {step === 2 ? (
                            <>
                                <div className="w-full text-left text-[18px] leading-[27px] font-[700] text-[var(--ink)]" style={{ textAlign: 'right' }}>ملخص السعر</div>
                                <SumRow k="إجمالي البنود" v={formatMoneyFixed(quote?.subtotal_minor ?? 0)} />
                                {quote && quote.discount_minor > 0 && <SumRow k={`خصم الأوردر (${discType === 'PERCENT' ? discValue + '%' : formatMoneyFixed(quote.discount_minor)})`} v={formatMoneyFixed(quote.discount_minor)} />}
                                <SumRow k="الإجمالي بعد الخصم" v={formatMoneyFixed((quote?.subtotal_minor ?? 0) - (quote?.discount_minor ?? 0))} bold blue big />
                                <SumRow k="رسوم التوصيل" v="تُحدد في خطوة التسليم" />
                            </>
                        ) : step === 3 ? (
                            <>
                                <div className="w-full text-right text-[18px] leading-[27px] font-[700] text-[var(--ink)]">ملخص الأوردر</div>
                                <SumRow k="العميل" v={customer?.name ?? ''} />
                                <SumRow k="عدد البنود" v={String(complete.length)} />
                                <SumRow k="إجمالي البنود" v={formatMoneyFixed(quote?.subtotal_minor ?? 0)} />
                                <SumRow k="خصم الأوردر" v={formatMoneyFixed(quote?.discount_minor ?? 0)} />
                                <SumRow k="رسوم التوصيل" v={formatMoneyFixed(feeMinor)} />
                                <SumRow k="الإجمالي النهائي" v={formatMoneyFixed(quote?.grand_total_minor ?? 0)} bold blue big />
                            </>
                        ) : (
                            <>
                                <div className="flex w-full shrink-0 items-center justify-between">
                                    <button type="button" onClick={() => setStep(2)} className={act38}>
                                        تعديل التسعير
                                    </button>
                                    <div className="flex-1 text-right text-[18px] leading-[26px] font-[700] text-[var(--ink)]">ملخص السعر</div>
                                </div>
                                <div className="w-full text-right text-[12px] leading-[17px] font-[400] text-[var(--muted-foreground)]">
                                    {customer?.tier}
                                    {customer?.tier_discount ? ` — خصم ${customer.tier_discount}% ضمن أسعار البنود` : ''}
                                </div>
                                {[
                                    ['إجمالي البنود', formatMoneyFixed(quote?.subtotal_minor ?? 0)],
                                    ...(quote && quote.discount_minor > 0 ? [[`خصم الأوردر (${discType === 'PERCENT' ? discValue + '%' : formatMoneyFixed(quote.discount_minor)})`, formatMoneyFixed(quote.discount_minor)]] : []),
                                    ['الإجمالي بعد الخصم', formatMoneyFixed((quote?.subtotal_minor ?? 0) - (quote?.discount_minor ?? 0))],
                                    ...(method === 'DELIVERY' ? [['رسوم التوصيل', formatMoneyFixed(feeMinor)]] : []),
                                ].map(([k, v]) => (
                                    <div key={k} className="flex h-[41.5px] w-[320px] shrink-0 items-center justify-between p-[7px_0px]">
                                        <div className="text-left text-[14px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{v}</div>
                                        <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">{k}</div>
                                    </div>
                                ))}
                                <div className="flex h-[41.5px] w-[320px] shrink-0 items-center justify-between p-[7px_0px]">
                                    <div className="text-left text-[18px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{formatMoneyFixed(quote?.grand_total_minor ?? 0)}</div>
                                    <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">الإجمالي النهائي</div>
                                </div>
                            </>
                        )}
                    </div>
                );
            },
         
        [step, customer, quote, complete.length, discType, discValue, feeMinor, method],
    );

    return (
        <AppLayout active="/orders" nav={navOrders}>
            <Head title="إنشاء أوردر جديد" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">الرئيسية ‹ الأوردرات ‹ إنشاء أوردر جديد</div>
                <div className="flex w-full shrink-0 flex-col gap-[6px]">
                    <h1 className="w-full text-right text-[26px] leading-[40px] font-[700] text-[var(--ink)]">إنشاء أوردر جديد</h1>
                    <div className="w-full text-right text-[15px] leading-[23px] font-[400] text-[var(--muted-foreground)]">{SUBTITLE[step]}</div>
                </div>
                <Stepper step={step} />
                {error && (
                    <div role="alert" className="w-full rounded-[10px] bg-[var(--danger-soft)] p-[12px_16px] text-right text-[13px] leading-[20px] font-[600] text-[var(--danger-text)]">
                        {error}
                    </div>
                )}

                {/* ───── 1 — العميل ───── */}
                {step === 0 && (
                    <div className="flex h-[400px] w-full shrink-0 gap-[20px]">
                        <Summary />
                        <div className={`${card} min-w-0 flex-1 gap-[12px] p-[24px] self-start`}>
                            <div className="w-full text-right text-[20px] leading-[31px] font-[700] text-[var(--ink)]">العميل المحدد</div>
                            <div className="relative flex w-full shrink-0 items-center gap-[12px]">
                                <a href="/customers/create" className={`${btn} bg-[var(--primary)] [outline:1px_solid_var(--primary)]`}>
                                    <span className={`${btnLbl} text-white`}>إضافة عميل جديد</span>
                                </a>
                                <div className="flex h-[48px] flex-1 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]">
                                    <Icon name="search" className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
                                    <input dir="rtl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم العميل أو رقم الهاتف" aria-label="بحث عن عميل" className="min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                                </div>
                                {found.length > 0 && (
                                    <ul className="absolute top-[52px] right-0 left-0 z-10 rounded-[10px] bg-[var(--surface)] p-[4px] shadow-lg [outline:1px_solid_var(--border)]">
                                        {found.map((c) => (
                                            <li key={c.id}>
                                                <button type="button" onClick={() => pickCustomer(c)} className="flex h-[42px] w-full items-center justify-between rounded-[8px] p-[0px_12px] hover:bg-[var(--surface-subtle)]">
                                                    <span className="text-[12px] text-[var(--muted-foreground)]">{c.code} • {c.phone}</span>
                                                    <span className="text-[14px] font-[600] text-[var(--ink)]">{c.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {customer && (
                                <div className="flex w-full shrink-0 flex-col gap-[8px] rounded-[8px] bg-[#F5F9FF] p-[16px] [outline:1px_solid_#B8D1F2] [outline-offset:-0.5px]">
                                    <div className="w-full text-right text-[18px] leading-[28px] font-[700] text-[var(--ink)]">{customer.name}</div>
                                    <div className="w-full text-right text-[13px] leading-[20px] font-[400] text-[var(--muted-foreground)]">
                                        {customer.code} • {customer.phone}
                                    </div>
                                    <div className="flex w-full shrink-0 gap-[24px]">
                                        {[
                                            ['شريحة السعر', customer.tier],
                                            ['خصم الشريحة', customer.tier_discount ? `${customer.tier_discount}%` : '—'],
                                            ['دخول المنصة', customer.platform_access ? 'مفعل' : 'غير مفعل'],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex flex-1 flex-col gap-[4px]">
                                                <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{k}</div>
                                                <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)]">{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => setCustomer(null)} className={`${btn} bg-[var(--surface)] [outline:1px_solid_var(--border)]`}>
                                        <span className={`${btnLbl} text-[var(--ink)]`}>تغيير العميل</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ───── 2 — البنود ───── */}
                {step === 1 && (
                    <div className="flex w-full shrink-0 gap-[20px]">
                        <Summary />
                        <div className={`${card} min-w-0 flex-1 gap-[12px] p-[20px]`}>
                            <div className="flex w-full shrink-0 items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const n = blank();
                                        setItems((x) => [...x, n]);
                                        setEditing(n.uid);
                                    }}
                                    className={`${btn} bg-[var(--primary)] [outline:1px_solid_var(--primary)]`}
                                >
                                    <span className={`${btnLbl} text-white`}>إضافة بند جديد</span>
                                </button>
                                <div className="flex-1 text-right text-[20px] leading-[31px] font-[400] text-[var(--ink)]">بنود الأوردر</div>
                            </div>
                            {items.map((it, n) => {
                                const p = product(it);
                                const iq = quoteOf(it);
                                const label = `البند ${String(n + 1).padStart(2, '0')}`;
                                const total = iq ? formatMoney(iq.item_total_minor) : '—';
                                if (editing !== it.uid)
                                    return (
                                        <div key={it.uid} className="flex w-full shrink-0 flex-col gap-[6px] rounded-[8px] bg-[var(--surface)] p-[12px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                            <div className="flex w-full shrink-0 items-center justify-between">
                                                <div className="flex-1 text-right text-[17px] leading-[26px] font-[700] text-[var(--ink)]">{label} — {p?.name ?? 'بدون منتج'}</div>
                                                <div className="flex-1 text-right text-[16px] leading-[25px] font-[700] text-[var(--primary)]">{total}</div>
                                            </div>
                                            <div className="w-full text-right text-[13px] leading-[20px] font-[400] text-[var(--muted-foreground)]">
                                                الكمية: {fmtInt(num(it.quantity))}{specs(it) ? ` • ${specs(it)}` : ''}
                                            </div>
                                            <div className="flex w-fit shrink-0 justify-end gap-[8px]">
                                                <button type="button" onClick={() => setEditing(it.uid)} className={`${btn} bg-[var(--surface)] [outline:1px_solid_var(--border)]`}><span className={`${btnLbl} text-[var(--ink)]`}>تعديل</span></button>
                                                {items.length > 1 && <button type="button" onClick={() => setItems((x) => x.filter((y) => y.uid !== it.uid))} className={`${btn} bg-[var(--surface)] [outline:1px_solid_var(--border)]`}><span className={`${btnLbl} text-[var(--ink)]`}>حذف</span></button>}
                                            </div>
                                        </div>
                                    );
                                const singles = p?.groups.filter((g) => g.selection_type === 'SINGLE') ?? [];
                                const multis = p?.groups.filter((g) => g.selection_type === 'MULTIPLE') ?? [];
                                const pairs: Group[][] = [];
                                for (let i = 0; i < singles.length; i += 2) pairs.push(singles.slice(i, i + 2));
                                return (
                                    <div key={it.uid} className="flex w-full shrink-0 flex-col gap-[12px] rounded-[8px] bg-[#F7FAFE] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                        <div className="flex w-full shrink-0 items-center justify-between">
                                            <div className="text-left text-[16px] leading-[25px] font-[700] whitespace-nowrap text-[var(--primary)]">{total}</div>
                                            <div className="flex-1 text-right text-[17px] leading-[26px] font-[700] text-[var(--ink)]">{label}{p ? ` — ${p.name}` : ''}</div>
                                        </div>
                                        <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">
                                            {label} • شريحة العميل: {customer?.tier}{customer?.tier_discount ? ` — خصم %${customer.tier_discount}` : ''}
                                        </div>
                                        <div className="flex w-full shrink-0 gap-[12px]">
                                            <PenInput v3 label="الكمية" leadingIcon="chevron-down" inputMode="numeric" value={it.quantity} onChange={(e) => patchItem(it.uid, { quantity: e.target.value.replace(/[^\d]/g, '') })} wrapperClassName="flex-1" hint={p?.minimum_quantity ? `الحد الأدنى ${fmtInt(p.minimum_quantity)}` : undefined} />
                                            <PenSelect v3 label="المنتج" wrapperClassName="flex-1" value={it.product_id ? String(it.product_id) : ''} placeholder="اختر المنتج" options={products.map((x) => ({ value: String(x.id), label: x.name }))} onValueChange={(v) => patchItem(it.uid, { product_id: Number(v), options: {} })} />
                                        </div>
                                        {pairs.map((pair, i) => (
                                            <div key={i} className="flex w-full shrink-0 gap-[12px]">
                                                {[...pair].reverse().map((g) => (
                                                    <PenSelect key={g.id} v3 label={g.name} wrapperClassName="flex-1" value={it.options[g.id]?.[0] ? String(it.options[g.id][0]) : ''} placeholder={g.is_required ? 'اختر' : 'بدون'} options={g.values.map((v) => ({ value: String(v.id), label: v.name }))} onValueChange={(v) => patchItem(it.uid, { options: { ...it.options, [g.id]: [Number(v)] } })} />
                                                ))}
                                            </div>
                                        ))}
                                        {multis.length > 0 && (
                                            <div className="flex w-full shrink-0 flex-col gap-[6px]">
                                                <div className="w-full text-right text-[12px] leading-[17px] font-[600] text-[var(--ink)]">خيارات المنتج</div>
                                                {multis.flatMap((g) =>
                                                    g.values.filter((v) => v.addition_minor > 0 || it.options[g.id]?.includes(v.id)).map((v) => {
                                                        const on = it.options[g.id]?.includes(v.id);
                                                        return (
                                                            <button key={v.id} type="button" onClick={() => patchItem(it.uid, { options: { ...it.options, [g.id]: on ? (it.options[g.id] ?? []).filter((x) => x !== v.id) : [...(it.options[g.id] ?? []), v.id] } })} className="flex h-[44px] w-full shrink-0 items-center justify-between rounded-[7px] p-[0px_12px] [outline-offset:-0.5px]" style={{ background: on ? '#EFF6FF' : '#FFFFFF', outline: `1px solid ${on ? '#2563EB' : '#E2E8F0'}` }}>
                                                                <div className="text-left text-[13px] leading-[19px] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">+{(v.addition_minor / 100).toFixed(2)} ج.م للوحدة</div>
                                                                <div className="flex-1 text-right text-[14px] leading-[20px] font-[400] text-[var(--ink)]">{v.name}</div>
                                                            </button>
                                                        );
                                                    }),
                                                )}
                                            </div>
                                        )}
                                        <div className="flex w-full shrink-0 flex-col gap-[6px]">
                                            <div className="w-full text-right text-[12px] leading-[17px] font-[600] text-[var(--ink)]">ملاحظات البند</div>
                                            <textarea dir="rtl" value={it.notes} onChange={(e) => patchItem(it.uid, { notes: e.target.value })} placeholder="أضف ملاحظات خاصة بالبند إن وجدت" className="h-[100px] w-full shrink-0 resize-none rounded-[10px] bg-[var(--background)] p-[14px] text-right text-[14px] leading-[20px] font-[400] text-[var(--ink)] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] placeholder:text-[var(--muted-foreground)]" />
                                        </div>
                                        {iq && (
                                            <div className="flex w-full shrink-0 flex-col gap-[4px] rounded-[8px] bg-[#EEF4FB] p-[12px]">
                                                <div className="w-full text-right text-[14px] leading-[20px] font-[700] text-[var(--ink)]">ملخص سعر البند</div>
                                                {[
                                                    ['السعر الأساسي للوحدة', formatMoneyFixed(iq.base_unit_minor)],
                                                    ['إضافات الخيارات', formatMoneyFixed(iq.options_unit_minor)],
                                                    ['السعر قبل خصم الشريحة', formatMoneyFixed(iq.standard_unit_minor)],
                                                    ['خصم الشريحة', customer?.tier_discount ? `${customer.tier_discount}%` : '—'],
                                                    ['السعر النهائي للوحدة', formatMoneyFixed(iq.final_unit_minor)],
                                                    ['الكمية', fmtInt(num(it.quantity))],
                                                ].map(([k, v]) => (
                                                    <div key={k} className="flex h-[25px] w-full shrink-0 items-center justify-between">
                                                        <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">{k}</div>
                                                        <div className="text-left text-[13px] leading-[normal] font-[400] whitespace-nowrap text-[var(--ink)]">{v}</div>
                                                    </div>
                                                ))}
                                                <div className="flex h-[25px] w-full shrink-0 items-center justify-between">
                                                    <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-nowrap text-[var(--muted-foreground)]">إجمالي البند</div>
                                                    <div className="text-left text-[13px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{formatMoney(iq.item_total_minor)}</div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex w-full shrink-0 justify-end gap-[8px]">
                                            <button type="button" onClick={() => setEditing(-1)} className={small}>تعديل</button>
                                            {items.length > 1 && <button type="button" onClick={() => { setItems((x) => x.filter((y) => y.uid !== it.uid)); setEditing(items.find((y) => y.uid !== it.uid)!.uid); }} className={small}>حذف</button>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ───── 3 — التسعير ───── */}
                {step === 2 && (
                    <div className="flex w-full shrink-0 gap-[20px]">
                        <Summary />
                        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
                            <div className={`${card} w-full shrink-0`}>
                                <div className="flex h-[52px] w-full shrink-0 items-center p-[0px_16px]">
                                    <div className="flex-1 text-right text-[18px] leading-[27px] font-[700] text-[var(--ink)]">أسعار البنود</div>
                                </div>
                                <div className="flex h-[43.5px] w-full shrink-0 items-center gap-[12px] bg-[#F3F6FA] p-[0px_16px] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px]">
                                    {[['إجمالي البند', 'w-[180px]'], ['سعر الوحدة', 'w-[140px]'], ['الكمية', 'w-[100px]'], ['المنتج', 'flex-1']].map(([h, w]) => (
                                        <div key={h} className={`${w} shrink-0 text-right text-[12px] leading-[18px] font-[700] text-[var(--muted-foreground)]`}>{h}</div>
                                    ))}
                                </div>
                                {complete.map((it, n) => {
                                    const iq = quote?.items[n];
                                    return (
                                        <div key={it.uid} className="flex h-[53.5px] w-full shrink-0 items-center gap-[12px] p-[0px_16px] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px]">
                                            <div className="w-[180px] shrink-0 text-right text-[13px] leading-[20px] font-[600] text-[var(--ink)]">{iq ? formatMoneyFixed(iq.item_total_minor) : '—'}</div>
                                            <div className="w-[140px] shrink-0 text-right text-[13px] leading-[20px] font-[600] text-[var(--muted-foreground)]">{iq ? formatMoneyFixed(iq.final_unit_minor) : '—'}</div>
                                            <div className="w-[100px] shrink-0 text-right text-[13px] leading-[20px] font-[600] text-[var(--muted-foreground)]">{fmtInt(num(it.quantity))}</div>
                                            <div className="flex-1 text-right text-[13px] leading-[20px] font-[400] text-[var(--muted-foreground)]">{product(it)?.name}</div>
                                        </div>
                                    );
                                })}
                                <div className="flex h-[52px] w-full shrink-0 items-center justify-between p-[0px_16px]">
                                    <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{formatMoneyFixed(quote?.subtotal_minor ?? 0)}</div>
                                    <div className="text-left text-[14px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">إجمالي البنود</div>
                                </div>
                            </div>
                            <div className={`${card} w-full shrink-0 gap-[8px] p-[16px]`}>
                                <div className="w-full text-right text-[16px] leading-[24px] font-[700] text-[var(--ink)]">شريحة سعر العميل</div>
                                <div className="flex h-[36px] w-full shrink-0 items-center justify-between gap-[12px]">
                                    {customer?.tier_discount ? (
                                        <div className="flex h-[28px] w-fit shrink-0 items-center rounded-[14px] bg-[#FFF3CD] p-[0px_10px]">
                                            <div className="text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-[#8A5A00]">خصم {customer.tier_discount}%</div>
                                        </div>
                                    ) : (
                                        <div />
                                    )}
                                    <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{customer?.tier}</div>
                                </div>
                                <div className="w-full text-right text-[12px] leading-[18px] font-[400] text-[var(--muted-foreground)]">خصم الشريحة محسوب ضمن أسعار البنود المعروضة.</div>
                            </div>
                            <div className={`${card} w-full shrink-0 gap-[10px] p-[16px]`}>
                                <div className="flex w-full shrink-0 items-center justify-between">
                                    {can.discount && (
                                        <button type="button" onClick={() => setEditDiscount((v) => !v)} className={`${btn} bg-[var(--surface)] [outline:1px_solid_var(--border)]`}>
                                            <span className={`${btnLbl} text-[var(--ink)]`}>تعديل الخصم</span>
                                        </button>
                                    )}
                                    <div className="flex-1 text-right text-[16px] leading-[24px] font-[700] text-[var(--ink)]">خصم الأوردر</div>
                                </div>
                                {editDiscount && can.discount && (
                                    <div className="flex w-full shrink-0 gap-[12px]">
                                        <PenInput label="القيمة" value={discValue} inputMode="decimal" onChange={(e) => setDiscValue(e.target.value)} wrapperClassName="flex-1" />
                                        <PenSelect label="نوع الخصم" wrapperClassName="flex-1" value={discType} options={[{ value: 'NONE', label: 'بدون خصم' }, { value: 'PERCENT', label: 'نسبة مئوية' }, { value: 'FIXED', label: 'مبلغ ثابت' }]} onValueChange={(v) => setDiscType(v as 'NONE' | 'FIXED' | 'PERCENT')} />
                                    </div>
                                )}
                                <div className="flex w-full shrink-0 justify-between">
                                    <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{discType === 'PERCENT' ? `${discValue || 0}%` : '—'}</div>
                                    <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{formatMoneyFixed(quote?.discount_minor ?? 0)}</div>
                                </div>
                                <div className="w-full text-right text-[12px] leading-[18px] font-[400] text-[var(--muted-foreground)]">يُطبّق الخصم على إجمالي البنود بعد تسعير الشريحة.</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── 4 — التسليم ───── */}
                {step === 3 && (
                    <div className="flex w-full shrink-0 gap-[20px]">
                        <Summary />
                        <div className={`${card} min-w-0 flex-1 gap-[18px] self-start p-[20px]`}>
                            <div className="w-full text-right text-[20px] leading-[30px] font-[700] text-[var(--ink)]">التسليم ومدة الطباعة</div>
                            <div className="flex w-full shrink-0 flex-col gap-[8px]">
                                <div className="w-full text-right text-[14px] leading-[21px] font-[600] text-[var(--ink)]">طريقة التسليم</div>
                                <div className="flex h-[44px] w-full shrink-0 gap-[4px] rounded-[8px] bg-[#F3F6FA] p-[4px]">
                                    {(
                                        [
                                            ['PICKUP', 'استلام من المطبعة'],
                                            ['DELIVERY', 'توصيل'],
                                        ] as const
                                    ).map(([v, l]) => (
                                        <button key={v} type="button" onClick={() => setMethod(v)} className="flex h-[36px] flex-1 items-center justify-center rounded-[6px]" style={{ background: method === v ? '#2563EB' : '#F3F6FA' }}>
                                            <span className={`text-left text-[14px] leading-[normal] whitespace-nowrap ${method === v ? 'font-[700] text-white' : 'font-[400] text-[var(--muted-foreground)]'}`}>{l}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {method === 'DELIVERY' && (
                                <>
                                    <PenInput v3 label="عنوان التوصيل" value={address} onChange={(e) => setAddress(e.target.value)} />
                                    <div className="flex w-full shrink-0 gap-[16px]">
                                        <PenInput v3 label="رسوم التوصيل" value={fee} inputMode="decimal" placeholder="0.00" onChange={(e) => setFee(e.target.value)} wrapperClassName="flex-1" />
                                        <PenInput v3 label="مدة الطباعة المتوقعة" value={eta} inputMode="numeric" onChange={(e) => setEta(e.target.value.replace(/[^\d]/g, ''))} wrapperClassName="flex-1" hint="المدة تقديرية وتبدأ بعد اعتماد جميع التصميمات." />
                                    </div>
                                </>
                            )}
                            {method === 'PICKUP' && <PenInput v3 label="مدة الطباعة المتوقعة" value={eta} inputMode="numeric" onChange={(e) => setEta(e.target.value.replace(/[^\d]/g, ''))} hint="المدة تقديرية وتبدأ بعد اعتماد جميع التصميمات." />}
                            <PenTextarea v3 label="ملاحظات الأوردر" placeholder="أضف ملاحظات خاصة بالأوردر إن وجدت" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                    </div>
                )}

                {/* ───── 5 — المراجعة ───── */}
                {step === 4 && customer && (
                    <div className="flex w-full shrink-0 gap-[20px]">
                        <Summary />
                        <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
                            <div className={`${card} w-full shrink-0 gap-[10px] p-[16px]`}>
                                <H17 title="بيانات العميل" action="تعديل" onAction={() => setStep(0)} />
                                <div className="w-full text-right text-[16px] leading-[23px] font-[700] text-[var(--ink)]">{customer.name}</div>
                                <div className="flex w-full shrink-0 gap-[20px]">
                                    <div className="flex flex-1 items-center justify-between gap-[12px]"><div className="text-left text-[13px] leading-[normal] font-[600] text-[var(--ink)]">{customer.code}</div><div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">رقم العميل</div></div>
                                    <div className="flex flex-1 items-center justify-between gap-[12px]"><div className="text-left text-[13px] leading-[normal] font-[600] text-[var(--ink)]">{customer.phone}</div><div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">رقم الهاتف</div></div>
                                </div>
                                <div className="flex w-full shrink-0 gap-[20px]">
                                    <div className="flex flex-1"><Stmt k="شريحة السعر" v={`${customer.tier}${customer.tier_discount ? ` — خصم ${customer.tier_discount}%` : ''}`} /></div>
                                    <div className="flex flex-1"><Stmt k="دخول المنصة" v={customer.platform_access ? 'مفعل' : 'غير مفعل'} /></div>
                                </div>
                            </div>
                            <div className={`${card} w-full shrink-0 gap-[10px] p-[16px]`}>
                                <H17 title="بنود الأوردر" action="تعديل البنود" onAction={() => setStep(1)} />
                                {complete.map((it, n) => {
                                    const iq = quote?.items[n];
                                    const label = `البند ${String(n + 1).padStart(2, '0')} — ${product(it)?.name}`;
                                    return (
                                        <div key={it.uid} className="flex h-[96.5px] w-full shrink-0 flex-col gap-[5px] p-[10px_0px] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px]">
                                            <div className="flex w-full shrink-0 items-center justify-between">
                                                <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{iq ? formatMoneyFixed(iq.item_total_minor) : '—'}</div>
                                                <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{label}</div>
                                            </div>
                                            <div className="w-full text-right text-[12px] leading-[17px] font-[400] text-[var(--muted-foreground)]">{specs(it)}</div>
                                            <div className="flex w-full shrink-0 items-center justify-end gap-[24px]">
                                                <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--ink)]">سعر الوحدة: {iq ? formatMoneyFixed(iq.final_unit_minor) : '—'}</div>
                                                <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--ink)]">الكمية: {fmtInt(num(it.quantity))}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={`${card} w-full shrink-0 gap-[10px] p-[16px]`}>
                                <H17 title="مرفقات البنود" action="تعديل المرفقات" onAction={() => setStep(1)} />
                                {complete.map((it, n) => (
                                    <div key={it.uid} className="flex h-[33.5px] w-full shrink-0 items-center justify-between p-[6px_0px] [border-color:var(--border)] [border-style:solid] [border-width:0px_0px_1px_0px]">
                                        <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">لا توجد مرفقات لهذا البند.</div>
                                        <div className="text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">البند {String(n + 1).padStart(2, '0')} — {product(it)?.name}</div>
                                    </div>
                                ))}
                            </div>
                            <div className={`${card} w-full shrink-0 gap-[10px] p-[16px]`}>
                                <H17 title="التسليم والطباعة" action="تعديل التسليم" onAction={() => setStep(3)} />
                                <Stmt k="طريقة التسليم" v={method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'} />
                                {method === 'DELIVERY' && <Stmt k="عنوان التوصيل" v={address} />}
                                {method === 'DELIVERY' && <Stmt k="رسوم التوصيل" v={formatMoneyFixed(feeMinor)} />}
                                <Stmt k="مدة الطباعة المتوقعة" v={num(eta) === 2 ? 'يومان' : `${num(eta)} يوم`} />
                                <Stmt k="ملاحظات الأوردر" v={notes || 'لا توجد ملاحظات'} />
                                <div className="w-full text-right text-[12px] leading-[17px] font-[400] text-[var(--muted-foreground)]">تبدأ مدة الطباعة بعد اعتماد جميع التصميمات.</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── التنقل السفلي ───── */}
                {step < 4 ? (
                    <div className="flex w-full shrink-0 items-end gap-[8px]">
                        <PenButton onClick={() => canNext && setStep(step + 1)} disabled={!canNext}>
                            التالي
                        </PenButton>
                        {step === 0 ? (
                            <PenButton variant="secondary" href="/orders">
                                إلغاء
                            </PenButton>
                        ) : (
                            <PenButton variant="secondary" onClick={() => setStep(step - 1)}>
                                السابق
                            </PenButton>
                        )}
                    </div>
                ) : (
                    <div className="flex w-full shrink-0 justify-end gap-[8px]">
                        <button type="button" onClick={() => setStep(3)} className={act38}>
                            السابق
                        </button>
                        <button type="button" onClick={submit} disabled={busy || !quote} className="flex h-[38px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-left text-[13px] leading-[normal] font-[600] whitespace-nowrap text-white disabled:opacity-60">
                            إنشاء الأوردر
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
