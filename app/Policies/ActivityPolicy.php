<?php

namespace App\Policies;

use App\Models\Activity\Activity;
use App\Models\User;

class ActivityPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Activity $activity): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Activity $activity): bool
    {
        return true;
    }

    public function delete(User $user, Activity $activity): bool
    {
        return true;
    }
}
