import { cn } from '@/lib/utils';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import * as React from 'react';

const tones = {
    success: { box: 'bg-success-soft text-[#15803D]', Icon: CircleCheck },
    warning: { box: 'bg-warning-soft text-warning-text', Icon: TriangleAlert },
    danger: { box: 'bg-danger-soft text-[#B91C1C]', Icon: CircleAlert },
    info: { box: 'bg-primary-soft text-primary-hover', Icon: Info },
} as const;

export type AlertTone = keyof typeof tones;

/** Alert (pen: Alert / …): radius 10، p16، gap12؛ عنوان 15/700 + نص 13؛ أيقونة 20 */
function Alert({ tone = 'info', title, children, className }: { tone?: AlertTone; title: string; children?: React.ReactNode; className?: string }) {
    const { box, Icon } = tones[tone];
    return (
        <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-control p-4', box, className)}>
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="flex flex-1 flex-col gap-1">
                <span className="text-[15px] font-bold">{title}</span>
                {children && <span className="text-[13px]">{children}</span>}
            </div>
        </div>
    );
}

export { Alert };
