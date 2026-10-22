<?php

namespace App\Support;

/** بيانات عينة مطابقة لما هو مرسوم في pendev/untitled.pen — للمقارنة البصرية في بيئة local فقط (?fixture=pen). */
final class PenFixtures
{
    /** M-A08 — طلباتي على الموبايل. @return array<string, mixed> */
    public static function portalRequests(): array
    {
        return ['cards' => [
            ['id' => 187, 'number' => 'REQ-0187', 'status' => 'بانتظار المراجعة', 'status_key' => 'PENDING', 'items' => 2, 'total_minor' => 248000, 'at' => '2026-10-17T10:00:00+03:00', 'order_number' => null],
            ['id' => 186, 'number' => 'REQ-0186', 'status' => 'مقبول', 'status_key' => 'ACCEPTED', 'items' => 2, 'total_minor' => 260000, 'at' => '2026-10-14T10:00:00+03:00', 'order_number' => 'ORD-0153'],
        ]];
    }

    /** M-A10 — أوردراتي على الموبايل. @return array<string, mixed> */
    public static function portalOrders(): array
    {
        return [
            'summary' => ['active' => 1, 'done' => 0, 'cancelled' => 0],
            'cards' => [['id' => 153, 'number' => 'ORD-0153', 'status' => 'مرحلة التصميم', 'status_key' => 'IN_DESIGN', 'products' => ['كروت شخصية', 'فلاير'], 'total_minor' => 260000]],
        ];
    }

    /** M-A03..A07 — معالج طلب الأوردر على الموبايل. @return array<string, mixed> */
    public static function portalWizard(int $step): array
    {
        $g = fn (int $id, string $name, array $values) => ['id' => $id, 'name' => $name, 'selection_type' => 'SINGLE', 'is_required' => true,
            'values' => array_map(fn ($v, $k) => ['id' => $id * 10 + $k, 'name' => $v, 'addition_minor' => 0], $values, array_keys($values))];

        return [
            'products' => [
                ['id' => 1, 'name' => 'كروت شخصية', 'description' => 'بطاقات للتواصل والتعريف', 'minimum_quantity' => 100, 'unit' => 'كارت', 'groups' => [
                    $g(1, 'نوع الورق', ['كوشيه 300 جم', 'كوشيه 350 جم']), $g(2, 'الألوان', ['ألوان كاملة', 'لون واحد']), $g(3, 'عدد الأوجه', ['وجه واحد', 'وجهان']), $g(4, 'التغليف', ['تغليف مطفي', 'تغليف لامع'])]],
                ['id' => 2, 'name' => 'فلاير', 'description' => 'منشورات دعائية خفيفة', 'minimum_quantity' => 100, 'unit' => 'فلاير', 'groups' => []],
                ['id' => 3, 'name' => 'بروشور', 'description' => 'مطوية تعريفية متعددة الصفحات', 'minimum_quantity' => 50, 'unit' => 'بروشور', 'groups' => []],
            ],
            'pen' => ['step' => max(1, min(5, $step)), 'total_minor' => 248000, 'lines' => [
                ['product_id' => 1, 'quantity' => '1000', 'options' => [1 => [10], 2 => [20], 3 => [31], 4 => [40]], 'files' => [['id' => 1, 'name' => 'logo-reference.png']]],
                ['product_id' => 2, 'quantity' => '400', 'options' => [], 'files' => [['id' => 2, 'name' => 'flyer-text.pdf']]],
            ]],
        ];
    }

    /** M-A02 — لوحة العميل على الموبايل. @return array<string, mixed> */
    public static function portalDashboard(): array
    {
        return [
            'greeting_name' => 'شركة الأفق للإعلان',
            'requests' => 1,
            'awaiting' => [['order_id' => 153, 'item_id' => 1, 'name' => 'كروت شخصية', 'order_number' => 'ORD-0153']],
            'active' => [['id' => 153, 'number' => 'ORD-0153', 'status' => 'مرحلة التصميم', 'remaining_minor' => 260000, 'total_minor' => 260000]],
            'recent_requests' => [['id' => 187, 'number' => 'REQ-0187', 'status' => 'بانتظار المراجعة'], ['id' => 186, 'number' => 'REQ-0186', 'status' => 'مقبول']],
        ];
    }

    /** @return array<string, mixed> */
    public static function dashboard(): array
    {
        return [
            'user_first_name' => 'أحمد',
            'now' => '2025-06-18T09:42:00+03:00',
            'urgent' => ['late' => 3, 'unassigned' => 4],
            'kpis' => ['pending_requests' => 7, 'unassigned_items' => 4, 'follow_up' => 12, 'revisions' => 3, 'awaiting_approval' => 9, 'in_printing' => 14, 'ready' => 14],
            'summary' => ['awaiting_approval' => 9, 'in_design' => 12, 'out_for_delivery' => 5, 'completed' => 124, 'pickup' => 8, 'delivery' => 6],
            'finance' => ['collected_today' => 1845000, 'collected_week' => 12875000, 'receivables' => 8640000, 'order_value_today' => 4260000, 'refund_due' => 125000],
            'alerts' => [
                ['title' => 'موعد تسليم قريب', 'tone' => 'warn', 'text' => 'طلب 0148 لشركة النور مستحق اليوم الساعة 02:00 م.'],
                ['title' => 'ملف يحتاج مراجعة', 'tone' => 'danger', 'text' => 'طلب 0146: دقة ملف البانر أقل من المطلوب للطباعة.'],
            ],
            'actions' => ['total' => 14, 'items' => [
                ['title' => 'مراجعة طلب أوردر جديد', 'sub' => 'شركة النور • منذ يومين', 'href' => '/order-requests'],
                ['title' => 'إسناد تصميم غير معيّن', 'sub' => 'بطاقات أعمال • طلب 0149', 'href' => '/design'],
                ['title' => 'إرسال إشعار واتساب يدوي', 'sub' => 'مقهى ورد • طلب 0142', 'href' => '/actions'],
            ]],
            'recent' => [
                ['id' => 148, 'no' => '0148', 'subject' => 'شركة النور / بروشور', 'status' => 'قيد الطباعة', 'tone' => 'info', 'due' => '18 يونيو', 'total_minor' => 485000, 'href' => '/orders/148'],
                ['id' => 147, 'no' => '0147', 'subject' => 'مقهى ورد / منيو', 'status' => 'قيد التصميم', 'tone' => 'design', 'due' => '19 يونيو', 'total_minor' => 120000, 'href' => '/orders/147'],
                ['id' => 146, 'no' => '0146', 'subject' => 'مؤسسة مدار / بانر', 'status' => 'تعديل مطلوب', 'tone' => 'warn', 'due' => '20 يونيو', 'total_minor' => 640000, 'href' => '/orders/146'],
            ],
        ];
    }

    /** @return array<string, mixed> S-065: موظف واحد معروف بدون بيانات محفوظة إضافية (كما في التصميم) */
    public static function employees(): array
    {
        $row = ['id' => 1, 'name' => 'منى إبراهيم', 'email' => null, 'phone' => null, 'role' => 'DESIGNER', 'role_label' => 'مصمم', 'status' => null, 'created_at' => null, 'last_login_at' => null, 'can_edit' => true];

        return [
            'employees' => ['data' => [$row], 'current_page' => 1, 'last_page' => 1],
            'selected' => $row + ['extra_permissions' => null, 'can_permissions' => true],
        ];
    }

    /** @return array<string, mixed> S-022 */
    public static function customers(): array
    {
        $r = fn (int $i, string $name, string $phone, string $tier, bool $acc, int $orders, int $bal, string $date) => ['id' => $i, 'code' => 'CUS-'.str_pad((string) $i, 4, '0', STR_PAD_LEFT), 'name' => $name, 'phone' => $phone, 'tier' => $tier, 'platform_access' => $acc, 'orders_count' => $orders, 'balance_minor' => $bal, 'created_at' => $date.'T09:00:00+03:00'];

        return [
            'customers' => ['data' => [
                $r(1, 'شركة النور للدعاية', '010 2345 6789', 'ذهبية', true, 14, 0, '2025-06-12'),
                $r(2, 'مؤسسة مدار التجارية', '011 8765 4321', 'فضية', true, 9, 325000, '2025-05-28'),
                $r(3, 'مقهى ورد', '012 3456 7890', 'افتراضية', false, 6, 0, '2025-05-17'),
                $r(4, 'شركة بيان للطباعة', '010 9876 1203', 'ذهبية', true, 11, 1138000, '2025-05-02'),
                $r(5, 'محمود علي', '015 2233 4455', 'افتراضية', false, 4, 75000, '2025-04-21'),
                $r(6, 'عيادات الشفاء', '011 2234 5566', 'فضية', true, 8, 0, '2025-04-08'),
                $r(7, 'مجموعة الأفق', '010 6655 4433', 'ذهبية', true, 17, 540000, '2025-03-30'),
            ], 'current_page' => 1, 'last_page' => 47, 'from' => 1, 'to' => 7, 'total' => 328],
            'total' => 328,
            'now' => '2025-06-18T09:45:00+03:00',
        ];
    }

    /** @return array<string, mixed> S-012/S-013: أوردر ORD-0152 كما في التصميم */
    public static function orderDetail(): array
    {
        $it = fn (int $id, string $label, int $qty, string $specs, string $designer, string $ver, int $total, string $status, string $at) => [
            'id' => $id, 'label' => $label, 'quantity' => $qty, 'specs' => $specs, 'designer' => $designer, 'version' => $ver, 'total_minor' => $total, 'status' => $status, 'updated_at' => $at,
        ];

        return [
            'order' => [
                'id' => 152, 'number' => 'ORD-0152', 'status' => 'DESIGN_STAGE', 'status_label' => 'مرحلة التصميم',
                'customer' => ['id' => 104, 'name' => 'شركة النور للدعاية', 'phone' => '01023456789', 'phone_display' => '010 2345 6789'],
                'created_at' => '2025-06-18T09:15:00+03:00', 'updated_at' => '2025-06-18T12:05:00+03:00', 'delivery_method' => 'DELIVERY',
                'delivery_address' => '12 شارع الطيران، مدينة نصر، القاهرة', 'eta_days' => 2, 'notes' => 'تسليم العينة بعد اعتماد آخر بند.', 'source_label' => 'موظف المطبعة',
                'subtotal_minor' => 292000, 'discount_minor' => 29200, 'delivery_fee_minor' => 10000, 'grand_total_minor' => 272800, 'paid_minor' => 100000, 'remaining_minor' => 172800,
            ],
            'approval' => ['approved' => 2, 'total' => 3, 'next' => ['id' => 3, 'name' => 'البروشور']],
            'items' => [
                $it(1, 'البند 01 — كروت شخصية', 1000, '9 × 5 سم • مطفي • وجهان', 'أحمد حسن', 'النسخة 03', 200000, 'APPROVED', '2025-06-18T10:45:00+03:00'),
                $it(2, 'البند 02 — فلاير', 500, 'مقاس A4 • ألوان كاملة', 'منى إبراهيم', 'النسخة 02', 60000, 'APPROVED', '2025-06-18T11:05:00+03:00'),
                $it(3, 'البند 03 — بروشور', 100, 'كوشيه 300 جم • A4 • وجه واحد', 'محمود أحمد', 'النسخة 02', 32000, 'PENDING', '2025-06-18T11:30:00+03:00'),
            ],
            'payments' => [['id' => 914, 'number' => 'PAY-0914', 'at' => '2025-06-18T12:05:00+03:00', 'amount_minor' => 100000, 'method' => 'تحويل بنكي', 'status' => 'مؤكدة']],
            'files' => [
                ['label' => 'البند 01 — كروت شخصية', 'rows' => [
                    ['name' => 'معاينة كروت شخصية — الإصدار 03', 'type' => 'PDF', 'item' => 'البند 01', 'at' => '2025-06-18T10:20:00+03:00', 'source' => 'نسخ التصميم', 'by' => 'أحمد حسن'],
                    ['name' => 'customer-logo.ai', 'type' => 'AI', 'item' => 'البند 01', 'at' => '2025-06-18T09:40:00+03:00', 'source' => 'ملفات العميل', 'by' => null],
                ]],
                ['label' => 'البند 02 — فلاير', 'rows' => [['name' => 'معاينة فلاير — الإصدار 02', 'type' => 'PDF', 'item' => 'البند 02', 'at' => '2025-06-18T11:05:00+03:00', 'source' => 'نسخ التصميم', 'by' => 'منى إبراهيم']]],
                ['label' => 'البند 03 — بروشور', 'rows' => [['name' => 'brochure-source.pdf', 'type' => 'PDF', 'item' => 'البند 03', 'at' => '2025-06-18T11:30:00+03:00', 'source' => 'ملفات العميل', 'by' => null]]],
            ],
            'activity' => [
                ['id' => 6, 'at' => '2025-06-18T12:05:00+03:00', 'actor' => 'أحمد حسن', 'action' => 'تسجيل دفعة', 'details' => 'تسجيل دفعة PAY-0914 بقيمة 1,000 ج.م'],
                ['id' => 5, 'at' => '2025-06-18T11:30:00+03:00', 'actor' => 'محمود أحمد', 'action' => 'رفع نسخة تصميم', 'details' => 'رفع الإصدار 02 للبند ITEM-03'],
                ['id' => 4, 'at' => '2025-06-18T11:05:00+03:00', 'actor' => 'شركة النور للدعاية', 'action' => 'اعتماد تصميم', 'details' => 'اعتماد الإصدار 02 للبند ITEM-02'],
                ['id' => 3, 'at' => '2025-06-18T10:45:00+03:00', 'actor' => 'شركة النور للدعاية', 'action' => 'اعتماد تصميم', 'details' => 'اعتماد البند 01'],
                ['id' => 2, 'at' => '2025-06-18T09:25:00+03:00', 'actor' => 'منى إبراهيم', 'action' => 'إسناد المصمم', 'details' => 'إسناد ITEM-03 إلى محمود أحمد'],
                ['id' => 1, 'at' => '2025-06-18T09:15:00+03:00', 'actor' => 'أحمد حسن', 'action' => 'إنشاء الأوردر', 'details' => 'إنشاء الأوردر'],
            ],
            'delivery_log' => [
                ['at' => '2025-06-18T11:30:00+03:00', 'text' => 'تم تحديث مدة الطباعة المتوقعة', 'by' => 'أحمد حسن'],
                ['at' => '2025-06-18T09:15:00+03:00', 'text' => 'تم إنشاء طلب التسليم', 'by' => 'أحمد حسن'],
            ],
            'link' => ['status' => 'نشط'],
        ];
    }

    /**
     * S-019..021: الطلب REQ-0186 (العميل CUS-0220). الأسعار/الأرقام كما في الـpen (لا تُشتق من الكتالوج).
     *
     * @return array<string, mixed>
     */
    public static function orderRequest(string $status): array
    {
        $edited = $status !== 'PENDING';
        $item = fn (int $id, string $name, int $qty, int $orig, int $unit, int $n) => [
            'id' => $id, 'label' => 'البند 0'.$n.' — '.$name, 'product' => $name, 'quantity' => $qty, 'original_quantity' => $orig, 'unit_minor' => $unit, 'total_minor' => $unit * $qty, 'specs' => '', 'notes' => null,
        ];
        $log = [['id' => 1, 'at' => '2026-10-14T10:20:00+03:00', 'action' => 'تم إرسال الطلب', 'actor' => 'العميل']];
        if ($edited) {
            $log[] = ['id' => 2, 'at' => '2026-10-14T11:00:00+03:00', 'action' => 'بدء المراجعة', 'actor' => 'أحمد حسن'];
            $log[] = ['id' => 3, 'at' => '2026-10-14T11:12:00+03:00', 'action' => 'حفظ تعديلات الطلب', 'actor' => 'أحمد حسن'];
        }
        if ($status === 'ACCEPTED') {
            $log[] = ['id' => 4, 'at' => '2026-10-14T11:18:00+03:00', 'action' => 'رفض الطلب', 'actor' => 'أحمد حسن']; // كما في الـpen (HgTHs)
        }
        if ($status === 'REJECTED') {
            $log[] = ['id' => 4, 'at' => '2026-10-14T11:18:00+03:00', 'action' => 'رفض الطلب', 'actor' => 'أحمد حسن'];
        }

        return [
            'customer' => ['id' => 220, 'code' => 'CUS-0220', 'name' => 'شركة الأفق للإعلان', 'phone' => '01012345678', 'tier' => 'الذهبية', 'tier_discount' => '20', 'registered' => true],
            'items' => [$item(1, 'كروت شخصية', 1000, 1000, 200, 1), $item(2, 'فلاير', $edited ? 500 : 300, 300, 120, 2)],
            'subtotal_minor' => $edited ? 260000 : 236000, 'original_total_minor' => 236000,
            'edits' => $edited ? [['item' => 'فلاير', 'field' => 'الكمية', 'old' => 300, 'new' => 500]] : [],
            'log' => $log,
        ];
    }

    /** @return array<string, mixed> */
    public static function orderRequestIndex(): array
    {
        return ['counts' => ['PENDING' => 1, 'IN_REVIEW' => 0, 'ACCEPTED' => 0, 'REJECTED' => 0]];
    }

    /** @return array<string, mixed> S-043: مهامي — منى إبراهيم */
    public static function designerTasks(string $tab): array
    {
        $t = fn (int $o, string $product, string $customer, string $specs, string $at, int $files, int $unread, string $state, ?string $line = null) => [
            'id' => 1000 + $o, 'code' => "ITEM-{$o}-0".($tab === 'revision' || $tab === 'awaiting' ? 2 : 1), 'order_number' => 'ORD-0'.$o, 'product' => $product, 'customer' => $customer, 'specs' => $specs,
            'updated_at' => $at, 'files_count' => $files, 'unread' => $unread, 'state' => $state, 'line' => $line,
        ];
        $counts = ['new' => 2, 'in_progress' => 1, 'revision' => $tab === 'revision' ? 1 : 0, 'awaiting' => $tab === 'awaiting' ? 1 : ($tab === 'revision' ? 0 : 1), 'done' => 9];
        $tasks = match ($tab) {
            'in_progress' => [$t(154, 'بروشور', 'شركة الأفق للإعلان', 'مقاس A4 • ورق كوشيه • طباعة وجهين', '2026-10-16T14:20:00+03:00', 3, 0, 'IN_DESIGN')],
            'revision' => [$t(156, 'كروت شخصية', 'شركة البيان للدعاية', '', '2026-10-16T11:30:00+03:00', 0, 0, 'REVISION_REQUESTED', 'النسخة ٢ محفوظة • رسالة العميل: يرجى تعديل رقم الهاتف في التصميم.')],
            'awaiting' => [$t(156, 'كروت شخصية', 'شركة البيان للدعاية', '', '2026-10-16T11:30:00+03:00', 0, 0, 'AWAITING_APPROVAL', 'النسخة ٢ مرسلة • الوجه الأمامي والخلفي • 16 أكتوبر 2026، 11:30 ص')],
            default => [
                $t(161, 'فلاير', 'شركة الرواد للدعاية', 'مقاس A5 • ورق كوشيه • طباعة وجهين', '2026-10-17T10:15:00+03:00', 2, 1, 'NEW'),
                $t(162, 'كروت شخصية', 'مؤسسة البيان', 'مقاس ٩ × ٥ سم • ورق فاخر • وجهان', '2026-10-17T11:05:00+03:00', 0, 0, 'NEW'),
            ],
        };

        return ['tab' => $tab, 'counts' => $counts, 'tasks' => $tasks, 'workload' => 1, 'designer' => ['name' => 'منى إبراهيم']];
    }

    /** @return array<string, mixed> S-044: تفاصيل المهمة (الحالة: new | in_progress | versions | revision) */
    public static function designerTask(string $state, string $tab): array
    {
        $specs161 = [['group' => 'نوع الورق', 'value' => 'كوشيه ١٥٠ جم'], ['group' => 'المقاس', 'value' => 'A5'], ['group' => 'نظام الألوان', 'value' => 'ألوان كاملة (CMYK)'], ['group' => 'عدد الأوجه', 'value' => 'وجهان'], ['group' => 'خيارات المنتج', 'value' => 'بدون تغليف']];
        $files161 = [['name' => 'الشعار.png', 'kind' => 'صورة PNG', 'size' => '٢٫٤ م.ب'], ['name' => 'نموذج-الفلاير.pdf', 'kind' => 'مستند PDF', 'size' => '١٫٢ م.ب']];
        $base161 = ['code' => 'ITEM-161-01', 'order_number' => 'ORD-0161', 'product' => 'فلاير', 'customer' => 'شركة الرواد للدعاية', 'quantity' => 1000, 'specs_list' => $specs161, 'files' => $files161, 'notes' => null];
        $faces = [['id' => 1, 'name' => 'الوجه الأمامي'], ['id' => 2, 'name' => 'الوجه الخلفي']];
        $b156 = ['code' => 'ITEM-156-02', 'order_number' => 'ORD-0156', 'product' => 'كروت شخصية', 'customer' => 'شركة البيان للدعاية', 'designer' => 'منى إبراهيم', 'quantity' => 500, 'files' => [], 'notes' => null,
            'specs_list' => [['group' => 'المقاس', 'value' => '٩ × ٥ سم'], ['group' => 'نوع الورق', 'value' => 'ورق فاخر'], ['group' => 'نظام الألوان', 'value' => 'ألوان كاملة'], ['group' => 'عدد الأوجه', 'value' => 'وجهان'], ['group' => 'خيارات المنتج', 'value' => 'تغليف مطفي']]];

        return match ($state) {
            'in_progress' => ['task' => $base161 + ['state' => 'IN_DESIGN', 'updated_at' => '2026-10-17T10:16:00+03:00'], 'versions' => [], 'can' => ['start' => false, 'version' => true]],
            'versions' => ['task' => $b156 + ['state' => 'AWAITING_APPROVAL', 'updated_at' => '2026-10-17T12:10:00+03:00'], 'can' => ['start' => false, 'version' => false], 'versions' => [
                ['id' => 2, 'no' => 2, 'label' => 'الثانية', 'status' => 'SUBMITTED', 'status_label' => 'بانتظار اعتماد العميل', 'submitted_at' => '2026-10-16T11:30:00+03:00', 'files' => $faces],
                ['id' => 1, 'no' => 1, 'label' => 'الأولى', 'status' => 'SUPERSEDED', 'status_label' => 'نسخة سابقة', 'submitted_at' => '2026-10-15T09:40:00+03:00', 'files' => $faces],
            ]],
            'revision' => ['task' => $b156 + ['state' => 'REVISION_REQUESTED', 'updated_at' => '2026-10-17T12:10:00+03:00', 'customer_note' => ['text' => 'يرجى تعديل رقم الهاتف في التصميم.', 'at' => '2026-10-17T12:10:00+03:00'], 'last_version' => ['label' => 'الثانية', 'sent_at' => '2026-10-16T11:30:00+03:00', 'faces' => 'الوجه الأمامي والخلفي']], 'versions' => [], 'can' => ['start' => false, 'version' => true]],
            default => ['task' => $base161 + ['state' => 'NEW', 'updated_at' => '2026-10-17T10:15:00+03:00'], 'versions' => [], 'can' => ['start' => true, 'version' => false]],
        };
    }

    /** @return array<string, mixed> S-045: محرر النسخة (الحالة: first | edit | revision) */
    public static function designerVersion(string $state): array
    {
        $ctx161 = ['code' => 'ITEM-161-01', 'order_number' => 'ORD-0161', 'product' => 'فلاير', 'customer' => 'شركة الرواد للدعاية', 'designer' => 'منى إبراهيم', 'state' => 'IN_DESIGN'];
        $ctx156 = ['code' => 'ITEM-156-02', 'order_number' => 'ORD-0156', 'product' => 'كروت شخصية', 'customer' => 'شركة البيان للدعاية', 'designer' => 'منى إبراهيم', 'state' => 'REVISION_REQUESTED'];
        $f = fn (int $id, string $label, string $name, string $type, string $size) => ['id' => $id, 'label' => $label, 'name' => $name, 'type' => $type, 'size' => $size];

        return match ($state) {
            'edit' => ['mode' => 'edit', 'task' => $ctx156, 'version' => ['id' => 2, 'no' => 2, 'status' => 'SUBMITTED', 'notes' => null, 'files' => [$f(1, 'الوجه الأمامي', 'business-card-front-v2.png', 'image/png', '١٫٨ م.ب'), $f(2, 'الوجه الخلفي', 'business-card-back-v2.png', 'image/png', '١٫٦ م.ب')]], 'previous' => null],
            'revision' => ['mode' => 'revision', 'task' => $ctx156, 'customer_note' => ['text' => 'يرجى تعديل رقم الهاتف في التصميم.', 'at' => '2026-10-17T12:10:00+03:00'], 'previous' => ['id' => 2, 'no' => 2], 'version' => ['id' => 3, 'no' => 3, 'status' => 'DRAFT', 'notes' => 'تم تحديث رقم الهاتف وفق ملاحظات العميل.', 'files' => [$f(1, 'الوجه الأمامي', 'business-card-front-v3.png', 'image/png', '١٫٨ م.ب'), $f(2, 'الوجه الخلفي', 'business-card-back-v3.png', 'image/png', '١٫٧ م.ب')]]],
            default => ['mode' => 'first', 'task' => $ctx161, 'previous' => null, 'version' => ['id' => 1, 'no' => 1, 'status' => 'DRAFT', 'notes' => null, 'files' => [$f(1, 'وجها الفلاير', 'flyer-preview-v1.pdf', 'application/pdf', '٤٫٢ م.ب')]]],
        };
    }

    /** @return array<string, mixed> S-039 */
    public static function designManagement(): array
    {
        $t = fn (int $id, string $code, string $order, string $product, string $designer, string $state, string $label, string $at) => ['id' => $id, 'code' => $code, 'order_number' => $order, 'product' => $product, 'designer' => $designer, 'state' => $state, 'state_label' => $label, 'updated_at' => "2026-10-14T{$at}:00+03:00"];

        return [
            'kpis' => ['unassigned' => 1, 'in_design' => 2, 'revision' => 1, 'awaiting' => 4],
            'unassigned' => [['id' => 160, 'code' => 'ITEM-160-02', 'order_number' => 'ORD-0160', 'product' => 'فلاير', 'specialty' => 'تصميم مطبوعات', 'created_at' => '2026-10-14T09:15:00+03:00']],
            'tasks' => [
                $t(1, 'ITEM-153-01', 'ORD-0153', 'كروت شخصية', 'أحمد حسن', 'NEW', 'مهمة جديدة', '09:40'),
                $t(2, 'ITEM-157-01', 'ORD-0157', 'فلاير', 'منى إبراهيم', 'IN_DESIGN', 'قيد التنفيذ', '10:15'),
                $t(3, 'ITEM-161-01', 'ORD-0161', 'كروت شخصية', 'أحمد حسن', 'IN_DESIGN', 'قيد التنفيذ', '10:10'),
                $t(4, 'ITEM-158-03', 'ORD-0158', 'بروشور', 'أحمد حسن', 'REVISION_REQUESTED', 'مطلوب تعديل', '11:10'),
                $t(5, 'ITEM-152-03', 'ORD-0152', 'بروشور', 'محمود أحمد', 'AWAITING_APPROVAL', 'بانتظار اعتماد العميل', '11:30'),
                $t(6, 'ITEM-159-02', 'ORD-0159', 'فلاير', 'منى إبراهيم', 'APPROVED', 'معتمد', '11:45'),
            ],
            'workload' => [
                ['id' => 3, 'name' => 'محمود أحمد', 'availability' => 'في إجازة', 'availability_value' => 'ON_LEAVE', 'active' => 0],
                ['id' => 2, 'name' => 'منى إبراهيم', 'availability' => 'متاح', 'availability_value' => 'AVAILABLE', 'active' => 1],
                ['id' => 1, 'name' => 'أحمد حسن', 'availability' => 'متاح', 'availability_value' => 'AVAILABLE', 'active' => 2],
            ],
        ];
    }

    /** @return array<string, mixed> S-040 */
    public static function designersList(): array
    {
        $d = fn (int $id, string $name, string $av, string $avv, array $stats) => ['id' => $id, 'name' => $name, 'specialty' => 'تصميم مطبوعات', 'status' => 'ACTIVE', 'availability' => $av, 'availability_value' => $avv, 'stats' => $stats];

        return ['designers' => [
            $d(3, 'محمود أحمد', 'في إجازة', 'ON_LEAVE', ['active' => 0, 'new' => 0, 'awaiting' => 1, 'done' => 10]),
            $d(2, 'منى إبراهيم', 'متاح', 'AVAILABLE', ['active' => 1, 'new' => 2, 'awaiting' => 1, 'done' => 9]),
            $d(1, 'أحمد حسن', 'متاح', 'AVAILABLE', ['active' => 2, 'new' => 1, 'awaiting' => 2, 'done' => 12]),
        ]];
    }

    /** @return array<string, mixed> S-041 */
    public static function designerProfile(string $tab): array
    {
        $t = fn (string $code, string $order, string $product, string $state, string $label, string $at) => ['id' => 1, 'code' => $code, 'order_number' => $order, 'product' => $product, 'state' => $state, 'state_label' => $label, 'updated_at' => "2026-10-14T{$at}:00+03:00"];

        return [
            'designer' => ['id' => 2, 'name' => 'منى إبراهيم', 'specialty' => 'تصميم مطبوعات', 'status' => 'ACTIVE', 'availability' => 'متاح', 'availability_value' => 'AVAILABLE', 'stats' => ['active' => 1, 'new' => 2, 'awaiting' => 1, 'done' => 9]],
            'tasks' => match ($tab) {
                'active' => [$t('ITEM-157-01', 'ORD-0157', 'فلاير', 'IN_DESIGN', 'قيد التنفيذ', '10:15')],
                'awaiting' => [$t('ITEM-159-01', 'ORD-0159', 'بروشور', 'AWAITING_APPROVAL', 'بانتظار اعتماد العميل', '11:45')],
                'done' => [$t('ITEM-159-02', 'ORD-0159', 'فلاير', 'APPROVED', 'معتمد', '11:45')],
                default => [$t('ITEM-157-01', 'ORD-0157', 'فلاير', 'IN_DESIGN', 'قيد التنفيذ', '10:15'), $t('ITEM-159-01', 'ORD-0159', 'بروشور', 'AWAITING_APPROVAL', 'بانتظار اعتماد العميل', '11:45'), $t('ITEM-153-02', 'ORD-0153', 'كروت شخصية', 'NEW', 'مهمة جديدة', '09:40')],
            },
            'history' => [],
        ];
    }
}
