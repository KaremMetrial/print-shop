<?php

namespace App\Support;

use InvalidArgumentException;
use JsonSerializable;
use Stringable;

/**
 * مبلغ مالي بالقروش (integer). ممنوع float في أي حساب (BR / §30.13).
 * التقريب: HALF_UP بعيدًا عن الصفر (قرار D1 مبدئي — يُراجَع قبل Phase 2).
 */
final readonly class Money implements JsonSerializable, Stringable
{
    public const CURRENCY = 'EGP';

    private function __construct(public int $minor) {}

    public static function minor(int $minor): self
    {
        return new self($minor);
    }

    public static function zero(): self
    {
        return new self(0);
    }

    /** يقبل نصًا عشريًا صارمًا مثل "12.5" أو "1850" أو "-3.07" — لا floats. */
    public static function fromMajor(string|int $value): self
    {
        $value = trim((string) $value);
        if (! preg_match('/^(-)?(\d+)(?:\.(\d{1,2}))?$/', $value, $m)) {
            throw new InvalidArgumentException("مبلغ غير صالح: {$value}");
        }
        $minor = ((int) $m[2]) * 100 + (int) str_pad($m[3] ?? '0', 2, '0');

        return new self($m[1] === '-' ? -$minor : $minor);
    }

    public function add(self $o): self
    {
        return new self($this->minor + $o->minor);
    }

    public function sub(self $o): self
    {
        return new self($this->minor - $o->minor);
    }

    public function mul(int $factor): self
    {
        return new self($this->minor * $factor);
    }

    /** نسبة مئوية كنص عشري (حتى منزلتين) مثل "20" أو "12.5" — الناتج مقرَّب HALF_UP. */
    public function percent(string|int $percent): self
    {
        $bps = self::toBasisPoints((string) $percent);

        return new self(self::divRound($this->minor * $bps, 10000));
    }

    /** السعر بعد خصم نسبة: amount − percent(amount). */
    public function discountedBy(string|int $percent): self
    {
        return $this->sub($this->percent($percent));
    }

    /** توزيع المبلغ على أجزاء بنسب صحيحة دون فقد قرش (الباقي للأقدم أولًا). @param list<int> $weights */
    public function allocate(array $weights): array
    {
        $total = array_sum($weights);
        if ($total <= 0) {
            throw new InvalidArgumentException('أوزان التوزيع غير صالحة.');
        }
        $parts = [];
        $given = 0;
        foreach ($weights as $w) {
            $share = intdiv($this->minor * $w, $total);
            $parts[] = $share;
            $given += $share;
        }
        $rest = $this->minor - $given;
        for ($i = 0; $rest !== 0; $i = ($i + 1) % count($parts)) {
            $parts[$i] += $rest > 0 ? 1 : -1;
            $rest += $rest > 0 ? -1 : 1;
        }

        return array_map(fn (int $m) => new self($m), $parts);
    }

    public function negate(): self
    {
        return new self(-$this->minor);
    }

    public function isZero(): bool
    {
        return $this->minor === 0;
    }

    public function isNegative(): bool
    {
        return $this->minor < 0;
    }

    public function isPositive(): bool
    {
        return $this->minor > 0;
    }

    public function equals(self $o): bool
    {
        return $this->minor === $o->minor;
    }

    public function compare(self $o): int
    {
        return $this->minor <=> $o->minor;
    }

    public function greaterThan(self $o): bool
    {
        return $this->minor > $o->minor;
    }

    public function lessThan(self $o): bool
    {
        return $this->minor < $o->minor;
    }

    public static function min(self $a, self $b): self
    {
        return $a->minor <= $b->minor ? $a : $b;
    }

    public static function max(self $a, self $b): self
    {
        return $a->minor >= $b->minor ? $a : $b;
    }

    /** "1850.00" (للتخزين/التصدير). */
    public function toDecimalString(): string
    {
        $abs = abs($this->minor);

        return ($this->minor < 0 ? '-' : '').intdiv($abs, 100).'.'.str_pad((string) ($abs % 100), 2, '0', STR_PAD_LEFT);
    }

    /** للعرض: "1,850.00 ج.م" */
    public function format(): string
    {
        $abs = abs($this->minor);

        return ($this->minor < 0 ? '-' : '').number_format(intdiv($abs, 100)).'.'.str_pad((string) ($abs % 100), 2, '0', STR_PAD_LEFT).' ج.م';
    }

    public function jsonSerialize(): array
    {
        return ['minor' => $this->minor, 'currency' => self::CURRENCY];
    }

    public function __toString(): string
    {
        return $this->toDecimalString();
    }

    private static function toBasisPoints(string $p): int
    {
        if (! preg_match('/^(\d+)(?:\.(\d{1,2}))?$/', trim($p), $m)) {
            throw new InvalidArgumentException("نسبة غير صالحة: {$p}");
        }

        return ((int) $m[1]) * 100 + (int) str_pad($m[2] ?? '0', 2, '0');
    }

    private static function divRound(int $num, int $den): int
    {
        $sign = $num < 0 ? -1 : 1;
        $num = abs($num);

        return $sign * intdiv($num * 2 + $den, $den * 2);
    }
}
