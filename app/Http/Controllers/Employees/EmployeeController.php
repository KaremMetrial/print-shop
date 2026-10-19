<?php

namespace App\Http\Controllers\Employees;

use App\Actions\Employees\CreateEmployee;
use App\Actions\Employees\ResetEmployeePassword;
use App\Actions\Employees\SetEmployeeStatus;
use App\Actions\Employees\SyncEmployeePermissions;
use App\Actions\Employees\UpdateEmployee;
use App\Enums\DesignerAvailability;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employees\EmployeeRequest;
use App\Http\Requests\Employees\PermissionsRequest;
use App\Models\DesignerSpecialty;
use App\Models\User;
use App\Support\Auth\Permissions;
use App\Support\PenFixtures;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);
        $actor = $request->user();

        $query = User::query()->with('role')->orderBy('name');
        if ($q = trim((string) $request->query('q'))) {
            $query->where(fn ($w) => $w->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"));
        }
        if ($role = $request->query('role')) {
            $query->whereHas('role', fn ($r) => $r->where('code', $role));
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($av = $request->query('availability')) {
            $query->whereIn('id', DB::table('designer_availability')->where('status', $av)->select('designer_id'));
        }

        $rows = $query->paginate(15)->withQueryString()->through(fn (User $u) => $this->row($u, $actor));

        $payload = [
            'employees' => $rows,
            'filters' => $request->only(['q', 'role', 'status', 'availability']),
            'roles' => $this->roleOptions($actor),
            'can' => ['create' => Gate::forUser($actor)->allows('create', [User::class, Role::DataEntry]) || Gate::forUser($actor)->allows('create', [User::class, Role::Admin])],
            'selected' => null,
        ];
        if ($id = $request->query('selected')) {
            $sel = User::with('role', 'permissionOverrides')->find($id);
            $payload['selected'] = $sel ? $this->row($sel, $actor) + [
                'specialties' => $sel->specialties()->pluck('name')->all(),
                'extra_permissions' => $sel->permissionOverrides->filter(fn ($p) => $p->getAttribute('pivot')->granted)->count(),
                'can_permissions' => Gate::forUser($actor)->allows('managePermissions', $sel),
            ] : null;
        }
        if (app()->environment('local') && $request->query('fixture') === 'pen') {
            $payload = array_replace($payload, PenFixtures::employees());
        }

        return Inertia::render('employees/index', $payload);
    }

    public function create(Request $request): Response
    {
        abort_if($this->roleOptions($request->user()) === [], 403);

        return Inertia::render('employees/form', ['employee' => null, 'roles' => $this->roleOptions($request->user())] + $this->designerOptions());
    }

    public function store(EmployeeRequest $request, CreateEmployee $action): RedirectResponse
    {
        $data = $request->validated();
        $data['role'] = Role::from($data['role']);
        Gate::authorize('create', [User::class, $data['role']]);

        $user = $action->handle($request->user(), $data);

        return redirect()->route('employees.index', ['selected' => $user->id])->with('success', 'تم إنشاء الموظف.');
    }

    /** لا توجد شاشة تفاصيل مستقلة في التصميم: التفاصيل drawer داخل S-065. */
    public function show(User $employee): RedirectResponse
    {
        Gate::authorize('view', $employee);

        return redirect()->route('employees.index', ['selected' => $employee->id]);
    }

    /** S-067 — إدارة الصلاحيات: حالة كل صلاحية بالنسبة لهذا الموظف. */
    public function permissionsPage(Request $request, User $employee): Response
    {
        Gate::authorize('managePermissions', $employee);
        $actor = $request->user();
        $role = $employee->roleEnum();
        $roleCodes = $employee->role->permissions()->pluck('code')->all();
        $granted = $employee->permissionOverrides()->get()->filter(fn ($p) => $p->getAttribute('pivot')->granted)->pluck('code')->all();

        // مجموعات الشاشة كما في التصميم (S-067) ← وحدات الكتالوج
        $map = ['customers' => 'العملاء', 'orders' => 'الأوردرات', 'order_requests' => 'طلبات الأوردرات', 'catalog' => 'المنتجات والأسعار', 'design' => 'التصميمات', 'finance' => 'الحسابات', 'reports' => 'التقارير', 'employees' => 'الموظفون', 'settings' => 'الإعدادات', 'audit' => 'سجل التدقيق'];
        $moduleOf = fn (string $m) => $m === 'dashboard' ? 'reports' : $m;
        $items = [];
        foreach (Permissions::CATALOG as $module => $perms) {
            foreach ($perms as $code => $label) {
                $state = match (true) {
                    $role && Permissions::isHardDenied($role, $code) => 'restricted',
                    in_array($code, $roleCodes, true) => 'role',
                    in_array($code, $granted, true) => 'granted',
                    $actor->hasPermission($code) => 'available',
                    default => 'unavailable',
                };
                $items[$moduleOf($module)][] = ['code' => $code, 'label' => $label, 'state' => $state];
            }
        }
        $groups = [];
        foreach ($map as $key => $title) {
            $groups[] = ['key' => $key, 'title' => $title, 'items' => $items[$key] ?? []];
        }

        return Inertia::render('employees/permissions', [
            'employee' => $this->row($employee, $actor),
            'groups' => $groups,
            'granted' => $granted,
        ]);
    }

    public function edit(Request $request, User $employee): Response
    {
        Gate::authorize('update', $employee);

        return Inertia::render('employees/form', [
            'employee' => ['id' => $employee->id, 'name' => $employee->name, 'email' => $employee->email, 'phone' => $employee->phone, 'role' => $employee->roleEnum()?->value,
                'status' => $employee->status, 'created_at' => $employee->created_at?->toIso8601String(),
                'specialty_ids' => $employee->specialties()->pluck('designer_specialties.id')->map(fn ($i) => (string) $i)->all(),
                'availability' => ($employee->availabilityStatus() ?? DesignerAvailability::Available)->value],
            'roles' => $this->roleOptions($request->user()),
        ] + $this->designerOptions());
    }

    public function update(EmployeeRequest $request, User $employee, UpdateEmployee $action): RedirectResponse
    {
        Gate::authorize('update', $employee);
        $data = $request->validated();
        if (isset($data['role'])) {
            $data['role'] = Role::from($data['role']);
        }
        $action->handle($request->user(), $employee, $data);

        return redirect()->route('employees.index', ['selected' => $employee->id])->with('success', 'تم حفظ التعديلات.');
    }

    public function deactivate(Request $request, User $employee, SetEmployeeStatus $action): RedirectResponse
    {
        Gate::authorize('update', $employee);
        $action->handle($employee, false, $request->input('reason'));

        return back()->with('success', 'تم تعطيل الحساب وإنهاء جلساته.');
    }

    public function activate(User $employee, SetEmployeeStatus $action): RedirectResponse
    {
        Gate::authorize('update', $employee);
        $action->handle($employee, true);

        return back()->with('success', 'تم تفعيل الحساب.');
    }

    public function resetPassword(User $employee, ResetEmployeePassword $action): RedirectResponse
    {
        Gate::authorize('update', $employee);

        return back()->with('generated_password', $action->handle($employee))->with('success', 'تم توليد كلمة مرور مؤقتة. تُعرض مرة واحدة فقط.');
    }

    public function permissions(PermissionsRequest $request, User $employee, SyncEmployeePermissions $action): RedirectResponse
    {
        Gate::authorize('managePermissions', $employee);
        $action->handle($request->user(), $employee, $request->validated('grant'), $request->validated('revoke'));

        return back()->with('success', 'تم حفظ الصلاحيات.');
    }

    /** @return array<string, mixed> */
    private function row(User $u, User $actor): array
    {
        return [
            'id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'phone' => $u->phone,
            'role' => $u->roleEnum()?->value, 'role_label' => $u->roleEnum()?->label(),
            'status' => $u->status, 'created_at' => $u->created_at?->toIso8601String(),
            'last_login_at' => $u->last_login_at?->toIso8601String(),
            'can_edit' => Gate::forUser($actor)->allows('update', $u),
            'availability' => $u->roleEnum() === Role::Designer ? $u->availabilityStatus()?->label() : null,
        ];
    }

    /** @return list<array{value:string,label:string}> الأدوار التي يحق للمنفّذ إنشاءها. */
    private function roleOptions(User $actor): array
    {
        return collect(Role::cases())
            ->filter(fn (Role $r) => Gate::forUser($actor)->allows('create', [User::class, $r]))
            ->map(fn (Role $r) => ['value' => $r->value, 'label' => $r->label()])->values()->all();
    }

    /** @return array<string, mixed> */
    private function designerOptions(): array
    {
        return [
            'specialties' => DesignerSpecialty::where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn ($s) => ['value' => (string) $s->id, 'label' => $s->name])->all(),
            'availabilityOptions' => collect(DesignerAvailability::cases())->map(fn ($a) => ['value' => $a->value, 'label' => $a->label()])->values()->all(),
        ];
    }
}
