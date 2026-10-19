<?php

namespace App\Services\Settings;

use Illuminate\Support\Facades\DB;

/** إعدادات النظام (S-068…076): قيم افتراضية معروفة + تخزين في app_settings. المفاتيح مسموحة فقط من DEFAULTS. */
class Settings
{
    /** @var array<string, array{label: string, group: string, type: string, default: string}> */
    public const DEFAULTS = [
        'shop.name' => ['label' => 'اسم المطبعة', 'group' => 'general', 'type' => 'text', 'default' => 'مطبعة الإتقان'],
        'shop.branch' => ['label' => 'الفرع', 'group' => 'general', 'type' => 'text', 'default' => 'الفرع الرئيسي • القاهرة'],
        'shop.phone' => ['label' => 'هاتف المطبعة (يظهر لعميل الرابط)', 'group' => 'general', 'type' => 'text', 'default' => ''],
        'orders.default_eta_days' => ['label' => 'مدة الطباعة الافتراضية (أيام)', 'group' => 'orders', 'type' => 'int', 'default' => '2'],
        'orders.auto_complete_hours' => ['label' => 'إتمام تلقائي بعد الخروج للتوصيل (ساعات)', 'group' => 'orders', 'type' => 'int', 'default' => '24'],
        'payments.methods' => ['label' => 'طرق الدفع المتاحة', 'group' => 'payments', 'type' => 'text', 'default' => 'CASH,BANK_TRANSFER,WALLET'],
        'files.max_mb' => ['label' => 'الحد الأقصى لحجم الملف (ميجابايت)', 'group' => 'files', 'type' => 'int', 'default' => '50'],
    ];

    public function get(string $key): string
    {
        $v = DB::table('app_settings')->where('key', $key)->value('value');

        return $v ?? (self::DEFAULTS[$key]['default'] ?? '');
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
    }
}
