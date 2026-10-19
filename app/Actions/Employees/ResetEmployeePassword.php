<?php

namespace App\Actions\Employees;

use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ResetEmployeePassword
{
    public function __construct(private AuditService $audit) {}

    /** يولّد كلمة مرور مؤقتة تُعرض مرة واحدة فقط (لا تُخزَّن ولا تُسجَّل في الـAudit). */
    public function handle(User $target): string
    {
        $plain = Str::password(14, symbols: false);

        DB::transaction(function () use ($target, $plain) {
            $target->forceFill(['password' => $plain])->save();
            $target->increment('session_version');
            $this->audit->record('employee.password_reset', $target);
        });

        return $plain;
    }
}
