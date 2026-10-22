import { PaymentDialog } from '@/components/finance/payment-dialog';
import { AddItemDialog, type CatalogProduct } from '@/components/orders/add-item-dialog';
import { AssignDesignerDialog } from '@/components/orders/assign-designer-dialog';
import { CancelOrderDialog } from '@/components/orders/cancel-dialog';
import { CancelItemDialog } from '@/components/orders/cancel-item-dialog';
import { EditItemDialog } from '@/components/orders/edit-item-dialog';
import { PageTabs } from '@/components/pen/page-tabs';
import { PenBreadcrumb } from '@/components/pen/primitives';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, formatTime } from '@/lib/money';
import { Head, Link, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';

type Tab = 'overview' | 'items' | 'payments' | 'delivery' | 'files' | 'activity';
interface OrderItemRow {
    id: number;
    notes: string | null;
    designer_id: number | null;
    label: string;
    quantity: number;
    specs: string;
    designer: string | null;
    version: string | null;
    status: 'APPROVED' | 'PENDING' | 'CANCELLED';
    updated_at: string | null;
    total_minor?: number;
}
interface Props {
    tab: Tab;
    catalog: CatalogProduct[];
    designers: { id: number; name: string }[];
    order: {
        id: number;
        number: string;
        status: string;
        status_label: string;
        customer: { id: number; name: string; phone: string; phone_display: string };
        created_at: string;
        updated_at: string;
        delivery_method: 'PICKUP' | 'DELIVERY';
        delivery_address: string | null;
        eta_days: number | null;
        notes: string | null;
        source_label: string;
        subtotal_minor?: number;
        discount_minor?: number;
        delivery_fee_minor?: number;
        grand_total_minor?: number;
        paid_minor?: number;
        remaining_minor?: number;
    };
    approval: { approved: number; total: number; next: { id: number; name: string } | null };
    items: OrderItemRow[];
    payments: { id: number; number: string; at: string; amount_minor: number; method: string; status: string }[];
    files: { label: string; rows: { name: string; type: string; item: string; at: string; source: string; by: string | null }[] }[];
    activity: { id: number; at: string; actor: string; action: string; details: string }[];
    delivery_log: { at: string; text: string; by: string }[];
    link: { status: string } | null;
    can: {
        assign: boolean;
        update: boolean;
        items: boolean;
        links: boolean;
        price: boolean;
        cancel: boolean;
        pay: boolean;
        next: { step: string; label: string } | null;
    };
    reasons: string[];
}

const TABS: [Tab, string][] = [
    ['overview', 'نظرة عامة'],
    ['items', 'البنود'],
    ['payments', 'المدفوعات'],
    ['delivery', 'التسليم'],
    ['files', 'الملفات'],
    ['activity', 'سجل النشاط'],
];
const sub36 =
    'flex h-[36px] flex-1 items-center justify-center rounded-[8px] bg-[var(--surface)] p-[0px_4px] text-left text-[13px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const dt = (iso: string, seconds = false) => `${formatDate(iso)}، ${formatTime(iso)}${seconds ? '' : ''}`;
const dShort = (iso: string) => `${formatDate(iso, { year: false })}، ${formatTime(iso)}`;
const eta = (n: number | null) => (n === null ? '—' : n === 2 ? 'يومان' : n === 1 ? 'يوم' : `${n} أيام`);
const deliveryLabel = (m: string) => (m === 'DELIVERY' ? 'توصيل' : 'استلام من المطبعة');
const waitText = (s: string) =>
    ({
        DESIGN_STAGE: 'بانتظار اعتماد جميع التصميمات قبل الطباعة.',
        IN_PRINTING: 'الأوردر قيد الطباعة.',
        READY_FOR_PICKUP: 'الأوردر جاهز للاستلام من المطبعة.',
        READY_FOR_DELIVERY: 'الأوردر جاهز للتوصيل.',
        OUT_FOR_DELIVERY: 'الأوردر خرج للتوصيل.',
        COMPLETED: 'تم إتمام الأوردر.',
        CANCELLED: 'الأوردر ملغي.',
    })[s] ?? '';

const panel = 'flex w-full shrink-0 flex-col rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const btn40 =
    'flex h-[40px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] text-left text-[14px] leading-[normal] font-[400] whitespace-nowrap text-[var(--ink)]';
const btn34 =
    'flex h-[34px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface)] p-[0px_12px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]';
const primary34 =
    'flex h-[34px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--primary)] p-[0px_12px] [outline:1px_solid_var(--primary)] [outline-offset:-0.5px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-white';

function StatusPill({ tone, children, w }: { tone: 'amber' | 'green'; children: ReactNode; w?: number }) {
    const c = tone === 'amber' ? ['#FEF3C7', '#92400E'] : ['#F0FDF4', '#15803D'];
    return (
        <div className="flex w-fit shrink-0 items-center rounded-[8px] p-[4px_10px]" style={{ background: c[0], width: w }}>
            <div className="text-left text-[11px] leading-[normal] font-[700] whitespace-nowrap" style={{ color: c[1] }}>
                {children}
            </div>
        </div>
    );
}

function Tabs({ order, tab }: { order: Props['order']; tab: Tab }) {
    return (
        <PageTabs
            label="أقسام الأوردر"
            value={tab}
            tabs={TABS.map(([key, label]) => ({ key, label, href: `/orders/${order.id}${key === 'overview' ? '' : `?tab=${key}`}` }))}
        />
    );
}

const Line = ({
    k,
    v,
    vc,
    h = 28.5,
    pad = '4px 0px',
    vs = 13,
    kv = 12,
}: {
    k: string;
    v: ReactNode;
    vc?: string;
    h?: number;
    pad?: string;
    vs?: number;
    kv?: number;
}) => (
    <div
        className="flex w-full shrink-0 items-center gap-[12px] [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:var(--border)]"
        style={{ height: h, padding: pad, margin: '0px 0px -0.5px 0px' }}
    >
        <div
            className="flex-1 text-right font-[600]"
            style={{ fontSize: vs, lineHeight: vs === 13 ? '21px' : '22px', color: vc ?? 'var(--ink)', fontWeight: vs === 14 ? 700 : 600 }}
        >
            {v}
        </div>
        <div className="flex-1 text-right font-[400] text-[var(--muted-foreground)]" style={{ fontSize: kv, lineHeight: '19px' }}>
            {k}
        </div>
    </div>
);
const H17 = ({ children }: { children: ReactNode }) => (
    <div className="w-full text-right text-[17px] leading-[27px] font-[700] text-[var(--ink)]">{children}</div>
);

function Overview({ p }: { p: Props }) {
    const { order: o, approval: a, can } = p;
    const next = a.next;
    return (
        <>
            <div className={`${panel} gap-[8px] p-[16px]`}>
                <div className="w-full text-right text-[15px] leading-[24px] font-[700] text-[var(--ink)]">
                    حالة الأوردر: {o.status_label} • اعتماد التصميمات
                </div>
                <div className="w-full text-right text-[20px] leading-[32px] font-[700] text-[var(--primary)]">
                    {a.approved} من {a.total} بنود معتمدة
                </div>
                <div className="flex h-[6px] w-full shrink-0 gap-[6px]">
                    {Array.from({ length: a.total }, (_, i) => (
                        <div key={i} className="h-[6px] flex-1 rounded-[3px]" style={{ background: i < a.approved ? '#2563EB' : '#E2E8F0' }} />
                    ))}
                </div>
                <div className="flex w-full shrink-0 items-center gap-[16px]">
                    {next && (
                        <Link href={`/orders/${o.id}?tab=items`} className={btn40}>
                            عرض البند
                        </Link>
                    )}
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <div className="w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">
                            {next ? `بانتظار اعتماد تصميم ${next.name}` : 'تم اعتماد جميع التصميمات'}
                        </div>
                        <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                            {next
                                ? `تم اعتماد ${a.approved === 2 ? 'تصميمين' : `${a.approved} تصميمات`}، ويتبقى اعتماد تصميم ${next.name} لبدء الطباعة.`
                                : 'يمكن بدء الطباعة.'}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex w-full shrink-0 gap-[16px]">
                <div className="flex flex-1 flex-col gap-[16px]">
                    {can.price && (
                        <div className={`${panel} gap-[8px] p-[20px]`}>
                            <H17>الملخص المالي</H17>
                            <Line k="إجمالي البنود" v={formatMoney(o.subtotal_minor ?? 0)} vs={14} h={33.5} pad="6px 0px" />
                            <Line k="خصم الأوردر" v={formatMoney(o.discount_minor ?? 0)} vc="#B45309" vs={14} h={33.5} pad="6px 0px" />
                            <Line k="رسوم التوصيل" v={formatMoney(o.delivery_fee_minor ?? 0)} vs={14} h={33.5} pad="6px 0px" />
                            <div
                                className="flex h-[43.5px] w-full shrink-0 items-center gap-[12px] [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:var(--border)] p-[6px_0px]"
                                style={{ margin: '0px 0px -0.5px 0px' }}
                            >
                                <div className="flex-1 text-right text-[20px] leading-[32px] font-[700] text-[var(--primary)]">
                                    {formatMoney(o.grand_total_minor ?? 0)}
                                </div>
                                <div className="flex-1 text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">الإجمالي النهائي</div>
                            </div>
                            <Line k="المدفوع" v={formatMoney(o.paid_minor ?? 0)} vc="#15803D" vs={14} h={33.5} pad="6px 0px" />
                            <div className="flex w-full shrink-0 items-center gap-[12px] rounded-[8px] bg-[#FFFBEB] p-[8px_12px]">
                                <div className="flex-1 text-right text-[20px] leading-[32px] font-[700] text-[#B45309]">
                                    {formatMoney(o.remaining_minor ?? 0)}
                                </div>
                                <div className="flex-1 text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">المتبقي</div>
                            </div>
                        </div>
                    )}
                    <div className={`${panel} gap-[8px] p-[16px]`}>
                        <H17>معلومات إضافية</H17>
                        <div className="flex w-full shrink-0 flex-col items-center gap-[8px]">
                            {[
                                ['مصدر الأوردر', o.source_label],
                                ['ملاحظات الأوردر', o.notes || 'لا توجد ملاحظات'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex w-full shrink-0 flex-col gap-[4px]">
                                    <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{k}</div>
                                    <div className="w-full text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">{v}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-[16px]">
                    <div className={`${panel} gap-[8px] p-[16px]`}>
                        <H17>بيانات العميل</H17>
                        <Line k="اسم العميل" v={o.customer.name} />
                        <Line k="رقم الهاتف" v={o.customer.phone} />
                        <Line k="طريقة التسليم" v={o.delivery_method === 'DELIVERY' ? 'توصيل' : 'استلام'} />
                        <Link href={`/customers/${o.customer.id}`} className={btn40}>
                            عرض ملف العميل
                        </Link>
                    </div>
                    <div className={`${panel} gap-[8px] p-[16px]`}>
                        <H17>التسليم والطباعة</H17>
                        <Line k="طريقة التسليم" v={deliveryLabel(o.delivery_method)} />
                        <Line k="مدة الطباعة المتوقعة" v={eta(o.eta_days)} />
                        {o.delivery_method === 'DELIVERY' && (
                            <div
                                className="flex h-[51.5px] w-full shrink-0 flex-col items-end gap-[4px] [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:var(--border)] p-[4px_0px]"
                                style={{ margin: '0px 0px -0.5px 0px' }}
                            >
                                <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">
                                    عنوان التوصيل
                                </div>
                                <div className="w-full text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{o.delivery_address}</div>
                            </div>
                        )}
                    </div>
                    {p.link && (
                        <div className={`${panel} flex-row items-center gap-[8px] p-[12px_16px]`}>
                            {can.links && (
                                <Link href={`/orders/${o.id}/link`} className={btn40}>
                                    إدارة الرابط
                                </Link>
                            )}
                            <div className="flex-1 text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">رابط العميل</div>
                            <div className="text-left text-[13px] leading-[21px] font-[600] whitespace-nowrap text-[#15803D]">{p.link.status}</div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function Items({ p }: { p: Props }) {
    const { order: o, items, approval: a, can } = p;
    const [cancelItem, setCancelItem] = useState<OrderItemRow | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<OrderItemRow | null>(null);
    const [assigning, setAssigning] = useState<OrderItemRow | null>(null);
    const open = o.status === 'DESIGN_STAGE';
    return (
        <>
            {adding && <AddItemDialog orderId={o.id} catalog={p.catalog} onClose={() => setAdding(false)} />}
            {editing && <EditItemDialog orderId={o.id} item={editing} onClose={() => setEditing(null)} />}
            {assigning && <AssignDesignerDialog item={assigning} designers={p.designers} onClose={() => setAssigning(null)} />}
            {cancelItem && <CancelItemDialog orderId={o.id} item={cancelItem} onClose={() => setCancelItem(null)} />}
            <div className="w-full text-right text-[20px] leading-[32px] font-[700] text-[var(--ink)]">بنود الأوردر</div>
            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                {can.items && o.status === 'DESIGN_STAGE' && (
                    <button type="button" onClick={() => setAdding(true)} className={primary34}>
                        إضافة بند
                    </button>
                )}
                <div className="flex-1 text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                    {a.approved} من {a.total} بنود معتمدة
                </div>
            </div>
            <div className="flex w-full shrink-0 items-start gap-[12px]">
                {[...items].map((i) => {
                    const rows: [string, string][] = [
                        ['الكمية', String(i.quantity)],
                        ['ملخص المواصفات', i.specs],
                        ['المصمم المسؤول', i.designer ?? 'غير معيّن'],
                        ['آخر نسخة', i.version ?? '—'],
                        ...(can.price && i.total_minor !== undefined ? ([['سعر البند', formatMoney(i.total_minor)]] as [string, string][]) : []),
                        ['آخر نشاط', i.updated_at ? dShort(i.updated_at).replace(/^(\d+ \S+)، /, '$1، ') : '—'],
                    ];
                    return (
                        <div key={i.id} className={`${panel} min-w-0 flex-1 gap-[10px] p-[18px]`}>
                            <div className="w-full text-right text-[16px] leading-[26px] font-[700] text-[var(--ink)]">{i.label}</div>
                            <div
                                className="flex w-fit shrink-0 items-center rounded-[8px] p-[4px_10px]"
                                style={{ background: i.status === 'APPROVED' ? '#F0FDF4' : '#FEF3C7' }}
                            >
                                <div
                                    className="text-left text-[13px] leading-[normal] font-[700] whitespace-nowrap"
                                    style={{ color: i.status === 'APPROVED' ? '#15803D' : '#92400E' }}
                                >
                                    {i.status === 'APPROVED' ? 'معتمد' : i.status === 'CANCELLED' ? 'ملغي' : 'بانتظار اعتماد العميل'}
                                </div>
                            </div>
                            {rows.map(([k, v]) => (
                                <div
                                    key={k}
                                    className="flex min-h-[28.5px] w-full shrink-0 items-center gap-[12px] [border-width:0px_0px_1px_0px] [border-style:solid] [border-color:var(--border)] p-[4px_0px]"
                                >
                                    <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{v}</div>
                                    <div className="flex-1 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">{k}</div>
                                </div>
                            ))}
                            <div className="flex w-full shrink-0 flex-col items-end gap-[8px]">
                                <Link
                                    href={`/orders/${o.id}/items/${i.id}`}
                                    className="flex h-[40px] w-[120px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary)] p-[0px_12px] text-left text-[14px] leading-[normal] font-[600] whitespace-nowrap text-white"
                                >
                                    عرض البند
                                </Link>
                                {can.items && o.status === 'DESIGN_STAGE' && i.status !== 'CANCELLED' && (
                                    <button
                                        type="button"
                                        onClick={() => setCancelItem(i)}
                                        className="flex h-[40px] w-[120px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--danger-soft)] px-[12px] text-left text-[14px] leading-[22px] font-[600] text-[var(--danger-text)] [outline:1px_solid_#FECACA] transition-colors hover:bg-[#FEE2E2] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                    >
                                        إلغاء البند
                                    </button>
                                )}
                                {i.status !== 'CANCELLED' && (
                                    <div className="flex w-full shrink-0 gap-[8px]">
                                        <Link href={`/orders/${o.id}/items/${i.id}?tab=versions`} className={sub36}>
                                            تاريخ التصميم
                                        </Link>
                                        {can.assign && open && (
                                            <button type="button" onClick={() => setAssigning(i)} className={sub36}>
                                                تغيير المصمم
                                            </button>
                                        )}
                                        {can.items && open && (
                                            <button type="button" onClick={() => setEditing(i)} className={sub36}>
                                                تعديل البند
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

function Payments({ p, onPay }: { p: Props; onPay: () => void }) {
    const o = p.order;
    const th = 'text-right text-[13px] leading-[21px] font-[600] text-[#475569]';
    return (
        <>
            <div className="w-full text-right text-[19px] leading-[30px] font-[700] text-[var(--ink)]">ملخص المدفوعات</div>
            <div className="flex w-full shrink-0 items-center gap-[12px]">
                {[
                    ['الإجمالي النهائي', formatMoney(o.grand_total_minor ?? 0), 'var(--ink)'],
                    ['المدفوع', formatMoney(o.paid_minor ?? 0), '#15803D'],
                    ['المتبقي', formatMoney(o.remaining_minor ?? 0), '#B45309'],
                ].map(([k, v, c]) => (
                    <div key={k} className={`${panel} flex-1 gap-[5px] p-[14px]`}>
                        <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{k}</div>
                        <div className="w-full text-right text-[20px] leading-[32px] font-[700]" style={{ color: c }}>
                            {v}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                {p.can.pay && (
                    <button type="button" onClick={onPay} className={primary34}>
                        تسجيل دفعة
                    </button>
                )}
                <div className="flex-1 text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">سجل المدفوعات</div>
            </div>
            <div className={panel}>
                <div className="flex h-[47.5px] w-full shrink-0 items-center gap-[12px] bg-[#F1F5F9] p-[0px_16px]">
                    <div className={`${th} w-[220px] shrink-0`}>الإجراءات</div>
                    <div className={`${th} w-[90px] shrink-0`}>الحالة</div>
                    <div className={`${th} w-[140px] shrink-0`}>طريقة الدفع</div>
                    <div className={`${th} w-[130px] shrink-0`}>المبلغ</div>
                    <div className={`${th} w-[210px] shrink-0`}>التاريخ</div>
                    <div className={`${th} flex-1`}>رقم الدفعة</div>
                </div>
                {p.payments.length === 0 && (
                    <div className="w-full p-[24px] text-center text-[13px] leading-[21px] text-[var(--muted-foreground)]">
                        لا توجد مدفوعات مسجلة لهذا الأوردر.
                    </div>
                )}
                {p.payments.map((x) => (
                    <div key={x.id} className="flex h-[67.5px] w-full shrink-0 items-center gap-[12px] p-[0px_16px]">
                        <div className="flex w-[220px] shrink-0 items-center gap-[4px]">
                            <div className={`${btn34} w-[92px]`}>عرض الإيصال</div>
                            <div className={`${btn34} w-[92px]`}>عرض التفاصيل</div>
                        </div>
                        <div className="w-[90px] shrink-0">
                            <StatusPill tone="green" w={90}>
                                {x.status}
                            </StatusPill>
                        </div>
                        <div className="w-[140px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--ink)]">{x.method}</div>
                        <div className="w-[130px] shrink-0 text-right text-[13px] leading-[21px] font-[700] text-[var(--ink)]">
                            {formatMoney(x.amount_minor)}
                        </div>
                        <div className="w-[210px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                            {dt(x.at)}
                        </div>
                        <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{x.number}</div>
                    </div>
                ))}
            </div>
        </>
    );
}

function Delivery({ p }: { p: Props }) {
    const o = p.order;
    return (
        <>
            <div className="w-full text-right text-[19px] leading-[30px] font-[700] text-[var(--ink)]">تفاصيل التسليم</div>
            <div className={`${panel} gap-[14px] p-[18px]`}>
                <Line k="طريقة التسليم" v={deliveryLabel(o.delivery_method)} h={36.5} pad="8px 0px" />
                {o.delivery_method === 'DELIVERY' && <Line k="عنوان التوصيل" v={o.delivery_address} h={36.5} pad="8px 0px" />}
                {o.delivery_method === 'DELIVERY' && <Line k="رسوم التوصيل" v={formatMoney(o.delivery_fee_minor ?? 0)} h={36.5} pad="8px 0px" />}
                <Line k="مدة الطباعة المتوقعة" v={eta(o.eta_days)} h={36.5} pad="8px 0px" />
                <Line k="حالة التنفيذ" v={o.status_label} h={36.5} pad="8px 0px" />
            </div>
            <div className={`${panel} gap-[10px] p-[18px]`}>
                <div className="w-full text-right text-[16px] leading-[26px] font-[700] text-[var(--ink)]">الحالة الحالية</div>
                <StatusPill tone="amber">{o.status_label}</StatusPill>
                <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{waitText(o.status)}</div>
                <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                    {p.can.update && (
                        <Link href={`/orders/${o.id}/edit`} className={btn34}>
                            تحديث بيانات التسليم
                        </Link>
                    )}
                </div>
            </div>
            <div className={panel}>
                <div className="w-full text-right text-[16px] leading-[26px] font-[700] text-[var(--ink)]">سجل تحديثات التسليم</div>
                {p.delivery_log.map((l, i) => (
                    <div
                        key={i}
                        className="flex h-[42.5px] w-full shrink-0 items-center gap-[12px] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:var(--border)] p-[12px_14px]"
                    >
                        <div className="w-[140px] shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--ink)]">{l.by}</div>
                        <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{l.text}</div>
                        <div className="w-[160px] shrink-0 text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">
                            {dShort(l.at)}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

function Files({ p }: { p: Props }) {
    return (
        <>
            <div className="w-full text-right text-[19px] leading-[30px] font-[700] text-[var(--ink)]">ملفات الأوردر</div>
            {p.files.map((g) => (
                <div key={g.label} className={panel}>
                    <div className="flex w-full shrink-0 items-center gap-[12px] bg-[#F8FAFC] p-[12px_14px]">
                        <div className="flex-1 text-right text-[15px] leading-[24px] font-[700] text-[var(--ink)]">{g.label}</div>
                    </div>
                    {g.rows.map((r, i) => (
                        <div
                            key={i}
                            className="flex h-[75.5px] w-full shrink-0 items-center gap-[12px] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:var(--border)] p-[8px_16px]"
                        >
                            <div className="flex w-[180px] shrink-0 items-center gap-[6px]">
                                <div className={btn34}>تنزيل</div>
                                <div className={btn34}>معاينة</div>
                            </div>
                            <div className="w-[160px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                                {r.source}
                                {r.by && (
                                    <>
                                        <br />
                                        {r.by}
                                    </>
                                )}
                            </div>
                            <div className="w-[180px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                                {dShort(r.at)}
                            </div>
                            <div className="w-[90px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--ink)]">{r.item}</div>
                            <div className="w-[60px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                                {r.type}
                            </div>
                            <div className="flex-1 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{r.name}</div>
                        </div>
                    ))}
                </div>
            ))}
            <div className={`${panel} gap-[10px] p-[16px]`}>
                <div className="w-full text-right text-[16px] leading-[26px] font-[400] text-[var(--ink)]">ملفات التشغيل الداخلية</div>
                <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                    لا توجد ملفات تشغيل مرفوعة حتى الآن.
                </div>
            </div>
        </>
    );
}

function Activity({ p }: { p: Props }) {
    const th = 'text-right text-[13px] leading-[21px] font-[600] text-[#475569]';
    return (
        <>
            <div className="w-full text-right text-[19px] leading-[30px] font-[700] text-[var(--ink)]">سجل نشاط الأوردر</div>
            <div className={panel}>
                <div className="flex h-[47.5px] w-full shrink-0 items-center gap-[12px] bg-[#F1F5F9] p-[0px_16px]">
                    <div className={`${th} flex-1`}>التفاصيل</div>
                    <div className={`${th} w-[190px] shrink-0`}>الإجراء</div>
                    <div className={`${th} w-[180px] shrink-0`}>الموظف أو المستخدم</div>
                    <div className={`${th} w-[210px] shrink-0`}>التاريخ والوقت</div>
                </div>
                {p.activity.map((r) => (
                    <div
                        key={r.id}
                        className="flex h-[67.5px] w-full shrink-0 items-center gap-[12px] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:var(--border)] p-[0px_16px]"
                    >
                        <div className="flex-1 text-right text-[13px] leading-[21px] font-[400] text-[var(--ink)]">{r.details || r.action}</div>
                        <div className="w-[190px] shrink-0 text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{r.action}</div>
                        <div className="w-[180px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--ink)]">{r.actor}</div>
                        <div className="w-[210px] shrink-0 text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                            {dt(r.at)}
                        </div>
                    </div>
                ))}
            </div>
            <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">سجل نشاط الأوردر للقراءة فقط</div>
        </>
    );
}

/** S-012 (6 تبويبات) + S-013 البنود — pendev: Mo2G0 / O2atww / knyLb / XyDHA / rsbuP / OkEyj */
export default function OrderShow(props: Props) {
    const { order: o, tab, can } = props;
    const [cancelOpen, setCancelOpen] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    return (
        <AppLayout active="/orders">
            <Head title={`تفاصيل الأوردر ${o.number}`} />
            <div className="flex w-full shrink-0 flex-col" style={{ gap: 18 }}>
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'الأوردرات', href: '/orders' }, o.number]} />
                <div className="flex w-full shrink-0 justify-between gap-[12px]">
                    <div className="flex w-fit shrink-0 items-center gap-[12px]">
                        <div className="flex w-fit shrink-0 items-center gap-[8px]">
                            <DropdownMenu>
                                <DropdownMenuTrigger className={btn40}>المزيد</DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-52 p-2">
                                    <DropdownMenuItem asChild className="h-11 px-3">
                                        <Link href={`/orders/${o.id}/job-ticket`}>بطاقة تشغيل الطباعة</Link>
                                    </DropdownMenuItem>
                                    {can.links && (
                                        <DropdownMenuItem asChild className="h-11 px-3">
                                            <Link href={`/orders/${o.id}/link`}>إدارة رابط الأوردر</Link>
                                        </DropdownMenuItem>
                                    )}
                                    {can.next && (
                                        <DropdownMenuItem
                                            className="h-11 px-3 font-[700] text-[var(--primary)]"
                                            onSelect={() =>
                                                router.post(
                                                    `/orders/${o.id}/${can.next!.step}`,
                                                    {},
                                                    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
                                                )
                                            }
                                        >
                                            {can.next.label}
                                        </DropdownMenuItem>
                                    )}
                                    {can.cancel && (
                                        <DropdownMenuItem className="h-11 px-3 text-[var(--danger-text)]" onSelect={() => setCancelOpen(true)}>
                                            إلغاء الأوردر
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {can.update && (
                                <Link
                                    href={`/orders/${o.id}/edit`}
                                    className="flex h-[40px] w-fit shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary)] p-[0px_12px] text-left text-[14px] leading-[normal] font-[600] whitespace-nowrap text-white [outline:1px_solid_var(--primary)] [outline-offset:-0.5px]"
                                >
                                    تعديل الأوردر
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">تفاصيل الأوردر</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">
                            {o.number} • {o.customer.name}
                        </div>
                        <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">
                            تم الإنشاء {dt(o.created_at)} • آخر تحديث {dt(o.updated_at)}
                        </div>
                    </div>
                    <div className="flex w-fit shrink-0 flex-col items-end gap-[8px]">
                        <StatusPill tone="amber">{o.status_label}</StatusPill>
                        <div className="w-[130px] text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">
                            {o.customer.phone_display}
                        </div>
                    </div>
                </div>
                <Tabs order={o} tab={tab} />
                {tab === 'overview' && <Overview p={props} />}
                {tab === 'items' && <Items p={props} />}
                {tab === 'payments' && <Payments p={props} onPay={() => setPayOpen(true)} />}
                {tab === 'delivery' && <Delivery p={props} />}
                {tab === 'files' && <Files p={props} />}
                {tab === 'activity' && <Activity p={props} />}
            </div>
            {payOpen && (
                <PaymentDialog
                    onClose={() => setPayOpen(false)}
                    customerId={o.customer.id}
                    order={{ id: o.id, number: o.number, remaining_minor: o.remaining_minor ?? 0 }}
                />
            )}
            {can.cancel && <CancelOrderDialog open={cancelOpen} onOpenChange={setCancelOpen} order={o} reasons={props.reasons} />}
        </AppLayout>
    );
}
