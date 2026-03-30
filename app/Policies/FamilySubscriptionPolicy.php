<?php

namespace App\Policies;

use App\Models\Billing\FamilySubscription;
use App\Models\User;

class FamilySubscriptionPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, FamilySubscription $subscription): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, FamilySubscription $subscription): bool
    {
        return true;
    }

    public function delete(User $user, FamilySubscription $subscription): bool
    {
        return true;
    }
}
