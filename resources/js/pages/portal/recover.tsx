import { FlashMessages } from '@/components/flash-messages';
import { Head, useForm } from '@inertiajs/react';

/** S-080 — استرجاع كلمة المرور: لا يكشف وجود الرقم؛ يفتح طلبًا لموظف يعيد تعيينها (لا بريد/SMS). */
export default function PortalRecover() {
    const { data, setData, post, processing } = useForm({ phone: '' });
    return (
        <div dir="ltr" className="flex min-h-screen w-full flex-col items-center bg-[var(--background)]">
            <Head title="استرجاع كلمة المرور" />
            <FlashMessages />
            <div className="flex w-full flex-1 items-center justify-center p-[16px]">
                <form
                    dir="rtl"
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/portal/recover');
                    }}
                    className="flex w-[460px] max-w-full flex-col gap-[16px] rounded-[12px] bg-[var(--surface)] p-[32px] [outline:1px_solid_var(--border)]"
                >
                    <h1 className="text-[26px] leading-[38px] font-[700] text-[var(--ink)]">استرجاع كلمة المرور</h1>
                    <div className="text-[13px] leading-[21px] text-[var(--muted-foreground)]">أدخل رقم هاتفك المسجّل وسيتواصل معك فريق المطبعة بكلمة مرور جديدة.</div>
                    <input dir="ltr" aria-label="رقم الهاتف" inputMode="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="رقم الهاتف" className="h-[46px] w-full rounded-[10px] bg-[var(--background)] p-[0px_14px] text-right text-[14px] outline-hidden [outline:1px_solid_var(--control-border)]" />
                    <button type="submit" disabled={processing || data.phone.length < 7} className="h-[44px] w-full rounded-[8px] bg-[var(--primary)] text-[14px] font-[600] text-white disabled:opacity-60">
                        إرسال الطلب
                    </button>
                    <a href="/portal/login" className="text-center text-[13px] font-[600] text-[var(--primary)]">
                        العودة لتسجيل الدخول
                    </a>
                </form>
            </div>
        </div>
    );
}
