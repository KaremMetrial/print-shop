import { MobileCards } from '@/components/pen/lists';
import { Icon } from '@/pen/icon';
import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * عناصر الـpen الأساسية — قيم حرفية من التصدير (html-css). الـDOM LTR-literal: ترتيب الأبناء كما في التصميم.
 */
const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ');

const btnBase = 'flex h-[46px] w-fit shrink-0 items-center justify-center rounded-[10px] p-[0px_16px] disabled:opacity-60';
const lblBase = 'text-left text-[14px] leading-[normal] font-[600] whitespace-nowrap';

/** Button / Primary — V3 */
export function PenButton({
    href,
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    disabled,
    className,
}: {
    href?: string;
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    className?: string;
}) {
    const style =
        variant === 'primary'
            ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
            : variant === 'danger'
              ? 'bg-[var(--danger-soft)] [outline:1px_solid_#FECACA] [outline-offset:-0.5px]'
              : 'bg-[var(--surface)] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] hover:bg-[var(--surface-subtle)]';
    const color = variant === 'primary' ? 'text-[var(--surface)]' : variant === 'danger' ? 'text-[var(--danger-text)]' : 'text-[var(--ink)]';
    const inner = <span className={cx(lblBase, color)}>{children}</span>;
    return href ? (
        <Link href={href} className={cx(btnBase, style, className)}>
            {inner}
        </Link>
    ) : (
        <button type={type} onClick={onClick} disabled={disabled} className={cx(btnBase, style, className)}>
            {inner}
        </button>
    );
}

/** Table action / عرض الطلب: h32، radius 8، padding 0×10، outline، نص 12/600 */
export function PenRowAction({ href, children, onClick }: { href?: string; children: ReactNode; onClick?: () => void }) {
    const c =
        'flex h-[32px] w-fit shrink-0 items-center justify-center gap-[6px] rounded-[8px] bg-[var(--surface)] p-[0px_10px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] hover:bg-[var(--surface-subtle)]';
    const l = <span className="text-left text-[12px] leading-[19px] font-[600] whitespace-nowrap text-[var(--ink)]">{children}</span>;
    return href ? (
        <Link href={href} className={c}>
            {l}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={c}>
            {l}
        </button>
    );
}

export type StatusTone = 'info' | 'design' | 'warn' | 'ok' | 'danger' | 'neutral';
const statusTone: Record<StatusTone, [string, string]> = {
    info: ['var(--primary-soft)', 'var(--primary-hover)'],
    design: ['#F5F3FF', '#6D28D9'],
    warn: ['var(--warning-soft)', 'var(--warning-text)'],
    ok: ['var(--success-soft)', 'var(--success-text)'],
    danger: ['var(--danger-soft)', 'var(--danger-text)'],
    neutral: ['var(--surface-subtle)', 'var(--text-secondary)'],
};
/** Status / … : radius 8، padding 3×10، نص 12/600 */
export function PenStatus({ tone, children }: { tone: StatusTone; children: ReactNode }) {
    const [bg, fg] = statusTone[tone];
    return (
        <span className="flex w-fit shrink-0 rounded-[8px] p-[3px_10px]" style={{ background: bg }}>
            <span className="text-left text-[12px] leading-[19px] font-[600] whitespace-nowrap" style={{ color: fg }}>
                {children}
            </span>
        </span>
    );
}

/** KPI card (S-007): border، radius 12، padding 16، gap 4 */
export function PenKpi({
    label,
    value,
    hint,
    href,
    big = true,
    className,
}: {
    label: string;
    value: ReactNode;
    hint: string;
    href?: string;
    big?: boolean;
    className?: string;
}) {
    const body = (
        <>
            <div
                className={cx(
                    'w-full text-right font-[400] text-[var(--muted-foreground)]',
                    big ? 'text-[13px] leading-[21px]' : 'text-[13px] leading-[21px]',
                )}
            >
                {label}
            </div>
            <div className={cx('w-full text-right font-[700] text-[var(--ink)]', big ? 'text-[28px] leading-[39px]' : 'text-[20px] leading-[32px]')}>
                {value}
            </div>
            <div
                className={cx(
                    'w-full text-right font-[400] text-[var(--primary)]',
                    big ? 'text-[12px] leading-[19px]' : 'text-[11px] leading-[18px]',
                )}
            >
                {hint}
            </div>
        </>
    );
    const base = big
        ? 'flex shrink-0 flex-col gap-[4px] rounded-[12px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]'
        : 'flex flex-1 shrink-0 flex-col gap-[4px] bg-transparent';
    return href ? (
        <Link href={href} className={cx(base, 'hover:bg-[var(--background)]', className)}>
            {body}
        </Link>
    ) : (
        <div className={cx(base, className)}>{body}</div>
    );
}

/** بطاقة بحد: radius 12، outline 1px border */
export function PenCard({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cx(
                'flex w-full shrink-0 flex-col rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]',
                className,
            )}
        >
            {children}
        </div>
    );
}

export const penH2 = 'w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]';
export const penLink = 'text-right text-[12px] leading-[19px] font-[400] whitespace-nowrap text-[var(--primary)]';

export interface PenCol<T> {
    key: string;
    header: string;
    /** عرض ثابت بالبكسل، أو undefined = flex-1. الأعمدة بترتيب الـpen (LTR: الأول أقصى اليسار). */
    width?: number;
    cell: (row: T) => ReactNode;
    /** محاذاة محتوى الخلية (الافتراضي right كما في التصميم) */
    align?: 'right' | 'left';
}

/** جدول الـpen: رأس h43.5 خلفية surface-subtle، صفوف h71.5 بحد سفلي، أعمدة بعروض حرفية. */
export function PenTable<T extends { id: string | number }>({
    cols,
    rows,
    rowHeight = 71.5,
    empty,
}: {
    cols: PenCol<T>[];
    rows: T[];
    rowHeight?: number;
    empty?: ReactNode;
}) {
    const colCls = (c: PenCol<T>) => (c.width ? '' : 'flex-1');
    const colStyle = (c: PenCol<T>) => (c.width ? { width: c.width } : undefined);
    return (
        <>
            <MobileCards cols={cols.map((c) => ({ h: c.header, cell: c.cell }))} rows={rows} empty={empty ?? 'لا توجد بيانات.'} />
            <div className="hidden w-full flex-col md:flex">
                <div className="flex h-[43.5px] w-full items-center gap-[12px] bg-[var(--surface-subtle)] p-[0px_16px] [border-bottom:1px_solid_var(--border)]">
                    {cols.map((c) => (
                        <div
                            key={c.key}
                            style={colStyle(c)}
                            className={cx('shrink-0 text-right text-[12px] leading-[19px] font-[600] text-[var(--text-secondary)]', colCls(c))}
                        >
                            {c.header}
                        </div>
                    ))}
                </div>
                {rows.length === 0 && empty}
                {rows.map((r) => (
                    <div
                        key={r.id}
                        style={{ height: rowHeight }}
                        className="flex w-full items-center gap-[12px] bg-[var(--surface)] p-[0px_16px] [border-bottom:1px_solid_var(--border)] last:border-b-0"
                    >
                        {cols.map((c) => (
                            <div key={c.key} style={colStyle(c)} className={cx('shrink-0', colCls(c), c.align === 'left' && 'flex justify-start')}>
                                {c.cell(r)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
}

export const penCell = 'text-right text-[13px] leading-[21px] font-[400] text-[var(--ink)]';

export type BadgeTone = 'green' | 'amber' | 'gray' | 'blue' | 'red' | 'violet';
const badgeTone: Record<BadgeTone, [string, string]> = {
    green: ['#F0FDF4', '#15803D'],
    amber: ['#FFFBEB', '#92400E'],
    gray: ['#F1F5F9', '#475569'],
    blue: ['#EFF6FF', '#1D4ED8'],
    red: ['#FEF2F2', '#991B1B'],
    violet: ['#F5F3FF', '#6D28D9'],
};
/** Status / … (صغير): radius 8، padding 3×9، نص 11/600 */
export function PenBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
    const [bg, fg] = badgeTone[tone];
    return (
        <span className="flex w-fit shrink-0 items-center gap-[12px] rounded-[8px] p-[3px_9px]" style={{ background: bg }}>
            <span className="text-left text-[11px] leading-[normal] font-[600] whitespace-nowrap" style={{ color: fg }}>
                {children}
            </span>
        </span>
    );
}

/** مسار التنقل النصي أعلى الصفحة: «الرئيسية ‹ العملاء ‹ …» (12/400 lh19) */
export function PenBreadcrumb({ items }: { items: ({ label: string; href?: string } | string)[] }) {
    return (
        <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">
            {items.map((it, i) => {
                const x = typeof it === 'string' ? { label: it } : it;
                return (
                    <span key={i}>
                        {i > 0 && ' ‹ '}
                        {x.href ? (
                            <Link href={x.href} className="hover:text-[var(--ink)]">
                                {x.label}
                            </Link>
                        ) : (
                            x.label
                        )}
                    </span>
                );
            })}
        </div>
    );
}

/** عنوان الصفحة (V3): الإجراءات يسارًا + [عنوان 28/700 lh39 + وصف 14/400 lh22] */
export function PenPageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
    return (
        <div className="flex w-full shrink-0 items-center justify-between gap-[12px]">
            {children && <div className="flex w-fit shrink-0 items-center gap-[12px]">{children}</div>}
            <div className="flex flex-1 flex-col gap-[4px]">
                <h1 className="w-full text-right text-[28px] leading-[39px] font-[700] text-[var(--ink)]">{title}</h1>
                {subtitle && <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">{subtitle}</div>}
            </div>
        </div>
    );
}

/** فلتر منسدل (Action / …: الكل ⌄): h46، radius 10، bg background، outline control-border */
export function PenFilterMenu({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);
    const current = options.find((o) => o.value === value) ?? options[0];
    return (
        <div ref={ref} className="relative w-fit shrink-0">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="flex h-[46px] w-fit shrink-0 items-center justify-between gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]"
            >
                <Icon name="chevron-down" className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
                <span className="text-left text-[14px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">
                    {label}: {current.label}
                </span>
            </button>
            {open && (
                <div
                    role="listbox"
                    className="absolute start-0 top-[50px] z-30 flex min-w-full flex-col overflow-hidden rounded-[10px] bg-[var(--surface)] [box-shadow:0px_4px_12px_#0F172A16] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]"
                >
                    {options.map((o) => {
                        const on = o.value === current.value;
                        return (
                            <button
                                key={o.value}
                                type="button"
                                role="option"
                                aria-selected={on}
                                onClick={() => {
                                    onChange(o.value);
                                    setOpen(false);
                                }}
                                className={cx(
                                    'flex h-[42px] w-full shrink-0 items-center justify-between gap-[12px] p-[0px_14px] hover:bg-[var(--surface-subtle)]',
                                    on && 'bg-[var(--primary-soft)]',
                                )}
                            >
                                {on ? (
                                    <Icon name="check" className="h-[15px] w-[15px]" color="var(--primary)" />
                                ) : (
                                    <span className="h-[15px] w-[15px]" />
                                )}
                                <span
                                    className={cx(
                                        'text-left text-[14px] leading-[normal] whitespace-nowrap',
                                        on ? 'font-[600] text-[var(--primary)]' : 'font-[400] text-[var(--ink)]',
                                    )}
                                >
                                    {o.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/** شريط ترقيم الصفحات (pen: Pagination): [‹ التالي][الصفحة][السابق ›][ملخص] */
export function PenPagination({ page, pages, summary, onPage }: { page: number; pages: number; summary: string; onPage: (p: number) => void }) {
    const b =
        'flex h-[32px] w-fit shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface)] p-[0px_10px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] disabled:cursor-default';
    const l = 'text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]';
    return (
        <div className="flex w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--surface)] p-[12px_16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
            <button type="button" className={b} disabled={page >= pages} onClick={() => onPage(page + 1)}>
                <span className={l}>‹ التالي</span>
            </button>
            <span className={b}>
                <span className={l}>{page}</span>
            </span>
            <button type="button" className={b} disabled={page <= 1} onClick={() => onPage(page - 1)}>
                <span className={l}>السابق ›</span>
            </button>
            <div className="flex-1 text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{summary}</div>
        </div>
    );
}

/** Action (11px): h32، radius 8، outline border، padding 0×10، نص 11/600 — شاشات المنتجات/التسعير */
export function PenAction11({
    href,
    children,
    onClick,
    width,
    disabled,
    type = 'button',
    muted,
}: {
    href?: string;
    children: ReactNode;
    onClick?: () => void;
    width?: number;
    disabled?: boolean;
    type?: 'button' | 'submit';
    muted?: boolean;
}) {
    const cls = cx(
        'flex h-[32px] shrink-0 items-center justify-center gap-[12px] rounded-[8px] p-[0px_10px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] hover:bg-[var(--surface-subtle)] disabled:opacity-50',
        muted ? 'bg-[var(--background)]' : 'bg-[var(--surface)]',
        !width && 'w-fit',
    );
    const lab = (
        <span
            className={cx(
                'text-left text-[11px] leading-[normal] font-[600] whitespace-nowrap',
                muted ? 'text-[var(--muted-foreground)]' : 'text-[var(--ink)]',
            )}
        >
            {children}
        </span>
    );
    const style = width ? { width } : undefined;
    return href ? (
        <Link href={href} className={cls} style={style}>
            {lab}
        </Link>
    ) : (
        <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
            {lab}
        </button>
    );
}

/** شارة حالة ثابتة العرض (Status badge / نشط: h27 radius8) */
export function PenStatusFixed({
    on,
    w = 64,
    onLabel = 'نشط',
    offLabel = 'غير نشط',
}: {
    on: boolean;
    w?: number;
    onLabel?: string;
    offLabel?: string;
}) {
    return (
        <span
            className={cx(
                'flex h-[27px] shrink-0 items-center justify-center rounded-[8px]',
                on ? 'bg-[var(--success-soft)]' : 'bg-[var(--surface-subtle)]',
            )}
            style={{ width: w }}
        >
            <span
                className={cx(
                    'text-left text-[11px] leading-[normal] font-[600] whitespace-nowrap',
                    on ? 'text-[#15803D]' : 'text-[var(--text-secondary)]',
                )}
            >
                {on ? onLabel : offLabel}
            </span>
        </span>
    );
}
