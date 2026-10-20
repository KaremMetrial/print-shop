<?php

use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;

it('turns a 419 into a friendly Arabic redirect instead of an error page', function () {
    Route::middleware('web')->post('/_t419', fn () => throw new TokenMismatchException);
    $r = $this->from('/login')->post('/_t419');
    $r->assertRedirect('/login')->assertSessionHasErrors(['business']);
    expect(session('errors')->first('business'))->toContain('انتهت صلاحية الجلسة');
});

it('translates validation attribute names on login', function () {
    $r = $this->from('/login')->post('/login', ['email' => '', 'password' => '']);
    expect(session('errors')->first('email'))->toBe('حقل البريد الإلكتروني مطلوب.');
});
