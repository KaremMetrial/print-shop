<?php

namespace App\Actions\Employees;

use App\Enums\Role as RoleEnum;
use App\Models\Role;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\DB;

class CreateEmployee
{
    public function __construct(private AuditService $audit) {}

    /** @param array<string, mixed> $data */
    public function handle(User $actor, array $data): User
    {
        return DB::transaction(function () use ($actor, $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => mb_strtolower($data['email']),
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'role_id' => Role::where('code', $data['role']->value)->firstOrFail()->id,
                'status' => User::ACTIVE,
                'created_by' => $actor->id,
                'email_verified_at' => now(),
            ]);

            $this->syncDesigner($user, $actor, $data);
            $this->audit->record('employee.created', $user, [], ['name' => $user->name, 'email' => $user->email, 'role' => $data['role']->value]);

            return $user;
        });
    }

    /** @param array<string, mixed> $data */
    private function syncDesigner(User $user, User $actor, array $data): void
    {
        if (($data['role'] ?? null) !== RoleEnum::Designer) {
            return;
        }
        $user->specialties()->sync($data['specialty_ids'] ?? []);
        DB::table('designer_availability')->updateOrInsert(['designer_id' => $user->id], ['status' => $data['availability'] ?? 'AVAILABLE', 'updated_by' => $actor->id, 'updated_at' => now()]);
    }
}
