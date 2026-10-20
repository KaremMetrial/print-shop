import { PageTabs } from '@/components/pen/page-tabs';
import { PenBadge, PenBreadcrumb, PenRowAction, type BadgeTone } from '@/components/pen/primitives';
import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

export interface CustomerHead {
    id: number;
    code: string;
    name: string;
    phone: string;
    tier: string;
    platform_access: boolean;
    can: { update: boolean; access: boolean; financial: boolean; payments: boolean; refunds: boolean };
}

export const tierTone = (name: string): BadgeTone => (/ذهب/.test(name) ? 'amber' : /فض/.test(name) ? 'gray' : /بلات/.test(name) ? 'violet' : 'blue');

const SUBTITLES: Record<string, string> = {
    overview: 'بيانات العميل ونشاطه وسجلاته المرتبطة.',
    orders: 'أوردرات العميل ومراحلها.',
    financial: 'نظرة مالية على حساب العميل وحركات كشف الحساب.',
    payments: 'سجل مدفوعات العميل.',
    refunds: 'التزامات الاسترداد والمبالغ المردودة.',
    access: 'إدارة دخول العميل إلى منصة العملاء.',
    activity: 'سجل التغييرات والأحداث على ملف العميل.',
};

const TABS: [string, string, string][] = [
    ['activity', 'النشاط', '/activity'],
    ['access', 'دخول المنصة', '/access'],
    ['refunds', 'الاستردادات', '/refunds'],
    ['payments', 'المدفوعات', '/payments'],
    ['financial', 'الملخص المالي', '/financial'],
    ['orders', 'الأوردرات', '/orders'],
    ['overview', 'نظرة عامة', ''],
];

/** رأس ملف العميل + تبويباته (pen: Customer profile header / tabs — S-024…S-032) */
export function CustomerShell({ customer, active, title, subtitle, crumb, children }: { customer: CustomerHead; active: string; title: string; subtitle?: string; crumb: string; children: ReactNode }) {
    const base = `/customers/${customer.id}`;
    const full = true; // رأس موحّد في كل تبويبات ملف العميل (نفس الأزرار والأحجام)
    return (
        <>
            <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, { label: 'العملاء', href: '/customers' }, crumb]} />
            <div className="flex w-full shrink-0 flex-col gap-[4px]">
                <h1 className={`w-full text-right text-[28px] font-[700] text-[var(--ink)] ${full ? 'leading-[39px]' : 'leading-[45px]'}`}>{title}</h1>
                <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">{subtitle ?? SUBTITLES[active]}</div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-[16px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className={`flex w-full shrink-0 items-center gap-[12px] ${full ? 'justify-between' : ''}`}>
                    {full && (
                        <div className="flex w-fit shrink-0 items-center gap-[12px]">
                            <Link href={`/orders/create?customer=${customer.id}`} className="flex h-[46px] w-fit shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary)] p-[0px_16px] hover:bg-[var(--primary-hover)]">
                                <span className="text-left text-[14px] leading-[normal] font-[600] whitespace-nowrap text-[var(--surface)]">إنشاء أوردر</span>
                            </Link>
                            {customer.can.update && <PenRowAction href={`${base}/edit`}>تعديل البيانات</PenRowAction>}
                        </div>
                    )}
                    <div className={`flex flex-1 flex-col ${full ? 'gap-[4px]' : 'gap-[3px]'}`}>
                        <div className={`w-full text-right font-[700] text-[var(--ink)] ${full ? 'text-[24px] leading-[34px]' : 'text-[22px] leading-[35px]'}`}>{customer.name}</div>
                        <div className={`w-full text-right font-[400] text-[var(--muted-foreground)] ${full ? 'text-[13px] leading-[21px]' : 'text-[12px] leading-[19px]'}`}>
                            <bdi dir="ltr">{customer.phone}</bdi> • {full ? 'العميل ' : ''}{customer.code}
                        </div>
                        <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                            <PenBadge tone={tierTone(customer.tier)}>شريحة {customer.tier}</PenBadge>
                            <PenBadge tone={customer.platform_access ? 'green' : 'gray'}>{full ? (customer.platform_access ? 'دخول المنصة مفعّل' : 'دخول المنصة غير مفعّل') : customer.platform_access ? 'المنصة مفعّلة' : 'المنصة غير مفعّلة'}</PenBadge>
                        </div>
                    </div>
                </div>
                <PageTabs label="أقسام ملف العميل" value={active} tabs={TABS.map(([key, label, suffix]) => ({ key, label, href: base + suffix }))} />
            </div>
            {children}
        </>
    );
}
