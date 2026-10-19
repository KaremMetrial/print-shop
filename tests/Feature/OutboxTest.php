<?php

use App\Events\OutboxEventPublished;
use App\Models\OutboxEvent;
use App\Models\User;
use App\Services\Outbox\Outbox;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

it('is written in the same transaction as the business change', function () {
    try {
        DB::transaction(function () {
            app(Outbox::class)->record('order.created', User::factory()->create(), ['n' => 1]);
            throw new RuntimeException('rollback');
        });
    } catch (RuntimeException) {
    }
    expect(OutboxEvent::count())->toBe(0);

    DB::transaction(fn () => app(Outbox::class)->record('order.created', null, ['n' => 1]));
    expect(OutboxEvent::count())->toBe(1);
});

it('dispatches pending events once and marks them processed', function () {
    Event::fake([OutboxEventPublished::class]);
    app(Outbox::class)->record('a');
    app(Outbox::class)->record('b');

    expect(app(Outbox::class)->dispatchPending())->toBe(2)
        ->and(app(Outbox::class)->dispatchPending())->toBe(0);
    Event::assertDispatchedTimes(OutboxEventPublished::class, 2);
    expect(OutboxEvent::whereNull('processed_at')->count())->toBe(0);
});

it('keeps the event and backs off when a listener fails, then gives up after max attempts', function () {
    Event::listen(OutboxEventPublished::class, fn () => throw new RuntimeException('whatsapp down'));
    $e = app(Outbox::class)->record('notify');

    app(Outbox::class)->dispatchPending();
    $e->refresh();
    expect($e->processed_at)->toBeNull()->and($e->attempts)->toBe(1)
        ->and($e->last_error)->toContain('whatsapp down')->and($e->available_at->isFuture())->toBeTrue();

    for ($i = 1; $i < Outbox::MAX_ATTEMPTS; $i++) {
        OutboxEvent::whereKey($e->id)->update(['available_at' => now()->subSecond()]);
        app(Outbox::class)->dispatchPending();
    }
    expect($e->refresh()->failed_at)->not->toBeNull();
});

it('does not process an event that is already claimed', function () {
    Event::fake([OutboxEventPublished::class]);
    $e = app(Outbox::class)->record('x');
    $e->update(['claimed_at' => now()]);
    expect(app(Outbox::class)->dispatchPending())->toBe(0);
});

it('runs through the artisan command', function () {
    Event::fake([OutboxEventPublished::class]);
    app(Outbox::class)->record('x');
    $this->artisan('outbox:dispatch')->assertSuccessful();
    expect(OutboxEvent::whereNotNull('processed_at')->count())->toBe(1);
});
