<?php

namespace App\Policies;

use App\Models\Child\Child;
use App\Models\User;

class ChildPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Child $child): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Child $child): bool
    {
        return true;
    }

    public function delete(User $user, Child $child): bool
    {
        return true;
    }
}
