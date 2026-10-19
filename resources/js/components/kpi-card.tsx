import { cn } from '@/lib/utils';

/** KPI / Revenue: border، radius 12، p24، gap8؛ القيمة Goldman 36 */
export function KpiCard({ label, value, hint, tone = 'muted', className }: { label: string; value: React.ReactNode; hint?: string; tone?: 'muted' | 'success' | 'danger'; className?: string }) {
    return (
        <div className={cn('bg-surface border-border flex flex-col gap-2 rounded-xl border p-6', className)}>
            <span className="text-muted-foreground text-xs">{label}</span>
            <span className="text-ink font-[Goldman] text-4xl leading-none">
                {value}
            </span>
            {hint && <span className={cn('text-[13px]', tone === 'success' ? 'text-[#15803D]' : tone === 'danger' ? 'text-danger-text' : 'text-muted-foreground')}>{hint}</span>}
        </div>
    );
}
