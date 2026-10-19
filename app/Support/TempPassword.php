<?php

namespace App\Support;

/** كلمة مرور مؤقتة قابلة للقراءة والإملاء (بدون رموز ملتبسة): مثل P7mQk-42Kqz. تُعرض مرة واحدة فقط. */
final class TempPassword
{
    private const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

    public static function generate(int $groups = 2, int $size = 5): string
    {
        $parts = [];
        for ($g = 0; $g < $groups; $g++) {
            $s = '';
            for ($i = 0; $i < $size; $i++) {
                $s .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
            }
            $parts[] = $s;
        }

        return implode('-', $parts);
    }
}
