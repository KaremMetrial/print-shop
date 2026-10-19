<?php

namespace App\Actions\Employees;

use App\Enums\ErrorCode;
use App\Enums\Role as RoleEnum;
use App\Exceptions\BusinessException;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\DB;

class SetEmployeeStatus
{
    public function __construct(private AuditService $audit) {}

    public function handle(User $target, bool $active, ?string $reason = null): User
    {
        return DB::transaction(function () use ($target, $active, $reason) {
            $target = User::whereKey($target->id)->lockForUpdate()->firstOrFail();
            $status = $active ? User::ACTIVE : User::INACTIVE;
            if ($target->status === $status) {
                return $target;
            }
            if (! $active && $target->roleEnum() === RoleEnum::SuperAdmin) {
                throw new BusinessException(ErrorCode::INSUFFICIENT_PERMISSION);
            }

            $old = $target->status;
            $target->status = $status;
            $target->session_version++; // تعطيل = إنهاء الجلسة فورًا (§40.36)
            $target->save();
            $this->audit->record($active ? 'employee.activated' : 'employee.deactivated', $target, ['status' => $old], ['status' => $status], $reason);

            return $target;
        });
    }
}
