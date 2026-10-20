import { Link } from '@inertiajs/react';

export interface PageTab {
    key: string;
    label: string;
    href?: string;
}

/**
 * شريط التبويبات الموحّد لكل الشاشات (ملف العميل/المنتج/الأوردر/البند/المصمم/القوائم).
 * الترتيب = ترتيب العرض كما في الـpen (DOM LTR). تبويب نشط: خلفية #EFF6FF + حد سفلي 2px بلون primary.
 * مع href يعمل كرابط (Inertia)، وبدونه كزر يستدعي onChange.
 */
export function PageTabs({
    tabs,
    value,
    onChange,
    label = 'أقسام الصفحة',
}: {
    tabs: PageTab[];
    value: string;
    onChange?: (k: string) => void;
    label?: string;
}) {
    return (
        <nav aria-label={label} className="flex h-[43.5px] w-full shrink-0 items-center gap-[2px] [border-bottom:1px_solid_var(--border)]">
            {tabs.map((t) => {
                const on = t.key === value;
                const cls = `flex flex-1 shrink-0 items-center justify-center p-[10px_14px] text-center text-[12px] leading-[19px] whitespace-nowrap ${on ? 'h-[43px] bg-[var(--primary-soft)] font-[700] text-[var(--primary)] [border-bottom:2px_solid_var(--primary)]' : 'h-[43px] bg-[var(--surface)] font-[500] text-[var(--muted-foreground)]'}`;
                return t.href ? (
                    <Link key={t.key} href={t.href} preserveScroll aria-current={on ? 'page' : undefined} className={cls}>
                        {t.label}
                    </Link>
                ) : (
                    <button key={t.key} type="button" onClick={() => onChange?.(t.key)} aria-current={on ? 'page' : undefined} className={cls}>
                        {t.label}
                    </button>
                );
            })}
        </nav>
    );
}
