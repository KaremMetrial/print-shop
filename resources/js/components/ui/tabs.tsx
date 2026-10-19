import { cn } from '@/lib/utils';

export interface TabItem {
    key: string;
    label: string;
}

/** Tabs / Order details: تبويب padding 12×8، 14/600؛ نشط = primary + حد سفلي primary */
export function Tabs({ items, value, onChange, className }: { items: TabItem[]; value: string; onChange: (k: string) => void; className?: string }) {
    return (
        <div role="tablist" className={cn('flex w-full items-center overflow-x-auto', className)}>
            {items.map((t) => {
                const active = t.key === value;
                return (
                    <button
                        key={t.key}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => onChange(t.key)}
                        className={cn(
                            'flex-1 border-b-2 px-2 py-3 text-sm font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                            active ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:text-ink',
                        )}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}
