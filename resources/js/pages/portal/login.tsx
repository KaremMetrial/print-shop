import { Icon } from '@/pen/icon';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

/** S-079 — تسجيل دخول العميل (pendev: ablZH). برقم الهاتف وكلمة مرور ينشئها موظف؛ رسالة خطأ عامة بلا enumeration. */
export default function PortalLogin() {
    const { data, setData, post, processing, errors } = useForm({ phone: '', password: '' });
    const [show, setShow] = useState(false);
    const shopName = (usePage().props as { name?: string }).name ?? '';
    const field = 'flex h-[46px] w-full items-center gap-[12px] rounded-[10px] bg-[var(--background)] p-[0px_14px] [outline:1px_solid_var(--control-border)] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]';
    const m = 'flex h-[46px] w-full items-center gap-[12px] rounded-[10px] bg-[#F8FAFC] p-[0px_14px] [outline:1px_solid_#CBD5E1] [outline-offset:-0.5px] focus-within:[outline:2px_solid_var(--primary)]';
    return (
        <>
            <Head title="تسجيل الدخول" />
            {/* M-A01 (pendev: e2A1h) — الموبايل 390px؛ شريط حالة الهاتف المرسوم في التصميم من النظام فلا يُرسم */}
            <form
                dir="ltr"
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    post('/portal/login');
                }}
                className="flex min-h-screen w-full flex-col items-end bg-[#F6F8FC] md:hidden"
            >
                <div className="flex h-[57px] w-full shrink-0 items-center justify-between bg-white p-[0px_16px] [border-bottom:1px_solid_#E2E8F0]">
                    <div className="flex h-[44px] w-[44px] items-center justify-center">
                        <Icon name="lock-keyhole" className="h-[21px] w-[21px]" color="#334155" />
                    </div>
                    <div className="text-right text-[16px] leading-[normal] font-[700] whitespace-nowrap text-[#0F172A]">تسجيل الدخول</div>
                </div>
                <div className="flex w-full flex-col items-end gap-[16px] p-[20px_16px_24px_16px]">
                    <div className="w-full text-right text-[24px] leading-[normal] font-[700] text-[#0F172A]">مرحبًا بك في {shopName}</div>
                    <div className="w-full text-right text-[15px] leading-[normal] font-[400] text-[#475569]">تابع أوردراتك وطلباتك من مكان واحد.</div>
                    <div className="flex w-full flex-col items-end gap-[10px] rounded-[14px] bg-white p-[16px] [outline:1px_solid_#E2E8F0] [outline-offset:-0.5px]">
                        <label className="flex w-full flex-col gap-[6px]">
                            <span className="w-full text-right text-[14px] leading-[21px] font-[600] text-[#475569]">رقم الهاتف</span>
                            <div className={m}>
                                <input dir="rtl" inputMode="tel" autoComplete="username" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="أدخل رقم هاتفك" className="min-w-0 flex-1 bg-transparent text-right text-[15px] leading-[23px] text-[#0F172A] outline-none placeholder:text-[#64748B]" />
                            </div>
                        </label>
                        <label className="flex w-full flex-col gap-[6px]">
                            <span className="w-full text-right text-[14px] leading-[21px] font-[600] text-[#475569]">كلمة المرور</span>
                            <div className={m}>
                                <button type="button" aria-label={show ? 'إخفاء' : 'إظهار'} onClick={() => setShow((s) => !s)}>
                                    <Icon name={show ? 'eye-off' : 'eye'} className="h-[16px] w-[16px]" color="#64748B" />
                                </button>
                                <input dir="rtl" type={show ? 'text' : 'password'} autoComplete="current-password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" className="min-w-0 flex-1 bg-transparent text-right text-[15px] leading-[23px] text-[#0F172A] outline-none placeholder:text-[#64748B]" />
                            </div>
                        </label>
                        {errors.phone && <div role="alert" className="w-full rounded-[8px] bg-[var(--danger-soft)] p-[10px_14px] text-right text-[13px] text-[var(--danger-text)]">{errors.phone}</div>}
                        <button type="submit" disabled={processing} className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[#2563EB] text-[15px] leading-[normal] font-[700] text-white [outline:1px_solid_#2563EB] [outline-offset:-0.5px] disabled:opacity-60">
                            تسجيل الدخول
                        </button>
                    </div>
                    <a href="/portal/recover" className="w-full text-right text-[14px] leading-[normal] font-[700] text-[#2563EB]">
                        نسيت كلمة المرور؟
                    </a>
                    <div className="w-full text-right text-[14px] leading-[normal] font-[400] text-[#64748B]">هذا الدخول للعميل المسجّل فقط. رابط الأوردر الخاص لا يحتاج إلى حساب.</div>
                </div>
            </form>
        <div dir="ltr" className="hidden min-h-screen w-full flex-col items-center bg-[var(--background)] md:flex">
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
        </>
    );
}
