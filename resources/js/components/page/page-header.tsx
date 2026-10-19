import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';

/** مسار التنقل + العنوان + الإجراء الرئيسي — العنصر الأول في كل Page template */
export function PageHeader({ breadcrumbs, title, badge, subtitle, actions, className }: { breadcrumbs?: BreadcrumbItem[]; title: string; badge?: React.ReactNode; subtitle?: string; actions?: React.ReactNode; className?: string }) {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="مسار التنقل" className="text-text-secondary flex flex-wrap items-center gap-1.5 text-[13px]">
                    {breadcrumbs.map((b, i) => (
                        <span key={b.href} className="flex items-center gap-1.5">
                            {i > 0 && <ChevronLeft className="text-muted-foreground size-3.5" aria-hidden />}
                            {i === breadcrumbs.length - 1 ? <span className="text-ink font-semibold">{b.title}</span> : <Link href={b.href} className="hover:text-ink">{b.title}</Link>}
                        </span>
                    ))}
                </nav>
            )}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-ink text-[22px] font-bold">{title}</h1>
                        {badge}
                    </div>
                    {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
        </div>
    );
}
