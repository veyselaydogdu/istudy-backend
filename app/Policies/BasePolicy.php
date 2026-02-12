<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Tüm policy'lerin atası.
 * Tek developer projesi için basit: Super Admin her şeyi yapabilir.
 */
abstract class BasePolicy
{
    use HandlesAuthorization;

    /**
     * Super Admin tüm işlemlere izinli (before hook)
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null; // Diğer kontrollere devam et
    }
}
