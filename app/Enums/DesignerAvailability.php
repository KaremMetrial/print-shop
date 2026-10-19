<?php

namespace App\Enums;

enum DesignerAvailability: string
{
    case Available = 'AVAILABLE';
    case Unavailable = 'UNAVAILABLE';
    case OnLeave = 'ON_LEAVE';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'متاح',
            self::Unavailable => 'غير متاح',
            self::OnLeave => 'في إجازة',
        };
    }
}
