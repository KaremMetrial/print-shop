import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { FileX, Lock, RefreshCw } from 'lucide-react';

/** Loading skeleton V3: border، radius 10، p16، خطوط 12px #F1F5F9 */
export function LoadingSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
    const widths = ['w-56', 'w-40', 'w-48'];
    return (
        <div className={cn('border-border bg-surface flex flex-col gap-4 rounded-control border p-4', className)} aria-busy="true" aria-label="جارٍ التحميل">
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className={cn('bg-surface-subtle h-3 animate-pulse rounded-[4px]', widths[i % 3])} />
            ))}
        </div>
    );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
    return (
        <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-xl border p-10 text-center">
            <FileX className="text-muted-foreground size-8" aria-hidden />
            <span className="text-ink text-base font-semibold">{title}</span>
            {hint && <span className="text-muted-foreground text-sm">{hint}</span>}
            {action}
        </div>
    );
}

export function ErrorState({ message = 'تعذر تحميل البيانات.', onRetry }: { message?: string; onRetry?: () => void }) {
    return (
        <div className="flex flex-col gap-3">
            <Alert tone="danger" title="حدث خطأ">
                {message}
            </Alert>
            {onRetry && (
                <Button variant="secondary" onClick={onRetry} className="self-start">
                    <RefreshCw /> إعادة المحاولة
                </Button>
            )}
        </div>
    );
}

export function ForbiddenState() {
    return (
        <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-xl border p-10 text-center">
            <Lock className="text-muted-foreground size-8" aria-hidden />
            <span className="text-ink text-base font-semibold">ليس لديك صلاحية للوصول</span>
            <span className="text-muted-foreground text-sm">تواصل مع مسؤول النظام إذا كنت تحتاج هذه الصفحة.</span>
        </div>
    );
}

export function StaleBanner({ onRefresh }: { onRefresh: () => void }) {
    return (
        <Alert tone="warning" title="تغيّرت البيانات منذ فتح الصفحة">
            حدّث الصفحة قبل تنفيذ أي إجراء حساس.{' '}
            <button type="button" onClick={onRefresh} className="font-bold underline">
                تحديث الآن
            </button>
        </Alert>
    );
}
