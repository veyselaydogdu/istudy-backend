<?php

namespace App\Policies;

use App\Models\Academic\SchoolClass;
use App\Models\User;

class SchoolClassPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SchoolClass $class): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true; // School scope controller'da zaten kontrol ediliyor
    }

    public function update(User $user, SchoolClass $class): bool
    {
        return true;
    }

    public function delete(User $user, SchoolClass $class): bool
    {
        return true;
    }
}
