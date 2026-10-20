import { FlashMessages } from '@/components/flash-messages';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import { designerNav, type ShellNavGroup } from './nav-config';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { StaffSidebar } from './staff-sidebar';
import { RealtimeNotifications } from './realtime-notifications';
import { StaffTopbar } from './staff-topbar';

/**
 * هيكل شاشات الموظفين (pen: S-007): [مساحة العمل (Topbar + المحتوى)] ثم [Sidebar يمين]. الـDOM LTR-literal كما في التصميم.
 * محتوى الصفحة: col، gap 20، padding 32. موبايل: القائمة drawer.
 */
export function StaffLayout({ children, nav }: { children: React.ReactNode; nav?: ShellNavGroup[]; shell?: string; active?: string; sidebarWidth?: number }) {
    const [open, setOpen] = useState(false);
    const role = usePage<SharedData>().props.auth.user.role;
    const items = nav ?? (role === 'designer' ? designerNav : undefined);
    return (
        <div dir="ltr" className="flex min-h-screen w-full bg-[var(--background)]">
            <div className="flex min-w-0 flex-1 flex-col">
                <StaffTopbar onMenu={() => setOpen(true)} />
                <RealtimeNotifications />
                <main className="flex w-full shrink-0 flex-col gap-[20px] p-[16px] lg:p-[32px]">
                    <FlashMessages />
                    {children}
                </main>
            </div>
            <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
                <StaffSidebar nav={items} />
            </aside>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-[264px] max-w-[85vw] p-0">
                    <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
                    <StaffSidebar nav={items} onNavigate={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
