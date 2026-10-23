<?php

namespace App\Support;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\Role;
use App\Services\Orders\OrderStatusLabels;

/** تسميات عربية موحّدة لسجل التدقيق: الإجراءات، الكيانات، الأدوار، أسماء الحقول، وقيمها. أي مفتاح جديد يُضاف هنا (يفحصه اختبار). */
class Labels
{
    public const ACTIONS = [
        'auth.login' => 'تسجيل دخول', 'auth.logout' => 'تسجيل خروج', 'auth.login_failed' => 'محاولة دخول فاشلة', 'auth.login_blocked' => 'دخول محجوب',
        'action.completed' => 'إتمام إجراء عمل',
        'category.created' => 'إضافة تصنيف', 'category.updated' => 'تعديل تصنيف', 'category.toggled' => 'تفعيل/إيقاف تصنيف',
        'customer.created' => 'إضافة عميل', 'customer.updated' => 'تعديل بيانات عميل', 'customer.tier_changed' => 'تغيير شريحة عميل',
        'customer.platform_access_enabled' => 'تفعيل دخول العميل للمنصة', 'customer.platform_access_disabled' => 'إيقاف دخول العميل للمنصة', 'customer.password_reset' => 'إعادة تعيين كلمة مرور عميل',
        'designer.availability_changed' => 'تغيير توفّر مصمم', 'designer.specialties_changed' => 'تغيير تخصصات مصمم',
        'employee.created' => 'إضافة موظف', 'employee.updated' => 'تعديل موظف', 'employee.activated' => 'تفعيل موظف', 'employee.deactivated' => 'إيقاف موظف',
        'employee.password_reset' => 'إعادة تعيين كلمة مرور موظف', 'employee.permissions_changed' => 'تغيير صلاحيات موظف', 'employee.profile_updated' => 'تحديث الملف الشخصي',
        'item.design_started' => 'بدء تصميم بند', 'item.design_submitted' => 'إرسال نسخة تصميم', 'item.design_approved' => 'اعتماد تصميم بند', 'item.design_reopened' => 'إعادة فتح تصميم معتمد',
        'item.assigned' => 'إسناد بند لمصمم', 'item.designer_assigned' => 'إسناد مصمم لبند', 'item.designer_changed' => 'تغيير مصمم بند',
        'order.created' => 'إنشاء أوردر', 'order.updated' => 'تعديل أوردر', 'order.cancelled' => 'إلغاء أوردر', 'order.status_changed' => 'تغيير حالة أوردر',
        'order.item_added' => 'إضافة بند للأوردر', 'order.item_updated' => 'تعديل بند في الأوردر', 'order.item_cancelled' => 'إلغاء بند من الأوردر',
        'invoice.issued' => 'إصدار فاتورة', 'invoice.voided' => 'إلغاء فاتورة',
        'order_link.regenerated' => 'إعادة توليد رابط الأوردر', 'order_link.suspended' => 'إيقاف رابط الأوردر', 'order_link.reactivated' => 'إعادة تفعيل رابط الأوردر',
        'order_request.submitted' => 'إرسال طلب أوردر', 'order_request.review_started' => 'بدء مراجعة طلب', 'order_request.review_released' => 'فكّ حجز مراجعة طلب', 'order_request.edited' => 'تعديل طلب أثناء المراجعة',
        'order_request.accepted' => 'قبول طلب أوردر', 'order_request.rejected' => 'رفض طلب أوردر',
        'payment.recorded' => 'تسجيل دفعة', 'payment.corrected' => 'تصحيح دفعة', 'payment.voided' => 'إلغاء دفعة',
        'payment_proof.approved' => 'اعتماد إثبات دفع', 'payment_proof.rejected' => 'رفض إثبات دفع',
        'product.created' => 'إضافة منتج', 'product.updated' => 'تعديل منتج', 'product.status_changed' => 'تغيير حالة منتج', 'product.price_changed' => 'تغيير سعر منتج',
        'product.option_group_updated' => 'تعديل مجموعة خيارات', 'product.option_group_created' => 'إضافة مجموعة خيارات', 'product.routing_updated' => 'تعديل توزيع التصميم',
        'tier.created' => 'إضافة شريحة سعر', 'tier.updated' => 'تعديل شريحة سعر', 'pricing_tier.created' => 'إضافة شريحة سعر', 'pricing_tier.updated' => 'تعديل شريحة سعر',
        'refund.obligation_opened' => 'فتح التزام استرداد', 'refund.paid' => 'صرف استرداد',
        'settings.updated' => 'تعديل إعدادات النظام',
    ];

    public const ENTITIES = [
        'Order' => 'أوردر', 'OrderItem' => 'بند أوردر', 'OrderRequest' => 'طلب أوردر', 'OrderLink' => 'رابط أوردر', 'Customer' => 'عميل', 'User' => 'موظف',
        'Payment' => 'دفعة', 'Product' => 'منتج', 'ProductCategory' => 'تصنيف', 'PricingTier' => 'شريحة سعر', 'DesignVersion' => 'نسخة تصميم',
        'ProductOptionGroup' => 'مجموعة خيارات', 'Role' => 'دور', 'Invoice' => 'فاتورة',
    ];

    public const FIELDS = [
        'address' => 'العنوان', 'allocations' => 'التوزيعات', 'amount_due_minor' => 'المبلغ المستحق', 'amount_minor' => 'المبلغ', 'by' => 'بواسطة', 'changes' => 'التغييرات',
        'customer_id' => 'العميل', 'delivery_address' => 'عنوان التوصيل', 'delivery_fee' => 'رسوم التوصيل', 'delivery_fee_minor' => 'رسوم التوصيل', 'delivery_method' => 'طريقة التسليم',
        'designer_id' => 'المصمم', 'design_state' => 'حالة التصميم', 'discount_amount' => 'قيمة الخصم', 'discount_type' => 'نوع الخصم', 'discount_value' => 'قيمة/نسبة الخصم',
        'email' => 'البريد الإلكتروني', 'from' => 'من', 'grand_total' => 'الإجمالي', 'grand_total_minor' => 'الإجمالي', 'group' => 'المجموعة', 'is_active' => 'نشط',
        'item_id' => 'البند', 'item_total_minor' => 'إجمالي البند', 'items' => 'البنود', 'mode' => 'النمط', 'name' => 'الاسم', 'notes' => 'الملاحظات',
        'notification_mode' => 'وضع الإشعارات', 'number' => 'الرقم', 'obligation_id' => 'التزام الاسترداد', 'order_id' => 'الأوردر', 'paid_minor' => 'المدفوع',
        'phone' => 'الهاتف', 'pricing_tier_id' => 'شريحة السعر', 'printing_eta_days' => 'مدة الطباعة (أيام)', 'product' => 'المنتج', 'proof_id' => 'إثبات الدفع',
        'quantity' => 'الكمية', 'reason' => 'السبب', 'reviewer_id' => 'المراجع', 'role' => 'الدور', 'specialty_ids' => 'التخصصات', 'status' => 'الحالة', 'target' => 'الأوردر المستهدف',
        'to' => 'إلى', 'values' => 'القيم', 'version' => 'النسخة', 'version_id' => 'النسخة', 'base_unit_price' => 'سعر الوحدة الأساسي', 'shop.name' => 'اسم المطبعة',
        'shop.branch' => 'الفرع', 'shop.phone' => 'هاتف المطبعة', 'orders.default_eta_days' => 'مدة الطباعة الافتراضية', 'orders.auto_complete_hours' => 'ساعات الإتمام التلقائي',
        'orders.status_label.DESIGN_STAGE' => 'مسمى حالة مرحلة التصميم', 'orders.status_label.IN_PRINTING' => 'مسمى حالة قيد الطباعة',
        'orders.status_label.READY_FOR_PICKUP' => 'مسمى حالة جاهز للاستلام', 'orders.status_label.READY_FOR_DELIVERY' => 'مسمى حالة جاهز للتوصيل',
        'orders.status_label.OUT_FOR_DELIVERY' => 'مسمى حالة خرج للتوصيل', 'orders.status_label.COMPLETED' => 'مسمى حالة مكتمل', 'orders.status_label.CANCELLED' => 'مسمى حالة ملغي',
        'payments.methods' => 'طرق الدفع المتاحة', 'files.max_mb' => 'حد حجم الملف (MB)', 'availability' => 'التوفر', 'method' => 'طريقة الدفع', 'type' => 'النوع',
        'invoice_id' => 'الفاتورة', 'is_default' => 'افتراضي', 'sort_order' => 'الترتيب', 'old_amount' => 'المبلغ السابق', 'new_amount' => 'المبلغ الجديد', 'permissions' => 'الصلاحيات',
    ];

    public const VALUES = [
        'DESIGN_STAGE' => 'مرحلة التصميم', 'NEW' => 'جديد', 'IN_DESIGN' => 'قيد التصميم', 'REVISION_REQUESTED' => 'مطلوب تعديل', 'AWAITING_APPROVAL' => 'بانتظار الاعتماد', 'APPROVED' => 'معتمد',
        'PENDING' => 'بانتظار المراجعة', 'IN_REVIEW' => 'قيد المراجعة', 'ACCEPTED' => 'مقبول', 'REJECTED' => 'مرفوض', 'ACTIVE' => 'نشط', 'INACTIVE' => 'غير نشط',
        'PICKUP' => 'استلام من المطبعة', 'DELIVERY' => 'توصيل', 'NONE' => 'بدون', 'PERCENT' => 'نسبة', 'FIXED' => 'مبلغ ثابت', 'PERCENTAGE' => 'نسبة', 'FIXED_BASE' => 'أسعار ثابتة',
        'CONFIRMED' => 'مؤكدة', 'VOIDED' => 'ملغاة', 'AVAILABLE' => 'متاح', 'BUSY' => 'مشغول', 'UNAVAILABLE' => 'غير متاح', 'STAFF_CREATED' => 'موظف المطبعة', 'ACCEPTED_REQUEST' => 'طلب عميل',
        'WHATSAPP' => 'واتساب', 'EMAIL' => 'بريد إلكتروني', 'SMS' => 'رسالة نصية', 'INTERNAL' => 'داخل النظام', 'CUSTOMER' => 'عميل',
    ];

    public static function action(string $code): string
    {
        return self::ACTIONS[$code] ?? $code;
    }

    public static function entity(?string $type): string
    {
        $b = class_basename((string) $type);

        return self::ENTITIES[$b] ?? ($b ?: '—');
    }

    public static function role(?string $code): ?string
    {
        if ($code === null) {
            return null;
        }
        if ($code === 'CUSTOMER') {
            return 'عميل';
        }

        return Role::tryFrom($code)?->label() ?? $code;
    }

    public static function field(string $key): string
    {
        return self::FIELDS[$key] ?? $key;
    }

    public static function translateValue(string $key, mixed $v): string
    {
        if (is_bool($v)) {
            return $v ? 'نعم' : 'لا';
        }
        if ($v === null || $v === '') {
            return '—';
        }
        if (is_array($v)) {
            return implode('، ', array_map(fn ($x) => is_array($x) ? json_encode($x, JSON_UNESCAPED_UNICODE) : self::translateValue($key, $x), $v));
        }
        $s = (string) $v;
        if ($key === 'method' || $key === 'payments.methods') {
            return implode('، ', array_map(fn ($m) => PaymentMethod::label_of(trim($m)), explode(',', $s)));
        }
        if (str_ends_with($key, '_minor') && is_numeric($v)) {
            return number_format(((int) $v) / 100, 2).' ج.م';
        }
        if ($key === 'status' && OrderStatus::tryFrom($s)) {
            return app(OrderStatusLabels::class)->label(OrderStatus::from($s));
        }

        return self::VALUES[$s] ?? $s;
    }

    /**
     * @param  array<string, mixed>|null  $values
     * @return list<array{k: string, v: string}>
     */
    public static function fields(?array $values): array
    {
        if (! $values) {
            return [];
        }
        $o = [];
        foreach ($values as $k => $v) {
            $o[] = ['k' => self::field((string) $k), 'v' => self::translateValue((string) $k, $v)];
        }

        return $o;
    }
}
