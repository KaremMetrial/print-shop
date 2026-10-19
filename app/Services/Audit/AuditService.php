<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * يُستدعى من داخل الـAction (نفس المعاملة) لكل عملية حساسة.
 * لا تُسجَّل أسرار: كلمات المرور/التوكنات/المفاتيح تُحجب تلقائيًا.
 */
class AuditService
{
    private const SENSITIVE = ['password', 'password_confirmation', 'current_password', 'token', 'remember_token', 'secret', 'api_key', 'api_secret', 'authorization'];

    public function record(string $action, ?Model $entity = null, array $old = [], array $new = [], ?string $reason = null): AuditLog
    {
        [$type, $id, $role] = $this->actor();

        return AuditLog::create([
            'actor_type' => $type,
            'actor_id' => $id,
            'actor_role_snapshot' => $role,
            'entity_type' => $entity ? $entity->getMorphClass() : null,
            'entity_id' => $entity?->getKey(),
            'action' => $action,
            'old_values' => $old ? $this->redact($old) : null,
            'new_values' => $new ? $this->redact($new) : null,
            'reason' => $reason,
            'correlation_id' => $this->correlationId(),
            'ip' => request()->ip(),
        ]);
    }

    /** فروق قبل/بعد للحقول المتغيرة فقط. */
    public function diff(array $before, array $after): array
    {
        $old = $new = [];
        foreach ($after as $k => $v) {
            if (($before[$k] ?? null) !== $v) {
                $old[$k] = $before[$k] ?? null;
                $new[$k] = $v;
            }
        }

        return [$old, $new];
    }

    private function actor(): array
    {
        foreach (['staff' => 'staff', 'customer' => 'customer'] as $guard => $type) {
            if (config("auth.guards.$guard") && Auth::guard($guard)->check()) {
                $u = Auth::guard($guard)->user();

                $role = $u instanceof User ? $u->roleEnum()?->value : null;

                return [$type, $u->getAuthIdentifier(), $role];
            }
        }

        return ['system', null, null];
    }

    private function correlationId(): string
    {
        $req = request();
        $id = $req->headers->get('X-Correlation-Id') ?: $req->attributes->get('correlation_id');
        if (! $id) {
            $id = (string) Str::uuid();
            $req->attributes->set('correlation_id', $id);
        }

        return (string) $id;
    }

    private function redact(array $data): array
    {
        $out = [];
        foreach ($data as $k => $v) {
            if (in_array(strtolower((string) $k), self::SENSITIVE, true)) {
                $out[$k] = '***';
            } else {
                $out[$k] = is_array($v) ? $this->redact($v) : $v;
            }
        }

        return $out;
    }
}
