import { Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

export interface PageTab {
    key: string;
    label: string;
    href?: string;
}

/**
 * شريط التبويبات الموحّد لكل الشاشات (ملف العميل/المنتج/الأوردر/البند/المصمم/القوائم).
 * ترتيب عناصر tabs يبدأ من اليمين ليتوافق مع اتجاه الواجهة العربية. تبويب نشط: خلفية #EFF6FF + حد سفلي 2px بلون primary.
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
    const nav = useRef<HTMLElement>(null);
    // على الشاشات الضيقة: مرّر التبويب النشط إلى الظهور مع الحفاظ على موضع الصفحة عموديًا.
    useEffect(() => {
        const el = nav.current;
        const on = el?.querySelector('[aria-current="page"]') as HTMLElement | null;
        if (el && on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, [value]);
    return (
        <nav
            ref={nav}
            aria-label={label}
            dir="rtl"
            className="flex h-[43.5px] w-full shrink-0 items-center gap-[2px] overflow-x-auto [border-bottom:1px_solid_var(--border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {tabs.map((t) => {
                const on = t.key === value;
                const cls = `flex min-w-fit flex-1 shrink-0 items-center justify-center p-[10px_14px] text-center text-[12px] leading-[19px] whitespace-nowrap ${on ? 'h-[43px] bg-[var(--primary-soft)] font-[700] text-[var(--primary)] [border-bottom:2px_solid_var(--primary)]' : 'h-[43px] bg-[var(--surface)] font-[500] text-[var(--muted-foreground)]'}`;
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
