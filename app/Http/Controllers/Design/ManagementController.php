<?php

namespace App\Http\Controllers\Design;

use App\Enums\DesignerAvailability;
use App\Enums\Role as RoleEnum;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Design\AssignmentService;
use App\Support\PenFixtures;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** إدارة التصميمات (S-039) والمصممون (S-040/041): متابعة وإسناد وتوفر. للإدارة/الإدخال حسب الصلاحية. */
class ManagementController extends Controller
{
    private const STATE_LABELS = ['NEW' => 'مهمة جديدة', 'IN_DESIGN' => 'قيد التنفيذ', 'REVISION_REQUESTED' => 'مطلوب تعديل', 'AWAITING_APPROVAL' => 'بانتظار اعتماد العميل', 'APPROVED' => 'معتمد'];

    public function index(Request $request): Response
    {
        Gate::authorize('designers.view');
        $base = OrderItem::query()->whereNull('cancelled_at')->whereHas('order', fn ($o) => $o->where('status', 'DESIGN_STAGE'));
        $kpis = [
            'unassigned' => (clone $base)->whereNull('designer_id')->count(), 'in_design' => (clone $base)->where('design_state', 'IN_DESIGN')->count(),
            'revision' => (clone $base)->where('design_state', 'REVISION_REQUESTED')->count(), 'awaiting' => (clone $base)->where('design_state', 'AWAITING_APPROVAL')->count(),
        ];
        $q = $request->query('q');
        $order = $request->query('order');
        $specialty = $request->query('specialty');
        $period = in_array($request->query('period'), ['today', 'week', 'month'], true) ? $request->query('period') : null;
        $createdAfter = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->subDays(6)->startOfDay(),
            'month' => now()->subDays(29)->startOfDay(),
            default => null,
        };
        $filtered = (clone $base)->with('order:id,order_number,created_at')
            ->when($q, fn ($b) => $b->whereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$q}%")))
            ->when($order, fn ($b) => $b->whereHas('order', fn ($o) => $o->where('order_number', $order)))
            ->when($specialty && ctype_digit((string) $specialty), fn ($b) => $b->where('product_snapshot->required_specialty_id', (int) $specialty))
            ->when($createdAfter, fn ($b) => $b->where('created_at', '>=', $createdAfter))
            ->when($request->query('state'), fn ($b, $st) => $b->where('design_state', $st))
            ->when($request->query('designer'), fn ($b, $d) => $b->where('designer_id', $d));
        $names = User::pluck('name', 'id');
        $specs = DB::table('designer_specialties')->pluck('name', 'id');
        $orderOptions = Order::query()->where('status', 'DESIGN_STAGE')->whereHas('items', fn ($items) => $items->whereNull('cancelled_at'))
            ->latest('created_at')->limit(100)->get(['id', 'order_number'])
            ->map(fn (Order $o) => ['value' => (string) $o->order_number, 'label' => (string) $o->order_number])->all();
        $specialtyOptions = DB::table('designer_specialties')->orderBy('name')->get(['id', 'name'])
            ->map(fn ($s) => ['value' => (string) $s->id, 'label' => $s->name])->all();
        $unassigned = (clone $filtered)->whereNull('designer_id')->oldest('created_at')->get()->map(fn (OrderItem $i) => [
            'id' => $i->id, 'code' => $i->code(), 'order_number' => $i->order->order_number, 'product' => $i->product_snapshot['name'],
            'specialty' => $specs[$i->product_snapshot['required_specialty_id'] ?? 0] ?? '—', 'created_at' => $i->created_at->toIso8601String(),
        ]);
        $tasks = (clone $filtered)->whereNotNull('designer_id')->latest('updated_at')->limit(100)->get()->map(fn (OrderItem $i) => [
            'id' => $i->id, 'code' => $i->code(), 'order_number' => $i->order->order_number, 'product' => $i->product_snapshot['name'], 'designer' => $names[$i->designer_id] ?? '—',
            'state' => $i->design_state, 'state_label' => self::STATE_LABELS[$i->design_state] ?? $i->design_state, 'updated_at' => $i->updated_at->toIso8601String(),
        ]);
        $props = [
            'kpis' => $kpis, 'unassigned' => $unassigned, 'tasks' => $tasks, 'workload' => $this->workload(),
            'designers' => $this->designerOptions(), 'orders' => $orderOptions, 'specialties' => $specialtyOptions,
            'filters' => $request->only(['q', 'state', 'designer', 'order', 'period', 'specialty']),
            'can' => ['assign' => (bool) $request->user()->hasPermission('designers.assignment.manage')],
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::designManagement());
        }

        return Inertia::render('design/index', $props);
    }

    public function assign(Request $request, OrderItem $item, AssignmentService $assignment): RedirectResponse
    {
        Gate::authorize('designers.assignment.manage');
        $data = $request->validate(['designer_id' => ['required', 'integer', 'exists:users,id'], 'reason' => ['nullable', 'string', 'max:255']]);
        $assignment->assignManually($request->user(), $item, User::findOrFail($data['designer_id']), $data['reason'] ?? null);

        return back()->with('success', 'تم إسناد المصمم.');
    }

    public function designers(Request $request): Response
    {
        Gate::authorize('designers.view');
        $rows = $this->designerCards($request->query('q'), $request->query('availability'), $request->query('specialty'), $request->query('status'));
        $props = [
            'designers' => $rows,
            'specialties' => DB::table('designer_specialties')->orderBy('name')->get(['id', 'name'])->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->all(),
            'filters' => $request->only(['q', 'availability', 'specialty', 'status']),
            'can' => ['availability' => (bool) $request->user()->hasPermission('designers.availability.manage')],
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::designersList());
        }

        return Inertia::render('design/designers', $props);
    }

    public function availability(Request $request, User $designer): RedirectResponse
    {
        Gate::authorize('designers.availability.manage');
        abort_unless($designer->roleEnum() === RoleEnum::Designer, 404);
        $data = $request->validate(['status' => ['required', 'in:'.implode(',', array_column(DesignerAvailability::cases(), 'value'))]]);
        DB::table('designer_availability')->updateOrInsert(['designer_id' => $designer->id], ['status' => $data['status'], 'updated_by' => $request->user()->id, 'updated_at' => now()]);
        app(AuditService::class)->record('designer.availability_changed', $designer, [], ['status' => $data['status']]);

        return back()->with('success', 'تم تحديث حالة التوفر.');
    }

    public function designer(Request $request, User $designer): Response
    {
        Gate::authorize('designers.view');
        abort_unless($designer->roleEnum() === RoleEnum::Designer, 404);
        $tab = in_array($request->query('tab'), ['active', 'awaiting', 'done', 'history', 'availability'], true) ? $request->query('tab') : 'overview';
        $items = OrderItem::where('designer_id', $designer->id)->whereNull('cancelled_at')->with('order:id,order_number')->latest('updated_at')->get();
        $stats = $this->stats($designer->id);
        $props = [
            'designer' => $this->card($designer) + ['stats' => $stats], 'tab' => $tab,
            'tasks' => $items->filter(fn ($i) => match ($tab) {
                'active' => in_array($i->design_state, ['IN_DESIGN', 'REVISION_REQUESTED', 'NEW'], true), 'awaiting' => $i->design_state === 'AWAITING_APPROVAL', 'done' => $i->design_state === 'APPROVED', default => true,
            })->take($tab === 'overview' ? 3 : 100)->values()->map(fn (OrderItem $i) => [
                'id' => $i->id, 'code' => $i->code(), 'order_number' => $i->order->order_number, 'product' => $i->product_snapshot['name'], 'state' => $i->design_state,
                'state_label' => self::STATE_LABELS[$i->design_state], 'updated_at' => $i->updated_at->toIso8601String(),
            ]),
            'history' => DB::table('item_assignment_history')->join('order_items', 'order_items.id', '=', 'item_assignment_history.order_item_id')->where('item_assignment_history.designer_id', $designer->id)->orderByDesc('item_assignment_history.id')->limit(50)
                ->get(['item_assignment_history.mode', 'item_assignment_history.reason', 'item_assignment_history.created_at', 'order_items.id as item_id'])->map(fn ($h) => ['mode' => $h->mode, 'reason' => $h->reason, 'at' => $h->created_at, 'item_id' => $h->item_id]),
            'can' => ['availability' => (bool) $request->user()->hasPermission('designers.availability.manage')],
            'availabilityOptions' => collect(DesignerAvailability::cases())->map(fn ($a) => ['value' => $a->value, 'label' => $a->label()])->values(),
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::designerProfile($tab));
        }

        return Inertia::render('design/designer', $props);
    }

    /** @return list<array<string, mixed>> */
    private function designerOptions(): array
    {
        return $this->designerQuery()->get()->map(fn (User $d) => ['id' => $d->id, 'name' => $d->name])->all();
    }

    /** @return Builder<User> */
    private function designerQuery()
    {
        return User::query()->whereHas('role', fn ($r) => $r->where('code', RoleEnum::Designer->value))->orderBy('name');
    }

    /** @return list<array<string, mixed>> */
    private function workload(): array
    {
        return $this->designerQuery()->get()->map(fn (User $d) => ['id' => $d->id, 'name' => $d->name, 'availability' => ($d->availabilityStatus() ?? DesignerAvailability::Available)->label(), 'availability_value' => ($d->availabilityStatus() ?? DesignerAvailability::Available)->value, 'active' => $this->stats($d->id)['active']])->all();
    }

    /** @return list<array<string, mixed>> */
    private function designerCards(?string $q, ?string $availability, ?string $specialty = null, ?string $status = null): array
    {
        return $this->designerQuery()->when($q, fn ($b) => $b->where('name', 'like', "%{$q}%"))
            ->when($availability, fn ($b) => $b->whereIn('id', DB::table('designer_availability')->where('status', $availability)->select('designer_id')))
            ->when($specialty && ctype_digit($specialty), fn ($b) => $b->whereHas('specialties', fn ($s) => $s->where('designer_specialties.id', (int) $specialty)))
            ->when(in_array($status, ['ACTIVE', 'INACTIVE'], true), fn ($b) => $b->where('status', $status))
            ->with('specialties')->get()->map(fn (User $d) => $this->card($d) + ['stats' => $this->stats($d->id)])->all();
    }

    /** @return array<string, mixed> */
    private function card(User $d): array
    {
        $av = $d->availabilityStatus() ?? DesignerAvailability::Available;

        return ['id' => $d->id, 'name' => $d->name, 'specialty' => $d->specialties()->pluck('name')->implode('، ') ?: '—', 'status' => $d->status, 'availability' => $av->label(), 'availability_value' => $av->value];
    }

    /** @return array{active: int, new: int, awaiting: int, done: int} */
    private function stats(int $designerId): array
    {
        $c = OrderItem::where('designer_id', $designerId)->whereNull('cancelled_at')->selectRaw('design_state, count(*) n')->groupBy('design_state')->pluck('n', 'design_state');

        return ['active' => (int) ($c['IN_DESIGN'] ?? 0) + (int) ($c['REVISION_REQUESTED'] ?? 0), 'new' => (int) ($c['NEW'] ?? 0), 'awaiting' => (int) ($c['AWAITING_APPROVAL'] ?? 0), 'done' => (int) ($c['APPROVED'] ?? 0)];
    }
}
