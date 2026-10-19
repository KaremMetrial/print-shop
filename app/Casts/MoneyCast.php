<?php

namespace App\Casts;

use App\Support\Money;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/** @implements CastsAttributes<Money, Money|int|null> */
class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Money
    {
        return $value === null ? null : Money::minor((int) $value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?int
    {
        return match (true) {
            $value === null => null,
            $value instanceof Money => $value->minor,
            // @phpstan-ignore-next-line  قيم قادمة من الفورم قد تكون نصًا
            is_numeric($value) => (int) $value,
            default => throw new InvalidArgumentException('يجب أن تكون القيمة Money أو int (قروش).'),
        };
    }
}
