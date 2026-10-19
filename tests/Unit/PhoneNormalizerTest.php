<?php

use App\Support\PhoneNormalizer;

it('normalizes egyptian mobiles from every common format', function (string $in) {
    expect(PhoneNormalizer::normalize($in))->toBe('01023456789');
})->with(['010 2345 6789', '01023456789', '+201023456789', '00201023456789', '1023456789', '٠١٠٢٣٤٥٦٧٨٩', '010-2345-6789']);

it('rejects invalid numbers', function (?string $in) {
    expect(PhoneNormalizer::normalize($in))->toBeNull();
})->with([null, '', 'abc', '123', '01923456789']);

it('formats for display', function () {
    expect(PhoneNormalizer::display('01023456789'))->toBe('010 2345 6789')->and(PhoneNormalizer::display('0222345678'))->toBe('0222345678');
});
