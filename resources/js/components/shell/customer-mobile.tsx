import { Icon } from '@/pen/icon';
import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

const tabs = [
    { key: 'home', label: 'الرئيسية', icon: 'house', href: '/portal' },
    { key: 'orders', label: 'أوردراتي', icon: 'package', href: '/portal/orders' },
    { key: 'requests', label: 'طلباتي', icon: 'clipboard-list', href: '/portal/requests' },
    { key: 'account', label: 'حسابي', icon: 'user-round', href: '/portal/account' },
];

export type MobileTab = 'home' | 'orders' | 'requests' | 'account';

/**
 * هيكل موبايل العميل المسجّل (pendev: إطارات M-A*، 390px): ترويسة 57px + محتوى + تنقل سفلي.
 * شريط حالة الهاتف المرسوم في الإطارات من نظام الجهاز فلا يُرسم هنا.
 * lead: أيقونة اليسار في الترويسة (جرس في الرئيسية، سهم رجوع في الشاشات الداخلية).
 */
export function CustomerMobileShell({ title, lead, leadSide = 'left', tab, children }: { title: string; lead?: ReactNode; leadSide?: 'left' | 'right'; tab?: MobileTab; children: ReactNode }) {
    return (
        <div dir="ltr" className="flex min-h-screen w-full flex-col items-end bg-[#F6F8FC] md:hidden">
            {leadSide === 'left' ? (
                <div className="mb-[-0.5px] flex h-[57.5px] w-full shrink-0 items-center justify-between bg-white p-[0px_16px] [border-bottom:1px_solid_#E2E8F0]">
                    <div className="flex h-[44px] w-[44px] items-center justify-center">{lead}</div>
                    <div className="text-right text-[16px] leading-[normal] font-[700] whitespace-nowrap text-[#0F172A]">{title}</div>
                </div>
            ) : (
                <div className="mb-[-0.5px] flex h-[57.5px] w-full shrink-0 items-center justify-end gap-[12px] bg-white p-[0px_16px] [border-bottom:1px_solid_#E2E8F0]">
                    <div className="flex-1 text-right text-[16px] leading-[normal] font-[700] whitespace-nowrap text-[#0F172A]">{title}</div>
                    <div className="flex h-[44px] w-[44px] items-center justify-center">{lead}</div>
                </div>
            )}
            <div className="flex w-full flex-1 flex-col items-end gap-[16px] p-[20px_16px_24px_16px]">{children}</div>
            {tab && (
                <nav className="sticky bottom-0 mt-[-0.5px] flex h-[75.5px] w-full shrink-0 gap-[2px] bg-white p-[8px_8px_12px_8px] [border-top:1px_solid_#E2E8F0]">
                    {[...tabs].reverse().map((t) => {
                        const on = t.key === tab;
                        return (
                            <Link key={t.key} href={t.href} className="flex h-[48px] flex-1 flex-col items-center justify-start gap-[2px] pt-[0.5px]">
                                <Icon name={t.icon} className="h-[20px] w-[20px]" color={on ? '#2563EB' : '#64748B'} />
                                <span className="text-right text-[11px] leading-[normal] whitespace-nowrap" style={{ color: on ? '#2563EB' : '#64748B', fontWeight: on ? 700 : 500 }}>
                                    {t.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}

export const mCard = 'flex w-full flex-col items-end gap-[10px] rounded-[14px] bg-white p-[16px] [outline:1px_solid_#E2E8F0] [outline-offset:-0.5px]';
export const mH2 = 'w-full text-right text-[18px] leading-[normal] font-[700] text-[#0F172A]';
export const mBtnPrimary = 'flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[#2563EB] text-[15px] leading-[normal] font-[700] text-white [outline:1px_solid_#2563EB] [outline-offset:-0.5px]';
export const mBtnOutline = 'flex h-[48px] w-full items-center justify-center rounded-[10px] bg-white text-[15px] leading-[normal] font-[700] text-[#2563EB] [outline:1px_solid_#CBD5E1] [outline-offset:-0.5px]';

/** عزل الأرقام اللاتينية داخل النص العربي كما في تصدير الـpen (⁦…⁩). */
export const iso = (v: string | number | null | undefined) => `\u2066${v ?? ''}\u2069`;
export const mMoney = (minor: number | null | undefined) => `${iso(((minor ?? 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))} ج.م`;
export const mArrowBack = <Icon name="arrow-right" className="h-[21px] w-[21px]" color="#334155" />;
