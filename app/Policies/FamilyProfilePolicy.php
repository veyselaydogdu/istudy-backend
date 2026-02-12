<?php

namespace App\Policies;

use App\Models\Child\FamilyProfile;
use App\Models\User;

class FamilyProfilePolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, FamilyProfile $familyProfile): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, FamilyProfile $familyProfile): bool
    {
        return true;
    }

    public function delete(User $user, FamilyProfile $familyProfile): bool
    {
        return true;
    }
}
