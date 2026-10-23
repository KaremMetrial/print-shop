import { iso, mBtnPrimary, mCard, mH2, mMoney } from '@/components/shell/customer-mobile';
import { MobileProofSheetBody } from '@/components/finance/mobile-proof-sheet';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

export interface LinkOrder {
    number: string;
    status: string;
    status_label: string;
    status_labels: Record<string, string>;
    delivery_method: 'PICKUP' | 'DELIVERY';
    delivery_address: string | null;
    grand_total_minor: number;
    paid_minor: number;
    remaining_minor: number;
    has_invoice: boolean;
    items: { id: number; name: string; quantity: number; state: string; approved: boolean; version_no: number | null }[];
}

const ORD = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
const STAGES = ['DESIGN_STAGE', 'IN_PRINTING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'];
const mTitle = 'w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]';
const mMuted = 'w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]';

/** رسالة الحالة بعد مرحلة التصميم (M-B05..B07): العنوان + سطران + «ما التالي؟» (إن وُجد). */
function statusMessage(o: LinkOrder): { title: string; lines: [string, string]; next: string | null } {
    const delivery = o.delivery_method === 'DELIVERY';
    switch (o.status) {
        case 'IN_PRINTING':
            return { title: 'طلبك قيد الطباعة', lines: ['تم اعتماد التصميمات،', 'وبنجهّز الأوردر للطباعة.'], next: `سنخبرك عند انتهاء الطباعة وتجهيز ${delivery ? 'التوصيل' : 'الاستلام'}.` };
        case 'READY_FOR_DELIVERY':
        case 'READY_FOR_PICKUP':
            return delivery
                ? { title: 'طلبك جاهز للتوصيل', lines: ['الطباعة خلصت،', 'والأوردر جاهز للتوصيل.'], next: 'ستظهر حالة الأوردر عندما يخرج للتوصيل.' }
                : { title: 'طلبك جاهز للاستلام', lines: ['الطباعة خلصت،', 'والأوردر جاهز للاستلام.'], next: 'تفضّل بالاستلام من المطبعة.' };
        case 'OUT_FOR_DELIVERY':
            return { title: 'طلبك خرج للتوصيل', lines: ['الأوردر خرج من المطبعة', 'وفي طريقه للتوصيل.'], next: null };
        case 'COMPLETED':
            return { title: 'تم تسليم طلبك', lines: ['شكرًا لتعاملك معنا،', 'نتمنى أن ينال الأوردر إعجابك.'], next: null };
        default:
            return { title: o.status_label, lines: ['', ''], next: null };
    }
}

function Tracking({ o, bare }: { o: LinkOrder; bare?: boolean }) {
    const [open, setOpen] = useState(false);
    const idx = STAGES.indexOf(o.status === 'READY_FOR_PICKUP' ? 'READY_FOR_DELIVERY' : o.status);
    return (
        <div className={bare ? 'flex w-full flex-col items-end gap-[10px] rounded-[14px] bg-white p-[4px_0px] [outline:1px_solid_#FFFFFF]' : mCard}>
            <button type="button" onClick={() => setOpen((v) => !v)} className={mTitle}>
                تتبع مراحل الأوردر ⌄
            </button>
            {open && (
                <div className="flex w-full flex-col gap-[6px]">
                    {STAGES.map((k, n) => ({ k, n }))
                        .reverse()
                        .map(({ k, n }) => (
                            <div key={k} className="text-right text-[14px] leading-[normal]" style={{ color: n <= idx ? '#2563EB' : '#64748B', fontWeight: n === idx ? 700 : 400 }}>{`${n <= idx ? '●' : '○'} ${o.status_labels[k] ?? k}`}</div>
                        ))}
                </div>
            )}
        </div>
    );
}

/**
 * نظرة الرابط الخاص على الموبايل (pendev: PAnfZ للتصميم، ADDWE/Dzum7/qdGNq لما بعده).
 * مرحلة التصميم = بطاقة الإجراء المطلوب؛ بعدها = رسالة الحالة. الخادم هو المرجع في كل حالة.
 */
export function LinkMobileOverview({ token, o, onProof, sheet }: { token: string; o: LinkOrder; onProof: () => void; sheet?: { onClose: () => void } }) {
    const [more, setMore] = useState(false);
    const [det, setDet] = useState(false);
    const pending = o.items.find((i) => i.state === 'AWAITING_APPROVAL' && !i.approved);
    const approved = o.items.filter((i) => i.approved);
    const designStage = o.status === 'DESIGN_STAGE';
    const msg = statusMessage(o);
    const addr = o.delivery_method === 'DELIVERY' ? o.delivery_address : null;
    const remainBtn = o.remaining_minor > 0 && (
        <button type="button" onClick={onProof} className={designStage ? `${mBtnPrimary} font-[600]` : 'flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB]'}>
            إرسال إثبات دفع
        </button>
    );

    if (sheet) {
        return (
            <div dir="ltr" className="flex w-full flex-col items-end gap-[16px] p-[20px_16px_28px_16px] lg:hidden">
                <MobileProofSheetBody url={`/l/${token}/proofs`} order={o.number} remaining={o.remaining_minor} onClose={sheet.onClose} colon />
            </div>
        );
    }

    if (designStage) {
        return (
            <div dir="ltr" className="flex w-full flex-col items-end gap-[16px] p-[20px_16px_28px_16px] lg:hidden">
                <div className="w-full text-right text-[23px] leading-[normal] font-[700] text-[#0F172A]">{`أوردر #${iso(o.number)}`}</div>
                <div className="w-full text-right text-[15px] leading-[normal] font-[700] text-[#2563EB]">{o.status_label}</div>
                {pending ? (
                    <div className="flex w-full flex-col items-end gap-[10px] rounded-[14px] bg-[#EFF6FF] p-[16px] [outline:1px_solid_#BFDBFE] [outline-offset:-0.5px]">
                        <div className={mH2}>عندك تصميم محتاج مراجعتك.</div>
                        <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">{`${pending.name} · النسخة ${ORD[pending.version_no ?? 1] ?? iso(pending.version_no)} · بانتظار اعتمادك`}</div>
                        <Link href={`/l/${token}/items/${pending.id}`} className={`${mBtnPrimary} font-[600]`}>{`راجع تصميم ${pending.name}`}</Link>
                        <Link href={`/l/${token}/items/${pending.id}?tab=chat`} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB]">{`محادثة ${pending.name}`}</Link>
                    </div>
                ) : (
                    <div className={mCard}>
                        <div className={mH2}>حالة الأوردر: {o.status_label}</div>
                        <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">تبدأ الطباعة بعد اعتماد جميع التصميمات.</div>
                    </div>
                )}
                <div className={mCard}>
                    <div className="w-full text-right text-[15px] leading-[normal] font-[700] text-[#15803D]">{`تم اعتماد ${approved.length === 2 ? 'تصميمين' : `${iso(approved.length)} تصميم`} من ${iso(o.items.length)}.`}</div>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">{approved.map((i) => i.name).join(' · ') || '—'}</div>
                    <button type="button" onClick={() => setMore((v) => !v)} className="flex h-[44px] w-full items-center text-right text-[14px] leading-[normal] font-[400] text-[#2563EB]">
                        <span className="flex-1">{approved.length === 2 ? 'عرض التصميمين' : 'عرض التصاميم'} ⌄</span>
                    </button>
                    {more && (
                        <div className="flex w-full flex-col gap-[8px]">
                            {approved.map((i) => (
                                <Link key={i.id} href={`/l/${token}/items/${i.id}`} className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">{`${i.name} · عرض التصميم المعتمد`}</Link>
                            ))}
                        </div>
                    )}
                </div>
                <div className={mCard}>
                    <div className={mMuted}>المتبقي عليك</div>
                    <div className="w-full text-right text-[30px] leading-[normal] font-[700] text-[#0F172A]">{mMoney(o.remaining_minor)}</div>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#334155]">
                        {`إجمالي الأوردر ${mMoney(o.grand_total_minor)}`}
                        <br />
                        {`المدفوع المؤكد ${mMoney(o.paid_minor)}`}
                    </div>
                    {remainBtn}
                    {o.has_invoice && (
                        <Link href={`/l/${token}/invoice`} className="flex h-[44px] w-full items-center text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                            عرض الفاتورة
                        </Link>
                    )}
                    <button type="button" onClick={() => setDet((v) => !v)} className="flex h-[44px] w-full items-center text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                        <span className="flex-1">تفاصيل المدفوعات ⌄</span>
                    </button>
                    {det && <div className={mMuted}>{o.paid_minor > 0 ? `المدفوع المؤكد ${mMoney(o.paid_minor)}` : 'لا توجد دفعات مؤكدة بعد.'}</div>}
                </div>
                <div className={mCard}>
                    <div className="w-full text-right text-[15px] leading-[normal] font-[700] text-[#0F172A]">{`طريقة الاستلام: ${o.delivery_method === 'DELIVERY' ? 'توصيل' : 'من المطبعة'}`}</div>
                    {addr && <div className={mMuted}>{addr}</div>}
                    <Tracking o={o} bare />
                </div>
            </div>
        );
    }

    return (
        <div dir="ltr" className="flex w-full flex-col items-end gap-[16px] p-[20px_16px_28px_16px] lg:hidden">
            <div className="w-full text-right text-[20px] leading-[normal] font-[700] text-[#0F172A]">{`أوردر #${iso(o.number)}`}</div>
            <div className="w-full text-right text-[15px] leading-[normal] font-[700] text-[#2563EB]">{o.status_label}</div>
            <div className={mCard}>
                <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">{msg.title}</div>
                <div className="w-full text-right text-[16px] leading-[normal] font-[400] text-[#475569]">
                    {msg.lines[0]}
                    <br />
                    {msg.lines[1]}
                </div>
            </div>
            <Tracking o={o} />
            {msg.next && (
                <div className={mCard}>
                    <div className={mTitle}>ما التالي؟</div>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">{msg.next}</div>
                </div>
            )}
            <div className={mCard}>
                <div className="w-full text-right text-[16px] leading-[normal] font-[700] text-[#0F172A]">{`طريقة الاستلام: ${o.delivery_method === 'DELIVERY' ? 'توصيل' : 'من المطبعة'}`}</div>
                {addr && <div className={mMuted}>{addr}</div>}
            </div>
            {o.remaining_minor > 0 && (
                <div className={mCard}>
                    <div className={mMuted}>المتبقي عليك</div>
                    <div className="w-full text-right text-[30px] leading-[normal] font-[700] text-[#0F172A]">{mMoney(o.remaining_minor)}</div>
                    {remainBtn}
                </div>
            )}
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB]">
                العودة إلى الأوردر
            </button>
        </div>
    );
}
