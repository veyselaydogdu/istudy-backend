<?php

namespace App\Policies;

use App\Models\Social\SocialPost;
use App\Models\User;

class SocialPostPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SocialPost $socialPost): bool
    {
        if ($socialPost->visibility === 'school') {
            return true;
        }

        // Sınıfa özel: parent ise çocuklarının sınıflarından biri eşleşmeli
        $isParent = $user->roles()->where('name', 'parent')->exists();

        if (! $isParent) {
            return true;
        }

        $childClassIds = $user->familyProfiles()
            ->with('children.classes')
            ->get()
            ->flatMap(fn ($fp) => $fp->children)
            ->flatMap(fn ($child) => $child->classes->pluck('id'))
            ->unique();

        $postClassIds = $socialPost->classes->pluck('id');

        return $childClassIds->intersect($postClassIds)->isNotEmpty();
    }

    public function create(User $user): bool
    {
        $allowedRoles = ['tenant_owner', 'school_admin', 'teacher'];

        return $user->roles()->whereIn('name', $allowedRoles)->exists();
    }

    public function update(User $user, SocialPost $socialPost): bool
    {
        if ($socialPost->author_id === $user->id) {
            return true;
        }

        return $user->roles()->whereIn('name', ['tenant_owner', 'school_admin'])->exists();
    }

    public function delete(User $user, SocialPost $socialPost): bool
    {
        if ($socialPost->author_id === $user->id) {
            return true;
        }

        return $user->roles()->whereIn('name', ['tenant_owner', 'school_admin'])->exists();
    }

    public function react(User $user): bool
    {
        return true;
    }

    public function comment(User $user): bool
    {
        return true;
    }
}
