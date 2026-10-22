import { PageTabs } from '@/components/pen/page-tabs';
import { PenBreadcrumb } from '@/components/pen/primitives';
import { Icon } from '@/pen/icon';
import { Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';

/** مكوّنات قوائم مشتركة بنفس لغة الـpen (Page template / قائمة): رأس، تبويبات، بحث، جدول. */
export function ListHead({
    crumbs,
    title,
    subtitle,
    actions,
}: {
    crumbs: ({ label: string; href?: string } | string)[];
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <>
            <PenBreadcrumb items={crumbs} />
            <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
                <div className="flex w-fit shrink-0 items-center gap-[8px]">{actions}</div>
                <div className="flex flex-1 flex-col gap-[4px]">
                    <h1 className="w-full text-right text-[28px] leading-[42px] font-[700] text-[var(--ink)]">{title}</h1>
                    {subtitle && <div className="w-full text-right text-[14px] leading-[22px] text-[var(--muted-foreground)]">{subtitle}</div>}
                </div>
            </div>
        </>
    );
}

export function TabsBar({ tabs, value, onChange }: { tabs: [string, string][]; value: string; onChange: (v: string) => void }) {
    return <PageTabs tabs={tabs.map(([key, label]) => ({ key, label }))} value={value} onChange={onChange} />;
}

export function SearchBox({ value, onSubmit, placeholder }: { value: string; onSubmit: (q: string) => void; placeholder: string }) {
    const [q, setQ] = useState(value);
    return (
        <form
            role="search"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(q);
            }}
            className="flex h-[46px] w-full flex-1 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]"
        >
            <Icon name="search" className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
            <input
                dir="rtl"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={placeholder}
                aria-label="بحث"
                className="min-w-0 flex-1 bg-transparent text-right text-[14px] outline-hidden placeholder:text-[var(--muted-foreground)]"
            />
        </form>
    );
}

export interface Col<T> {
    h: string;
    w?: number;
    cell: (r: T) => ReactNode;
}
/** جدول: الأعمدة بترتيب DOM (الأول أقصى اليسار) كما في الـpen. */
export function DataGrid<T extends { id: number | string }>({ cols, rows, empty }: { cols: Col<T>[]; rows: T[]; empty: string }) {
    const template = cols.map((c) => c.w ? `minmax(${c.w}px, ${c.w}fr)` : 'minmax(140px, 1fr)').join(' ');
    const minWidth = cols.reduce((width, col) => width + (col.w ?? 140), 0) + Math.max(0, cols.length - 1) * 10 + 32;
    const tableStyle = { gridTemplateColumns: template, width: `max(100%, ${minWidth}px)` };

    return (
        <>
            <div className="hidden w-full min-w-0 overflow-x-auto rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] md:block">
                <div className="grid h-[44px] items-center gap-[10px] bg-[var(--background)] p-[0px_16px] [border-bottom:1px_solid_var(--border)]" style={tableStyle}>
                    {cols.map((c) => (
                        <div key={c.h} className="min-w-0 text-right text-[12px] leading-[19px] font-[600] text-[#475569]">
                            {c.h}
                        </div>
                    ))}
                </div>
                {rows.length === 0 && <div className="p-[40px] text-center text-[14px] text-[var(--muted-foreground)]" style={tableStyle}>{empty}</div>}
                {rows.map((r) => (
                    <div key={r.id} className="grid min-h-[60px] items-center gap-[10px] p-[8px_16px] [border-bottom:1px_solid_var(--border)] last:border-b-0" style={tableStyle}>
                        {cols.map((c) => (
                            <div key={c.h} className="min-w-0 text-right text-[12px] leading-[19px] text-[var(--ink)]">
                                {c.cell(r)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <MobileCards cols={cols} rows={rows} empty={empty} />
        </>
    );
}

/** عرض الجدول كبطاقات على الموبايل: آخر عمود (المعرّف) عنوانًا، وأعمدة «الإجراء» أزرارًا أسفل البطاقة، والباقي زوج اسم/قيمة. */
export function MobileCards<T extends { id: number | string }>({ cols, rows, empty }: { cols: Col<T>[]; rows: T[]; empty: ReactNode }) {
    const ordered = [...cols].reverse();
    const [title, ...rest] = ordered;
    const isAction = (c: Col<T>) => c.h.includes('إجراء') || c.h.includes('الإجراءات');
    const fields = rest.filter((c) => !isAction(c));
    const actions = rest.filter(isAction);
    return (
        <div className="flex w-full shrink-0 flex-col gap-[10px] md:hidden">
            {rows.length === 0 && (
                <div className="w-full rounded-[12px] bg-[var(--surface)] p-[32px] text-center text-[14px] text-[var(--muted-foreground)] [outline:1px_solid_var(--border)]">
                    {empty}
                </div>
            )}
            {rows.map((r) => (
                <div
                    key={r.id}
                    className="flex w-full flex-col gap-[8px] rounded-[12px] bg-[var(--surface)] p-[14px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]"
                >
                    <div className="w-full text-right text-[15px] leading-[24px] font-[700] text-[var(--ink)]">{title?.cell(r)}</div>
                    {fields.map((c) => (
                        <div key={c.h} className="flex w-full items-center justify-between gap-[12px] text-[13px]">
                            <div className="min-w-0 text-left font-[600] text-[var(--ink)]">{c.cell(r)}</div>
                            <div className="shrink-0 text-right text-[12px] text-[var(--muted-foreground)]">{c.h}</div>
                        </div>
                    ))}
                    {actions.map((c) => (
                        <div key={c.h} className="flex w-full justify-end gap-[8px]">
                            {c.cell(r)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export const RowBtn = ({ href, onClick, children, primary }: { href?: string; onClick?: () => void; children: ReactNode; primary?: boolean }) => {
    const cls = `flex h-[34px] w-fit shrink-0 cursor-pointer items-center rounded-[8px] p-[0px_12px] text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap transition-colors ${primary ? 'bg-[var(--primary)] text-white [outline:1px_solid_var(--primary)] hover:bg-[var(--primary-hover)]' : 'bg-[var(--surface)] text-[var(--primary)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] hover:bg-[var(--surface-subtle)]'}`;
    return href ? (
        <Link href={href} className={cls}>
            {children}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={cls}>
            {children}
        </button>
    );
};

export const Pill = ({ children, bg, fg }: { children: ReactNode; bg: string; fg: string }) => (
    <div
        className="flex h-[26px] w-fit shrink-0 items-center rounded-[13px] p-[0px_9px] text-[11px] font-[700] whitespace-nowrap"
        style={{ background: bg, color: fg }}
    >
        {children}
    </div>
);
