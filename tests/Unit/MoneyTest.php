<?php

use App\Support\Money;

it('parses major strings strictly without floats', function () {
    expect(Money::fromMajor('12.5')->minor)->toBe(1250)
        ->and(Money::fromMajor('1850')->minor)->toBe(185000)
        ->and(Money::fromMajor('-3.07')->minor)->toBe(-307)
        ->and(fn () => Money::fromMajor('1.234'))->toThrow(InvalidArgumentException::class)
        ->and(fn () => Money::fromMajor('abc'))->toThrow(InvalidArgumentException::class);
});

it('adds, subtracts and multiplies', function () {
    expect(Money::minor(1000)->add(Money::minor(250))->minor)->toBe(1250)
        ->and(Money::minor(1000)->sub(Money::minor(1500))->minor)->toBe(-500)
        ->and(Money::minor(960)->mul(5)->minor)->toBe(4800);
});

it('matches the pricing examples from the spec', function () {
    // (10 + 2) × 0.8 = 9.6  (فئة Percentage 20%)
    expect(Money::fromMajor('12')->discountedBy(20)->toDecimalString())->toBe('9.60');
    // Fixed base: 7 + 2 = 9
    expect(Money::fromMajor('7')->add(Money::fromMajor('2'))->toDecimalString())->toBe('9.00');
});

it('rounds half up away from zero', function () {
    expect(Money::minor(5)->percent('50')->minor)->toBe(3)       // 2.5 → 3
        ->and(Money::minor(-5)->percent('50')->minor)->toBe(-3)  // -2.5 → -3
        ->and(Money::minor(1001)->percent('10')->minor)->toBe(100) // 100.1 → 100
        ->and(Money::minor(1005)->percent('10')->minor)->toBe(101); // 100.5 → 101
});

it('allocates without losing a piaster', function () {
    $parts = Money::minor(1000)->allocate([1, 1, 1]);
    expect(array_map(fn ($m) => $m->minor, $parts))->toBe([334, 333, 333])
        ->and(array_sum(array_map(fn ($m) => $m->minor, $parts)))->toBe(1000);
});

it('formats for display and json', function () {
    expect(Money::minor(185000)->format())->toBe('1,850.00 ج.م')
        ->and(Money::minor(-307)->toDecimalString())->toBe('-3.07')
        ->and(json_encode(Money::minor(100)))->toBe('{"minor":100,"currency":"EGP"}');
});

it('compares', function () {
    expect(Money::minor(1)->lessThan(Money::minor(2)))->toBeTrue()
        ->and(Money::max(Money::minor(1), Money::minor(2))->minor)->toBe(2)
        ->and(Money::zero()->isZero())->toBeTrue();
});
