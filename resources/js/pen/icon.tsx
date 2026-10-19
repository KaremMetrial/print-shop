import { icons } from 'lucide-react';

const toPascal = (s: string) => s.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());

/**
 * أيقونات الـpen = lucide بالاسم نفسه (data-icon-name). حجم/لون من className/color كما في التصميم.
 * التصدير من الـpen يرسم الأيقونة كـfill؛ هنا نستخدم stroke lucide الأصلي بنفس الحجم واللون.
 */
export function Icon({ name, className, color }: { name: string; className?: string; color?: string }) {
    const Cmp = icons[toPascal(name) as keyof typeof icons];
    if (!Cmp) return <span className={className} aria-hidden />;
    // var(--x) غير مسموح كـ attribute في SVG → نمرر اللون عبر style/currentColor.
    return <Cmp className={className} color="currentColor" style={{ color }} aria-hidden />;
}
