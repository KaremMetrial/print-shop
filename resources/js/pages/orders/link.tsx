import { PenBreadcrumb } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    order: { id: number; number: string; customer: string; phone: string; status_label: string; created_at: string };
    link: { status: string; created_at: string; last_regenerated_at: string | null; url: string | null; closed: boolean };
}
const btn = 'flex h-[40px] w-fit shrink-0 items-center rounded-[8px] bg-[var(--surface)] p-[0px_14px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] disabled:opacity-50';
const Line = ({ k, v }: { k: string; v: string }) => (
    <div className="flex h-[51px] w-full shrink-0 items-center gap-[12px] [border-bottom:1px_solid_var(--border)]">
        <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{v}</div>
        <div className="flex-1 text-right text-[12px] leading-[19px] text-[var(--muted-foreground)]">{k}</div>
    </div>
);
const ST: Record<string, string> = { ACTIVE: 'نشط', SUSPENDED: 'موقوف مؤقتًا', CLOSED: 'مغلق' };

/** S-017 — إدارة رابط الأوردر (pendev: JMyOe). */
export default function OrderLink({ order: o, link }: Props) {
    const [copied, setCopied] = useState(false);
    const post = (a: string) => router.post(`/orders/${o.id}/link/${a}`, {}, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
    return (
        <AppLayout active="/orders">
            <Head title="إدارة رابط الأوردر" />
            <div className="flex w-full shrink-0 flex-col gap-[18px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'الأوردرات', href: '/orders' }, { label: o.number, href: `/orders/${o.id}` }, 'إدارة الرابط']} />
                <div className="flex w-full shrink-0 justify-between gap-[12px]">
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">إدارة رابط الأوردر</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] text-[var(--muted-foreground)]">{o.number} • {o.customer}</div>
                    </div>
                    <div className="flex w-fit shrink-0 flex-col items-end gap-[8px]">
                        <div className="flex w-fit items-center rounded-[8px] bg-[#FEF3C7] p-[4px_10px]">
                            <div className="text-[11px] leading-[normal] font-[700] text-[#92400E]">{o.status_label}</div>
                        </div>
                        <div className="w-[130px] text-right text-[13px] leading-[21px] text-[var(--muted-foreground)]">{o.phone}</div>
                    </div>
                </div>
                <div className="w-full text-right text-[19px] leading-[30px] font-[700] text-[var(--ink)]">معلومات الرابط — A</div>
                <div className="flex w-full shrink-0 flex-col rounded-[12px] bg-[var(--surface)] p-[18px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <Line k="حالة الرابط" v={ST[link.status]} />
                    <Line k="تاريخ الإنشاء" v={`${formatDate(link.created_at)}، ${formatTime(link.created_at)}`} />
                    <Line k="آخر إعادة إنشاء" v={link.last_regenerated_at ? `${formatDate(link.last_regenerated_at)}، ${formatTime(link.last_regenerated_at)}` : 'لم تتم إعادة الإنشاء'} />
                    <Line k="حالة الوصول" v={link.closed ? 'مغلق (الأوردر منتهٍ)' : link.status === 'ACTIVE' ? 'نشط وخاص' : 'غير متاح للعميل'} />
                </div>
                <div className="w-full text-right text-[17px] leading-[27px] font-[700] text-[var(--ink)]">إدارة الرابط — B</div>
                <div className="flex w-full shrink-0 items-center justify-end gap-[8px] rounded-[12px] bg-[var(--surface)] p-[18px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <button type="button" disabled={link.closed} onClick={() => post('regenerate')} className={btn}>إعادة إنشاء الرابط</button>
                    {link.status === 'SUSPENDED' ? (
                        <button type="button" disabled={link.closed} onClick={() => post('reactivate')} className={btn}>إعادة تفعيل الرابط</button>
                    ) : (
                        <button type="button" disabled={link.closed} onClick={() => post('suspend')} className={btn}>إيقاف الرابط مؤقتًا</button>
                    )}
                    {link.url && (
                        <a href={`https://wa.me/?text=${encodeURIComponent(link.url)}`} target="_blank" rel="noreferrer" className={btn}>فتح واتساب</a>
                    )}
                    <button
                        type="button"
                        disabled={!link.url}
                        onClick={() => {
                            navigator.clipboard?.writeText(link.url!);
                            setCopied(true);
                        }}
                        className="flex h-[40px] w-fit shrink-0 items-center rounded-[8px] bg-[var(--primary)] p-[0px_14px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-white disabled:opacity-50"
                    >
                        {copied ? 'تم النسخ' : 'نسخ الرابط'}
                    </button>
                </div>
                <div className="w-full rounded-[12px] bg-[var(--surface)] p-[14px_18px] text-right text-[12px] leading-[19px] text-[var(--muted-foreground)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">افتح واتساب لمشاركة الرابط مع العميل يدويًا.</div>
            </div>
        </AppLayout>
    );
}
