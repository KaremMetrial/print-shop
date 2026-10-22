import { Icon } from '@/pen/icon';
import { Link } from '@inertiajs/react';
import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

/** عناصر نماذج الـpen (V2 Fields): label 13/600 lh20، Input Control h46 radius10 bg background outline control-border p0×14 gap12. */
const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ');
const ctrl =
    'flex h-[46px] w-full shrink-0 items-center justify-between gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]';
const valueCls =
    'min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[21px] font-[400] text-[var(--ink)] outline-hidden placeholder:text-[var(--muted-foreground)]';

export function PenField({
    label,
    error,
    hint,
    children,
    className,
    v3,
    htmlFor,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
    v3?: boolean;
    htmlFor?: string;
}) {
    return (
        <div className={cx('flex shrink-0 flex-col gap-[6px]', className ?? 'w-full')}>
            <label
                htmlFor={htmlFor}
                className={cx(
                    'w-full text-right text-[13px] font-[600]',
                    v3 ? 'leading-[21px] text-[#334155]' : 'leading-[20px] text-[var(--text-secondary)]',
                )}
            >
                {label}
            </label>
            {children}
            {error ? (
                <div className="w-full text-right text-[12px] leading-[19px] text-[var(--danger)]">{error}</div>
            ) : hint ? (
                <div
                    className={cx(
                        'w-full text-right font-[400] text-[var(--muted-foreground)]',
                        v3 ? 'text-[11px] leading-[18px]' : 'text-[12px] leading-[19px]',
                    )}
                >
                    {hint}
                </div>
            ) : null}
        </div>
    );
}

type InProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    hint?: string;
    wrapperClassName?: string;
    leadingIcon?: string;
    ltr?: boolean;
    v3?: boolean;
};
export const PenInput = forwardRef<HTMLInputElement, InProps>(
    ({ label, error, hint, wrapperClassName, leadingIcon, ltr, type, v3, ...rest }, ref) => {
        const [show, setShow] = useState(false);
        const isPw = type === 'password';
        const uid = useId();
        const id = rest.id ?? uid;
        return (
            <PenField label={label} error={error} hint={hint} className={wrapperClassName} v3={v3} htmlFor={id}>
                <div className={cx(ctrl, error && '[outline:1px_solid_var(--danger)]')}>
                    {isPw ? (
                        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'إخفاء' : 'إظهار'} className="shrink-0">
                            <Icon name={show ? 'eye-off' : 'eye'} className="h-[16px] w-[16px]" color="var(--muted-foreground)" />
                        </button>
                    ) : leadingIcon ? (
                        <Icon name={leadingIcon} className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
                    ) : null}
                    <input
                        ref={ref}
                        dir={ltr ? 'ltr' : 'rtl'}
                        type={isPw && show ? 'text' : type}
                        aria-invalid={!!error}
                        {...rest}
                        id={id}
                        className={cx(valueCls, v3 && 'leading-[22px]', ltr && 'text-left')}
                    />
                </div>
            </PenField>
        );
    },
);
PenInput.displayName = 'PenInput';

interface Opt {
    value: string;
    label: string;
}
type DropProps = {
    label: string;
    error?: string;
    hint?: string;
    options: Opt[];
    placeholder?: string;
    wrapperClassName?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    v3?: boolean;
} & (
    | { multiple?: false; value: string; onValueChange: (v: string) => void }
    | { multiple: true; value: string[]; onValueChange: (v: string[]) => void }
);

/** V2 / Dropdown Menu + Multi Select: trigger = Input Control، القائمة radius10 + ظل + outline، الخيار h42 (المحدد primary-soft + check). */
export function PenSelect(props: DropProps) {
    const { label, error, hint, options, placeholder, wrapperClassName, disabled, v3 } = props;
    const [open, setOpen] = useState(false);
    const [hover, setHover] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const hasEmptyOption = options.some((o) => o.value === '');
    const selected = props.multiple
        ? (props.value ?? [])
        : props.value !== undefined && props.value !== null && props.value !== ''
            ? [props.value]
            : hasEmptyOption
                ? ['']
                : [];
    useEffect(() => {
        const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);
    const pick = (v: string) => {
        if (props.multiple) props.onValueChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
        else {
            props.onValueChange(v);
            setOpen(false);
        }
    };
    const text = selected
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter(Boolean)
        .join('، ');
    return (
        <PenField label={label} error={error} hint={hint} className={wrapperClassName} v3={v3}>
            <div ref={ref} className="relative w-full">
                <button
                    type="button"
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                    onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                    className={cx(ctrl, 'disabled:opacity-55', error && '[outline:1px_solid_var(--danger)]')}
                >
                    <Icon name="chevron-down" className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
                    <span
                        className={cx(
                            'flex-1 truncate text-right text-[14px] font-[400]',
                            v3 ? 'leading-[22px]' : 'leading-[21px]',
                            text ? 'text-[var(--ink)]' : 'text-[var(--muted-foreground)]',
                        )}
                    >
                        {text || placeholder}
                    </span>
                </button>
                {open && (
                    <div
                        role="listbox"
                        aria-multiselectable={props.multiple}
                        className="absolute start-0 top-[50px] z-30 flex w-full flex-col overflow-hidden rounded-[10px] bg-[var(--surface)] [box-shadow:0px_4px_12px_#0F172A16] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]"
                    >
                        {options.map((o) => {
                            const on = selected.includes(o.value);
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    role="option"
                                    aria-selected={on}
                                    onMouseEnter={() => setHover(o.value)}
                                    onMouseLeave={() => setHover(null)}
                                    onClick={() => pick(o.value)}
                                    className={cx(
                                        'flex h-[42px] w-full shrink-0 items-center justify-between p-[0px_14px]',
                                        on ? 'bg-[var(--primary-soft)]' : hover === o.value ? 'bg-[var(--surface-subtle)]' : 'bg-[var(--surface)]',
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
            {props.name && !props.multiple && <input type="hidden" name={props.name} value={props.value} />}
        </PenField>
    );
}

/** قسم نموذج: بطاقة (radius 12، outline، p20، gap14) بعنوان 18/700 */
export function PenSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex w-full shrink-0 flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
            <div className="w-full text-right text-[18px] leading-[normal] font-[700] text-[var(--ink)]">{title}</div>
            {children}
        </div>
    );
}

export const penNote = 'w-full text-right text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]';

/** أزرار 44px (S-065…): radius 10، outline control-border، padding 0×14/16، نص 14/600 */
export function Pen44({
    href,
    children,
    onClick,
    type = 'button',
    variant = 'secondary',
    disabled,
    px = 14,
}: {
    href?: string;
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'small' | 'smallDanger';
    disabled?: boolean;
    px?: number;
}) {
    const base = {
        primary: 'h-[44px] rounded-[10px] bg-[var(--primary)]',
        secondary: 'h-[44px] rounded-[10px] bg-[var(--surface)]',
        small: 'h-[40px] rounded-[9px] bg-[var(--surface)]',
        smallDanger: 'h-[40px] rounded-[9px] bg-[var(--danger-soft)]',
    }[variant];
    const outline = variant === 'smallDanger' ? '[outline:1px_solid_#FECACA]' : '[outline:1px_solid_var(--control-border)]';
    const text =
        variant === 'primary'
            ? 'text-[14px] text-[var(--surface)]'
            : variant === 'small'
              ? 'text-[12px] text-[#334155]'
              : variant === 'smallDanger'
                ? 'text-[12px] text-[var(--danger-text)]'
                : 'text-[14px] text-[#334155]';
    const hover =
        variant === 'primary'
            ? 'hover:bg-[var(--primary-hover)]'
            : variant === 'smallDanger'
              ? 'hover:bg-[#FEE2E2]'
              : 'hover:bg-[var(--surface-subtle)]';
    const cls = cx('flex w-fit shrink-0 cursor-pointer items-center justify-center transition-colors [outline-offset:-0.5px] disabled:cursor-not-allowed disabled:opacity-60', base, outline, hover);
    const style = { padding: `0px ${variant === 'small' || variant === 'smallDanger' ? 12 : px}px` };
    const label = <span className={cx('text-left leading-[normal] font-[600] whitespace-nowrap', text)}>{children}</span>;
    return href ? (
        <Link href={href} className={cls} style={style}>
            {label}
        </Link>
    ) : (
        <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
            {label}
        </button>
    );
}

/** مفتاح الحالة (PBMS Toggle Switch): track 40×24 radius 12، thumb 18 */
export function PenSwitch({
    checked,
    onChange,
    label,
    disabled,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className="flex h-[32px] w-[100px] shrink-0 items-center gap-[8px] disabled:opacity-55"
        >
            <span className="text-left text-[12px] leading-[normal] font-[600] whitespace-nowrap text-[var(--ink)]">{label}</span>
            <span
                className={cx('relative h-[24px] w-[40px] shrink-0 rounded-[12px]', checked ? 'bg-[var(--primary)]' : 'bg-[var(--control-border)]')}
            >
                <span className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all" style={{ left: checked ? 20 : 2 }} />
            </span>
        </button>
    );
}

/** V2/V3 Textarea: h100، radius 10، padding 14 */
export const PenTextarea = forwardRef<
    HTMLTextAreaElement,
    { label: string; error?: string; hint?: string; v3?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ label, error, hint, v3, ...rest }, ref) => {
    const uid = useId();
    const id = rest.id ?? uid;
    return (
        <PenField label={label} error={error} hint={hint} v3={v3} htmlFor={id}>
            <textarea
                ref={ref}
                dir="rtl"
                {...rest}
                id={id}
                className="h-[100px] w-full shrink-0 resize-none rounded-[10px] bg-[var(--background)] p-[14px] text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)] outline-hidden [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] placeholder:text-[var(--muted-foreground)] focus:[outline:2px_solid_var(--primary)]"
            />
        </PenField>
    );
});
PenTextarea.displayName = 'PenTextarea';
