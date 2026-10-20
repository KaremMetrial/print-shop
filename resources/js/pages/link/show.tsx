import { ProofDialog } from '@/components/finance/proof-dialog';
import { LinkLayout } from '@/components/shell/link-layout';
import { formatDate, formatMoneyFixed } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    token: string;
    order: {
        number: string;
        customer: string;
        status: string;
        status_label: string;
        created_at: string;
        delivery_method: 'PICKUP' | 'DELIVERY';
        delivery_address: string | null;
        delivery_fee_minor: number;
        grand_total_minor: number;
        paid_minor: number;
        remaining_minor: number;
        items: { id: number; name: string; quantity: number; state: string; approved: boolean; version_no: number | null }[];
    };
}
const STAGES = [
    ['COMPLETED', 'مكتمل'],
    ['OUT_FOR_DELIVERY', 'خرج للتوصيل'],
    ['READY_FOR_DELIVERY', 'جاهز للتوصيل'],
    ['IN_PRINTING', 'قيد الطباعة'],
    ['DESIGN_STAGE', 'مرحلة التصميم'],
] as const;
const ORDER = ['DESIGN_STAGE', 'IN_PRINTING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'];
const ORD = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة'];
const card = 'flex w-full shrink-0 flex-col items-end gap-[12px] rounded-[9px] bg-[var(--surface)] p-[17px]';
const h15 = 'text-left text-[15px] leading-[normal] font-[700] text-[var(--ink)]';
const KV = ({ k, v }: { k: string; v: string }) => (
    <div className="flex w-full shrink-0 items-center justify-between">
        <div className="text-left text-[12px] leading-[normal] font-[600] whitespace-pre text-[var(--ink)]">{v}</div>
        <div className="text-left text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{k}</div>
    </div>
);
const MSG: Record<string, [string, string]> = {
    DESIGN_STAGE: ['الأوردر حاليًا في مرحلة التصميم.', 'تبدأ الطباعة بعد اعتماد جميع التصميمات.'],
    IN_PRINTING: ['طلبك قيد الطباعة', 'تم اعتماد جميع التصميمات وبدأت الطباعة. سنُعلمك عند الجاهزية.'],
    READY_FOR_PICKUP: ['طلبك جاهز للاستلام', 'يمكنك استلام طلبك من المطبعة.'],
    READY_FOR_DELIVERY: ['طلبك جاهز للتوصيل', 'سيتم تسليم الأوردر قريبًا.'],
    OUT_FOR_DELIVERY: ['طلبك خرج للتوصيل', 'المندوب في الطريق إلى العنوان المسجّل.'],
};
const itemBadge = (s: string, a: boolean): [string, string, string] => (a ? ['معتمد', '#E9F7EE', '#207A44'] : s === 'AWAITING_APPROVAL' ? ['بانتظار اعتماد العميل', '#FFF4DD', '#925B10'] : s === 'REVISION_REQUESTED' ? ['مطلوب تعديل', '#FEF2F2', '#B42318'] : ['قيد التصميم', '#EFF6FF', '#2563EB']);

/** S-086 (مرحلة التصميم) + S-089..092 (حالات التنفيذ) — تجربة الأوردر عبر الرابط. */
export default function LinkShow({ token, order: o }: Props) {
    const [open, setOpen] = useState(false);
    const [proof, setProof] = useState(false);
    const idx = ORDER.indexOf(o.status === 'READY_FOR_PICKUP' ? 'READY_FOR_DELIVERY' : o.status);
    const [title, sub] = MSG[o.status] ?? ['', ''];
    const designStage = o.status === 'DESIGN_STAGE';
    return (
        <LinkLayout orderRef={{ number: o.number, customer: o.customer }}>
            <Head title={`تفاصيل الأوردر ${o.number}`} />
            <div className="hidden w-full flex-col items-end gap-[16px] p-[24px_48px] lg:flex">
                <div className="text-left text-[11px] leading-[normal] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`تفاصيل الأوردر / ⁦${o.number}⁩`}</div>
                <div className="flex w-full shrink-0 flex-col items-end gap-[10px]">
                    <div className="flex w-full shrink-0 items-center justify-end gap-[10px]">
                        <div className="flex w-fit shrink-0 items-center rounded-[14px] bg-[#EFF6FF] p-[4px_10px]">
                            <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">{o.status_label}</div>
                        </div>
                        <h1 className="text-left text-[26px] leading-[normal] font-[700] whitespace-nowrap text-[var(--ink)]">تفاصيل الأوردر</h1>
                    </div>
                    <div className="flex w-full shrink-0 justify-end gap-[22px]">
                        {[o.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام', formatDate(o.created_at), o.customer, o.number].map((t, i) => (
                            <div key={i} className="text-left text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{t}</div>
                        ))}
                    </div>
                </div>
                <div className={`${card} gap-[12px] p-[17px]`}>
                    <div className={h15}>{designStage ? 'حالة الأوردر' : 'تقدم الأوردر'}</div>
                    <div className="flex w-full shrink-0 gap-[10px]">
                        {STAGES.map(([k, l]) => {
                            const i = ORDER.indexOf(k);
                            const done = i < idx;
                            const cur = i === idx;
                            return (
                                <div key={k} className="flex flex-1 flex-col items-center gap-[6px]">
                                    <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[12px]" style={{ background: cur ? '#2563EB' : done ? '#DBEAFE' : '#F1F5F9' }}>
                                        <Icon name={cur ? 'check' : 'circle'} className="h-[12px] w-[12px]" color={cur ? '#FFFFFF' : '#94A3B8'} />
                                    </div>
                                    <div className="text-left text-[12px] leading-[normal] whitespace-nowrap" style={{ color: cur ? '#2563EB' : '#64748B', fontWeight: cur ? 700 : 400 }}>{l}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex w-full shrink-0 flex-col items-end gap-[3px]">
                        <div className="text-left text-[13px] leading-[normal] font-[700] text-[var(--ink)]">{title}</div>
                        <div className="text-left text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{sub}</div>
                    </div>
                </div>
                {proof && <ProofDialog url={`/l/${token}/proofs`} remainingMinor={o.remaining_minor} onClose={() => setProof(false)} />}
                <div className="flex w-full shrink-0 flex-col items-stretch gap-[16px] lg:flex-row lg:items-start">
                    <div className="flex w-full shrink-0 lg:w-[426px] flex-col items-end gap-[14px]">
                        <div className={card}>
                            <div className={h15}>ملخص الدفع</div>
                            <div className="flex w-full shrink-0 items-center justify-between rounded-[10px] bg-[#EFF6FF] p-[10px_12px]">
                                <div className="text-left text-[15px] leading-[normal] font-[700] whitespace-pre text-[var(--primary)]">{formatMoneyFixed(o.remaining_minor)}</div>
                                <div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">المتبقي عليك</div>
                            </div>
                            <KV k="إجمالي الأوردر" v={formatMoneyFixed(o.grand_total_minor)} />
                            <KV k="المدفوع المؤكد" v={formatMoneyFixed(o.paid_minor)} />
                            {o.remaining_minor > 0 && (
                                <button type="button" onClick={() => setProof(true)} className="text-left text-[13px] leading-[normal] font-[700] text-[var(--primary)]">
                                    إرسال إثبات دفع
                                </button>
                            )}
                            <button type="button" onClick={() => setOpen((v) => !v)} className="text-left text-[13px] leading-[normal] font-[700] text-[var(--primary)]">
                                تفاصيل المدفوعات ⌄
                            </button>
                        </div>
                        <div className={card}>
                            <div className={h15}>معلومات التسليم</div>
                            <KV k="الطريقة" v={o.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'} />
                            {o.delivery_method === 'DELIVERY' && <KV k="العنوان" v={o.delivery_address ?? '—'} />}
                            {o.delivery_method === 'DELIVERY' && <KV k="الرسوم" v={formatMoneyFixed(o.delivery_fee_minor)} />}
                            <KV k="الحالة" v={o.status === 'OUT_FOR_DELIVERY' ? 'خرج للتوصيل' : o.delivery_method === 'DELIVERY' ? 'لم يبدأ التوصيل بعد' : 'استلام من المطبعة'} />
                        </div>
                        <div className={card}>
                            <div className={h15}>الفاتورة</div>
                            <div className="text-left text-[12px] leading-[normal] text-[var(--muted-foreground)]">الفاتورة غير متاحة حاليًا.</div>
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-end gap-[12px]">
                        <div className="text-left text-[17px] leading-[normal] font-[700] text-[var(--ink)]">بنود الأوردر</div>
                        {o.items.map((it) => {
                            const [label, bg, fg] = itemBadge(it.state, it.approved);
                            const awaiting = it.state === 'AWAITING_APPROVAL';
                            return (
                                <div key={it.id} className="flex h-[148px] w-full shrink-0 items-center gap-[14px] rounded-[9px] bg-[var(--surface)] p-[14px]">
                                    <div className="flex w-fit shrink-0 flex-col items-end gap-[7px]">
                                        {awaiting ? (
                                            <Link href={`/l/${token}/items/${it.id}`} className="flex h-[38px] w-fit items-center rounded-[8px] bg-[var(--primary)] p-[0px_13px] text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-white">
                                                راجع تصميم {it.name}
                                            </Link>
                                        ) : (
                                            <Link href={`/l/${token}/items/${it.id}`} className="flex h-[38px] w-fit items-center rounded-[8px] bg-[var(--surface)] p-[0px_13px] text-left text-[12px] leading-[normal] font-[700] whitespace-nowrap text-[var(--primary)]">
                                                عرض التصميم
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col items-end gap-[6px]">
                                        <div className="text-left text-[16px] leading-[normal] font-[700] text-[var(--ink)]">{it.name}</div>
                                        <div className="text-left text-[12px] leading-[normal] font-[400] whitespace-pre text-[var(--muted-foreground)]">{`الكمية: ⁦${it.quantity.toLocaleString('en-US')}⁩ • ${it.approved ? 'التصميم المعتمد' : it.version_no ? `النسخة ${ORD[it.version_no] ?? it.version_no}` : 'التصميم قيد الإعداد'}`}</div>
                                        <div className="flex w-fit items-center rounded-[13px] p-[3px_9px]" style={{ background: bg }}>
                                            <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: fg }}>{label}</div>
                                        </div>
                                    </div>
                                    <div className="flex h-[92px] w-[84px] shrink-0 flex-col items-center justify-center gap-[5px] rounded-[6px] bg-[#F1F5F9]">
                                        <Icon name="file-image" className="h-[22px] w-[22px]" color="var(--muted-foreground)" />
                                        <div className="text-left text-[10px] leading-[normal] text-[var(--muted-foreground)]">{it.approved ? 'معتمد' : it.version_no ? `نسخة ${it.version_no}` : '—'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {open && <div className="w-full text-right text-[12px] text-[var(--muted-foreground)]">لا توجد دفعات مسجلة بعد.</div>}
            </div>
            <MobileShow token={token} o={o} title={title} sub={sub} onProof={() => setProof(true)} />
            {proof && <ProofDialog url={`/l/${token}/proofs`} remainingMinor={o.remaining_minor} onClose={() => setProof(false)} />}
        </LinkLayout>
    );
}

const mCard = 'flex w-full flex-col items-end gap-[10px] rounded-[14px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const mBtn = 'flex h-[48px] w-full items-center justify-center rounded-[10px] text-[15px]';

/** M-B01 + M-B05..07 — نظرة عامة على رابط الأوردر للموبايل (390px). pendev: PAnfZ / ADDWE / Dzum7 / qdGNq */
function MobileShow({ token, o, title, sub, onProof }: { token: string; o: Props['order']; title: string; sub: string; onProof: () => void }) {
    const [det, setDet] = useState(false);
    const [track, setTrack] = useState(false);
    const pending = o.items.find((i) => i.state === 'AWAITING_APPROVAL' && !i.approved);
    const approved = o.items.filter((i) => i.approved);
    const idx = ORDER.indexOf(o.status === 'READY_FOR_PICKUP' ? 'READY_FOR_DELIVERY' : o.status);
    return (
        <div dir="ltr" className="flex w-full flex-col items-end gap-[16px] p-[20px_16px_28px_16px] lg:hidden">
            <div className="w-full text-right text-[23px] font-[700] text-[var(--ink)]">{`أوردر #${o.number}`}</div>
            <div className="w-full text-right text-[15px] font-[700] text-[var(--primary)]">{o.status_label}</div>
            {pending ? (
                <div className="flex w-full flex-col items-end gap-[10px] rounded-[14px] bg-[#EFF6FF] p-[16px] [outline:1px_solid_#BFDBFE] [outline-offset:-0.5px]">
                    <div className="w-full text-right text-[18px] font-[700] text-[var(--ink)]">عندك تصميم محتاج مراجعتك.</div>
                    <div className="w-full text-right text-[14px] text-[#475569]">{`${pending.name} · النسخة ${ORD[pending.version_no ?? 1] ?? pending.version_no} · بانتظار اعتمادك`}</div>
                    <Link href={`/l/${token}/items/${pending.id}`} className={`${mBtn} bg-[var(--primary)] font-[600] text-white`}>{`راجع تصميم ${pending.name}`}</Link>
                    <Link href={`/l/${token}/items/${pending.id}?tab=chat`} className={`${mBtn} bg-[var(--surface)] font-[700] text-[var(--primary)]`}>{`محادثة ${pending.name}`}</Link>
                </div>
            ) : (
                <div className={mCard}>
                    <div className="w-full text-right text-[18px] font-[700] text-[var(--ink)]">{title}</div>
                    <div className="w-full text-right text-[14px] text-[#475569]">{sub}</div>
                </div>
            )}
            <div className={mCard}>
                <div className="w-full text-right text-[15px] font-[700] text-[#15803D]">{`تم اعتماد ${approved.length} من ${o.items.length}.`}</div>
                <div className="w-full text-right text-[14px] text-[#475569]">{approved.map((i) => i.name).join(' · ') || '—'}</div>
            </div>
            <div className={mCard}>
                <div className="w-full text-right text-[14px] text-[var(--muted-foreground)]">المتبقي عليك</div>
                <div className="w-full text-right text-[30px] font-[700] text-[var(--ink)]">{formatMoneyFixed(o.remaining_minor)}</div>
                <div className="w-full text-right text-[14px] text-[#334155]">{`إجمالي الأوردر ${formatMoneyFixed(o.grand_total_minor)} · المدفوع المؤكد ${formatMoneyFixed(o.paid_minor)}`}</div>
                {o.remaining_minor > 0 && (
                    <button type="button" onClick={onProof} className={`${mBtn} bg-[var(--primary)] font-[600] text-white`}>إرسال إثبات دفع</button>
                )}
                <button type="button" onClick={() => setDet((v) => !v)} className="h-[44px] w-full text-right text-[14px] font-[700] text-[var(--primary)]">تفاصيل المدفوعات ⌄</button>
                {det && <div className="w-full text-right text-[12px] text-[var(--muted-foreground)]">لا توجد دفعات مسجلة بعد.</div>}
            </div>
            <div className={mCard}>
                <div className="w-full text-right text-[15px] font-[700] text-[var(--ink)]">{`طريقة الاستلام: ${o.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'}`}</div>
                {o.delivery_address && <div className="w-full text-right text-[14px] text-[var(--muted-foreground)]">{o.delivery_address}</div>}
                <button type="button" onClick={() => setTrack((v) => !v)} className="w-full text-right text-[17px] font-[700] text-[var(--ink)]">تتبع مراحل الأوردر ⌄</button>
                {track && (
                    <div className="flex w-full flex-col gap-[6px]">
                        {[...STAGES].reverse().map(([k, l], n) => (
                            <div key={k} className="text-right text-[13px]" style={{ color: n <= idx ? 'var(--primary)' : 'var(--muted-foreground)', fontWeight: n === idx ? 700 : 400 }}>{`${n <= idx ? '●' : '○'} ${l}`}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
