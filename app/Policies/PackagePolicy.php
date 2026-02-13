<?php

namespace App\Policies;

use App\Models\Package\Package;
use App\Models\User;

class PackagePolicy extends BasePolicy
{
    /**
     * Paketleri herkes görebilir
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Package $package): bool
    {
        return true;
    }

    /**
     * Paket oluşturma: Sadece Super Admin (before hook ile)
     */
    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Package $package): bool
    {
        return false; // Super Admin only
    }

    public function delete(User $user, Package $package): bool
    {
        return false; // Super Admin only
    }
}
