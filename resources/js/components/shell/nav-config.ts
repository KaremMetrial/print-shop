/**
 * التنقل — مطابق لـ pendev (S-007: «Right sidebar · V3»). أسماء العناصر والمجموعات والأيقونات (lucide) حرفية من التصميم.
 * permission: أي واحدة منها تكفي لظهور العنصر (UX فقط — الباك إند يفحص دائمًا).
 */
export interface ShellNavItem {
    title: string;
    href: string;
    icon: string;
    permission?: string | string[];
}
export interface ShellNavGroup {
    title: string;
    items: ShellNavItem[];
}

export const adminNav: ShellNavGroup[] = [
    {
        title: 'الرئيسية',
        items: [
            { title: 'لوحة التحكم', href: '/dashboard', icon: 'layout-dashboard' },
            { title: 'مركز الإجراءات', href: '/actions', icon: 'list-checks' },
        ],
    },
    {
        title: 'إدارة الأوردرات',
        items: [
            { title: 'الطلبات', href: '/orders', icon: 'clipboard-list', permission: 'orders.view' },
            { title: 'طلبات الأوردرات', href: '/order-requests', icon: 'inbox', permission: 'order_requests.view' },
            { title: 'العملاء', href: '/customers', icon: 'users', permission: 'customers.view' },
        ],
    },
    {
        title: 'المنتجات والتسعير',
        items: [
            { title: 'المنتجات', href: '/products', icon: 'package', permission: 'products.view' },
            { title: 'التسعير', href: '/pricing', icon: 'tags', permission: 'products.view' },
        ],
    },
    {
        title: 'التشغيل',
        items: [
            { title: 'إدارة التصميم', href: '/design', icon: 'pen-tool', permission: 'designers.view' },
            { title: 'التسليم', href: '/delivery', icon: 'truck', permission: 'orders.view' },
        ],
    },
    { title: 'الماليات', items: [{ title: 'المحاسبة', href: '/accounting', icon: 'wallet', permission: ['payments.view_all', 'dashboard.financial.view'] }] },
    {
        title: 'المتابعة',
        items: [
            { title: 'التقارير', href: '/reports', icon: 'chart-no-axes-combined', permission: ['reports.operational.view', 'reports.financial.view'] },
            { title: 'البحث', href: '/search', icon: 'search', permission: 'orders.view' },
        ],
    },
    {
        title: 'الإدارة والنظام',
        items: [
            { title: 'الموظفون', href: '/employees', icon: 'contact', permission: 'employees.view' },
            { title: 'سجل التدقيق', href: '/audit', icon: 'history', permission: 'audit.view' },
            { title: 'الإعدادات', href: '/settings/system', icon: 'settings', permission: ['settings.general.manage', 'settings.orders.manage', 'settings.payments.manage', 'settings.files.manage'] },
        ],
    },
];

export const staffNav = adminNav;

// أدوار أخرى: تُضبط مع شاشاتها (المصمم: Flow 06-B، المحاسب: Flow 08). حاليًا نفس الهيكل مرشَّحًا بالصلاحيات.
export function navForRole(): ShellNavGroup[] {
    return adminNav;
}

// العميل المسجّل (pen: «الرئيسية · أوردراتي · طلباتي · حسابي»)
export const customerNav: { title: string; href: string }[] = [
    { title: 'الرئيسية', href: '/portal' },
    { title: 'أوردراتي', href: '/portal/orders' },
    { title: 'طلباتي', href: '/portal/requests' },
    { title: 'حسابي', href: '/portal/account' },
];

/** المصمم: نفس الشيل المشترك بقائمة مختصرة (BR-071: لا يرى إلا مهامه) */
export const designerNav: ShellNavGroup[] = [
    {
        title: 'مساحة المصمم',
        items: [
            { title: 'مهامي', href: '/designer/tasks', icon: 'layout-dashboard', permission: 'design.tasks.view_own' },
            { title: 'الإشعارات', href: '/notifications', icon: 'bell' },
            { title: 'الملف الشخصي', href: '/settings/profile', icon: 'user-round' },
        ],
    },
];
