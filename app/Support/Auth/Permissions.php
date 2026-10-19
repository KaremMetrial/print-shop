<?php

namespace App\Support\Auth;

use App\Enums\Role;

/**
 * كتالوج الصلاحيات (project.md §4.2) + المصفوفة الافتراضية لكل دور.
 * مصدر الحقيقة في الكود؛ الـSeeder يزامنها مع الجداول (idempotent).
 */
final class Permissions
{
    /** module => [key => وصف عربي] */
    public const CATALOG = [
        'dashboard' => ['dashboard.operational.view' => 'عرض لوحة التشغيل', 'dashboard.financial.view' => 'عرض اللوحة المالية'],
        'customers' => [
            'customers.view' => 'عرض العملاء', 'customers.create' => 'إضافة عميل', 'customers.update' => 'تعديل عميل',
            'customers.view_balance' => 'عرض المستحق على العميل', 'customers.view_ledger' => 'عرض كشف حساب العميل',
            'customers.platform_access.manage' => 'إدارة دخول العميل للمنصة', 'customers.password_reset.handle' => 'معالجة استرجاع كلمة مرور العميل',
        ],
        'orders' => [
            'orders.view' => 'عرض الأوردرات', 'orders.create' => 'إنشاء أوردر', 'orders.update' => 'تعديل أوردر', 'orders.items.manage' => 'إدارة بنود الأوردر',
            'orders.pricing.edit' => 'تعديل سعر الأوردر', 'orders.discount.apply' => 'تطبيق خصم على الأوردر', 'orders.printing.complete' => 'إتمام الطباعة',
            'orders.delivery.update' => 'تحديث التوصيل', 'orders.complete' => 'إتمام الأوردر', 'orders.cancel' => 'إلغاء أوردر',
            'orders.links.manage' => 'إدارة رابط الأوردر', 'orders.files.view' => 'عرض ملفات الأوردر',
        ],
        'order_requests' => [
            'order_requests.view' => 'عرض طلبات الأوردرات', 'order_requests.review' => 'بدء مراجعة طلب',
            'order_requests.accept' => 'قبول طلب', 'order_requests.reject' => 'رفض طلب',
        ],
        'catalog' => [
            'products.view' => 'عرض المنتجات', 'products.manage' => 'إدارة المنتجات', 'pricing.tiers.manage' => 'إدارة شرائح الأسعار', 'pricing.options.manage' => 'إدارة خيارات التسعير',
        ],
        'design' => [
            'designers.view' => 'عرض المصممين', 'designers.assignment.manage' => 'إسناد المهام للمصممين', 'designers.availability.manage' => 'إدارة توفر المصممين',
            'design.tasks.view_own' => 'عرض مهامي', 'design.tasks.start' => 'بدء التصميم', 'design.versions.submit' => 'رفع نسخة تصميم',
            'design.versions.edit_unapproved' => 'تعديل نسخة غير معتمدة', 'design.approval.reopen' => 'إعادة فتح تصميم معتمد',
            'design.chat.read' => 'قراءة محادثات التصميم', 'design.chat.send_as_designer' => 'الرد كمصمم', 'design.chat.admin_participate' => 'مشاركة الإدارة في الشات',
        ],
        'finance' => [
            'payments.create' => 'تسجيل دفعة', 'payments.view_summary' => 'عرض ملخص المدفوعات', 'payments.view_all' => 'عرض كل المدفوعات',
            'payments.proofs.review' => 'مراجعة إثباتات الدفع', 'payments.correct' => 'تصحيح دفعة', 'refunds.view' => 'عرض المستردات',
            'refunds.record' => 'تسجيل رد مبلغ', 'invoices.view' => 'عرض الفواتير', 'invoices.issue' => 'إصدار الفواتير والإيصالات',
        ],
        'reports' => ['reports.operational.view' => 'التقارير التشغيلية', 'reports.financial.view' => 'التقارير المالية'],
        'employees' => [
            'employees.view' => 'عرض الموظفين', 'employees.manage_staff' => 'إدارة الموظفين العاديين', 'employees.manage_admins' => 'إدارة المديرين',
            'permissions.manage_staff' => 'إدارة صلاحيات الموظفين', 'permissions.manage_admins' => 'إدارة صلاحيات المديرين',
        ],
        'settings' => [
            'settings.general.manage' => 'الإعدادات العامة', 'settings.orders.manage' => 'إعدادات الأوردرات', 'settings.payments.manage' => 'إعدادات الدفع',
            'settings.whatsapp.manage' => 'إعدادات واتساب', 'settings.security.manage' => 'إعدادات الأمان', 'settings.files.manage' => 'إعدادات الملفات',
        ],
        'audit' => ['audit.view' => 'عرض سجل التدقيق', 'search.image.use' => 'البحث بالصورة'],
    ];

    /** صلاحيات لا يملكها Admin ولا تُمنح بالتفويض (للـSuper Admin فقط). */
    public const SUPER_ADMIN_ONLY = ['employees.manage_admins', 'permissions.manage_admins', 'settings.security.manage'];

    /** صلاحيات يجوز للإدارة تفويضها لـData Entry (§4.6). */
    public const DELEGABLE_TO_DATA_ENTRY = ['orders.discount.apply', 'customers.platform_access.manage', 'customers.password_reset.handle'];

    /** قيود ثابتة لا تُتجاوز بالتفويض (§4.3). */
    public const HARD_DENY = [
        'DATA_ENTRY' => ['design.chat.send_as_designer', 'design.chat.admin_participate', 'payments.correct', 'refunds.record', 'orders.cancel', 'design.approval.reopen', 'dashboard.financial.view', 'customers.view_ledger', 'payments.view_all'],
        'DESIGNER' => ['orders.pricing.edit', 'orders.discount.apply', 'orders.cancel', 'orders.printing.complete', 'orders.complete', 'dashboard.financial.view', 'customers.view_balance', 'customers.view_ledger', 'payments.create', 'payments.view_summary', 'payments.view_all', 'payments.correct', 'refunds.view', 'refunds.record', 'invoices.view', 'invoices.issue', 'reports.financial.view', 'design.approval.reopen'],
        'ACCOUNTANT' => ['orders.cancel', 'design.approval.reopen', 'designers.assignment.manage', 'employees.manage_admins', 'permissions.manage_admins'],
    ];

    public static function isHardDenied(Role $role, string $permission): bool
    {
        if ($role !== Role::SuperAdmin && in_array($permission, self::SUPER_ADMIN_ONLY, true)) {
            return true;
        }

        return in_array($permission, self::HARD_DENY[$role->value] ?? [], true);
    }

    /** @return list<string> */
    public static function all(): array
    {
        return array_merge(...array_values(array_map('array_keys', self::CATALOG)));
    }

    /** @return list<string> */
    public static function forRole(Role $role): array
    {
        return match ($role) {
            Role::SuperAdmin => self::all(),
            Role::Admin => array_values(array_diff(self::all(), self::SUPER_ADMIN_ONLY)),
            Role::DataEntry => [
                'dashboard.operational.view', 'customers.view', 'customers.create', 'customers.update', 'customers.view_balance',
                'orders.view', 'orders.create', 'orders.update', 'orders.items.manage', 'orders.pricing.edit', 'orders.printing.complete',
                'orders.delivery.update', 'orders.complete', 'orders.links.manage', 'orders.files.view',
                'order_requests.view', 'order_requests.review', 'order_requests.accept', 'order_requests.reject',
                'products.view', 'designers.view', 'designers.assignment.manage', 'design.chat.read',
                'payments.create', 'payments.view_summary', 'invoices.view', 'search.image.use',
            ],
            Role::Designer => [
                'design.tasks.view_own', 'design.tasks.start', 'design.versions.submit', 'design.versions.edit_unapproved',
                'design.chat.read', 'design.chat.send_as_designer',
            ],
            Role::Accountant => [
                'dashboard.financial.view', 'customers.view', 'customers.view_balance', 'customers.view_ledger', 'orders.view',
                'payments.create', 'payments.view_summary', 'payments.view_all', 'payments.proofs.review', 'payments.correct',
                'refunds.view', 'refunds.record', 'invoices.view', 'invoices.issue', 'reports.financial.view',
                'customers.password_reset.handle', // المسؤول والمحاسب (S-031)
            ],
        };
    }
}
