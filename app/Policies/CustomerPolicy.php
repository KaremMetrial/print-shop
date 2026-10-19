<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $u): bool
    {
        return $u->hasPermission('customers.view');
    }

    public function view(User $u, Customer $c): bool
    {
        return $u->hasPermission('customers.view');
    }

    public function create(User $u): bool
    {
        return $u->hasPermission('customers.create');
    }

    public function update(User $u, Customer $c): bool
    {
        return $u->hasPermission('customers.update');
    }

    public function managePlatformAccess(User $u, Customer $c): bool
    {
        return $u->hasPermission('customers.platform_access.manage');
    }

    /** إعادة تعيين كلمة مرور العميل: المسؤول والمحاسب، أو Data Entry مفوّض (§3.8). */
    public function resetPassword(User $u, Customer $c): bool
    {
        return $u->hasPermission('customers.password_reset.handle');
    }

    public function viewBalance(User $u): bool
    {
        return $u->hasPermission('customers.view_balance');
    }

    public function viewLedger(User $u): bool
    {
        return $u->hasPermission('customers.view_ledger');
    }
}
