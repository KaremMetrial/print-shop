import { Head, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { type SharedData } from '@/types';

/**
 * S-001 — تسجيل دخول الموظفين. مطابق حرفيًا لـ pendev/untitled.pen (frame e3h27) كما يُصدَّر html-css:
 * التخطيط literal (LTR) مع text-align:right للنص العربي — نفس منطق الـpen تمامًا.
 */
export default function Login({ status }: { status?: string }) {
    const { name } = usePage<SharedData>().props;
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', password: '' });
    const [show, setShow] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };
    const error = errors.email ?? errors.password ?? (errors as Record<string, string>).business;

    return (
        <div dir="ltr" className="bg-background flex min-h-screen flex-col items-start gap-8 overflow-hidden p-4 font-[Cairo] lg:p-12">
            <Head title="تسجيل دخول الموظفين" />

            <div className="flex w-full items-center justify-between gap-3">
                <div className="text-muted-foreground flex-1 text-right text-[13px] leading-[21px]">وصول آمن للموظفين فقط</div>
                <div className="text-primary flex-1 text-right text-2xl leading-[34px] font-bold">PBMS / {name}</div>
            </div>

            <div className="flex w-full flex-1 items-center justify-center gap-3">
                <form
                    onSubmit={submit}
                    noValidate
                    className="bg-surface outline-border flex w-[480px] max-w-full shrink-0 flex-col gap-6 rounded-xl p-10 outline-1 -outline-offset-[0.5px]"
                >
                    <div className="flex w-full items-center justify-end gap-3">
                        <ShieldCheck className="text-primary size-8" strokeWidth={2} aria-hidden />
                    </div>
                    <h1 className="text-ink w-full text-right text-[28px] leading-[39px] font-bold">تسجيل دخول الموظفين</h1>
                    <p className="text-muted-foreground w-full text-right text-sm leading-[22px]">
                        ادخل إلى مساحة عملك الآمنة لمتابعة الطلبات وعمليات المطبعة اليومية.
                    </p>

                    {status && (
                        <div className="bg-success-soft text-success-text w-full rounded-[10px] p-3 text-right text-sm font-semibold">{status}</div>
                    )}
                    {error && (
                        <div role="alert" className="bg-danger-soft flex w-full flex-col gap-1 rounded-[10px] p-3 text-right">
                            <span className="text-[14px] leading-[22px] font-bold text-[#B91C1C]">تعذر تسجيل الدخول</span>
                            <span className="text-[13px] leading-[21px] text-[#B91C1C]">{error}</span>
                        </div>
                    )}

                    <div className="flex w-full flex-col items-start gap-2">
                        <label htmlFor="email" className="text-ink w-full text-right text-sm leading-[22px] font-semibold">
                            البريد الإلكتروني *
                        </label>
                        <div className="bg-background outline-control-border focus-within:outline-primary flex h-12 w-full items-center gap-3 rounded-[10px] px-3.5 outline-1 -outline-offset-[0.5px] focus-within:outline-2">
                            <input
                                id="email"
                                type="email"
                                autoFocus
                                autoComplete="email"
                                placeholder="name@company.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="text-ink placeholder:text-ink min-w-0 flex-1 bg-transparent text-left text-sm leading-[22px] outline-hidden"
                            />
                        </div>
                    </div>

                    <div className="flex w-full flex-col items-start gap-2">
                        <label htmlFor="password" className="text-ink w-full text-right text-sm leading-[22px] font-semibold">
                            كلمة المرور *
                        </label>
                        <div className="bg-background outline-control-border focus-within:outline-primary flex h-12 w-full items-center gap-3 rounded-[10px] px-3.5 outline-1 -outline-offset-[0.5px] focus-within:outline-2">
                            <button
                                type="button"
                                onClick={() => setShow((s) => !s)}
                                aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                className="text-muted-foreground shrink-0"
                            >
                                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                            <input
                                id="password"
                                type={show ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="أدخل كلمة المرور"
                                dir="rtl"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="text-ink placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-right text-sm leading-[22px] outline-hidden"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-primary hover:bg-primary-hover flex h-12 w-full items-center justify-center rounded-[10px] px-4 text-sm font-semibold whitespace-nowrap text-white disabled:opacity-70"
                    >
                        {processing ? 'جارٍ التحقق…' : 'تسجيل الدخول'}
                    </button>

                    <p className="text-muted-foreground w-full text-right text-xs leading-[19px]">للمساعدة في الوصول، تواصل مع مسؤول النظام.</p>
                </form>
            </div>

            <div className="text-muted-foreground w-full text-center text-xs leading-[19px]">
                PBMS • نظام داخلي لإدارة مطبعة واحدة • جميع الاتصالات محمية
            </div>
        </div>
    );
}
