<?php

namespace App\Http\Controllers\Designer;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\DesignVersion;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\Design\DesignService;
use App\Support\PenFixtures;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** واجهة المصمم (S-043…045): يرى مهامه فقط ولا يرى أسعارًا (BR-014/071). */
class TaskController extends Controller
{
    private const TABS = [
        'new' => ['NEW'], 'in_progress' => ['IN_DESIGN'], 'revision' => ['REVISION_REQUESTED'], 'awaiting' => ['AWAITING_APPROVAL'], 'done' => ['APPROVED'],
    ];

    public function index(Request $request): Response
    {
        Gate::authorize('design.tasks.view_own');
        $user = $request->user();
        $tab = array_key_exists((string) $request->query('tab'), self::TABS) ? $request->query('tab') : 'new';
        $base = $this->mine($user);
        $counts = [];
        foreach (self::TABS as $k => $states) {
            $counts[$k] = (clone $base)->whereIn('design_state', $states)->count();
        }
        $period = in_array($request->query('period'), ['today', 'week', 'month'], true) ? $request->query('period') : null;
        $updatedAfter = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->subDays(6)->startOfDay(),
            'month' => now()->subDays(29)->startOfDay(),
            default => null,
        };
        $query = (clone $base)->whereIn('design_state', self::TABS[$tab])
            ->when($request->query('q'), fn ($b, $q) => $b->where(fn ($w) => $w->whereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$q}%"))->orWhere('product_snapshot->name', 'like', "%{$q}%")))
            ->when($request->query('product'), fn ($b, $name) => $b->where('product_snapshot->name', $name));
        if ($updatedAfter) {
            if (in_array($tab, ['new', 'in_progress'], true)) {
                $query->whereIn('id', DB::table('item_assignment_history')->where('designer_id', $user->id)->where('created_at', '>=', $updatedAfter)->select('order_item_id'));
            } else {
                $query->where('updated_at', '>=', $updatedAfter);
            }
        }
        $rows = $query->with('order.customer:id,name')->oldest('updated_at')->get()->map(fn (OrderItem $i) => $this->card($i));
        $products = (clone $base)->whereIn('design_state', self::TABS[$tab])->get(['product_snapshot'])
            ->map(fn (OrderItem $i) => $i->product_snapshot['name'] ?? null)->filter()->unique()->sort()
            ->map(fn (string $name) => ['value' => $name, 'label' => $name])->values()->all();

        $props = [
            'tab' => $tab, 'counts' => $counts, 'tasks' => $rows, 'workload' => $counts['in_progress'] + $counts['revision'],
            'designer' => ['name' => $user->name], 'products' => $products, 'filters' => $request->only(['q', 'period', 'product']),
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $props = array_replace($props, PenFixtures::designerTasks($tab));
        }

        return Inertia::render('designer/tasks', $props);
    }

    public function show(Request $request, OrderItem $item): Response
    {
        Gate::authorize('design.tasks.view_own');
        $this->own($request->user(), $item);
        $tab = in_array($request->query('tab'), ['specs', 'files', 'chat', 'versions', 'activity'], true) ? $request->query('tab') : 'specs';
        $item->load('order.customer:id,name');
        $versions = DesignVersion::where('order_item_id', $item->id)->with('files')->orderByDesc('version_no')->get();
        $props = [
            'tab' => $tab, 'designer' => ['name' => $request->user()->name],
            'task' => $this->card($item) + [
                'specs_list' => collect($item->options_snapshot)->map(fn ($o) => ['group' => $o['group'] ?? '', 'value' => $o['value'] ?? ''])->all(),
                'quantity' => $item->quantity, 'notes' => $item->notes, 'state' => $item->design_state,
            ],
            'versions' => $versions->map(fn (DesignVersion $v) => [
                'id' => $v->id, 'no' => $v->version_no, 'status' => $v->status, 'submitted_at' => $v->submitted_at?->toIso8601String(), 'notes' => $v->notes,
                'files' => $v->files->map(fn ($f) => ['id' => $f->id, 'name' => $f->original_filename])->all(),
            ])->all(),
            'customer_files' => [],
            'activity' => DB::table('design_events')->where('order_item_id', $item->id)->oldest('id')->get()->map(fn ($e) => ['id' => $e->id, 'type' => $e->type, 'at' => $e->created_at, 'note' => $e->note])->all(),
            'has_draft' => $versions->contains('status', 'DRAFT'),
            'can' => ['start' => $item->design_state === 'NEW', 'version' => in_array($item->design_state, ['IN_DESIGN', 'REVISION_REQUESTED'], true)],
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $fx = PenFixtures::designerTask((string) $request->query('state', 'new'), $tab);
            $fx['task'] = ['id' => $item->id] + $fx['task'];
            $props = array_replace($props, $fx);
        }

        return Inertia::render('designer/task', $props);
    }

    public function start(Request $request, OrderItem $item, DesignService $design): RedirectResponse
    {
        Gate::authorize('design.tasks.start');
        $design->start($request->user(), $item);

        return redirect()->route('designer.tasks.show', $item)->with('success', 'بدأت مهمة التصميم.');
    }

    /** ينشئ مسودة نسخة جديدة (أو يفتح الموجودة) ثم يوجّه لمحرر النسخة. */
    public function newVersion(Request $request, OrderItem $item, DesignService $design): RedirectResponse
    {
        Gate::authorize('design.versions.submit');
        $this->own($request->user(), $item);
        $draft = DesignVersion::where('order_item_id', $item->id)->where('status', 'DRAFT')->first() ?? $design->createVersion($request->user(), $item);

        return redirect()->route('designer.versions.edit', $draft);
    }

    public function editVersion(Request $request, DesignVersion $version): Response
    {
        Gate::authorize('design.versions.edit_unapproved');
        $item = $version->item()->with('order.customer:id,name')->firstOrFail();
        $this->own($request->user(), $item);
        if ($version->isImmutable()) {
            throw new BusinessException(ErrorCode::DESIGN_ALREADY_APPROVED);
        }
        $prev = DesignVersion::where('order_item_id', $item->id)->where('version_no', '<', $version->version_no)->orderByDesc('version_no')->first();
        $props = [
            'designer' => ['name' => $request->user()->name], 'task' => $this->card($item) + ['state' => $item->design_state],
            'version' => ['id' => $version->id, 'no' => $version->version_no, 'status' => $version->status, 'notes' => $version->notes, 'files' => $version->files->map(fn ($f) => ['id' => $f->id, 'name' => $f->original_filename, 'type' => $f->mime_type, 'size' => $f->size_bytes])->all()],
            'previous' => $prev ? ['id' => $prev->id, 'no' => $prev->version_no] : null,
            'revision_note' => DB::table('design_events')->where('order_item_id', $item->id)->where('type', 'revision_requested')->latest('id')->first(),
        ];
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $fx = PenFixtures::designerVersion((string) $request->query('state', 'first'));
            $fx['task'] = ['id' => $item->id] + $fx['task'];
            $fx['version'] = ['id' => $version->id] + $fx['version'];
            $props = array_replace($props, $fx);
        }

        return Inertia::render('designer/version', $props);
    }

    public function saveVersion(Request $request, DesignVersion $version, DesignService $design): RedirectResponse
    {
        Gate::authorize('design.versions.edit_unapproved');
        $data = $request->validate(['file_ids' => ['present', 'array'], 'file_ids.*' => ['integer'], 'notes' => ['nullable', 'string', 'max:1000'], 'submit' => ['boolean']]);
        $design->setFiles($request->user(), $version, $data['file_ids']);
        $version->update(['notes' => $data['notes'] ?? null]);
        if ($data['submit'] ?? false) {
            Gate::authorize('design.versions.submit');
            $design->submit($request->user(), $version->refresh());

            return redirect()->route('designer.tasks.show', ['item' => $version->order_item_id, 'tab' => 'versions'])->with('success', 'تم إرسال النسخة للمراجعة.');
        }

        return back()->with('success', 'تم حفظ التغييرات.');
    }

    /** @return Builder<OrderItem> */
    private function mine(User $user)
    {
        return OrderItem::query()->where('designer_id', $user->id)->whereNull('cancelled_at')
            ->whereHas('order', fn ($o) => $o->whereNotIn('status', ['CANCELLED']));
    }

    private function own(User $user, OrderItem $item): void
    {
        abort_unless($item->designer_id === $user->id, 404); // لا نكشف وجود بنود الغير (BR-071)
    }

    /** @return array<string, mixed> */
    private function card(OrderItem $i): array
    {
        $i->loadMissing('order.customer:id,name');

        return [
            'id' => $i->id, 'code' => 'ITEM-'.$i->order_id.'-'.str_pad((string) ($i->order->items()->where('id', '<=', $i->id)->count()), 2, '0', STR_PAD_LEFT), 'order_number' => $i->order->order_number,
            'product' => $i->product_snapshot['name'], 'customer' => $i->order->customer->name, 'specs' => collect($i->options_snapshot)->pluck('value')->implode(' • '),
            'updated_at' => $i->updated_at->toIso8601String(), 'files_count' => 0, 'unread' => 0, 'state' => $i->design_state,
        ];
    }
}
