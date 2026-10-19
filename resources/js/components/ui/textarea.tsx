import { cn } from '@/lib/utils';
import * as React from 'react';

/** V2 / Textarea: h100، #F8FAFC، stroke control-border، radius 10، padding 14 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...props }, ref) => (
    <textarea
        ref={ref}
        className={cn(
            'rounded-control border-control-border bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[100px] w-full border p-3.5 text-sm outline-hidden focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
        )}
        {...props}
    />
));
Textarea.displayName = 'Textarea';
export { Textarea };
