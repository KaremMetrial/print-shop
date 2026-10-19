import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Boxes, ClipboardList, Palette, Printer, Search, Settings, Truck, Users, Wallet, LayoutGrid, FileText, BellRing } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    { title: 'لوحة التحكم', url: '/dashboard', icon: LayoutGrid },
    { title: 'الأوردرات', url: '/orders', icon: Printer },
    { title: 'طلبات الأوردرات', url: '/order-requests', icon: ClipboardList },
    { title: 'العملاء', url: '/customers', icon: Users },
    { title: 'المنتجات والتسعير', url: '/products', icon: Boxes },
    { title: 'إدارة التصميم', url: '/design', icon: Palette },
    { title: 'الحسابات', url: '/accounting', icon: Wallet },
    { title: 'التوصيل', url: '/delivery', icon: Truck },
    { title: 'التقارير', url: '/reports', icon: FileText },
    { title: 'البحث', url: '/search', icon: Search },
    { title: 'مركز الإجراءات', url: '/actions', icon: BellRing },
    { title: 'الإعدادات', url: '/settings/profile', icon: Settings },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar side="right" collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
