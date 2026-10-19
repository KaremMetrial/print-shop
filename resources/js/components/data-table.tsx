import { cn } from '@/lib/utils';

export interface Column<T> {
    key: string;
    header: string;
    cell: (row: T) => React.ReactNode;
    className?: string;
}

/** Table / Orders V2: حاوية border+radius12، رأس h44 #F8FAFC، صفوف h56. على الموبايل ستتحول لبطاقات عند الاستخدام الفعلي. */
export function DataTable<T extends { id: string | number }>({ columns, rows, empty = 'لا توجد بيانات.' }: { columns: Column<T>[]; rows: T[]; empty?: string }) {
    return (
        <div className="border-border bg-surface overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-background border-border h-11 border-b">
                        {columns.map((c) => (
                            <th key={c.key} className={cn('text-muted-foreground px-3 text-start text-[13px] font-semibold', c.className)}>
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                                {empty}
                            </td>
                        </tr>
                    )}
                    {rows.map((r) => (
                        <tr key={r.id} className="border-border h-14 border-b last:border-b-0">
                            {columns.map((c) => (
                                <td key={c.key} className={cn('text-ink px-3', c.className)}>
                                    {c.cell(r)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
