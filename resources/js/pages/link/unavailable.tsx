import { LinkLayout } from '@/components/shell/link-layout';
import { Icon } from '@/pen/icon';
import { Head } from '@inertiajs/react';

/** S-093 — الرابط غير متاح. رسالة عامة آمنة بلا تسريب (لا نكشف سبب الإغلاق). */
export default function Unavailable() {
    return (
        <LinkLayout>
            <Head title="الرابط غير متاح" />
            <div className="flex w-full flex-1 flex-col items-center justify-center">
                <div className="flex w-[650px] max-w-full flex-col items-center gap-[15px] rounded-[12px] bg-[var(--surface)] p-[36px]">
                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[26px] bg-[#F1F5F9]">
                        <Icon name="link-2-off" className="h-[23px] w-[23px]" color="var(--muted-foreground)" />
                    </div>
                    <h1 className="text-left text-[23px] leading-[normal] font-[700] text-[var(--ink)]">الرابط غير متاح</h1>
                    <div className="w-[500px] max-w-full text-right text-[14px] leading-[26px] font-[400] text-[#475569]">
                        هذا الطلب لم يعد متاحًا من خلال الرابط.
                        <br />
                        للاستفسار يُرجى التواصل مع المطبعة.
                    </div>
                </div>
            </div>
        </LinkLayout>
    );
}
