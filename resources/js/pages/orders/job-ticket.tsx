import { PenBreadcrumb } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head } from '@inertiajs/react';

interface Props {
    order: { number: string; customer: string; status_label: string; created_at: string | null; printing_started_at: string | null; eta_days: number | null; delivery_label: string; notes: string | null };
    items: { id: number; name: string; quantity: number; specs: string; version: string; notes: string }[];
}
const meta = 'flex flex-1 flex-col gap-[4px] rounded-[12px] bg-[var(--surface)] p-[12px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const th = 'text-right text-[13px] leading-[21px] font-[600] text-[#475569]';
const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex w-full shrink-0 items-center gap-[12px] p-[7px_0px] [border-bottom:1px_solid_var(--border)]">
        <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{v}</div>
        <div className="flex-1 text-right text-[11px] leading-[18px] text-[var(--muted-foreground)]">{k}</div>
    </div>
);
const eta = (n: number | null) => (n === null ? '—' : n === 2 ? 'يومان' : n === 1 ? 'يوم' : `${n} أيام`);

/** S-018 — بطاقة تشغيل الطباعة (داخلية، ليست فاتورة). pendev: Zhcui */
export default function JobTicket({ order: o, items }: Props) {
    return (
        <AppLayout active="/orders">
            <Head title="بطاقة تشغيل الطباعة" />
            <div className="flex w-full shrink-0 flex-col gap-[18px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'الأوردرات', href: '/orders' }, 'بطاقة تشغيل الطباعة', o.number]} />
                <div className="flex w-full shrink-0 items-start justify-between gap-[12px]">
                    <div className="flex items-center gap-[8px]">
                        <button type="button" onClick={() => window.print()} className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[14px] text-[var(--ink)] [outline:1px_solid_var(--border)]">طباعة</button>
                        <a href={`${typeof window !== 'undefined' ? window.location.pathname : ''}/pdf`} target="_blank" rel="noreferrer" className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-[14px] text-white">تنزيل PDF</a>
                    </div>
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">بطاقة تشغيل الطباعة</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] text-[var(--muted-foreground)]">{`${o.number} • ${o.customer}`}</div>
                    </div>
                </div>
                <div className="flex w-full shrink-0 flex-col gap-[16px] rounded-[12px] bg-[var(--surface)] p-[24px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="flex w-full items-center justify-between gap-[12px]">
                        <div className="w-[320px] text-right text-[12px] text-[var(--muted-foreground)]">بطاقة داخلية • ليست فاتورة أو إيصال دفع</div>
                        <div className="flex-1 text-right text-[20px] leading-[32px] font-[700] text-[var(--primary)]">بطاقة التشغيل</div>
                    </div>
                    <div className="flex w-full items-center gap-[24px]">
                        {[['رقم الأوردر', o.number], ['العميل', o.customer], ['تاريخ الإنشاء', o.created_at ? `${formatDate(o.created_at)}، ${formatTime(o.created_at)}` : '—'], ['تاريخ الطباعة', o.printing_started_at ? formatDate(o.printing_started_at) : '—']].map(([k, v]) => (
                            <div key={k} className={meta}>
                                <div className="text-right text-[11px] leading-[18px] text-[var(--muted-foreground)]">{k}</div>
                                <div className="text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">{v}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex w-full flex-col gap-[0px] rounded-[12px] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                        <Row k="الحالة التشغيلية" v={o.status_label} />
                        <Row k="مدة الطباعة المتوقعة" v={eta(o.eta_days)} />
                        <Row k="طريقة التسليم" v={o.delivery_label} />
                        <Row k="ملاحظات التشغيل" v={o.notes || 'تم اعتماد جميع نسخ التصميم — ابدأ الإنتاج'} />
                    </div>
                    <div className="flex w-full min-w-0 flex-col overflow-x-auto rounded-[12px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                        <div className="flex h-[47.5px] w-full items-center gap-[12px] bg-[#F1F5F9] p-[0px_16px] [border-bottom:1px_solid_var(--border)]">
                            <div className={`${th} flex-1`}>ملاحظات التشغيل</div>
                            <div className={`${th} w-[150px]`}>النسخة المعتمدة</div>
                            <div className={`${th} w-[270px]`}>المواصفات</div>
                            <div className={`${th} w-[90px]`}>الكمية</div>
                            <div className={`${th} w-[150px]`}>اسم البند</div>
                        </div>
                        {items.map((i) => (
                            <div key={i.id} className="flex h-[67.5px] w-full items-center gap-[12px] p-[0px_16px] [border-bottom:1px_solid_var(--border)]">
                                <div className="flex-1 text-right text-[13px] leading-[21px] text-[var(--muted-foreground)]">{i.notes}</div>
                                <div className="w-[150px] text-right text-[13px] font-[600] text-[var(--ink)]">{i.version}</div>
                                <div className="w-[270px] text-right text-[13px] text-[var(--ink)]">{i.specs}</div>
                                <div className="w-[90px] text-right text-[13px] font-[700] text-[var(--ink)]">{i.quantity}</div>
                                <div className="w-[150px] text-right text-[13px] font-[700] text-[var(--ink)]">{i.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
