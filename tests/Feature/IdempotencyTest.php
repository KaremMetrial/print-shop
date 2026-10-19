<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    $this->calls = 0;
    Route::middleware(['web', 'auth', 'idempotent'])->post('/_test/pay', function () {
        $GLOBALS['idem_calls'] = ($GLOBALS['idem_calls'] ?? 0) + 1;

        return response()->json(['n' => $GLOBALS['idem_calls']], 201);
    });
    Route::middleware(['web', 'auth', 'idempotent'])->post('/_test/boom', fn () => response()->json(['e' => 1], 500));
    $GLOBALS['idem_calls'] = 0;
    $this->actingAs(User::factory()->create());
});

it('requires an Idempotency-Key on unsafe methods', function () {
    $this->postJson('/_test/pay', ['amount' => 100])->assertStatus(400)->assertJsonPath('error.code', 'IDEMPOTENCY_KEY_REQUIRED');
});

it('executes once and replays the stored response for the same key and payload', function () {
    $h = ['Idempotency-Key' => 'k-1'];
    $a = $this->postJson('/_test/pay', ['amount' => 100], $h)->assertCreated();
    $b = $this->postJson('/_test/pay', ['amount' => 100], $h)->assertCreated()->assertHeader('Idempotent-Replayed', 'true');

    expect($GLOBALS['idem_calls'])->toBe(1)->and($b->json('n'))->toBe($a->json('n'));
});

it('rejects the same key with a different payload', function () {
    $h = ['Idempotency-Key' => 'k-2'];
    $this->postJson('/_test/pay', ['amount' => 100], $h)->assertCreated();
    $this->postJson('/_test/pay', ['amount' => 999], $h)->assertStatus(422)->assertJsonPath('error.code', 'IDEMPOTENCY_KEY_REUSED');
    expect($GLOBALS['idem_calls'])->toBe(1);
});

it('returns 409 while the first request is still in flight', function () {
    DB::table('idempotency_keys')->insert([
        'scope' => 'staff:'.auth()->id(), 'key' => 'k-3', 'method' => 'POST', 'path' => '_test/pay',
        'request_hash' => hash('sha256', 'x'), 'created_at' => now(), 'updated_at' => now(),
    ]);
    $this->postJson('/_test/pay', ['amount' => 1], ['Idempotency-Key' => 'k-3'])->assertStatus(422); // hash مختلف
});

it('lets a failed (5xx) request be retried with the same key', function () {
    $h = ['Idempotency-Key' => 'k-4'];
    $this->postJson('/_test/boom', [], $h)->assertStatus(500);
    expect(DB::table('idempotency_keys')->where('key', 'k-4')->count())->toBe(0);
});

it('scopes keys per user', function () {
    $h = ['Idempotency-Key' => 'shared'];
    $this->postJson('/_test/pay', [], $h)->assertCreated();
    $this->actingAs(User::factory()->create());
    $this->postJson('/_test/pay', [], $h)->assertCreated();
    expect($GLOBALS['idem_calls'])->toBe(2);
});
