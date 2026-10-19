import { PenBreadcrumb } from '@/components/pen/primitives';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatTime } from '@/lib/money';
import { Icon } from '@/pen/icon';
import { Head, router, useForm } from '@inertiajs/react';

interface Props {
    profile: { name: string; email: string; phone: string | null; role: string; status: string; employee_no: string; last_login_at: string | null; device: string };
}
const field = 'flex h-[48px] w-full shrink-0 items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]';
const lbl = 'w-full text-right text-[13px] leading-[21px] font-[600] text-[var(--ink)]';
const inp = 'min-w-0 flex-1 bg-transparent text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)] outline-hidden';

/** S-003 — الملف الشخصي (pendev: UnZgI). الاسم والهاتف فقط؛ البريد والدور للقراءة. */
export default function Profile({ profile: p }: Props) {
    const { data, setData, patch, processing, errors, reset } = useForm({ name: p.name, phone: p.phone ?? '' });
    const initials = p.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('');
    const last = p.last_login_at ? `${formatDate(p.last_login_at)}، ${formatTime(p.last_login_at)}` : '—';
    return (
        <AppLayout>
            <Head title="الملف الشخصي" />
            <div className="flex w-full shrink-0 flex-col gap-[16px]">
                <PenBreadcrumb items={[{ label: 'الرئيسية', href: '/dashboard' }, 'الملف الشخصي']} />
                <div className="flex w-full shrink-0 items-center justify-between">
                    <button type="button" onClick={() => router.post(route('logout'))} className="flex h-[46px] w-fit shrink-0 items-center rounded-[10px] bg-[var(--surface)] p-[0px_16px] text-left text-[14px] leading-[normal] font-[400] whitespace-nowrap text-[var(--ink)] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]">
                        تسجيل الخروج
                    </button>
                    <div className="flex flex-1 flex-col gap-[4px]">
                        <h1 className="w-full text-right text-[32px] leading-[44px] font-[700] text-[var(--ink)]">الملف الشخصي</h1>
                        <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">بيانات حسابك ومعلومات الدخول إلى النظام.</div>
                    </div>
                </div>
                <div className="flex w-full shrink-0 items-start gap-[24px]">
                    <form
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault();
                            patch(route('profile.update'));
                        }}
                        className="flex min-w-0 flex-1 flex-col gap-[16px] rounded-[12px] bg-[var(--surface)] p-[24px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]"
                    >
                        <div className="w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">المعلومات الشخصية</div>
                        <div className="w-full text-right text-[13px] leading-[21px] font-[400] text-[var(--muted-foreground)]">يمكنك تحديث اسمك ورقم التواصل فقط.</div>
                        <div className="flex w-full shrink-0 flex-col gap-[8px]">
                            <label htmlFor="name" className={lbl}>الاسم الكامل</label>
                            <div className={field}>
                                <input id="name" dir="rtl" value={data.name} onChange={(e) => setData('name', e.target.value)} className={inp} />
                            </div>
                            {errors.name && <div className="w-full text-right text-[12px] text-[var(--danger)]">{errors.name}</div>}
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-[8px]">
                            <div className={lbl}>البريد الإلكتروني</div>
                            <div className={field}>
                                <Icon name="lock-keyhole" className="h-[16px] w-[16px] shrink-0" color="var(--muted-foreground)" />
                                <input readOnly dir="ltr" value={p.email} aria-label="البريد الإلكتروني" className={`${inp} text-left`} />
                            </div>
                            <div className="w-full text-right text-[11px] leading-[18px] font-[400] text-[var(--muted-foreground)]">بريد العمل للقراءة فقط؛ يُدار بواسطة مسؤول النظام.</div>
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-[8px]">
                            <label htmlFor="phone" className={lbl}>رقم التواصل</label>
                            <div className={field}>
                                <input id="phone" dir="ltr" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className={`${inp} text-left`} />
                            </div>
                            {errors.phone && <div className="w-full text-right text-[12px] text-[var(--danger)]">رقم التواصل غير صالح.</div>}
                        </div>
                        <div className="flex w-full shrink-0 items-center justify-end gap-[12px]">
                            <button type="button" onClick={() => reset()} className="flex h-[46px] w-fit shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface)] p-[0px_16px] text-left text-[14px] leading-[normal] font-[600] text-[var(--ink)] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px]">
                                إلغاء
                            </button>
                            <button type="submit" disabled={processing} className="flex h-[46px] w-fit shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary)] p-[0px_16px] text-left text-[14px] leading-[normal] font-[600] text-white disabled:opacity-60">
                                حفظ التغييرات
                            </button>
                        </div>
                    </form>
                    <div className="flex w-[328px] shrink-0 flex-col items-end gap-[12px] rounded-[12px] bg-[var(--surface)] p-[24px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center self-end rounded-[36px] bg-[#DBEAFE]">
                            <div className="text-left text-[26px] leading-[36px] font-[700] text-[var(--primary)]">{initials}</div>
                        </div>
                        <div className="w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">{p.name}</div>
                        <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--muted-foreground)]">{p.role}</div>
                        <div className="flex w-fit shrink-0 items-center rounded-[8px] bg-[#F0FDF4] p-[4px_10px]">
                            <div className="text-left text-[12px] leading-[19px] font-[600] whitespace-nowrap text-[#15803D]">{p.status === 'ACTIVE' ? 'الحساب نشط' : 'الحساب غير نشط'}</div>
                        </div>
                        <div className="w-full text-right text-[13px] leading-[21px] font-[400] whitespace-pre-line text-[var(--muted-foreground)]">{`رقم الموظف: ${p.employee_no}\nالفرع الرئيسي • القاهرة`}</div>
                        <div className="flex w-full shrink-0 flex-col gap-[8px] rounded-[10px] bg-[var(--background)] p-[16px]">
                            <div className="w-full text-right text-[14px] leading-[22px] font-[700] text-[var(--ink)]">الدور والصلاحيات</div>
                            <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">صلاحيات إدارية معتمدة. لا يمكن تغيير دورك أو صلاحياتك من ملفك الشخصي.</div>
                        </div>
                    </div>
                </div>
                <div className="flex w-full shrink-0 flex-col gap-[16px] rounded-[12px] bg-[var(--surface)] p-[24px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                    <div className="w-full text-right text-[18px] leading-[29px] font-[700] text-[var(--ink)]">معلومات الدخول</div>
                    <div className="flex w-full shrink-0 items-center gap-[32px]">
                        {[['الجلسة الحالية', 'نشطة • هذا الجهاز'], ['الجهاز والمتصفح', p.device], ['آخر تسجيل دخول', last]].map(([k, v], i) => (
                            <div key={k} className="flex flex-col gap-[4px]" style={i === 2 ? { width: 330 } : { flex: '1 1 0' }}>
                                <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">{k}</div>
                                <div className="w-full text-right text-[14px] leading-[22px] font-[400] text-[var(--ink)]">{v}</div>
                            </div>
                        ))}
                    </div>
                    <div className="w-full text-right text-[12px] leading-[19px] font-[400] text-[var(--muted-foreground)]">لأمان الحساب، سجّل الخروج عند الانتهاء من العمل على جهاز مشترك.</div>
                </div>
            </div>
        </AppLayout>
    );
}
