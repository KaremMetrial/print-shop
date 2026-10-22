<?php

namespace App\Services\Settings;

use Illuminate\Support\Facades\DB;

/** إعدادات النظام (S-068…076): قيم افتراضية معروفة + تخزين في app_settings. المفاتيح مسموحة فقط من DEFAULTS. */
class Settings
{
    /** @var array<string, array{label: string, group: string, type: string, default: string}> */
    public const DEFAULTS = [
        'shop.name' => ['label' => 'اسم المطبعة', 'group' => 'general', 'type' => 'text', 'default' => ''], // الافتراضي = APP_NAME
        'shop.branch' => ['label' => 'الفرع', 'group' => 'general', 'type' => 'text', 'default' => 'الفرع الرئيسي • القاهرة'],
        'shop.phone' => ['label' => 'هاتف المطبعة (يظهر لعميل الرابط)', 'group' => 'general', 'type' => 'text', 'default' => ''],
        'orders.default_eta_days' => ['label' => 'مدة الطباعة الافتراضية (أيام)', 'group' => 'orders', 'type' => 'int', 'default' => '2'],
        'orders.auto_complete_hours' => ['label' => 'إتمام تلقائي بعد الخروج للتوصيل (ساعات)', 'group' => 'orders', 'type' => 'int', 'default' => '24'],
        'orders.status_label.DESIGN_STAGE' => ['label' => 'مسمى حالة مرحلة التصميم', 'group' => 'orders', 'type' => 'status_label', 'default' => 'مرحلة التصميم'],
        'orders.status_label.IN_PRINTING' => ['label' => 'مسمى حالة قيد الطباعة', 'group' => 'orders', 'type' => 'status_label', 'default' => 'قيد الطباعة'],
        'orders.status_label.READY_FOR_PICKUP' => ['label' => 'مسمى حالة جاهز للاستلام', 'group' => 'orders', 'type' => 'status_label', 'default' => 'جاهز للاستلام'],
        'orders.status_label.READY_FOR_DELIVERY' => ['label' => 'مسمى حالة جاهز للتوصيل', 'group' => 'orders', 'type' => 'status_label', 'default' => 'جاهز للتوصيل'],
        'orders.status_label.OUT_FOR_DELIVERY' => ['label' => 'مسمى حالة خرج للتوصيل', 'group' => 'orders', 'type' => 'status_label', 'default' => 'خرج للتوصيل'],
        'orders.status_label.COMPLETED' => ['label' => 'مسمى حالة مكتمل', 'group' => 'orders', 'type' => 'status_label', 'default' => 'مكتمل'],
        'orders.status_label.CANCELLED' => ['label' => 'مسمى حالة ملغي', 'group' => 'orders', 'type' => 'status_label', 'default' => 'ملغي'],
        'payments.methods' => ['label' => 'طرق الدفع المتاحة', 'group' => 'payments', 'type' => 'methods', 'default' => 'CASH,BANK_TRANSFER,WALLET'],
        'files.max_mb' => ['label' => 'الحد الأقصى لحجم الملف (ميجابايت)', 'group' => 'files', 'type' => 'int', 'default' => '50'],
    ];

    /** @var array<string, string>|null */
    private ?array $cache = null;

    public function get(string $key): string
    {
        $this->cache ??= DB::table('app_settings')->pluck('value', 'key')->all();

        $v = $this->cache[$key] ?? (self::DEFAULTS[$key]['default'] ?? '');

        return ($v === '' && $key === 'shop.name') ? (string) config('app.name') : $v;
    }

    public function int(string $key): int
    {
        return (int) $this->get($key);
    }

    /** @return array<string, string> */
    public function all(): array
    {
        $out = [];
        foreach (array_keys(self::DEFAULTS) as $k) {
            $out[$k] = $this->get($k);
        }

        return $out;
    }

    public function set(string $key, string $value, ?int $by): void
    {
        abort_unless(isset(self::DEFAULTS[$key]), 422);
        DB::table('app_settings')->updateOrInsert(['key' => $key], ['value' => $value, 'updated_by' => $by, 'updated_at' => now()]);
        $this->cache = null;
    }
}
