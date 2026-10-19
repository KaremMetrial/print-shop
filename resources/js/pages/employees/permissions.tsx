import { Pen44 } from '@/components/pen/form';
import AppLayout from '@/layouts/app-layout';
import { Icon } from '@/pen/icon';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type State = 'role' | 'restricted' | 'granted' | 'available' | 'unavailable';
interface Item {
    code: string;
    label: string;
    state: State;
}
interface Group {
    key: string;
    title: string;
    items: Item[];
}

/** حالة المجموعة (chip) — مستخرجة من حالات صلاحياتها (S-067). */
function chip(items: Item[]): { text: string; warn: boolean } {
    const has = (s: State) => items.some((i) => i.state === s);
    const grant = has('available') || has('granted');
    if (!grant && has('restricted') && !has('role')) return { text: 'مقيدة للدور', warn: true };
    if (grant && has('role')) return { text: 'حسب سلطة المدير', warn: false };
    if (grant && has('restricted')) return { text: 'إضافية/مقيدة', warn: true };
    if (grant) return { text: 'إضافية قابلة للمنح', warn: false };
    if (has('restricted')) return { text: 'ممنوحة/مقيدة', warn: true };
    return { text: 'حسب الدور', warn: false };
}

function Box({ state, on, onToggle, label }: { state: boolean; on?: boolean; onToggle: () => void; label: string }) {
    void state;
    return (
        <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onToggle} className="relative h-[20px] w-[20px] shrink-0 focus-visible:ring-2">
            <span className={`absolute top-[1px] left-[1px] h-[18px] w-[18px] rounded-[4px] [outline:1.5px_solid_#94A3B8] [outline-offset:-0.75px] ${on ? 'bg-[var(--primary)]' : 'bg-[var(--surface)]'}`}>
                {on && <Icon name="check" className="absolute top-[2px] left-[2px] h-[14px] w-[14px]" color="#fff" />}
            </span>
        </button>
    );
}

/** S-067 — إدارة الصلاحيات (pendev: o4kGfo). القيود الثابتة لا تُتجاوز، والخادم يعيد التحقق. */
export default function EmployeePermissions({ employee, groups, granted }: { employee: { id: number; name: string; role_label: string | null; status: string | null }; groups: Group[]; granted: string[] }) {
    const [sel, setSel] = useState<Set<string>>(new Set(granted));
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const all = groups.flatMap((g) => g.items);
    const roleCount = all.filter((i) => i.state === 'role').length;
    const toggle = (c: string) =>
        setSel((p) => {
            const n = new Set(p);
            if (n.has(c)) n.delete(c);
            else n.add(c);
            return n;
        });

    return (
        <AppLayout active="/employees">
            <Head title="إدارة الصلاحيات" />
            <div className="w-full text-right text-[13px] leading-[normal] font-[400] text-[var(--muted-foreground)]">الموظفون ‹ إدارة الصلاحيات</div>

            <div className="flex w-full shrink-0 items-center gap-[12px]">
                <Pen44 px={16} variant="primary" disabled={saving} onClick={() => router.put(`/employees/${employee.id}/permissions`, { grant: [...sel], revoke: [] }, { onStart: () => setSaving(true), onFinish: () => setSaving(false) })}>
                    حفظ التغييرات
                </Pen44>
                <div className="flex flex-1 flex-col gap-[12px]">
                    <h1 className="w-full text-right text-[28px] leading-[normal] font-[700] text-[var(--ink)]">إدارة الصلاحيات</h1>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[var(--text-secondary)]">
                        {employee.name} · {employee.role_label} · حالة الحساب {employee.status === 'ACTIVE' ? 'نشط' : employee.status === 'INACTIVE' ? 'معطّل' : 'غير متاحة'}
                    </div>
                </div>
            </div>

            <div className="flex w-full shrink-0 gap-[12px]">
                {[
                    ['الصلاحيات المقيدة', 'ثوابت الدور', 'var(--warning-soft)', '#FFF7ED'],
                    ['الصلاحيات الإضافية', sel.size ? `${sel.size} صلاحية` : 'لا توجد بيانات محفوظة', '#EFF6FF', '#EFF6FF'],
                    ['الصلاحيات الأساسية', roleCount ? `${roleCount} ممنوحة من الدور` : 'ممنوحة من الدور', '#F0FDF4', '#F0FDF4'],
                ].map(([t, sub, , bg]) => (
                    <div key={t} className="flex flex-1 shrink-0 flex-col gap-[12px] rounded-[10px] p-[14px]" style={{ background: bg }}>
                        <div className="w-full text-right text-[13px] leading-[normal] font-[600] text-[#334155]">{t}</div>
                        <div className="w-full text-right text-[12px] leading-[normal] font-[400] text-[var(--muted-foreground)]">{sub}</div>
                    </div>
                ))}
            </div>

            <div className="flex w-full shrink-0 flex-col gap-[12px] rounded-[10px] bg-[#FFF7ED] p-[14px] [outline:1px_solid_#FED7AA] [outline-offset:-0.5px]">
                <div className="w-full text-right text-[13px] leading-[normal] font-[600] text-[#9A3412]">القيود الثابتة لا يمكن تجاوزها بصلاحيات إضافية. جميع التغييرات يعاد التحقق منها في الخادم؛ إخفاء التحكم ليس تفويضًا.</div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-[8px]">
                {groups.map((g) => {
                    const c = chip(g.items);
                    const grantable = g.items.filter((i) => i.state === 'available' || i.state === 'granted');
                    const restricted = g.items.some((i) => i.state === 'restricted');
                    const isOpen = open[g.key] ?? grantable.length > 0;
                    const roleLabels = g.items.filter((i) => i.state === 'role').map((i) => i.label);
                    return (
                        <div key={g.key} className="flex w-full shrink-0 flex-col gap-[12px] rounded-[10px] bg-[var(--surface)] p-[10px_14px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                            <button type="button" aria-expanded={isOpen} onClick={() => setOpen((p) => ({ ...p, [g.key]: !isOpen }))} className="flex w-full shrink-0 items-center gap-[12px]">
                                <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="h-[18px] w-[18px] shrink-0" color="var(--muted-foreground)" />
                                <span className="flex w-fit shrink-0 rounded-[999px] p-[4px_9px]" style={{ background: c.warn ? '#FFF7ED' : '#EFF6FF' }}>
                                    <span className="text-left text-[11px] leading-[normal] font-[400] whitespace-nowrap" style={{ color: c.warn ? '#9A3412' : '#1D4ED8' }}>
                                        {c.text}
                                    </span>
                                </span>
                                <span className="flex-1 text-right text-[14px] leading-[normal] font-[700] text-[var(--ink)]">{g.title}</span>
                            </button>
                            {isOpen && (
                                <>
                                    {roleLabels.length > 0 && <div className="w-full text-right text-[12px] leading-[normal] font-[400] text-[var(--text-secondary)]">{roleLabels.join(' · ')}</div>}
                                    {grantable.map((i) => (
                                        <div key={i.code} className="flex w-full shrink-0 items-center gap-[12px] p-[6px_0px]">
                                            <Box state on={sel.has(i.code)} onToggle={() => toggle(i.code)} label={i.label} />
                                            <div className="flex-1 text-right text-[13px] leading-[normal] font-[400] text-[#334155]">{i.label} — صلاحية إضافية</div>
                                        </div>
                                    ))}
                                    {restricted && (
                                        <div className="flex w-full shrink-0 items-center gap-[12px] p-[6px_0px]">
                                            <Icon name="lock-keyhole" className="h-[18px] w-[18px] shrink-0" color="#B45309" />
                                            <div className="flex-1 text-right text-[12px] leading-[normal] font-[600] text-[#92400E]">مقيدة بالدور · لا يمكن تعديلها</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex w-full shrink-0 flex-col gap-[12px] rounded-[10px] bg-[var(--background)] p-[14px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="w-full text-right text-[14px] leading-[normal] font-[700] text-[var(--ink)]">قيود محمية</div>
                <div className="w-full text-right text-[12px] leading-[normal] font-[400] text-[var(--text-secondary)]">
                    المصمم: لا يصل إلى مهام مصممين آخرين أو معلومات العملاء المالية. مدخل البيانات: لا يلغي الأوردرات ولا يصحح دفعات مؤكدة ولا يرسل داخل محادثات التصميم. Admin: لا يدير Admin أو Super Admin ولا يعدل صلاحياته الذاتية.
                </div>
            </div>
        </AppLayout>
    );
}
