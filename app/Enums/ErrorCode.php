<?php

namespace App\Enums;

/**
 * كتالوج أكواد الأخطاء الثابتة (project.md §33.20 + §28.5). الواجهة تعرض message() بالعربي.
 * لا تغيّر قيمة كود موجود — الـFrontend يعتمد عليها.
 */
enum ErrorCode: string
{
    // عامة
    case UNAUTHENTICATED = 'UNAUTHENTICATED';
    case INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION';
    case NOT_FOUND = 'NOT_FOUND';
    case VALIDATION_FAILED = 'VALIDATION_FAILED';
    case CONFLICT = 'CONFLICT';
    case RATE_LIMITED = 'RATE_LIMITED';
    case SERVER_ERROR = 'SERVER_ERROR';
    case STALE_DATA = 'STALE_DATA';
    // Idempotency
    case IDEMPOTENCY_KEY_REQUIRED = 'IDEMPOTENCY_KEY_REQUIRED';
    case IDEMPOTENCY_KEY_REUSED = 'IDEMPOTENCY_KEY_REUSED';
    case IDEMPOTENCY_IN_PROGRESS = 'IDEMPOTENCY_IN_PROGRESS';
    // العملاء والمنتجات
    case CUSTOMER_ALREADY_EXISTS = 'CUSTOMER_ALREADY_EXISTS';
    case PRODUCT_INACTIVE = 'PRODUCT_INACTIVE';
    case QUANTITY_BELOW_MINIMUM = 'QUANTITY_BELOW_MINIMUM';
    case INVALID_PRODUCT_OPTION = 'INVALID_PRODUCT_OPTION';
    // الأوردرات
    case ORDER_LOCKED_FOR_PRINTING = 'ORDER_LOCKED_FOR_PRINTING';
    case ORDER_ALREADY_COMPLETED = 'ORDER_ALREADY_COMPLETED';
    case ORDER_CANCELLED = 'ORDER_CANCELLED';
    case INVALID_ORDER_TRANSITION = 'INVALID_ORDER_TRANSITION';
    case ORDER_HAS_NO_ITEMS = 'ORDER_HAS_NO_ITEMS';
    case CANCEL_REASON_REQUIRED = 'CANCEL_REASON_REQUIRED';
    // الطلبات
    case REQUEST_ALREADY_CLAIMED = 'REQUEST_ALREADY_CLAIMED';
    case REQUEST_ALREADY_DECIDED = 'REQUEST_ALREADY_DECIDED';
    case REJECT_REASON_REQUIRED = 'REJECT_REASON_REQUIRED';
    // التصميم
    case DESIGN_VERSION_STALE = 'DESIGN_VERSION_STALE';
    case DESIGN_ALREADY_APPROVED = 'DESIGN_ALREADY_APPROVED';
    case DESIGN_REOPEN_FORBIDDEN = 'DESIGN_REOPEN_FORBIDDEN';
    case NO_QUALIFIED_DESIGNER = 'NO_QUALIFIED_DESIGNER';
    case CHAT_LOCKED = 'CHAT_LOCKED';
    // المالية
    case PAYMENT_EXCEEDS_DUE = 'PAYMENT_EXCEEDS_DUE';
    case PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED';
    case REFUND_EXCEEDS_DUE = 'REFUND_EXCEEDS_DUE';
    case PRICE_BELOW_PAID = 'PRICE_BELOW_PAID';
    case PRICE_EDIT_AFTER_PAYMENT_FORBIDDEN = 'PRICE_EDIT_AFTER_PAYMENT_FORBIDDEN';
    // روابط/ملفات/بحث
    case LINK_CLOSED = 'LINK_CLOSED';
    case FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED';
    case FILE_TYPE_NOT_ALLOWED = 'FILE_TYPE_NOT_ALLOWED';
    case FILE_TOO_LARGE = 'FILE_TOO_LARGE';
    case IMAGE_SEARCH_UNAVAILABLE = 'IMAGE_SEARCH_UNAVAILABLE';

    public function message(): string
    {
        return match ($this) {
            self::UNAUTHENTICATED => 'يجب تسجيل الدخول أولًا.',
            self::INSUFFICIENT_PERMISSION => 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
            self::NOT_FOUND => 'العنصر المطلوب غير موجود.',
            self::VALIDATION_FAILED => 'البيانات المدخلة غير صالحة.',
            self::CONFLICT => 'تعارضت العملية مع تغيير آخر. حدّث الصفحة وحاول مرة أخرى.',
            self::RATE_LIMITED => 'محاولات كثيرة. حاول بعد قليل.',
            self::SERVER_ERROR => 'حدث خطأ غير متوقع. حاول مرة أخرى.',
            self::STALE_DATA => 'تغيّرت البيانات منذ فتح الصفحة. حدّث الصفحة قبل المتابعة.',
            self::IDEMPOTENCY_KEY_REQUIRED => 'مفتاح منع التكرار مطلوب.',
            self::IDEMPOTENCY_KEY_REUSED => 'تم استخدام مفتاح منع التكرار مع طلب مختلف.',
            self::IDEMPOTENCY_IN_PROGRESS => 'العملية قيد التنفيذ، حاول بعد لحظات.',
            self::CUSTOMER_ALREADY_EXISTS => 'يوجد عميل مسجل بنفس رقم الهاتف.',
            self::PRODUCT_INACTIVE => 'هذا المنتج غير نشط ولا يمكن إضافته لأوردر جديد.',
            self::QUANTITY_BELOW_MINIMUM => 'الكمية أقل من الحد الأدنى المسموح لهذا المنتج.',
            self::INVALID_PRODUCT_OPTION => 'الخيار المحدد غير صالح لهذا المنتج.',
            self::ORDER_LOCKED_FOR_PRINTING => 'الأوردر دخل الطباعة ولا يمكن تعديل المواصفات.',
            self::ORDER_ALREADY_COMPLETED => 'الأوردر مكتمل ولا يمكن تغييره.',
            self::ORDER_CANCELLED => 'الأوردر ملغي.',
            self::INVALID_ORDER_TRANSITION => 'لا يمكن نقل الأوردر إلى هذه الحالة الآن.',
            self::ORDER_HAS_NO_ITEMS => 'لا يمكن حفظ الأوردر بدون بند واحد على الأقل.',
            self::CANCEL_REASON_REQUIRED => 'يجب كتابة سبب الإلغاء.',
            self::REQUEST_ALREADY_CLAIMED => 'هذا الطلب قيد المراجعة بواسطة موظف آخر.',
            self::REQUEST_ALREADY_DECIDED => 'تم اتخاذ قرار بشأن هذا الطلب بالفعل.',
            self::REJECT_REASON_REQUIRED => 'يجب اختيار سبب الرفض.',
            self::DESIGN_VERSION_STALE => 'تغيّرت ملفات التصميم منذ فتح المعاينة. راجع النسخة المحدثة قبل الاعتماد.',
            self::DESIGN_ALREADY_APPROVED => 'التصميم تم اعتماده ولا يمكن تعديل هذه النسخة.',
            self::DESIGN_REOPEN_FORBIDDEN => 'لا يمكن إعادة فتح التصميم بعد بدء الطباعة.',
            self::NO_QUALIFIED_DESIGNER => 'لا يوجد مصمم متاح يطابق تخصص هذا المنتج.',
            self::CHAT_LOCKED => 'المحادثة مقفولة.',
            self::PAYMENT_EXCEEDS_DUE => 'قيمة الدفعة أكبر من المبلغ المتبقي.',
            self::PAYMENT_ALREADY_PROCESSED => 'تمت معالجة هذه الدفعة بالفعل.',
            self::REFUND_EXCEEDS_DUE => 'قيمة الاسترداد أكبر من المبلغ المستحق رده.',
            self::PRICE_BELOW_PAID => 'لا يمكن أن يقل إجمالي الأوردر عن المبلغ المدفوع.',
            self::PRICE_EDIT_AFTER_PAYMENT_FORBIDDEN => 'ليس لديك صلاحية تعديل السعر بعد تسجيل أول دفعة.',
            self::LINK_CLOSED => 'هذا الطلب لم يعد متاحًا من خلال الرابط. للاستفسار يُرجى التواصل مع المطبعة.',
            self::FILE_ACCESS_DENIED => 'ليس لديك صلاحية الوصول إلى هذا الملف.',
            self::FILE_TYPE_NOT_ALLOWED => 'نوع الملف غير مسموح به.',
            self::FILE_TOO_LARGE => 'حجم الملف أكبر من الحد المسموح.',
            self::IMAGE_SEARCH_UNAVAILABLE => 'تعذر إتمام البحث بالصورة حاليًا.',
        };
    }

    public function status(): int
    {
        return match ($this) {
            self::UNAUTHENTICATED => 401,
            self::INSUFFICIENT_PERMISSION, self::FILE_ACCESS_DENIED, self::DESIGN_REOPEN_FORBIDDEN, self::PRICE_EDIT_AFTER_PAYMENT_FORBIDDEN => 403,
            self::NOT_FOUND => 404,
            self::VALIDATION_FAILED, self::QUANTITY_BELOW_MINIMUM, self::INVALID_PRODUCT_OPTION, self::ORDER_HAS_NO_ITEMS, self::CANCEL_REASON_REQUIRED,
            self::REJECT_REASON_REQUIRED, self::PAYMENT_EXCEEDS_DUE, self::REFUND_EXCEEDS_DUE, self::PRICE_BELOW_PAID, self::IDEMPOTENCY_KEY_REUSED,
            self::FILE_TYPE_NOT_ALLOWED, self::FILE_TOO_LARGE, self::PRODUCT_INACTIVE => 422,
            self::IDEMPOTENCY_KEY_REQUIRED => 400,
            self::RATE_LIMITED => 429,
            self::SERVER_ERROR => 500,
            self::LINK_CLOSED => 410,
            self::IMAGE_SEARCH_UNAVAILABLE => 503,
            default => 409,
        };
    }
}
