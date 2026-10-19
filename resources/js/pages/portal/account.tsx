import { CustomerLayout } from '@/components/shell/customer-layout';
import { Head } from '@inertiajs/react';

/** الملف الشخصي للعميل: للقراءة فقط؛ كلمة المرور يعيد تعيينها موظف (BR-007). */
export default function PortalAccount({ customer: c }: { customer: { name: string; phone: string; code: string; tier: string; address: string | null } }) {
    return (
        <CustomerLayout>
            <Head title="الملف الشخصي" />
            <h1 className="w-full text-right text-[28px] font-[700]">الملف الشخصي</h1>
            <div className="flex w-full flex-col gap-[12px] rounded-[12px] bg-[var(--surface)] p-[24px] [outline:1px_solid_var(--border)]">
                {[['الاسم', c.name], ['رقم العميل', c.code], ['الهاتف', c.phone], ['الفئة السعرية', c.tier], ['العنوان', c.address ?? '—']].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[14px] [border-bottom:1px_solid_var(--border)] p-[8px_0px]">
                        <b>{v}</b>
                        <span className="text-[var(--muted-foreground)]">{k}</span>
                    </div>
                ))}
                <div className="text-right text-[12px] text-[var(--muted-foreground)]">لتعديل بياناتك أو كلمة المرور، تواصل مع المطبعة.</div>
            </div>
        </CustomerLayout>
    );
}
