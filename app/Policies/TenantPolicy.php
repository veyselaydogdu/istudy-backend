<?php

namespace App\Policies;

use App\Models\Tenant\Tenant;
use App\Models\User;

class TenantPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Tenant $tenant): bool
    {
        return $user->tenants()->where('tenants.id', $tenant->id)->exists();
    }

    public function create(User $user): bool
    {
        return false; // Sadece Super Admin (before hook ile)
    }

    public function update(User $user, Tenant $tenant): bool
    {
        return $user->tenants()->where('tenants.id', $tenant->id)->exists();
    }

    public function delete(User $user, Tenant $tenant): bool
    {
        return false; // Sadece Super Admin
    }
}
