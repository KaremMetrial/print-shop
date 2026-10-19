<?php

namespace App\Actions\Employees;

use App\Enums\ErrorCode;
use App\Enums\Role as RoleEnum;
use App\Models\Role;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class UpdateEmployee
{
    public function __construct(private AuditService $audit) {}

    /**
     * تغيير الدور يتطلب أن يملك المنفّذ صلاحية إدارة الدور الجديد أيضًا (منع الترقية لـAdmin من Admin).
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, User $target, array $data): User
    {
        return DB::transaction(function () use ($actor, $target, $data) {
            $target = User::whereKey($target->id)->lockForUpdate()->firstOrFail();
            $before = $this->snapshot($target);

            $newRole = $data['role'] ?? null;
            if ($newRole && $newRole !== $target->roleEnum()) {
                if (! Gate::forUser($actor)->allows('create', [User::class, $newRole])) {
                    throw new AuthorizationException(ErrorCode::INSUFFICIENT_PERMISSION->message());
                }
                $target->role_id = Role::where('code', $newRole->value)->firstOrFail()->id;
                $target->session_version++; // تغيير الدور ينهي الجلسات الحالية
            }

            $target->fill(array_filter([
                'name' => $data['name'] ?? null,
                'email' => isset($data['email']) ? mb_strtolower($data['email']) : null,
            ], fn ($v) => $v !== null));
            if (array_key_exists('phone', $data)) {
                $target->phone = $data['phone'];
            }
            $target->save();
            $target->unsetRelation('role');
            $this->syncDesigner($actor, $target, $data);

            [$old, $new] = $this->audit->diff($before, $this->snapshot($target));
            if ($new) {
                $this->audit->record('employee.updated', $target, $old, $new);
            }

            return $target;
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(User $u): array
    {
        return ['name' => $u->name, 'email' => $u->email, 'phone' => $u->phone, 'role' => $u->roleEnum()?->value];
    }

    /** @param array<string, mixed> $data */
    private function syncDesigner(User $actor, User $target, array $data): void
    {
        if ($target->roleEnum() !== RoleEnum::Designer) {
            return;
        }
        if (array_key_exists('specialty_ids', $data)) {
            $old = $target->specialties()->pluck('designer_specialties.id')->map(fn ($i) => (int) $i)->sort()->values()->all();
            $target->specialties()->sync($data['specialty_ids']);
            $ids = array_map('intval', $data['specialty_ids']);
            sort($ids);
            $new = $ids;
            if ($old !== $new) {
                $this->audit->record('designer.specialties_changed', $target, ['specialty_ids' => $old], ['specialty_ids' => $new]);
            }
        }
        if (isset($data['availability'])) {
            $old = DB::table('designer_availability')->where('designer_id', $target->id)->value('status');
            DB::table('designer_availability')->updateOrInsert(['designer_id' => $target->id], ['status' => $data['availability'], 'updated_by' => $actor->id, 'updated_at' => now()]);
            if ($old !== $data['availability']) {
                $this->audit->record('designer.availability_changed', $target, ['status' => $old], ['status' => $data['availability']]);
            }
        }
    }
}
