<?php

namespace App\Enums;

use App\Services\Settings\Settings;

/** طرق الدفع — المصدر الوحيد للتسميات. المفعّل منها يحدده إعداد payments.methods. */
enum PaymentMethod: string
{
    case Cash = 'CASH';
    case BankTransfer = 'BANK_TRANSFER';
    case Wallet = 'WALLET';
    case Card = 'CARD';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'نقدًا',
            self::BankTransfer => 'تحويل بنكي',
            self::Wallet => 'محفظة إلكترونية',
            self::Card => 'بطاقة',
        };
    }

    /** @return array<string, string> كل الطرق (للعرض التاريخي) */
    public static function labels(): array
    {
        $o = [];
        foreach (self::cases() as $c) {
            $o[$c->value] = $c->label();
        }

        return $o;
    }

    /** @return array<string, string> المفعّل حاليًا من الإعدادات (للإدخال الجديد) */
    public static function enabled(): array
    {
        $on = array_filter(array_map('trim', explode(',', app(Settings::class)->get('payments.methods'))));
        $o = [];
        foreach (self::cases() as $c) {
            if (in_array($c->value, $on, true)) {
                $o[$c->value] = $c->label();
            }
        }

        return $o ?: [self::Cash->value => self::Cash->label()];
    }

    public static function label_of(?string $code): string
    {
        return self::tryFrom((string) $code)?->label() ?? (string) $code;
    }
}
