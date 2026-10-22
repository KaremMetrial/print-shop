import { ConfirmDialog } from '@/components/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Pen44, PenInput, PenSelect, penNote } from '@/components/pen/form';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Emp {
    id: number;
    name: string;
    email: string | null;
    role: string | null;
    role_label: string | null;
    status: 'ACTIVE' | 'INACTIVE' | null;
    created_at: string | null;
    last_login_at: string | null;
    availability?: string | null;
    phone?: string | null;
    can_edit: boolean;
}
interface Selected extends Emp {
    extra_permissions: number | null;
    specialties?: string[];
    can_permissions: boolean;
}
interface Props {
    employees: { data: Emp[]; current_page: number; last_page: number };
    filters: Record<string, string>;
    roles: { value: string; label: string }[];
    can: { create: boolean };
    selected: Selected | null;
}

const NA = 'غير متاح';
const cell = 'flex-1 text-right text-[13px] leading-[normal] font-[400]';
const muted = 'text-[var(--muted-foreground)]';
const th = 'flex-1 text-right text-[12px] leading-[normal] font-[600] text-[var(--text-secondary)]';

/** S-065 — قائمة الموظفين (pendev: gcUp5). DOM literal كما في التصدير. */
export default function EmployeesIndex({ employees, filters, roles, can, selected }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [dlg, setDlg] = useState<{ emp: Emp; kind: 'deactivate' | 'reset' } | null>(null);
    const go = (next: Record<string, string | undefined>) => router.get('/employees', { ...filters, selected: undefined, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    const open = (id: number) => router.get('/employees', { ...filters, selected: id }, { preserveState: true, preserveScroll: true, only: ['selected'], replace: true });
    const closeDetails = () => go({});
    const fmt = (d: string | null, time = false) => (d ? formatDate(d) + (time ? '' : '') : NA);
    const statusText = (s: Emp['status']) => (s === 'ACTIVE' ? 'نشط' : s === 'INACTIVE' ? 'معطّل' : null);

    return (
        <AppLayout active="/employees">
            <Head title="الموظفون" />
            <div className="flex w-full shrink-0 items-center gap-[14px]">
                {can.create && (
                    <Pen44 href="/employees/create" variant="primary">
                        إضافة موظف
                    </Pen44>
                )}
                <div className="flex flex-1 flex-col gap-[14px]">
                    <h1 className="w-full text-right text-[28px] leading-[normal] font-[700] text-[var(--ink)]">الموظفون</h1>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[var(--text-secondary)]">إدارة حسابات الموظفين وصلاحيات الوصول إلى النظام.</div>
                </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-[14px] rounded-[12px] bg-[var(--surface)] p-[16px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="flex w-full shrink-0 gap-[12px]">
                    <PenSelect label="توفر المصمم" wrapperClassName="w-[190px]" value={filters.availability ?? ''} onValueChange={(v) => go({ availability: v || undefined })} options={[{ value: '', label: 'كل حالات التوفر' }, { value: 'AVAILABLE', label: 'متاح' }, { value: 'UNAVAILABLE', label: 'غير متاح' }, { value: 'ON_LEAVE', label: 'في إجازة' }]} />
                    <PenSelect label="حالة الحساب" wrapperClassName="w-[190px]" value={filters.status ?? ''} onValueChange={(v) => go({ status: v || undefined })} options={[{ value: '', label: 'كل الحالات' }, { value: 'ACTIVE', label: 'نشط' }, { value: 'INACTIVE', label: 'معطّل' }]} />
                    <PenSelect label="الدور" wrapperClassName="w-[190px]" value={filters.role ?? ''} onValueChange={(v) => go({ role: v || undefined })} options={[{ value: '', label: 'كل الأدوار' }, ...roles, { value: 'SUPER_ADMIN', label: 'المدير العام' }]} />
                    <form
                        className="flex flex-1 shrink-0"
                        onSubmit={(e) => {
                            e.preventDefault();
                            go({ q: q || undefined });
                        }}
                    >
                        <PenInput label="بحث" leadingIcon="search" placeholder="ابحث باسم الموظف أو البريد الإلكتروني" value={q} onChange={(e) => setQ(e.target.value)} wrapperClassName="w-full" />
                    </form>
                </div>
                <div className={penNote}>توفر المصمم ينطبق على حسابات المصممين فقط.</div>
            </div>

            <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[12px] bg-[var(--surface)] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="flex w-full shrink-0 gap-[12px] bg-[var(--background)] p-[14px_16px]">
                    {['الإجراءات', 'آخر دخول', 'تاريخ الإنشاء', 'توفر المصمم', 'حالة الحساب', 'الدور', 'البريد الإلكتروني', 'الموظف'].map((h) => (
                        <div key={h} className={th}>
                            {h}
                        </div>
                    ))}
                </div>
                {employees.data.length === 0 && <div className="p-8 text-center text-[13px] text-[var(--muted-foreground)]">لا يوجد موظفون مطابقون.</div>}
                {employees.data.map((e) => (
                    <div key={e.id} className="flex w-full shrink-0 items-center gap-[12px] p-[18px_16px] [border-top:1px_solid_var(--border)]">
                        <div className="flex w-[210px] shrink-0 flex-col gap-[6px]">
                            <Pen44 onClick={() => open(e.id)}>عرض التفاصيل</Pen44>
                            {e.can_edit && (
                                <>
                                    <div className="flex w-full shrink-0 gap-[6px]">
                                        <Pen44 href={`/employees/${e.id}/edit`}>تعديل</Pen44>
                                        <Pen44 href={`/employees/${e.id}/permissions`}>الصلاحيات</Pen44>
                                    </div>
                                    <div className="flex w-full shrink-0 gap-[6px]">
                                        <Pen44 variant="small" onClick={() => setDlg({ emp: e, kind: 'reset' })}>
                                            إعادة التعيين
                                        </Pen44>
                                        {e.status === 'INACTIVE' ? (
                                            <Pen44 variant="small" onClick={() => router.post(`/employees/${e.id}/activate`)}>
                                                تفعيل
                                            </Pen44>
                                        ) : (
                                            <Pen44 variant="smallDanger" onClick={() => setDlg({ emp: e, kind: 'deactivate' })}>
                                                تعطيل
                                            </Pen44>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className={`${cell} ${e.last_login_at ? 'text-[var(--ink)]' : muted}`}>{fmt(e.last_login_at)}</div>
                        <div className={`${cell} ${e.created_at ? 'text-[var(--ink)]' : muted}`}>{fmt(e.created_at)}</div>
                        <div className={`${cell} ${e.availability ? 'text-[var(--ink)]' : muted}`}>{e.availability ?? NA}</div>
                        <div className={`${cell} ${statusText(e.status) ? 'text-[var(--ink)]' : muted}`}>{statusText(e.status) ?? NA}</div>
                        <div className="flex-1 text-right text-[13px] leading-[normal] font-[600] text-[var(--ink)]">{e.role_label}</div>
                        <div className={`${cell} ${e.email ? 'text-[var(--ink)]' : muted}`}>{e.email ? <bdi dir="ltr">{e.email}</bdi> : NA}</div>
                        <div className={`${cell} text-[var(--ink)]`}>{e.name}</div>
                    </div>
                ))}
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && closeDetails()}>
                {selected && (
                    <DialogContent className="max-h-[calc(100dvh-2rem)] w-[680px] max-w-[95vw] gap-[20px] overflow-y-auto rounded-[14px] p-[24px]" dir="rtl">
                        <DialogTitle className="w-full text-right text-[20px] leading-[normal] font-[700] text-[var(--ink)]">تفاصيل الموظف</DialogTitle>
                        <DialogDescription className="sr-only">بيانات حساب الموظف وصلاحياته.</DialogDescription>
                        <div className="flex w-full flex-wrap items-center justify-between gap-[12px] rounded-[12px] bg-[var(--background)] p-[16px]">
                            <div className="flex min-w-0 flex-1 flex-col gap-[5px] text-right">
                                <div className="text-[17px] leading-[25px] font-[700] text-[var(--ink)]">{selected.name}</div>
                                <div className="text-[13px] leading-[20px] text-[var(--muted-foreground)]">{selected.role_label}</div>
                            </div>
                            <span className={`inline-flex h-[30px] shrink-0 items-center rounded-full px-[12px] text-[12px] font-[700] ${selected.status === 'ACTIVE' ? 'bg-[#E8F6EC] text-[#237A4B]' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                                {statusText(selected.status) ?? '—'}
                            </span>
                        </div>
                        <div className="grid w-full grid-cols-1 gap-[10px] sm:grid-cols-2">
                            {[
                                { label: 'البريد الإلكتروني', value: selected.email ? <bdi dir="ltr">{selected.email}</bdi> : '—' },
                                { label: 'رقم الهاتف', value: selected.phone ? <bdi dir="ltr">{selected.phone}</bdi> : '—' },
                                { label: 'تاريخ الإنشاء', value: selected.created_at ? fmt(selected.created_at) : '—' },
                                { label: 'آخر دخول', value: selected.last_login_at ? fmt(selected.last_login_at) : 'لم يسجّل الدخول بعد' },
                                ...(selected.role === 'DESIGNER' ? [{ label: 'حالة التوفر', value: selected.availability ?? '—' }] : []),
                                ...(selected.role === 'DESIGNER' ? [{ label: 'التخصصات', value: selected.specialties?.length ? selected.specialties.join('، ') : 'لم تُحدَّد تخصصات' }] : []),
                                { label: 'الصلاحيات الإضافية', value: selected.extra_permissions ? `${selected.extra_permissions} صلاحية` : 'لا توجد صلاحيات إضافية' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex min-h-[72px] min-w-0 flex-col justify-center gap-[6px] rounded-[10px] bg-[var(--surface)] p-[12px_14px] text-right [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                                    <div className="text-[11px] leading-[17px] font-[500] text-[var(--muted-foreground)]">{label}</div>
                                    <div className="break-words text-[13px] leading-[20px] font-[600] text-[var(--ink)]">{value}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex w-full shrink-0 flex-wrap items-center justify-start gap-[10px] border-t border-[var(--border)] pt-[16px]">
                            {selected.can_permissions && <Pen44 href={`/employees/${selected.id}/permissions`}>إدارة الصلاحيات</Pen44>}
                            {selected.can_edit && (
                                <Pen44 href={`/employees/${selected.id}/edit`} variant="primary">
                                    تعديل البيانات
                                </Pen44>
                            )}
                            {selected.can_edit && <Pen44 px={16} onClick={() => setDlg({ emp: selected, kind: 'reset' })}>إعادة تعيين كلمة المرور</Pen44>}
                            {selected.can_edit && (
                                <button type="button" onClick={() => setDlg({ emp: selected, kind: 'deactivate' })} className="flex h-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--danger-soft)] px-[16px] text-[14px] font-[600] text-[var(--danger-text)] [outline:1px_solid_#FECACA] [outline-offset:-0.5px]">
                                    تعطيل الحساب
                                </button>
                            )}
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {dlg && (
                <ConfirmDialog
                    open
                    onOpenChange={(o) => !o && setDlg(null)}
                    danger={dlg.kind === 'deactivate'}
                    title={dlg.kind === 'deactivate' ? `تعطيل حساب ${dlg.emp.name}؟` : `إعادة تعيين كلمة مرور ${dlg.emp.name}؟`}
                    description={dlg.kind === 'deactivate' ? 'سيُنهى دخوله فورًا ويبقى سجله التاريخي محفوظًا.' : 'ستُولَّد كلمة مرور مؤقتة تُعرض مرة واحدة، وتُنهى جلساته الحالية.'}
                    warning={dlg.kind === 'deactivate' ? 'لا يُحذف أي من سجلات الموظف السابقة.' : undefined}
                    confirmLabel={dlg.kind === 'deactivate' ? 'تأكيد التعطيل' : 'توليد كلمة مرور'}
                    reasonLabel={dlg.kind === 'deactivate' ? 'سبب التعطيل' : undefined}
                    onConfirm={(reason) => router.post(`/employees/${dlg.emp.id}/${dlg.kind === 'deactivate' ? 'deactivate' : 'reset-password'}`, dlg.kind === 'deactivate' ? { reason } : {}, { onFinish: () => setDlg(null) })}
                />
            )}
        </AppLayout>
    );
}


