<?php

namespace App\Services\Outbox;

use App\Events\OutboxEventPublished;
use App\Models\OutboxEvent;
use Illuminate\Database\Eloquent\Model;
use Throwable;

class Outbox
{
    public const MAX_ATTEMPTS = 5;

    /** سجّل الحدث داخل نفس معاملة التغيير التجاري (قبل commit). */
    public function record(string $type, ?Model $aggregate = null, array $payload = []): OutboxEvent
    {
        return OutboxEvent::create([
            'event_type' => $type,
            'aggregate_type' => $aggregate?->getMorphClass(),
            'aggregate_id' => $aggregate?->getKey(),
            'payload' => $payload,
        ]);
    }

    /** يعالج الأحداث المعلّقة. يرجع عدد المنجز. فشل مستمع ≠ rollback للعملية التجارية. */
    public function dispatchPending(int $limit = 100): int
    {
        $done = 0;
        $ids = OutboxEvent::query()->whereNull('processed_at')->whereNull('failed_at')->whereNull('claimed_at')
            ->where('available_at', '<=', now())->orderBy('id')->limit($limit)->pluck('id');

        foreach ($ids as $id) {
            // claim ذري: عاملان لا يعالجان نفس الحدث
            $claimed = OutboxEvent::whereKey($id)->whereNull('claimed_at')->whereNull('processed_at')->update(['claimed_at' => now()]);
            if (! $claimed) {
                continue;
            }
            $event = OutboxEvent::find($id);
            try {
                event(new OutboxEventPublished($event));
                $event->update(['processed_at' => now(), 'last_error' => null]);
                $done++;
            } catch (Throwable $e) {
                $attempts = $event->attempts + 1;
                $event->update([
                    'attempts' => $attempts,
                    'claimed_at' => null,
                    'last_error' => mb_substr($e->getMessage(), 0, 1000),
                    'available_at' => now()->addSeconds(min(3600, 2 ** $attempts * 10)),
                    'failed_at' => $attempts >= self::MAX_ATTEMPTS ? now() : null,
                ]);
            }
        }

        return $done;
    }
}
