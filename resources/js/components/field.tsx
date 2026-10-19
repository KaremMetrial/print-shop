import { cn } from '@/lib/utils';

/** V2 Field: label 13/600 text-secondary + عنصر + helper/error 12 (gap 6) */
export function Field({ label, required, error, helper, htmlFor, children, className }: { label: string; required?: boolean; error?: string; helper?: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('flex w-full flex-col gap-1.5', className)}>
            <label htmlFor={htmlFor} className="text-text-secondary text-[13px] font-semibold">
                {label}
                {required && <span className="text-danger ms-0.5">*</span>}
            </label>
            {children}
            {error ? <p className="text-danger text-xs">{error}</p> : helper ? <p className="text-muted-foreground text-xs">{helper}</p> : null}
        </div>
    );
}
