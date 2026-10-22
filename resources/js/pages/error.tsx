import { Head, Link } from '@inertiajs/react';

const MSG: Record<number, [string, string]> = {
    403: ['غير مصرّح', 'ليست لديك صلاحية الوصول إلى هذه الصفحة. إن كنت تحتاجها تواصل مع مسؤول النظام.'],
    404: ['الصفحة غير موجودة', 'الرابط غير صحيح أو أن العنصر لم يعد متاحًا.'],
    419: ['انتهت صلاحية الجلسة', 'حدّث الصفحة ثم حاول مرة أخرى.'],
    429: ['طلبات كثيرة', 'حاولت أكثر من المسموح. انتظر قليلًا ثم أعد المحاولة.'],
    500: ['حدث خطأ غير متوقع', 'تم تسجيل المشكلة. حاول مرة أخرى بعد قليل، وإن استمر الخطأ تواصل مع الدعم.'],
    503: ['النظام تحت الصيانة', 'نعمل على تحسين النظام. سنعود خلال دقائق.'],
};

/** صفحة خطأ عربية موحّدة (لا تكشف تفاصيل تقنية). */
export default function ErrorPage({ status, home }: { status: number; home: string }) {
    const [title, text] = MSG[status] ?? MSG[500];
    return (
        <div dir="rtl" className="flex min-h-screen w-full items-center justify-center bg-[var(--background)] p-[16px]">
            <Head title={title} />
            <div className="flex w-[480px] max-w-full flex-col items-center gap-[14px] rounded-[12px] bg-[var(--surface)] p-[32px] text-center [outline:1px_solid_var(--border)] [outline-offset:-0.5px]">
                <div className="text-[56px] leading-[normal] font-[700] text-[var(--primary)]">{status}</div>
                <h1 className="text-[22px] font-[700] text-[var(--ink)]">{title}</h1>
                <p className="text-[14px] leading-[24px] text-[var(--muted-foreground)]">{text}</p>
                <div className="flex gap-[10px]">
                    <button type="button" onClick={() => history.back()} className="flex h-[40px] items-center rounded-[8px] bg-[var(--surface)] p-[0px_16px] text-[13px] text-[var(--ink)] [outline:1px_solid_var(--border)]">رجوع</button>
                    <Link href={home} className="flex h-[40px] items-center rounded-[8px] bg-[var(--primary)] p-[0px_16px] text-[13px] font-[600] text-white">الصفحة الرئيسية</Link>
                </div>
            </div>
        </div>
    );
}
