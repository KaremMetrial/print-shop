<?php

namespace App\Support;

use App\Services\Settings\Settings;

/** اسم المطبعة الحالي من الإعدادات (للقوالب/البريد/PDF). */
class Shop
{
    public static function name(): string
    {
        try {
            return app(Settings::class)->get('shop.name') ?: (string) config('app.name');
        } catch (\Throwable) {
            return (string) config('app.name');
        }
    }
}
