import { CustomerLayout } from '@/components/shell/customer-layout';
import { formatMoneyFixed } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';

interface Props {
    due_minor: number;
    active: { id: number; number: string; status: string; remaining_minor: number }[];
    awaiting: { order_id: number; item_id: number; name: string }[];
    requests: number;
}
const card = 'flex w-full shrink-0 flex-col gap-[10px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const btn = 'flex h-[40px] w-fit items-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[13px] font-[600] text-[var(--primary)] [outline:1px_solid_var(--border)]';

/** S-081 — لوحة تحكم العميل (pendev: lnLjF): المطلوب منه، أرقامه، أوردراته الحالية. */
export default function PortalDashboard({ due_minor, active, awaiting, requests }: Props) {
    return (
        <CustomerLayout>
            <Head title="لوحة التحكم" />
            <div className="flex w-full items-center justify-between">
                <Link href="/portal/requests/new" className="flex h-[44px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_18px] text-[14px] font-[600] text-white">
                    إنشاء طلب أوردر
                </Link>
                <div className="flex flex-col gap-[4px]">
                    <h1 className="text-right text-[28px] leading-[40px] font-[700] text-[var(--ink)]">لوحة التحكم</h1>
                    <div className="text-right text-[14px] text-[var(--muted-foreground)]">تابع أوردراتك وطلباتك من مكان واحد.</div>
                </div>
            </div>
            <div className="w-full text-right text-[20px] font-[700]">مطلوب منك</div>
            {awaiting.length === 0 && <div className={`${card} text-right text-[14px] text-[var(--muted-foreground)]`}>لا يوجد شيء مطلوب منك الآن.</div>}
            {awaiting.map((a) => (
                <div key={a.item_id} className={`${card} flex-row items-center justify-between`}>
                    <Link href={`/portal/orders/${a.order_id}/items/${a.item_id}`} className={`${btn} border-[var(--primary)]`}>
                        معاينة التصميم
                    </Link>
                    <div className="flex flex-col items-end gap-[4px]">
                        <div className="text-[18px] font-[700]">{a.name}</div>
                        <div className="flex w-fit rounded-[14px] bg-[#FFF3D9] p-[3px_10px] text-[11px] font-[700] text-[#895A0D]">بانتظار اعتماد العميل</div>
                    </div>
                </div>
            ))}
            <div className="flex w-full flex-col gap-[16px] lg:flex-row">
                {[['طلبات بانتظار المراجعة', requests], ['تصميمات بانتظار اعتمادك', awaiting.length], ['الأوردرات النشطة', active.length]].map(([k, v]) => (
                    <div key={k} className={`${card} flex-1`}>
                        <div className="text-right text-[32px] leading-[40px] font-[700] text-[var(--ink)]">{v}</div>
                        <div className="text-right text-[13px] text-[var(--muted-foreground)]">{k}</div>
                    </div>
                ))}
                <div className={`${card} flex-1`}>
                    <div className="text-right text-[26px] leading-[40px] font-[700] text-[var(--primary)]">{formatMoneyFixed(due_minor)}</div>
                    <div className="text-right text-[13px] text-[var(--muted-foreground)]">المتبقي عليك</div>
                </div>
            </div>
            <div className="w-full text-right text-[20px] font-[700]">الأوردرات الحالية</div>
            {active.length === 0 && <div className={`${card} text-right text-[14px] text-[var(--muted-foreground)]`}>لا توجد أوردرات نشطة. يمكنك إنشاء طلب أوردر جديد.</div>}
            {active.map((o) => (
                <div key={o.id} className={`${card} flex-row items-center justify-between`}>
                    <Link href={`/portal/orders/${o.id}`} className={btn}>
                        عرض التفاصيل
                    </Link>
                    <div className="text-[13px] text-[var(--muted-foreground)]">المتبقي: {formatMoneyFixed(o.remaining_minor)}</div>
                    <div className="flex items-center gap-[12px]">
                        <div className="rounded-[14px] bg-[#FFF3D9] p-[4px_12px] text-[12px] font-[700] text-[#895A0D]">{o.status}</div>
                        <div className="text-[16px] font-[700]">{o.number}</div>
                    </div>
                </div>
            ))}
        </CustomerLayout>
    );
}
