<?php

namespace App\Enums;

enum NotificationMode: string
{
    case SystemDefault = 'SYSTEM_DEFAULT';
    case Manual = 'MANUAL';
    case Automatic = 'AUTOMATIC';

    public function label(): string
    {
        return match ($this) {
            self::SystemDefault => 'افتراضي النظام',
            self::Manual => 'واتساب يدوي',
            self::Automatic => 'واتساب تلقائي',
        };
    }
}
