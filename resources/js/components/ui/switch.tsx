import { cn } from '@/lib/utils';

/** PBMS Toggle Switch: track 40×24 radius 12، thumb 18، تشغيل = primary */
export function Switch({ checked, onCheckedChange, label, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className="inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden disabled:opacity-50"
        >
            {label && <span className="text-ink text-xs font-semibold">{label}</span>}
            <span className={cn('relative h-6 w-10 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-control-border')}>
                <span className={cn('absolute top-[3px] size-[18px] rounded-full bg-white transition-all', checked ? 'end-[3px]' : 'start-[3px]')} />
            </span>
        </button>
    );
}
