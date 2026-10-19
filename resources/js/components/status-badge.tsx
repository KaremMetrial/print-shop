import { cn } from '@/lib/utils';

export type StatusTone = 'info' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const tones: Record<StatusTone, string> = {
    info: 'bg-primary-soft text-primary-hover',
    primary: 'bg-primary-soft text-primary-hover',
    success: 'bg-success-soft text-success-text',
    warning: 'bg-warning-soft text-warning-text',
    danger: 'bg-danger-soft text-danger-text',
    neutral: 'bg-surface-subtle text-text-secondary',
};

/** Status is always shown as text + color, never color alone (project.md §17.4). */
export function StatusBadge({ tone = 'neutral', dot, children, className }: { tone?: StatusTone; dot?: string; children: React.ReactNode; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-2 rounded-badge px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
            <span className="size-1.5 rounded-full" style={{ background: dot ?? 'currentColor' }} aria-hidden />
            {children}
        </span>
    );
}
