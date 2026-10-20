import { usePermissions } from '@/hooks/use-permissions';
import { Icon } from '@/pen/icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { adminNav, type ShellNavGroup } from './nav-config';

const roleLine: Record<string, string> = { super_admin: 'حساب إداري', admin: 'حساب إداري', data_entry: 'حساب تشغيل', designer: 'حساب مصمم', accountant: 'حساب محاسبة' };

/** Right sidebar · V3 — 264px، أبيض، حد يسار 1px، padding 20×12، gap 16 (pen: S-007). */
export function StaffSidebar({ onNavigate, nav = adminNav, width = 264, subtitle = 'إدارة أعمال الطباعة', footer }: { onNavigate?: () => void; nav?: ShellNavGroup[]; width?: number; subtitle?: string; footer?: { a: string; b: string } }) {
    const { url } = usePage();
    const { name, auth, branch } = usePage<SharedData & { branch?: string }>().props;
    const { canAny } = usePermissions();
    const path = url.split('?')[0];
    const matches = (href: string) => path === href || path.startsWith(href + '/');
    // عنصر واحد فقط نشط: الأطول تطابقًا (مثلًا /accounting/proofs يغلب /accounting)
    const best = nav.flatMap((g) => g.items).filter((i) => matches(i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
    const active = (href: string) => href === best;

    return (
        <div dir="ltr" style={{ width }} className="flex h-full shrink-0 flex-col gap-[16px] border-solid bg-[var(--surface)] p-[20px_12px] [border-color:var(--border)] [border-width:0px_0px_0px_1px]">
            <div className="flex w-full shrink-0 flex-col gap-[2px] p-[0px_8px]">
                <div className="w-full text-right font-[Goldman] text-[28px] leading-[39px] font-[400] text-[var(--primary)]">PBMS</div>
                <div className="w-full text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">{name}</div>
                <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{subtitle}</div>
            </div>

            <nav aria-label="القائمة الرئيسية" className="flex w-full flex-1 flex-col gap-[4px] overflow-y-auto">
                {nav.map((group) => {
                    const items = group.items.filter((i) => !i.permission || canAny(i.permission));
                    if (!items.length) return null;
                    return (
                        <div key={group.title} className="contents">
                            <div className="w-full text-right text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{group.title}</div>
                            {items.map((item) => {
                                const on = active(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-current={on ? 'page' : undefined}
                                        className={`flex h-[44px] w-full shrink-0 items-center gap-[10px] rounded-[10px] p-[0px_12px] ${on ? 'bg-[var(--primary-soft)]' : 'bg-[var(--surface)] hover:bg-[var(--surface-subtle)]'}`}
                                    >
                                        <div className={`flex-1 text-right text-[14px] leading-[normal] ${on ? 'font-[600] text-[var(--primary)]' : 'font-[500] text-[var(--text-secondary)]'}`}>{item.title}</div>
                                        <Icon name={item.icon} className="h-[20px] w-[20px] shrink-0" color={on ? 'var(--primary)' : 'var(--muted-foreground)'} />
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            <div className="flex w-full shrink-0 flex-col gap-[4px] rounded-[10px] bg-[var(--background)] p-[12px]">
                <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--ink)]">{footer?.a ?? branch ?? ''}</div>
                <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{footer?.b ?? `${roleLine[auth.user?.role ?? ''] ?? 'حساب موظف'} • اتصال آمن`}</div>
            </div>
        </div>
    );
}
