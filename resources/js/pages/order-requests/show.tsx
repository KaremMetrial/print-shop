import { idemHeaders } from '@/lib/idempotency';
import { PenBreadcrumb } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoneyFixed, formatTime } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';
import {useState} from 'react';

interface Item {
    id: number;
    label: string;
    product: string;
    quantity: number;
    original_quantity: number;
    unit_minor: number;
    total_minor: number;
    specs: string;
    notes: string | null;
}
interface Props {
    req: {
        id: number;
        number: string;
        status: 'PENDING' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED';
        status_label: string;
        submitted_at: string;
        decided_at: string | null;
        reviewer: string | null;
        review_started_at: string | null;
        delivery_method: 'PICKUP' | 'DELIVERY';
        delivery_address: string | null;
        reject_reason: string | null;
        order: { id: number; number: string } | null;
        mine: boolean;
    };
    customer: { id: number; code: string; name: string; phone: string; tier: string; tier_discount: string | null; registered: boolean };
    items: Item[];
    subtotal_minor: number;
    original_total_minor: number;
    edits: { item: string; field: string; old: number; new: number }[];
    log: { id: number; at: string; action: string; actor: string }[];
    can: { review: boolean; accept: boolean; reject: boolean };
}

const dt = (iso: string) => `${formatDate(iso)}، ${formatTime(iso).replace(/^0/, '')}`;
const card = 'flex w-full shrink-0 flex-col gap-[10px] rounded-[10px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const h17 = 'w-full text-right text-[17px] leading-[26px] font-[700] text-[var(--ink)]';
const btn = 'flex h-[40px] w-fit shrink-0 items-center justify-center rounded-[8px] p-[0px_14px] text-left text-[13px] leading-[normal] font-[700] whitespace-nowrap [outline-offset:-0.5px] disabled:opacity-60';
const pill: Record<string, [string, string, number]> = { PENDING: ['#FFF3D9', '#895A0D', 12], IN_REVIEW: ['#E8F1FF', '#2563EB', 12], ACCEPTED: ['#E6F5EA', '#237A4B', 12], REJECTED: ['#FEF0F0', '#B42318', 12] };

const Stmt = ({ k, v, blue }: { k: string; v: string; blue?: boolean }) => (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-[12px]">
        <div className="text-left text-[13px] leading-[normal] font-[600] whitespace-nowrap" style={{ color: blue ? '#2563EB' : 'var(--ink)' }}>{v}</div>
        <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">{k}</div>
    </div>
);
const SumRow = ({ k, v, big, blue, bold = true, compact }: { k: string; v: string; big?: boolean; blue?: boolean; bold?: boolean; compact?: boolean }) => (
    <div className="flex w-[320px] shrink-0 items-center justify-between [border-bottom:1px_solid_var(--border)]" style={compact ? { height: big ? 39.5 : 33.5, padding: '5px 0px' } : { height: 41.5, padding: '7px 0px' }}>
        <div className="text-left leading-[normal] whitespace-nowrap" style={{ fontSize: big ? (compact ? 16 : 17) : 13, fontWeight: bold ? 700 : 600, color: blue ? '#2563EB' : 'var(--ink)' }}>{v}</div>
        <div className="text-left leading-[normal] whitespace-nowrap" style={{ fontSize: big && !compact ? 14 : 12, fontWeight: big && !compact ? 700 : 400, color: big ? 'var(--ink)' : 'var(--muted-foreground)' }}>{k}</div>
    </div>
);
const LogCard = ({ log }: { log: Props['log'] }) => (
    <div className={card}>
        <div className={h17}>سجل المراجعة</div>
        {log.map((l) => (
            <div key={l.id} className="flex h-[39.5px] w-full shrink-0 items-center justify-between p-[8px_0px] [border-bottom:1px_solid_var(--border)]">
                <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">{dt(l.at)}</div>
                <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">{l.actor}</div>
                <div className="text-left text-[13px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{l.action}</div>
            </div>
        ))}
    </div>
);
const Delivery = ({ r }: { r: Props['req'] }) => (
    <div className={card}>
        <div className={h17}>التسليم</div>
        <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
            <div className="text-left text-[13px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">{r.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'}</div>
            <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">طريقة التسليم</div>
        </div>
        {r.delivery_method === 'DELIVERY' && r.delivery_address && (
            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                <div className="text-left text-[13px] leading-[normal] font-[600] text-[var(--ink)]">{r.delivery_address}</div>
                <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">عنوان التوصيل</div>
            </div>
        )}
    </div>
);
const Attachments = () => (
    <div className={card}>
        <div className={h17}>مرفقات العميل</div>
        <div className="w-full text-right text-[13px] leading-[20px] font-[400] text-[var(--muted-foreground)]">لا توجد مرفقات لهذا الطلب.</div>
    </div>
);
const CustomerCard = ({ c, sent, extra }: { c: Props['customer']; sent: string; extra?: boolean }) => (
    <div className={card}>
        <div className={h17}>بيانات العميل</div>
        <div className="flex w-full shrink-0 gap-[20px]">
            <Stmt k="رقم الهاتف" v={c.phone} />
            <Stmt k="اسم العميل" v={c.name} />
        </div>
        <div className="flex w-full shrink-0 gap-[20px]">
            {extra ? <Stmt k="تاريخ إرسال الطلب" v={sent} /> : <Stmt k="خصم الشريحة" v={c.tier_discount ? `${c.tier_discount}%` : '—'} />}
            <Stmt k="شريحة السعر" v={extra ? `${c.tier}${c.tier_discount ? ` — خصم ${c.tier_discount}%` : ''}` : c.tier} />
        </div>
        {extra ? (
            <div className="flex w-full shrink-0 gap-[20px]">
                <Stmt k="نوع العميل" v={c.registered ? 'عميل مسجل' : 'عميل رابط'} />
                <Stmt k="رقم العميل" v={c.code} />
            </div>
        ) : (
            <div className="flex w-full shrink-0 items-center justify-between">
                <div className="text-left text-[13px] leading-[normal] font-[600] text-[var(--ink)]">{sent}</div>
                <div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">تاريخ إرسال الطلب</div>
            </div>
        )}
    </div>
);

/** S-020-A / S-020-B / S-021-A / S-021-B — مراجعة طلب الأوردر (pendev: Vd6MM · LgN9R · HgTHs · kYJTt). */
export default function OrderRequestShow(p: Props) {
    const { req: r, customer: c, items, can } = p;
    const hdrs = { get headers() { return idemHeaders(); } };
    const [qty, setQty] = useState<Record<number, string>>(Object.fromEntries(items.map((i) => [i.id, String(i.quantity)])));
    const [editing, setEditing] = useState<number | null>(items.find((i) => i.quantity !== i.original_quantity)?.id ?? items[items.length - 1]?.id ?? null);
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');
    const sent = dt(r.submitted_at);
    const live = r.status === 'IN_REVIEW' && r.mine;
    const diff = p.subtotal_minor - p.original_total_minor;
    const tierLine = `${c.tier}${c.tier_discount ? ` — خصم ${c.tier_discount}% ${r.status === 'PENDING' ? 'محسوب' : 'ضمن'} أسعار البنود` : ''}`;

    const save = () => router.patch(`/order-requests/${r.id}`, { items: items.map((i) => ({ id: i.id, quantity: Number(qty[i.id] || i.quantity) })) } as never, hdrs);
    const [pillBg, pillFg] = pill[r.status];
    const title = r.status === 'PENDING' ? 'تفاصيل طلب الأوردر' : r.status === 'IN_REVIEW' ? 'مراجعة طلب الأوردر' : 'سجل مراجعة الطلب';
    const final = r.status === 'ACCEPTED' || r.status === 'REJECTED';

    return (
        <AppLayout active="/order-requests">
            <Head title={`${title} ${r.number}`} />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'طلبات الأوردرات', href: '/order-requests' }, r.number]} />
                <div className="flex w-full shrink-0 items-center justify-between">
                    <div className="flex w-fit shrink-0 items-center gap-[8px]">
                        {r.status === 'PENDING' && can.review && (
                            <button type="button" onClick={() => router.post(`/order-requests/${r.id}/start`, {}, hdrs)} className={`${btn} bg-[var(--primary)] px-[18px] text-[14px] text-white [outline:1px_solid_var(--primary)]`}>
                                بدء المراجعة
                            </button>
                        )}
                        {live && (
                            <>
                                <button type="button" onClick={save} className={`${btn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}>
                                    حفظ التعديلات
                                </button>
                                {can.accept && (
                                    <button type="button" onClick={() => router.post(`/order-requests/${r.id}/accept`, {}, hdrs)} className={`${btn} bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)]`}>
                                        قبول الطلب
                                    </button>
                                )}
                                {can.reject && (
                                    <button type="button" onClick={() => setRejecting(true)} className={`${btn} bg-[#FEF2F2] text-[#B42318] [outline:1px_solid_#FECACA]`}>
                                        رفض الطلب
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex w-[620px] shrink-0 flex-col gap-[4px]">
                        <div className="flex w-full shrink-0 items-center justify-end gap-[10px]">
                            <div className="flex h-[28px] w-fit shrink-0 items-center rounded-[14px] p-[0px_10px]" style={{ background: pillBg }}>
                                <div className="text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: pillFg }}>{r.status_label}</div>
                            </div>
                            <h1 className="text-left text-[26px] leading-[39px] font-[700] whitespace-nowrap text-[var(--ink)]">{title}</h1>
                        </div>
                        <div className="w-full text-right text-[15px] leading-[23px] font-[600] whitespace-pre text-[var(--ink)]">{`${r.number}  •  ${c.name}`}</div>
                        <div className="w-full text-right text-[12px] leading-[18px] font-[400] whitespace-pre text-[var(--muted-foreground)]">
                            {r.status === 'PENDING' ? `أُرسل في ${sent}` : `${final ? r.reviewer : `المراجع: ${r.reviewer}`}  •  ${final && r.decided_at ? dt(r.decided_at) : r.review_started_at ? `بدأ: ${dt(r.review_started_at)}` : ''}`}
                        </div>
                    </div>
                </div>

                <div className="flex w-full shrink-0 items-start gap-[20px]">
                    <div className="flex w-[360px] shrink-0 flex-col rounded-[10px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]" style={{ gap: final ? 6 : 5 }}>
                        <div className="w-full text-right text-[18px] leading-[27px] font-[700] text-[var(--ink)]">{final ? 'ملخص المراجعة' : 'ملخص السعر'}</div>
                        {!final && <div className="w-full text-right text-[12px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{tierLine}</div>}
                        {final ? (
                            <>
                                <SumRow k="الطلب" v={r.number} compact />
                                <SumRow k="شريحة السعر" v={`${c.tier}${c.tier_discount ? ` — ${c.tier_discount}%` : ''}`} compact />
                                <SumRow k="الإجمالي الأصلي" v={formatMoneyFixed(p.original_total_minor)} compact />
                                <SumRow k="فرق السعر" v={`${diff >= 0 ? '+' : ''}${formatMoneyFixed(diff)}`} compact />
                                <SumRow k="الإجمالي بعد المراجعة" v={formatMoneyFixed(p.subtotal_minor)} blue big compact />
                                <SumRow k="التسليم" v={r.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'} compact />
                                {r.order && <SumRow k="الأوردر المرتبط" v={r.order.number} compact />}
                            </>
                        ) : r.status === 'PENDING' ? (
                            <>
                                <SumRow k="إجمالي البنود" v={formatMoneyFixed(p.subtotal_minor)} />
                                <SumRow k="رسوم التوصيل" v={formatMoneyFixed(0)} />
                                <SumRow k="الإجمالي المبدئي" v={formatMoneyFixed(p.subtotal_minor)} blue />
                            </>
                        ) : (
                            <>
                                <SumRow k="إجمالي الطلب الأصلي" v={formatMoneyFixed(p.original_total_minor)} />
                                <SumRow k="فرق السعر" v={`${diff >= 0 ? '+' : ''}${formatMoneyFixed(diff)}`} />
                                <SumRow k="الإجمالي بعد المراجعة" v={formatMoneyFixed(p.subtotal_minor)} blue big />
                                <SumRow k="التسليم" v={r.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'} />
                                <SumRow k="رسوم التوصيل" v={formatMoneyFixed(0)} />
                            </>
                        )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
                        {!final && <CustomerCard c={c} sent={dt(r.submitted_at)} extra={r.status === 'PENDING'} />}

                        {r.status === 'PENDING' && (
                            <div className={card}>
                                <div className={h17}>بنود الطلب</div>
                                {items.map((i) => (
                                    <div key={i.id} className="flex w-full shrink-0 flex-col gap-[6px] p-[10px_0px] [border-bottom:1px_solid_var(--border)]">
                                        <div className="flex w-full shrink-0 items-center justify-between">
                                            <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--primary)]">{formatMoneyFixed(i.total_minor)}</div>
                                            <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--ink)]">{i.label}</div>
                                        </div>
                                        <div className="flex w-full shrink-0 items-center justify-end gap-[24px]">
                                            <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--ink)]">سعر الوحدة: {formatMoneyFixed(i.unit_minor)}</div>
                                            <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--ink)]">الكمية: {i.quantity.toLocaleString('en-US')}</div>
                                        </div>
                                        <div className="w-full text-right text-[12px] leading-[18px] text-[var(--muted-foreground)]">المواصفات: {i.specs || 'لا توجد مواصفات إضافية مسجلة.'}</div>
                                        <div className="w-full text-right text-[12px] leading-[18px] text-[var(--muted-foreground)]">ملاحظات العميل: {i.notes || 'لا توجد ملاحظات.'}</div>
                                        <div className="w-full text-right text-[12px] leading-[18px] text-[var(--muted-foreground)]">المرفقات: لا توجد مرفقات.</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {r.status === 'IN_REVIEW' && (
                            <>
                                <div className={card}>
                                    <div className={h17}>مراجعة البنود</div>
                                    {items.map((i) =>
                                        live && editing === i.id ? (
                                            <div key={i.id} className="flex w-full shrink-0 flex-col gap-[10px] rounded-[8px] bg-[#F7FAFE] p-[14px] [outline:1px_solid_#B8D1F2] [outline-offset:-0.5px]">
                                                <div className="flex w-full shrink-0 items-center justify-between">
                                                    <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--primary)]">{formatMoneyFixed(i.unit_minor * Number(qty[i.id] || i.quantity))}</div>
                                                    <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--ink)]">{i.label}</div>
                                                </div>
                                                <div className="flex w-full shrink-0 gap-[12px]">
                                                    <div className="flex flex-1 flex-col gap-[6px]">
                                                        <div className="w-full text-right text-[13px] leading-[20px] font-[600] text-[#334155]">الكمية</div>
                                                        <input inputMode="numeric" dir="rtl" value={qty[i.id]} onChange={(e) => setQty({ ...qty, [i.id]: e.target.value.replace(/[^\d]/g, '') })} className="h-[46px] w-full rounded-[10px] bg-[var(--background)] p-[0px_14px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus:[outline:2px_solid_var(--primary)]" />
                                                    </div>
                                                    <div className="flex flex-1 flex-col gap-[6px]">
                                                        <div className="w-full text-right text-[13px] leading-[20px] font-[600] text-[#334155]">المنتج</div>
                                                        <div className="flex h-[46px] w-full items-center justify-between rounded-[10px] bg-[var(--background)] p-[0px_14px] text-[14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]">
                                                            <span className="text-[var(--muted-foreground)]">⌄</span>
                                                            <span>{i.product}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full text-right text-[12px] leading-[18px] font-[600] text-[var(--ink)]">المواصفات وخيارات المنتج</div>
                                                <div className="w-full text-right text-[14px] leading-[normal] text-[var(--ink)]">{i.specs || 'المواصفات المسجلة'}</div>
                                                <div className="flex w-full shrink-0 items-center justify-between">
                                                    <div className="text-left text-[14px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">الإجمالي: {formatMoneyFixed(i.unit_minor * Number(qty[i.id] || i.quantity))}</div>
                                                    <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">السعر النهائي للوحدة: {formatMoneyFixed(i.unit_minor)}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button key={i.id} type="button" onClick={() => live && setEditing(i.id)} className="flex w-full shrink-0 flex-col gap-[5px] rounded-[8px] bg-[var(--background)] p-[12px] text-start [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                                <div className="flex w-full shrink-0 justify-between">
                                                    <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--primary)]">{formatMoneyFixed(i.total_minor)}</div>
                                                    <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--ink)]">{i.label}</div>
                                                </div>
                                                <div className="w-full text-right text-[12px] leading-[18px] text-[var(--muted-foreground)]">الكمية: {i.quantity.toLocaleString('en-US')} • سعر الوحدة: {formatMoneyFixed(i.unit_minor)}</div>
                                            </button>
                                        ),
                                    )}
                                </div>
                                {p.edits.length > 0 && (
                                    <div className={card}>
                                        <div className={h17}>ملخص التعديلات</div>
                                        {p.edits.map((e, n) => (
                                            <div key={n} className="flex w-full shrink-0 gap-[16px]">
                                                {[['البند', e.item], ['الحقل', e.field], ['الكمية الأصلية', String(e.old)], ['الكمية بعد التعديل', String(e.new)]].map(([k, v]) => (
                                                    <div key={k} className="flex flex-1 flex-col gap-[4px]">
                                                        <div className="w-full text-right text-[11px] leading-[17px] text-[var(--muted-foreground)]">{k}</div>
                                                        <div className="w-full text-right text-[14px] leading-[21px] font-[700] text-[var(--ink)]">{v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                        <div className="flex w-full shrink-0 items-center justify-between">
                                            <div className="text-left text-[13px] leading-[normal] font-[600] text-[var(--ink)]">{diff >= 0 ? '+' : ''}{formatMoneyFixed(diff)}</div>
                                            <div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">فرق السعر</div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {final && (
                            <>
                                {[
                                    ['بيانات الطلب الأصلية', items.map((i) => [i.product, i.original_quantity, i.unit_minor * i.original_quantity]), p.original_total_minor, 'إجمالي الطلب الأصلي'],
                                    ['البيانات بعد المراجعة', items.map((i) => [i.product, i.quantity, i.total_minor]), p.subtotal_minor, 'الإجمالي بعد المراجعة'],
                                ].map(([t, rows, total, tl]) => (
                                    <div key={t as string} className={card}>
                                        <div className={h17}>{t as string}</div>
                                        {(rows as [string, number, number][]).map(([n, q, tot]) => (
                                            <div key={n} className="flex h-[33.5px] w-full shrink-0 items-center justify-between p-[5px_0px] [border-bottom:1px_solid_var(--border)]">
                                                <div className="text-left text-[13px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{`${q.toLocaleString('en-US')}  •  ${formatMoneyFixed(tot)}`}</div>
                                                <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">{n}</div>
                                            </div>
                                        ))}
                                        <div className="flex h-[39.5px] w-full shrink-0 items-center justify-between p-[5px_0px]">
                                            <div className="text-left text-[16px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{formatMoneyFixed(total as number)}</div>
                                            <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">{tl as string}</div>
                                        </div>
                                    </div>
                                ))}
                                {p.edits.length > 0 && (
                                    <div className={card}>
                                        <div className={h17}>{r.status === 'ACCEPTED' ? 'التعديلات التي تمت' : 'التعديلات أثناء المراجعة'}</div>
                                        {p.edits.map((e, n) => (
                                            <div key={n} className="flex h-[33.5px] w-full shrink-0 items-center justify-between p-[5px_0px] [border-bottom:1px_solid_var(--border)]">
                                                <div className="text-left text-[13px] leading-[normal] font-[700] whitespace-pre text-[var(--ink)]">{`${e.old}  ←  ${e.new}`}</div>
                                                <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">{e.item} — {e.field}</div>
                                            </div>
                                        ))}
                                        <div className="flex h-[39.5px] w-full shrink-0 items-center justify-between p-[5px_0px]">
                                            <div className="text-left text-[16px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{diff >= 0 ? '+' : ''}{formatMoneyFixed(diff)}</div>
                                            <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">فرق السعر</div>
                                        </div>
                                    </div>
                                )}
                                <div className={card}>
                                    <div className={h17}>قرار المراجعة</div>
                                    {[['النتيجة', r.status_label], ['المراجع', r.reviewer ?? '—'], ['تاريخ القرار', r.decided_at ? dt(r.decided_at) : '—']].map(([k, v]) => (
                                        <div key={k} className="flex h-[33.5px] w-full shrink-0 items-center justify-between p-[5px_0px] [border-bottom:1px_solid_var(--border)]">
                                            <div className="text-left text-[13px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">{v}</div>
                                            <div className="text-left text-[12px] leading-[normal] whitespace-nowrap text-[var(--muted-foreground)]">{k}</div>
                                        </div>
                                    ))}
                                </div>
                                {r.status === 'ACCEPTED' && r.order && (
                                    <div className={card}>
                                        <div className={h17}>الأوردر المرتبط</div>
                                        <div className="flex w-full shrink-0 items-center justify-between">
                                            <Link href={`/orders/${r.order.id}`} className="flex h-[38px] w-fit shrink-0 items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-left text-[13px] leading-[normal] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                                فتح الأوردر
                                            </Link>
                                            <div className="text-left text-[15px] leading-[normal] font-[700] text-[var(--primary)]">{r.order.number}</div>
                                        </div>
                                    </div>
                                )}
                                {r.status === 'REJECTED' && (
                                    <div className={card}>
                                        <div className={h17}>سبب الرفض</div>
                                        <div className="w-full text-right text-[13px] leading-[20px] text-[var(--ink)]">{r.reject_reason}</div>
                                    </div>
                                )}
                            </>
                        )}

                        {!final && <Delivery r={r} />}
                        {!final && <Attachments />}
                        <LogCard log={p.log} />
                    </div>
                </div>
            </div>
            {rejecting && (
                <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]">
                    <div className="flex w-[440px] max-w-full flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)]">
                        <div className="w-full text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">رفض الطلب</div>
                        <textarea dir="rtl" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الرفض (إلزامي)" className="h-[100px] w-full resize-none rounded-[10px] bg-[var(--background)] p-[14px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)]" />
                        <div className="flex w-full shrink-0 justify-end gap-[12px]">
                            <button type="button" onClick={() => setRejecting(false)} className={`${btn} bg-[var(--surface)] text-[var(--ink)] [outline:1px_solid_var(--border)]`}>
                                الرجوع
                            </button>
                            <button type="button" disabled={reason.trim().length < 3} onClick={() => router.post(`/order-requests/${r.id}/reject`, { reason } as never, hdrs)} className={`${btn} bg-[#B42318] text-white`}>
                                تأكيد الرفض
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
