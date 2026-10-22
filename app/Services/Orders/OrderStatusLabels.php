<?php

namespace App\Services\Orders;

use App\Enums\OrderStatus;
use App\Services\Settings\Settings;

/** أسماء عرض قابلة للتخصيص لحالات الأوردر؛ مفاتيح الحالة وقواعد التشغيل تظل ثابتة. */
class OrderStatusLabels
{
    public function __construct(private Settings $settings) {}

    public function label(OrderStatus $status): string
    {
        $custom = trim($this->settings->get(self::key($status)));

        return $custom !== '' ? $custom : $status->label();
    }

    /** @return array<string, string> */
    public function all(): array
    {
        $labels = [];
        foreach (OrderStatus::cases() as $status) {
            $labels[$status->value] = $this->label($status);
        }

        return $labels;
    }

    public static function key(OrderStatus $status): string
    {
        return 'orders.status_label.'.$status->value;
    }
}
