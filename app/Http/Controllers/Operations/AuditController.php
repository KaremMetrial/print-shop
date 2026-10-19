<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** سجل التدقيق (S-077/078): للقراءة فقط. لا تعديل ولا حذف (append-only). */
class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('audit.view');
        $q = DB::table('audit_logs')->orderByDesc('id')
            ->when($request->query('action'), fn ($b, $a) => $b->where('action', 'like', "{$a}%"))
            ->when($request->query('actor'), fn ($b, $a) => $b->where('actor_id', $a))
            ->when($request->query('entity'), fn ($b, $e) => $b->where('entity_type', 'like', "%{$e}"))
            ->when($request->query('from'), fn ($b, $d) => $b->where('created_at', '>=', $d))
            ->when($request->query('to'), fn ($b, $d) => $b->where('created_at', '<=', $d.' 23:59:59'));
        $names = User::pluck('name', 'id');
        $rows = $q->paginate(20)->withQueryString()->through(fn ($l) => [
            'id' => $l->id, 'action' => $l->action, 'actor' => $l->actor_id ? ($names[$l->actor_id] ?? '—') : 'النظام', 'role' => $l->actor_role_snapshot,
            'entity' => class_basename((string) $l->entity_type), 'entity_id' => $l->entity_id, 'reason' => $l->reason, 'at' => $l->created_at,
            'old' => $l->old_values ? json_decode($l->old_values, true) : null, 'new' => $l->new_values ? json_decode($l->new_values, true) : null,
        ]);

        return Inertia::render('operations/audit', [
            'logs' => $rows, 'filters' => $request->only(['action', 'actor', 'entity', 'from', 'to']),
            'actors' => User::orderBy('name')->get(['id', 'name']), 'selected' => $request->query('selected') ? (int) $request->query('selected') : null,
        ]);
    }
}
