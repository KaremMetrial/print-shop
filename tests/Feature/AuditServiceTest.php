<?php

use App\Models\AuditLog;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

it('records an entry with actor, entity, diff and redacts secrets', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $log = app(AuditService::class)->record('employee.updated', $user, ['name' => 'قديم', 'password' => 'abc'], ['name' => 'جديد', 'api_key' => 'k'], 'تصحيح');

    expect($log->actor_type)->toBe('staff')
        ->and($log->actor_id)->toBe($user->id)
        ->and($log->entity_id)->toBe($user->id)
        ->and($log->old_values)->toBe(['name' => 'قديم', 'password' => '***'])
        ->and($log->new_values)->toBe(['name' => 'جديد', 'api_key' => '***'])
        ->and($log->reason)->toBe('تصحيح')
        ->and($log->correlation_id)->not->toBeEmpty();
});

it('falls back to a system actor when nobody is signed in', function () {
    $log = app(AuditService::class)->record('job.ran');
    expect($log->actor_type)->toBe('system')->and($log->actor_id)->toBeNull();
});

it('computes a before/after diff of changed fields only', function () {
    [$old, $new] = app(AuditService::class)->diff(['a' => 1, 'b' => 2], ['a' => 1, 'b' => 3, 'c' => 4]);
    expect($old)->toBe(['b' => 2, 'c' => null])->and($new)->toBe(['b' => 3, 'c' => 4]);
});

it('is append-only at the application level', function () {
    $log = app(AuditService::class)->record('x');
    expect(fn () => $log->update(['action' => 'y']))->toThrow(LogicException::class)
        ->and(fn () => $log->delete())->toThrow(LogicException::class);
});

it('is append-only at the database level (MySQL trigger)', function () {
    app(AuditService::class)->record('x');
    expect(fn () => DB::table('audit_logs')->update(['action' => 'hack']))->toThrow(QueryException::class)
        ->and(fn () => DB::table('audit_logs')->delete())->toThrow(QueryException::class)
        ->and(AuditLog::count())->toBe(1);
});
