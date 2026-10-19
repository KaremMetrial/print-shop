import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

/** V2 / Select: h46، #F8FAFC، stroke control-border، radius 10، سهم 16 */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(({ className, children, ...props }, ref) => (
    <div className="relative w-full">
        <select
            ref={ref}
            className={cn(
                'h-control rounded-control border-control-border bg-background text-ink focus-visible:ring-ring w-full appearance-none border ps-3.5 pe-9 text-sm outline-hidden focus-visible:ring-2 disabled:opacity-50',
                className,
            )}
            {...props}
        >
            {children}
        </select>
        <ChevronDown className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
    </div>
));
NativeSelect.displayName = 'NativeSelect';
export { NativeSelect };
