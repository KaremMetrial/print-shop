<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class CatalogPolicy
{
    public function viewAny(User $u): bool
    {
        return $u->hasPermission('products.view');
    }

    public function view(User $u, Product $p): bool
    {
        return $u->hasPermission('products.view');
    }

    public function manage(User $u): bool
    {
        return $u->hasPermission('products.manage');
    }

    public function manageOptions(User $u): bool
    {
        return $u->hasPermission('pricing.options.manage') || $u->hasPermission('products.manage');
    }

    public function manageTiers(User $u): bool
    {
        return $u->hasPermission('pricing.tiers.manage');
    }
}
