import { ListHead } from '@/components/pen/lists';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/money';
import { Head, router } from '@inertiajs/react';

interface Props {
    from: string;
    to: string;
    ops: { created: number; by_status: Record<string, number>; completed: number; cancelled: number } | null;
    fin: { orders_value: number; collected: number; refunds_due: number; by_method: Record<string, number> } | null;
}
const ST: Record<string, string> = {
    DESIGN_STAGE: 'مرحلة التصميم',
    IN_PRINTING: 'قيد الطباعة',
    READY_FOR_PICKUP: 'جاهز للاستلام',
    READY_FOR_DELIVERY: 'جاهز للتوصيل',
    OUT_FOR_DELIVERY: 'خرج للتوصيل',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي',
};
const Card = ({ k, v }: { k: string; v: string | number }) => (
    <div className="flex flex-1 flex-col gap-[4px] rounded-[12px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
        <div className="w-full text-right text-[12px] text-[var(--muted-foreground)]">{k}</div>
        <div className="w-full text-right text-[22px] leading-[32px] font-[700] text-[var(--ink)]">{v}</div>
    </div>
);

/** S-060/061 — التقارير التشغيلية والمالية لفترة محددة. */
export default function Reports({ from, to, ops, fin }: Props) {
    const { labels } = usePaymentMethods();
    const go = (n: Record<string, string>) => router.get('/reports', { from, to, ...n }, { preserveState: true });
    const fld = 'h-[46px] rounded-[10px] bg-[var(--background)] p-[0px_14px] text-[14px] [outline:1px_solid_var(--control-border)]';
    return (
        <AppLayout active="/reports">
            <Head title="التقارير" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <ListHead
                    crumbs={[{ label: 'الرئيسية', href: '/dashboard' }, 'التقارير']}
                    title="التقارير"
                    subtitle="أرقام الفترة المحددة من بيانات النظام مباشرة."
                />
                <div className="flex w-full justify-end gap-[8px]">
                    <input type="date" aria-label="إلى" value={to} onChange={(e) => go({ to: e.target.value })} className={fld} />
                    <input type="date" aria-label="من" value={from} onChange={(e) => go({ from: e.target.value })} className={fld} />
                </div>
                {ops && (
                    <>
                        <div className="w-full text-right text-[18px] font-[700]">التقرير التشغيلي</div>
                        <div className="flex w-full gap-[12px]">
                            <Card k="أوردرات منشأة" v={ops.created} />
                            <Card k="أوردرات مكتملة" v={ops.completed} />
                            <Card k="أوردرات ملغاة" v={ops.cancelled} />
                        </div>
                        <div className="flex w-full flex-wrap gap-[12px]">
                            {Object.entries(ops.by_status).map(([k, v]) => (
                                <Card key={k} k={ST[k] ?? k} v={v} />
                            ))}
                        </div>
                    </>
                )}
                {fin && (
                    <>
                        <div className="w-full text-right text-[18px] font-[700]">التقرير المالي</div>
                        <div className="flex w-full gap-[12px]">
                            <Card k="قيمة الأوردرات" v={formatMoney(fin.orders_value)} />
                            <Card k="المحصّل" v={formatMoney(fin.collected)} />
                            <Card k="مستردات مستحقة" v={formatMoney(fin.refunds_due)} />
                        </div>
                        <div className="flex w-full flex-wrap gap-[12px]">
                            {Object.entries(fin.by_method).map(([k, v]) => (
                                <Card key={k} k={`المحصّل — ${labels[k] ?? k}`} v={formatMoney(Number(v))} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
