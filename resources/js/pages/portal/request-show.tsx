import { CustomerLayout } from '@/components/shell/customer-layout';
import { CustomerMobileShell, iso, mArrowBack, mBtnPrimary, mCard, mMoney } from '@/components/shell/customer-mobile';
import { formatDate, formatTime } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    req: { number: string; status: string; status_key: string; at: string; delivery_method: string; reject_reason: string | null; order_id: number | null; order_number?: string | null; total_minor?: number | null; items: { name: string; quantity: number; files?: string[] }[]; edits?: { name: string; old: number; new: number }[] };
}
const row = 'flex w-full justify-between p-[10px_0px] [border-bottom:1px_solid_var(--border)] text-[14px]';
/** S-083-05..08 — تفاصيل الطلب: قيد المراجعة/مقبول/مرفوض (سبب الرفض يظهر للعميل). */
export default function PortalRequestShow({ req }: Props) {
    const [more, setMore] = useState(false);
    const edits = req.edits ?? [];
    const head: Record<string, [string, string]> = { ACCEPTED: ['تم قبول طلبك.', '#15803D'], REJECTED: ['تم رفض طلبك.', '#B91C1C'], IN_REVIEW: ['المطبعة تراجع طلبك الآن.', '#2563EB'], PENDING: ['طلبك بانتظار المراجعة.', '#2563EB'] };
    const [headText, headColor] = head[req.status_key] ?? [req.status, '#2563EB'];
    const files = req.items.flatMap((i) => i.files ?? []);
    const mobile = (
        <CustomerMobileShell title="تفاصيل الطلب" tab="requests" lead={mArrowBack} leadSide="right">
            <div className="w-full text-right text-[22px] leading-[normal] font-[700] text-[#0F172A]">{iso(req.number)}</div>
            <div className={mCard}>
                <div className="w-full text-right text-[18px] leading-[normal] font-[700]" style={{ color: headColor }}>{headText}</div>
                {req.status_key === 'ACCEPTED' && req.order_number && <div className="w-full text-right text-[16px] leading-[normal] font-[700] text-[#0F172A]">{`الأوردر: ${iso(req.order_number)}`}</div>}
                {req.status_key === 'REJECTED' && req.reject_reason && <div className="w-full text-right text-[15px] leading-[normal] font-[400] text-[#334155]">{`السبب: ${req.reject_reason}`}</div>}
                {req.order_id && (
                    <Link href={`/portal/orders/${req.order_id}`} className={mBtnPrimary}>
                        عرض الأوردر
                    </Link>
                )}
            </div>
            {edits.length > 0 && (
                <div className={mCard}>
                    <div className="w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]">ما الذي تغيّر؟</div>
                    {edits.map((e, n) => (
                        <div key={n} className="w-full text-right text-[15px] leading-[normal] font-[400] text-[#334155]">{`تم تعديل كمية ${e.name} من ${iso(e.old)} إلى ${iso(e.new)}.`}</div>
                    ))}
                </div>
            )}
            {req.total_minor != null && (
                <div className={mCard}>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">{req.order_id ? 'الإجمالي النهائي' : 'الإجمالي المبدئي'}</div>
                    <div className="w-full text-right text-[23px] leading-[normal] font-[700] text-[#0F172A]">{mMoney(req.total_minor)}</div>
                </div>
            )}
            <div className={mCard}>
                <div className="w-full text-right text-[17px] leading-[normal] font-[700] text-[#0F172A]">المنتجات</div>
                <div className="w-full text-right text-[15px] leading-[normal] font-[400] text-[#334155]">{req.items.map((i) => i.name).join(' · ')}</div>
            </div>
            <button type="button" onClick={() => setMore((m) => !m)} className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                تفاصيل التغييرات والمرفقات ⌄
            </button>
            {more && (
                <div className={mCard}>
                    {req.items.map((i, n) => (
                        <div key={n} className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#334155]">{`${i.name} · ${iso(i.quantity.toLocaleString('en-US'))}`}</div>
                    ))}
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#475569]">{files.length ? `📎 ${files.map(iso).join(' · ')}` : 'لا توجد مرفقات.'}</div>
                </div>
            )}
        </CustomerMobileShell>
    );
    return (
        <CustomerLayout mobile={mobile}>
            <Head title={`طلب ${req.number}`} />
            <div className="flex w-full flex-col gap-[4px]">
                <h1 className="text-right text-[28px] leading-[40px] font-[700]">طلب {req.number}</h1>
                <div className="text-right text-[14px] text-[var(--muted-foreground)]">{req.status} • أُرسل {formatDate(req.at)}، {formatTime(req.at)}</div>
            </div>
            <div className="flex w-full flex-col rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)]">
                <div className="text-right text-[18px] font-[700]">البنود</div>
                {req.items.map((i, n) => (
                    <div key={n} className={row}>
                        <span>الكمية: {i.quantity.toLocaleString('en-US')}</span>
                        <b>{i.name}</b>
                    </div>
                ))}
                <div className={row}>
                    <span>{req.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة'}</span>
                    <span className="text-[var(--muted-foreground)]">طريقة التسليم</span>
                </div>
            </div>
            {req.status_key === 'REJECTED' && <div className="w-full rounded-[12px] bg-[var(--danger-soft)] p-[16px] text-right text-[14px] text-[var(--danger-text)]">سبب الرفض: {req.reject_reason}</div>}
            {req.order_id && (
                <Link href={`/portal/orders/${req.order_id}`} className="flex h-[44px] w-fit items-center rounded-[8px] bg-[var(--primary)] p-[0px_18px] text-[14px] font-[600] text-white">
                    عرض الأوردر
                </Link>
            )}
        </CustomerLayout>
    );
}
