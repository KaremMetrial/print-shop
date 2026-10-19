<?php

namespace App\Http\Controllers\Notifications;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Notifications\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** S-004 الإشعارات (قراءة لا تُغلق إجراء) + S-005 مركز الإجراءات + S-006 سجل الإجراءات. كل مستخدم يرى إشعاراته فقط. */
class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $uid = $request->user()->id;
        $unread = $request->query('tab') === 'unread';
        $q = DB::table('staff_notifications')->where('user_id', $uid)->when($unread, fn ($b) => $b->whereNull('read_at'))->orderByDesc('id');
        $rows = $q->paginate(15)->withQueryString()->through(fn ($n) => [
            'id' => $n->id, 'type' => $n->type, 'title' => $n->title, 'body' => $n->body, 'link' => $n->link, 'action_id' => $n->action_id, 'read' => $n->read_at !== null, 'created_at' => $n->created_at,
            'action_open' => $n->action_id ? DB::table('staff_actions')->where('id', $n->action_id)->where('status', '!=', 'DONE')->exists() : false,
        ]);

        return Inertia::render('notifications/index', [
            'notifications' => $rows, 'tab' => $unread ? 'unread' : 'all',
            'counts' => ['all' => DB::table('staff_notifications')->where('user_id', $uid)->count(), 'unread' => DB::table('staff_notifications')->where('user_id', $uid)->whereNull('read_at')->count()],
        ]);
    }

    public function read(Request $request, int $id): RedirectResponse
    {
        DB::table('staff_notifications')->where('id', $id)->where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);

        return back();
    }

    public function readAll(Request $request): RedirectResponse
    {
        DB::table('staff_notifications')->where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);

        return back()->with('success', 'تم تعليم الإشعارات كمقروءة. لم تُغلق أي إجراءات عمل مرتبطة.');
    }

    public function actions(Request $request): Response
    {
        $status = in_array($request->query('status'), ['OPEN', 'CLAIMED', 'ALL'], true) ? $request->query('status') : 'ACTIVE';
        $type = $request->query('type');
        $q = DB::table('staff_actions')->where('status', '!=', 'DONE')
            ->when($status === 'OPEN', fn ($b) => $b->where('status', 'OPEN'))->when($status === 'CLAIMED', fn ($b) => $b->where('status', 'CLAIMED'))
            ->when($type, fn ($b) => $b->where('type', $type))
            ->when($request->query('q'), fn ($b, $t) => $b->where(fn ($w) => $w->where('title', 'like', "%{$t}%")->orWhere('order_ref', 'like', "%{$t}%")->orWhere('customer', 'like', "%{$t}%")))
            ->orderBy('created_at'); // الأقدم أولًا (BR-067)
        $names = User::pluck('name', 'id');
        $rows = $q->paginate(15)->withQueryString()->through(fn ($a) => [
            'id' => $a->id, 'type' => $a->type, 'title' => $a->title, 'customer' => $a->customer, 'order_ref' => $a->order_ref, 'link' => $a->link, 'status' => $a->status,
            'claimed_by' => $a->claimed_by ? ($names[$a->claimed_by] ?? null) : null, 'mine' => $a->claimed_by === $request->user()->id, 'created_at' => $a->created_at,
        ]);
        $base = DB::table('staff_actions')->where('status', '!=', 'DONE');

        return Inertia::render('notifications/actions', [
            'actions' => $rows, 'filters' => $request->only(['q', 'status', 'type']),
            'counts' => ['total' => (clone $base)->count(), 'open' => (clone $base)->where('status', 'OPEN')->count(), 'claimed' => (clone $base)->where('status', 'CLAIMED')->count()],
        ]);
    }

    public function claim(Request $request, int $id): RedirectResponse
    {
        $n = DB::table('staff_actions')->where('id', $id)->where('status', 'OPEN')->update(['status' => 'CLAIMED', 'claimed_by' => $request->user()->id, 'claimed_at' => now(), 'updated_at' => now()]);
        abort_if($n === 0, 409, 'الإجراء مُسند أو منتهٍ بالفعل.');

        return back()->with('success', 'أُسند الإجراء إليك.');
    }

    public function complete(Request $request, int $id, NotificationService $svc): RedirectResponse
    {
        $a = DB::table('staff_actions')->where('id', $id)->first();
        abort_if(! $a || $a->status === 'DONE', 409, 'الإجراء منتهٍ بالفعل.');
        abort_if($a->status === 'CLAIMED' && $a->claimed_by !== $request->user()->id, 403, 'الإجراء مُسند لموظف آخر.');
        $svc->resolveByKey($a->dedupe_key, $request->user(), $request->input('note'));
        app(AuditService::class)->record('action.completed', null, [], ['action_id' => $id]);

        return back()->with('success', 'تم إغلاق الإجراء.');
    }

    public function log(Request $request): Response
    {
        $names = User::pluck('name', 'id');
        $rows = DB::table('staff_actions')->where('status', 'DONE')->orderByDesc('completed_at')->paginate(15)->withQueryString()->through(fn ($a) => [
            'id' => $a->id, 'title' => $a->title, 'order_ref' => $a->order_ref, 'customer' => $a->customer, 'completed_by' => $a->completed_by ? ($names[$a->completed_by] ?? '—') : 'النظام', 'completed_at' => $a->completed_at, 'note' => $a->completed_note,
        ]);

        return Inertia::render('notifications/log', ['actions' => $rows]);
    }
}
