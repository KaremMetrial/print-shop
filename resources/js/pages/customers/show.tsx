import { CustomerShell, type CustomerHead } from '@/components/pen/customer-shell';
import { PenBadge } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Head } from '@inertiajs/react';

interface Props {
    customer: CustomerHead & { address: string | null; notes: string | null; notification_label: string; created_by: string | null; created_at: string };
    summary: { orders_total: number; orders_active: number; last_order_at: string | null };
    access: { last_login_at: string | null };
}

const card = 'flex w-full shrink-0 flex-col gap-[16px] rounded-[12px] bg-[var(--surface)] p-[24px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const h2 = 'w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]';
const lbl = 'w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]';
const val = 'w-full text-right text-[14px] leading-[22px] font-[600] text-[var(--ink)]';

function Pair({ k, v }: { k: string; v: React.ReactNode }) {
    return (
        <div className="flex w-full shrink-0 flex-col gap-[3px]">
            <div className={lbl}>{k}</div>
            <div className={val}>{v}</div>
        </div>
    );
}
function Row({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex h-[37.5px] w-full shrink-0 items-center gap-[12px] p-[8px_0px] [border-bottom:1px_solid_var(--border)]">
            <div className="flex-1 text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">{v}</div>
            <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{k}</div>
        </div>
    );
}

/** S-024 — نظرة عامة على العميل (pendev: cCUUY). */
export default function CustomerShow({ customer, summary, access }: Props) {
    return (
        <AppLayout>
            <Head title={customer.name} />
            <CustomerShell customer={customer} active="overview" title="ملف العميل" subtitle="بيانات العميل ونشاطه وسجلاته المرتبطة." crumb="ملف العميل">
                <div className="flex w-full shrink-0 gap-[20px]">
                    <div className="flex w-[350px] shrink-0 flex-col gap-[20px]">
                        <div className={card}>
                            <div className={h2}>ملخص النشاط</div>
                            <Row k="إجمالي الأوردرات" v={`${summary.orders_total} أوردرًا`} />
                            <Row k="الأوردرات النشطة" v={`${summary.orders_active} أوردرات`} />
                            <Row k="آخر أوردر" v={summary.last_order_at ? formatDate(summary.last_order_at) : '—'} />
                        </div>
                        <div className={card}>
                            <div className={h2}>بيانات الإضافة</div>
                            <Pair k="رقم العميل" v={customer.code} />
                            <Pair k="تاريخ إضافة العميل" v={formatDate(customer.created_at)} />
                            <Pair k="أضيف بواسطة" v={customer.created_by ?? '—'} />
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-[20px]">
                        <div className={card}>
                            <div className={h2}>بيانات العميل</div>
                            <div className="flex w-full shrink-0 items-center gap-[24px]">
                                <div className="flex flex-1 flex-col gap-[3px]">
                                    <div className={lbl}>اسم العميل</div>
                                    <div className={val}>{customer.name}</div>
                                </div>
                                <div className="flex flex-1 flex-col gap-[3px]">
                                    <div className={lbl}>رقم الهاتف</div>
                                    <div className={val}>
                                        <bdi dir="ltr">{customer.phone}</bdi>
                                    </div>
                                </div>
                            </div>
                            <div className="flex w-full shrink-0 items-center gap-[24px]">
                                <div className="flex flex-1 flex-col gap-[3px]">
                                    <div className={lbl}>العنوان</div>
                                    <div className={val}>{customer.address || '—'}</div>
                                </div>
                                <div className="flex flex-1 flex-col gap-[3px]">
                                    <div className={lbl}>شريحة السعر</div>
                                    <div className={val}>{customer.tier}</div>
                                </div>
                            </div>
                            <Pair k="تفضيل الإشعارات" v={customer.notification_label} />
                        </div>
                        <div className={card}>
                            <div className={h2}>معلومات إضافية</div>
                            <Pair k="ملاحظات داخلية" v={customer.notes || '—'} />
                            <div className="flex w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[16px]">
                                <PenBadge tone={customer.platform_access ? 'green' : 'gray'}>{customer.platform_access ? 'مفعّل' : 'غير مفعّل'}</PenBadge>
                                <div className="flex flex-1 flex-col gap-[2px]">
                                    <div className="w-full text-right text-[13px] leading-[21px] font-[700] text-[var(--ink)]">دخول المنصة</div>
                                    <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">
                                        {access.last_login_at ? `آخر دخول: ${formatDate(access.last_login_at)}، ${formatTime(access.last_login_at)}.` : 'لم يسجّل العميل الدخول بعد.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CustomerShell>
        </AppLayout>
    );
}
