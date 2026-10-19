import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bell, CircleUser } from 'lucide-react';
import { customerNav } from './nav-config';

/** واجهة العميل المسجّل — مستقلة عن تنقل الموظفين: الرئيسية · أوردراتي · طلباتي · حسابي (pen: V3 canonical navigation) */
export function CustomerLayout({ children }: { children: React.ReactNode }) {
    const { name, auth } = usePage<SharedData>().props;
    const { url } = usePage();
    const items = customerNav;
    return (
        <div className="bg-background flex min-h-screen flex-col">
            <header className="bg-surface border-border h-topbar flex shrink-0 items-center gap-4 border-b px-4 lg:px-8">
                <span className="text-primary text-lg font-bold">{name}</span>
                <nav className="flex flex-1 items-center gap-1 overflow-x-auto" aria-label="القائمة">
                    {items.map((i) => (
                        <Link key={i.href} href={i.href} className={cn('rounded-control h-11 px-3 text-sm leading-[2.75rem]', url.startsWith(i.href) ? 'bg-primary-soft text-primary font-semibold' : 'text-text-secondary font-medium')}>
                            {i.title}
                        </Link>
                    ))}
                </nav>
                <Button variant="ghost" size="icon" aria-label="الإشعارات">
                    <Bell className="text-muted-foreground" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="حسابي">
                            <CircleUser className="text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60 p-2">
                        <span className="text-ink block px-3 py-2 text-sm">{auth.user.name}</span>
                        <DropdownMenuItem asChild className="h-11 px-3">
                            <Link href="/customer/logout" method="post" as="button" className="w-full text-start">
                                تسجيل الخروج
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-8">{children}</main>
        </div>
    );
}
