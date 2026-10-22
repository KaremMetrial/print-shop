import {
    PenButton,
    PenCard,
    PenFilterMenu,
    PenKpi,
    PenRowAction,
    PenStatus,
    PenTable,
    penCell,
    penH2,
    penLink,
    type StatusTone,
} from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, formatTime } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';

interface Recent {
    id: number | string;
    no: string;
    subject: string;
    status: string;
    tone: StatusTone;
    due: string;
    total_minor: number;
    href: string;
}
const PERIODS = [
    { value: 'today', label: 'هذا اليوم' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
];
const PLABEL = { today: 'اليوم', week: 'الأسبوع', month: 'الشهر' } as const;

interface Props {
    period: 'today' | 'week' | 'month';
    user_first_name: string;
    now: string;
    urgent: { late: number; unassigned: number } | null;
    kpis: {
        pending_requests: number;
        unassigned_items: number;
        follow_up: number;
        revisions: number;
        awaiting_approval: number;
        in_printing: number;
        ready: number;
    };
    summary: { awaiting_approval: number; in_design: number; out_for_delivery: number; completed: number; pickup: number; delivery: number };
    finance: { collected_today: number; collected_week: number; receivables: number; order_value_today: number; refund_due: number } | null;
    alerts: { title: string; tone: 'warn' | 'danger'; text: string }[];
    actions: { total: number; items: { title: string; sub: string; href: string }[] };
    recent: Recent[];
    branch: string;
    statusLabels: Record<string, string>;
}

/** S-007 — لوحة التحكم (pendev: frame Xqpp0). التخطيط literal كما في التصدير. */
export default function Dashboard({ period, user_first_name, now, urgent, kpis, summary, finance, alerts, actions, recent, branch, statusLabels }: Props) {
    const d = new Date(now);
    return (
        <AppLayout>
            <Head title="لوحة التحكم" />
            <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">الرئيسية ‹ لوحة التحكم</div>

            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                <div className="flex w-fit shrink-0 items-center gap-[12px]">
                    <PenButton href="/orders/create">طلب جديد</PenButton>
                </div>
                <div className="flex flex-1 flex-col gap-[4px]">
                    <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">لوحة التحكم</h1>
                    <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                        صباح الخير، {user_first_name}. إليك ما يحتاج اهتمامك اليوم.
                    </div>
                </div>
            </div>

            <div className="flex w-full shrink-0 items-center gap-[12px]">
                <PenFilterMenu
                    label="الفترة"
                    value={period}
                    options={PERIODS}
                    onChange={(v) => router.get('/dashboard', { period: v === 'today' ? undefined : v }, { preserveScroll: true })}
                />
                <PenButton variant="secondary" onClick={() => router.reload()}>
                    تحديث
                </PenButton>
                <div className="flex-1 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                    {formatDate(d, { year: true, weekday: true })} • آخر تحديث {formatTime(d)}
                </div>
            </div>

            {urgent && (
                <div className="flex w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--warning-soft)] p-[12px_16px]">
                    <PenButton variant="secondary" href="/actions">
                        مراجعة الإجراءات
                    </PenButton>
                    <div className="flex-1 text-right text-[14px] leading-[22px] font-[600] text-[var(--warning-text)]">
                        {urgent.late} طلبات تجاوزت موعد التسليم • {urgent.unassigned} مهام تصميم لم تُسند بعد
                    </div>
                </div>
            )}

            <h2 className={penH2}>نظرة على العمليات</h2>
            <div className="flex w-full shrink-0 gap-[16px]">
                <PenKpi className="flex-1" label={`${statusLabels.READY_FOR_PICKUP} أو ${statusLabels.READY_FOR_DELIVERY}`} value={kpis.ready} hint="عرض الطلبات الجاهزة ←" href="/delivery" />
                <PenKpi className="flex-1" label={statusLabels.IN_PRINTING} value={kpis.in_printing} hint="متابعة الإنتاج ←" href="/orders?status=IN_PRINTING" />
                <PenKpi
                    className="flex-1"
                    label="تصاميم تحتاج متابعة"
                    value={kpis.follow_up}
                    hint={`${kpis.revisions} تعديلات • ${kpis.awaiting_approval} موافقات ←`}
                    href="/design"
                />
                <PenKpi
                    className="flex-1"
                    label="مهام تصميم غير مسندة"
                    value={kpis.unassigned_items}
                    hint="إسناد المهام ←"
                    href="/design?state=unassigned"
                />
                <PenKpi
                    className="w-[210px]"
                    label="طلبات أوردرات معلّقة"
                    value={kpis.pending_requests}
                    hint="مراجعة الطلبات ←"
                    href="/order-requests"
                />
            </div>

            <PenCard className="flex-row gap-[24px] p-[16px_20px]">
                <PenKpi
                    big={false}
                    label="بانتظار الموافقة"
                    value={summary.awaiting_approval}
                    hint="مراجعة الموافقات ←"
                    href="/design?state=awaiting"
                />
                <PenKpi big={false} label="تصاميم قيد التنفيذ" value={summary.in_design} hint="إدارة التصميم ←" href="/design" />
                <PenKpi big={false} label="خارج للتسليم" value={summary.out_for_delivery} hint="تتبع التوصيل ←" href="/delivery" />
                <PenKpi
                    big={false}
                    label={`طلبات مكتملة ${PLABEL[period]}`}
                    value={summary.completed}
                    hint="عرض الطلبات ←"
                    href="/orders?status=COMPLETED"
                />
                <PenKpi
                    big={false}
                    label="استلام / توصيل"
                    value={`${summary.pickup} / ${summary.delivery}`}
                    hint="جدولة التوصيل ←"
                    href="/delivery"
                />
            </PenCard>

            {finance && (
                <PenCard className="gap-[12px] p-[20px]">
                    <div className="flex w-full shrink-0 items-center gap-[12px]">
                        <div className="flex w-fit shrink-0 flex-col gap-[16px] rounded-[8px] bg-[var(--surface-subtle)] p-[4px_10px]">
                            <div className="text-left text-[12px] leading-[19px] font-[600] whitespace-nowrap text-[var(--text-secondary)]">
                                للمسؤول فقط
                            </div>
                        </div>
                        <div className="flex-1 text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">الملخص المالي</div>
                    </div>
                    <div className="flex w-full shrink-0 items-center gap-[24px]">
                        {[
                            ['مبالغ مستحقة للرد', finance.refund_due],
                            [`قيمة الطلبات ${PLABEL[period]}`, finance.order_value_today],
                            ['مستحقات العملاء', finance.receivables],
                            ['تحصيلات الأسبوع', finance.collected_week],
                            [`تحصيلات ${PLABEL[period]}`, finance.collected_today],
                        ].map(([label, v]) => (
                            <div key={label as string} className="flex flex-1 flex-col gap-[4px]">
                                <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{label}</div>
                                <div className="w-full text-right text-[20px] leading-[32px] font-[700] text-[var(--ink)]">
                                    {formatMoney(v as number)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">
                        جميع القيم بالجنيه المصري (EGP) • الأرقام المالية ظاهرة وفق صلاحياتك الإدارية.
                    </div>
                </PenCard>
            )}

            <div className="flex w-full shrink-0 gap-[24px]">
                <PenCard className="flex-1 gap-[12px] p-[20px]">
                    <div className={penH2}>تنبيهات التشغيل</div>
                    {alerts.length === 0 && (
                        <div className="w-full text-right text-[13px] leading-[21px] text-[var(--muted-foreground)]">
                            لا توجد تنبيهات تشغيلية الآن.
                        </div>
                    )}
                    {alerts.map((a, i) => (
                        <div key={i} className="contents">
                            <div
                                className={`w-full text-right text-[14px] leading-[22px] font-[700] ${a.tone === 'warn' ? 'text-[var(--warning-text)]' : 'text-[#B91C1C]'}`}
                            >
                                {a.title}
                            </div>
                            <div className="w-full text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">{a.text}</div>
                        </div>
                    ))}
                </PenCard>
                <PenCard className="flex-1 gap-[12px] p-[20px]">
                    <div className="flex w-full shrink-0 items-center gap-[12px]">
                        <Link href="/actions" className={penLink}>
                            كل الإجراءات ←
                        </Link>
                        <div className="flex-1 text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">
                            يتطلب إجراءً • {actions.total}
                        </div>
                    </div>
                    {actions.items.map((a, i) => (
                        <div key={i} className="flex w-full shrink-0 items-center gap-[12px]">
                            <Link href={a.href} className={`w-[60px] ${penLink}`}>
                                فتح ←
                            </Link>
                            <div className="flex flex-1 flex-col">
                                <div className="w-full text-right text-[13px] leading-[21px] font-[400] text-[var(--ink)]">{a.title}</div>
                                <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{a.sub}</div>
                            </div>
                        </div>
                    ))}
                </PenCard>
            </div>

            <PenCard className="overflow-hidden rounded-[10px]">
                <div className="flex w-full shrink-0 items-center gap-[12px] p-[16px_24px]">
                    <Link href="/orders" className={`flex-1 ${penLink}`}>
                        جميع الطلبات ←
                    </Link>
                    <div className="flex-1 text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">أحدث الطلبات</div>
                </div>
                <PenTable
                    rows={recent}
                    empty={<div className="p-6 text-center text-[13px] text-[var(--muted-foreground)]">لا توجد طلبات بعد.</div>}
                    cols={[
                        { key: 'a', header: 'الإجراء', width: 104, align: 'left', cell: (r) => <PenRowAction href={r.href}>عرض الطلب</PenRowAction> },
                        { key: 't', header: 'الإجمالي', width: 130, cell: (r) => <div className={penCell}>{formatMoney(r.total_minor)}</div> },
                        { key: 'd', header: 'موعد التسليم', width: 136, cell: (r) => <div className={penCell}>{r.due}</div> },
                        {
                            key: 's',
                            header: 'الحالة',
                            width: 136,
                            cell: (r) => (
                                <div className="flex justify-end">
                                    <PenStatus tone={r.tone}>{r.status}</PenStatus>
                                </div>
                            ),
                        },
                        { key: 'c', header: 'العميل / المنتج', cell: (r) => <div className={penCell}>{r.subject}</div> },
                        { key: 'n', header: 'رقم الطلب', width: 88, cell: (r) => <div className={penCell}>{r.no}</div> },
                    ]}
                />
            </PenCard>

            <div className="flex w-full shrink-0 items-center gap-[12px]">
                <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">
                    عرض البيانات حسب صلاحيات المسؤول
                </div>
                <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">
                    {formatDate(d)} • {branch}
                </div>
            </div>
        </AppLayout>
    );
}
