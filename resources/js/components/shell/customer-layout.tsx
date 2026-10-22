import { FlashMessages } from '@/components/flash-messages';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { type ShellNavGroup } from './nav-config';
import { StaffSidebar } from './staff-sidebar';

const portalNav: ShellNavGroup[] = [
    {
        title: '',
        items: [
            { title: 'لوحة التحكم', href: '/portal', icon: 'layout-dashboard' },
            { title: 'أوردراتي', href: '/portal/orders', icon: 'package' },
            { title: 'إنشاء طلب أوردر', href: '/portal/requests/new', icon: 'square-plus' },
            { title: 'طلباتي', href: '/portal/requests', icon: 'clipboard-list' },
            { title: 'الملف الشخصي', href: '/portal/account', icon: 'user' },
        ],
    },
];

/** بوابة العميل المسجّل: نفس الشيل المشترك (شريط جانبي + علوي) بقائمة العميل. جلسة منفصلة عن الموظفين. */
export function CustomerLayout({ children, mobile }: { children: ReactNode; mobile?: ReactNode }) {
    const portal = (usePage<SharedData & { portal?: { name: string; phone: string } | null }>().props as { portal?: { name: string; phone: string } | null }).portal;
    const [open, setOpen] = useState(false);
    const side = <StaffSidebar nav={portalNav} subtitle="بوابة العملاء" footer={{ a: portal?.name ?? '', b: portal?.phone ?? '' }} onNavigate={() => setOpen(false)} />;
    return (
        <>
            {mobile}
        <div dir="ltr" className={`min-h-screen w-full bg-[var(--background)] ${mobile ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex h-[66px] w-full shrink-0 items-center gap-[16px] border-solid bg-[var(--surface)] p-[0px_24px] [border-color:var(--border)] [border-width:0px_0px_1px_0px]">
                    <button type="button" onClick={() => setOpen(true)} aria-label="فتح القائمة" className="text-[var(--muted-foreground)] lg:hidden">
                        <Menu className="size-6" />
                    </button>
                    <button type="button" onClick={() => router.post('/portal/logout')} className="text-left text-[13px] text-[var(--muted-foreground)]">
                        تسجيل الخروج
                    </button>
                    <div className="flex flex-1 flex-col items-end">
                        <div className="text-left text-[14px] leading-[22px] font-[700] text-[var(--ink)]">{portal?.name}</div>
                        <div className="text-left text-[11px] text-[var(--muted-foreground)]">عميل مسجّل</div>
                    </div>
                </div>
                <main className="flex w-full shrink-0 flex-col gap-[20px] p-[16px] lg:p-[32px]">
                    <FlashMessages />
                    {children}
                </main>
            </div>
            <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">{side}</aside>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-[264px] max-w-[85vw] p-0">
                    <SheetTitle className="sr-only">القائمة</SheetTitle>
                    {side}
                </SheetContent>
            </Sheet>
        </div>
        </>
    );
}
