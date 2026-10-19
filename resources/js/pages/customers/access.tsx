import { CustomerShell, type CustomerHead } from '@/components/pen/customer-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PenBadge } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    customer: CustomerHead;
    access: { enabled: boolean; status_label: string; phone: string; last_reset_at: string | null; notification: string; last_login_at: string | null };
    can: { manage: boolean; reset: boolean };
    generated_password?: string | null;
}

const card = 'flex w-full shrink-0 flex-col gap-[18px] rounded-[12px] bg-[var(--surface)] p-[20px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]';
const h2 = 'w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]';

function Detail({ k, v }: { k: string; v: React.ReactNode }) {
    return (
        <div className="flex flex-1 flex-col gap-[3px]">
            <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">{k}</div>
            <div className="w-full text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]">{v}</div>
        </div>
    );
}
function Action({ title, desc, label, onClick, disabled, muted }: { title: string; desc: string; label: string; onClick: () => void; disabled?: boolean; muted?: boolean }) {
    return (
        <div className="flex h-[66.5px] w-full shrink-0 items-center gap-[12px] p-[12px_0px] [border-bottom:1px_solid_var(--border)]">
            <button type="button" onClick={onClick} disabled={disabled} className={`flex h-[32px] w-fit shrink-0 items-center justify-center gap-[12px] rounded-[8px] p-[0px_10px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px] disabled:opacity-50 ${muted ? 'bg-[var(--background)]' : 'bg-[var(--surface)]'}`}>
                <span className={`text-left text-[11px] leading-[normal] font-[600] whitespace-nowrap ${muted ? 'text-[var(--muted-foreground)]' : 'text-[var(--ink)]'}`}>{label}</span>
            </button>
            <div className="flex flex-1 flex-col gap-[2px]">
                <div className="w-full text-right text-[14px] leading-[22px] font-[600] text-[var(--ink)]">{title}</div>
                <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{desc}</div>
            </div>
        </div>
    );
}

/** S-031 — دخول منصة العميل (pendev: IfJS9). كلمة المرور المؤقتة تُعرض مرة واحدة فقط ولا تُسجَّل. */
export default function CustomerAccess({ customer, access, can }: Props) {
    const [dlg, setDlg] = useState<'enable' | 'reset' | 'disable' | null>(null);
    const base = `/customers/${customer.id}/access`;
    const run = (path: string) => router.post(`${base}/${path}`, {}, { onFinish: () => setDlg(null) });

    return (
        <AppLayout>
            <Head title="دخول منصة العميل" />
            <CustomerShell customer={customer} active="access" title="دخول منصة العميل" crumb="دخول منصة العميل">
                <div className={card}>
                    <div className="flex w-full shrink-0 items-center gap-[12px]">
                        <PenBadge tone={access.enabled ? 'green' : 'gray'}>{access.enabled ? 'مفعّل' : 'غير مفعّل'}</PenBadge>
                        <div className="flex-1 text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">حالة الوصول</div>
                    </div>
                    <div className="flex w-full shrink-0 gap-[28px]">
                        <Detail k="حالة الحساب" v={access.enabled ? 'نشط' : 'موقوف'} />
                        <Detail k="رقم الهاتف" v={<bdi dir="ltr">{access.phone}</bdi>} />
                        <Detail k="آخر إعادة تعيين" v={access.last_reset_at ? formatDate(access.last_reset_at) : '—'} />
                        <Detail k="طريقة الإشعار" v={access.notification} />
                    </div>
                </div>

                <div className={card}>
                    <div className={h2}>إدارة كلمة المرور</div>
                    {can.manage && !access.enabled && <Action title="تفعيل دخول المنصة" desc="إنشاء حساب للعميل على المنصة بكلمة مرور مؤقتة تظهر مرة واحدة." label="تفعيل الوصول" onClick={() => setDlg('enable')} />}
                    {can.manage && access.enabled && <Action title="إنشاء كلمة مرور أولية" desc="تظهر كلمة المرور المؤقتة مرة واحدة." label="إنشاء كلمة مرور أولية" onClick={() => setDlg('enable')} />}
                    {can.reset && <Action title="إعادة تعيين كلمة المرور" desc="متاح للمسؤول والمحاسب فقط." label="إعادة تعيين" disabled={!access.enabled} onClick={() => setDlg('reset')} />}
                    {can.manage && <Action title="إيقاف دخول المنصة" desc="إيقاف الدخول مع الحفاظ على سجل الحساب." label="إيقاف الدخول" disabled={!access.enabled} onClick={() => setDlg('disable')} />}
                </div>

                <div className="flex w-full shrink-0 flex-col gap-[3px] rounded-[10px] bg-[var(--surface-subtle)] p-[14px]">
                    <div className="w-full text-right text-[13px] leading-[21px] font-[700] text-[var(--ink)]">ملاحظة</div>
                    <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">لا يمكن للعميل تغيير كلمة المرور ذاتيًا.</div>
                </div>
            </CustomerShell>

            {dlg && (
                <ConfirmDialog
                    open
                    onOpenChange={(o) => !o && setDlg(null)}
                    danger={dlg === 'disable'}
                    title={dlg === 'enable' ? 'تأكيد تفعيل الدخول' : dlg === 'reset' ? 'تأكيد إعادة تعيين كلمة المرور' : 'تأكيد إيقاف الدخول'}
                    description={dlg === 'enable' ? 'سيتم تفعيل دخول المنصة للهاتف المسجل.' : dlg === 'reset' ? 'سيتم إنشاء كلمة مرور مؤقتة جديدة.' : 'سيُمنع الدخول مع الحفاظ على بيانات الحساب.'}
                    confirmLabel="تأكيد"
                    onConfirm={() => run(dlg === 'enable' ? 'enable' : dlg === 'reset' ? 'reset-password' : 'disable')}
                />
            )}
        </AppLayout>
    );
}
