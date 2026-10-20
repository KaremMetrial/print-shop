<?php

namespace App\Services\Search;

/**
 * بصمة إدراكية (dHash + aHash) بـGD. تلتقط الشبه البصري العام (تركيب/تباين) وليست تعلّمًا دلاليًا:
 * مناسبة لإيجاد تصميم قريب جدًا، وتضعف مع زاوية تصوير/إضاءة مختلفة كثيرًا (معيار القبول D6 معلّق).
 */
class ImageHasher
{
    public const SUPPORTED = ['image/png', 'image/jpeg', 'image/webp'];

    /** @return array{dhash: string, ahash: string}|null */
    public function hash(string $path): ?array
    {
        $data = @file_get_contents($path);
        $img = $data === false ? false : @imagecreatefromstring($data);
        if ($img === false) {
            return null;
        }
        $gray = fn (int $w, int $h) => $this->gray($img, $w, $h);
        $d = $gray(9, 8);
        $bits = '';
        for ($y = 0; $y < 8; $y++) {
            for ($x = 0; $x < 8; $x++) {
                $bits .= $d[$y][$x] > $d[$y][$x + 1] ? '1' : '0';
            }
        }
        $a = $gray(8, 8);
        $mean = array_sum(array_map('array_sum', $a)) / 64;
        $abits = '';
        foreach ($a as $row) {
            foreach ($row as $v) {
                $abits .= $v >= $mean ? '1' : '0';
            }
        }

        return ['dhash' => $this->toHex($bits), 'ahash' => $this->toHex($abits)];
    }

    /** المسافة 0..128 (مجموع Hamming للبصمتين). */
    public function distance(string $d1, string $a1, string $d2, string $a2): int
    {
        return $this->ham($d1, $d2) + $this->ham($a1, $a2);
    }

    private function ham(string $x, string $y): int
    {
        $n = 0;
        for ($i = 0; $i < 16; $i++) {
            $n += substr_count(decbin(hexdec($x[$i]) ^ hexdec($y[$i])), '1');
        }

        return $n;
    }

    /** @return list<list<int>> */
    private function gray(\GdImage $img, int $w, int $h): array
    {
        $s = imagecreatetruecolor($w, $h);
        imagefill($s, 0, 0, (int) imagecolorallocate($s, 255, 255, 255)); // شفافية PNG → أبيض
        imagecopyresampled($s, $img, 0, 0, 0, 0, $w, $h, imagesx($img), imagesy($img));
        $out = [];
        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $c = imagecolorat($s, $x, $y);
                $out[$y][$x] = (int) round(0.299 * (($c >> 16) & 255) + 0.587 * (($c >> 8) & 255) + 0.114 * ($c & 255));
            }
        }

        return $out;
    }

    private function toHex(string $bits): string
    {
        $hex = '';
        foreach (str_split($bits, 4) as $n) {
            $hex .= dechex(bindec($n));
        }

        return $hex;
    }
}
