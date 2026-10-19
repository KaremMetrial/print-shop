<?php

namespace App\Enums;

/** حالات الأوردر التشغيلية (§6/§11) — الانتقال فقط عبر canTransitionTo. */
enum OrderStatus: string
{
    case DESIGN_STAGE = 'DESIGN_STAGE';
    case IN_PRINTING = 'IN_PRINTING';
    case READY_FOR_PICKUP = 'READY_FOR_PICKUP';
    case READY_FOR_DELIVERY = 'READY_FOR_DELIVERY';
    case OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';

    /** @return list<self> */
    public function next(): array
    {
        return match ($this) {
            self::DESIGN_STAGE => [self::IN_PRINTING, self::CANCELLED],
            self::IN_PRINTING => [self::READY_FOR_PICKUP, self::READY_FOR_DELIVERY, self::CANCELLED],
            self::READY_FOR_PICKUP => [self::COMPLETED, self::CANCELLED],
            self::READY_FOR_DELIVERY => [self::OUT_FOR_DELIVERY, self::CANCELLED],
            self::OUT_FOR_DELIVERY => [self::COMPLETED, self::CANCELLED],
            self::COMPLETED, self::CANCELLED => [],
        };
    }

    public function canTransitionTo(self $to): bool
    {
        return in_array($to, $this->next(), true);
    }

    public function isFinal(): bool
    {
        return $this === self::COMPLETED || $this === self::CANCELLED;
    }

    public function label(): string
    {
        return match ($this) {
            self::DESIGN_STAGE => 'مرحلة التصميم', self::IN_PRINTING => 'قيد الطباعة', self::READY_FOR_PICKUP => 'جاهز للاستلام',
            self::READY_FOR_DELIVERY => 'جاهز للتوصيل', self::OUT_FOR_DELIVERY => 'خرج للتوصيل', self::COMPLETED => 'مكتمل', self::CANCELLED => 'ملغي',
        };
    }
}
