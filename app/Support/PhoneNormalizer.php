<?php

namespace App\Support;

/**
 * تطبيع أرقام الهاتف (مصر): أرقام عربية/هندية → لاتينية، +20/0020 → 0، فراغات وشرطات تُحذف.
 * الموبايل المصري يُعرض بصيغة 010 2345 6789.
 */
final class PhoneNormalizer
{
    private const AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    private const EN = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    /** يرجع الرقم المطبَّع أو null لو غير صالح. */
    public static function normalize(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }
        $d = preg_replace('/\D+/', '', str_replace(self::AR, self::EN, $raw)) ?? '';
        if (str_starts_with($d, '0020')) {
            $d = '0'.substr($d, 4);
        } elseif (str_starts_with($d, '20') && strlen($d) === 12) {
            $d = '0'.substr($d, 2);
        } elseif (strlen($d) === 10 && str_starts_with($d, '1')) {
            $d = '0'.$d; // 1012345678 → 01012345678
        }

        // موبايل مصري: 01[0125] + 8 أرقام. غير ذلك (أرضي/دولي): 7–15 رقم.
        if (preg_match('/^01[0125]\d{8}$/', $d)) {
            return $d;
        }

        return preg_match('/^\d{7,15}$/', $d) && ! str_starts_with($d, '01') ? $d : null;
    }

    public static function display(string $normalized): string
    {
        return preg_match('/^(01[0125])(\d{4})(\d{4})$/', $normalized, $m) ? "{$m[1]} {$m[2]} {$m[3]}" : $normalized;
    }
}
