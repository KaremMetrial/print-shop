<?php

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use Illuminate\Support\Facades\Route;

it('has an Arabic message and a valid status for every code', function () {
    foreach (ErrorCode::cases() as $c) {
        expect($c->message())->toMatch('/\p{Arabic}/u')
            ->and($c->status())->toBeBetween(400, 599);
    }
});

it('renders business errors as stable JSON for API calls', function () {
    Route::middleware('web')->get('/_test/biz', fn () => throw new BusinessException(ErrorCode::PAYMENT_EXCEEDS_DUE));
    $this->getJson('/_test/biz')->assertStatus(422)
        ->assertJsonPath('error.code', 'PAYMENT_EXCEEDS_DUE')
        ->assertJsonPath('error.message', 'قيمة الدفعة أكبر من المبلغ المتبقي.');
});

it('redirects back with the message for page requests', function () {
    Route::middleware('web')->post('/_test/biz2', fn () => throw new BusinessException(ErrorCode::REQUEST_ALREADY_CLAIMED));
    $this->from('/x')->post('/_test/biz2')->assertRedirect('/x')->assertSessionHasErrors('business');
});

it('keeps the generated TypeScript in sync', function () {
    $this->artisan('ts:generate', ['--check' => true])->assertSuccessful();
});
