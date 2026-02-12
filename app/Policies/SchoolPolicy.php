<?php

namespace App\Policies;

use App\Models\School\School;
use App\Models\User;

class SchoolPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true; // Tenant scope zaten filtreler
    }

    public function view(User $user, School $school): bool
    {
        return true; // Tenant scope zaten filtreler
    }

    public function create(User $user): bool
    {
        // Tenant owner veya üstü
        return $user->tenants()->exists();
    }

    public function update(User $user, School $school): bool
    {
        return $user->tenants()->where('tenants.id', $school->tenant_id)->exists();
    }

    public function delete(User $user, School $school): bool
    {
        return $user->tenants()->where('tenants.id', $school->tenant_id)->exists();
    }
}
