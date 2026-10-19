<?php

namespace App\Enums;

enum OrderRequestStatus: string
{
    case PENDING = 'PENDING';
    case IN_REVIEW = 'IN_REVIEW';
    case ACCEPTED = 'ACCEPTED';
    case REJECTED = 'REJECTED';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'بانتظار المراجعة', self::IN_REVIEW => 'قيد المراجعة', self::ACCEPTED => 'مقبول', self::REJECTED => 'مرفوض',
        };
    }

    public function isFinal(): bool
    {
        return $this === self::ACCEPTED || $this === self::REJECTED;
    }
}
