import { CustomerLayout } from '@/components/shell/customer-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';

interface Props {
    req: { number: string; status: string; status_key: string; at: string; delivery_method: string; reject_reason: string | null; order_id: number | null; items: { name: string; quantity: number }[] };
}
const row = 'flex w-full justify-between p-[10px_0px] [border-bottom:1px_solid_var(--border)] text-[14px]';
/** S-083-05..08 — تفاصيل الطلب: قيد المراجعة/مقبول/مرفوض (سبب الرفض يظهر للعميل). */
export default function PortalRequestShow({ req }: Props) {
    return (
        <CustomerLayout>
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
