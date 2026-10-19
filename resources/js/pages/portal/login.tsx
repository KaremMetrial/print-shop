import { Icon } from '@/pen/icon';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

/** S-079 — تسجيل دخول العميل (pendev: ablZH). برقم الهاتف وكلمة مرور ينشئها موظف؛ رسالة خطأ عامة بلا enumeration. */
export default function PortalLogin() {
    const { data, setData, post, processing, errors } = useForm({ phone: '', password: '' });
    const [show, setShow] = useState(false);
    const field = 'flex h-[46px] w-full items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]';
    return (
        <div dir="ltr" className="flex min-h-screen w-full flex-col items-center bg-[var(--background)]">
            <Head title="تسجيل الدخول" />
            <div className="flex h-[80px] w-full shrink-0 items-center justify-end bg-[var(--surface)] p-[0px_64px] [border-bottom:1px_solid_var(--border)]">
                <div className="flex flex-col items-end">
                    <div className="text-left text-[22px] leading-[normal] font-[800] text-[var(--primary)]">PBMS</div>
                    <div className="text-left text-[12px] text-[var(--muted-foreground)]">بوابة عملاء المطبعة</div>
                </div>
            </div>
            <div className="flex w-full flex-1 items-center justify-center p-[16px]">
                <form
                    dir="rtl"
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/portal/login');
                    }}
                    className="flex w-[460px] max-w-full flex-col gap-[16px] rounded-[12px] bg-[var(--surface)] p-[32px] [outline:1px_solid_var(--border)] [outline-offset:-0.5px]"
                >
                    <h1 className="text-[28px] leading-[40px] font-[700] text-[var(--ink)]">تسجيل الدخول</h1>
                    <div className="text-[13px] leading-[21px] text-[var(--muted-foreground)]">سجّل دخولك لمتابعة أوردراتك وطلباتك.</div>
                    <label className="flex flex-col gap-[8px]">
                        <span className="text-[13px] font-[600] text-[var(--ink)]">رقم الهاتف</span>
                        <div className={field}>
                            <input dir="ltr" inputMode="tel" autoComplete="username" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="أدخل رقم الهاتف" className="min-w-0 flex-1 bg-transparent text-right text-[14px] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                        </div>
                    </label>
                    <label className="flex flex-col gap-[8px]">
                        <span className="text-[13px] font-[600] text-[var(--ink)]">كلمة المرور</span>
                        <div className={field}>
                            <button type="button" aria-label={show ? 'إخفاء' : 'إظهار'} onClick={() => setShow((s) => !s)}>
                                <Icon name={show ? 'eye-off' : 'eye'} className="h-[16px] w-[16px]" color="var(--muted-foreground)" />
                            </button>
                            <input dir="ltr" type={show ? 'text' : 'password'} autoComplete="current-password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="أدخل كلمة المرور" className="min-w-0 flex-1 bg-transparent text-right text-[14px] outline-hidden placeholder:text-[var(--muted-foreground)]" />
                        </div>
                    </label>
                    {errors.phone && <div role="alert" className="rounded-[8px] bg-[var(--danger-soft)] p-[10px_14px] text-[13px] text-[var(--danger-text)]">{errors.phone}</div>}
                    <button type="submit" disabled={processing} className="h-[44px] w-full rounded-[8px] bg-[var(--primary)] text-[14px] font-[600] text-white disabled:opacity-60">
                        تسجيل الدخول
                    </button>
                    <a href="/portal/recover" className="text-center text-[13px] font-[600] text-[var(--primary)]">
                        نسيت كلمة المرور؟
                    </a>
                </form>
            </div>
            <div className="w-full p-[16px] text-center text-[12px] text-[var(--muted-foreground)]">للمساعدة في الوصول إلى حسابك، تواصل مع المطبعة.</div>
        </div>
    );
}
