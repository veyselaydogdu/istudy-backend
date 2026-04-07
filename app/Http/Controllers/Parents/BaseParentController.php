<?php

namespace App\Http\Controllers\Parents;

use App\Http\Controllers\Base\BaseController;
use App\Models\Child\Child;
use App\Models\Child\FamilyMember;
use App\Models\Child\FamilyProfile;

/**
 * Tüm Parent controller'larının atası.
 * getFamilyProfile() hem owner hem co-parent için çalışır.
 */
abstract class BaseParentController extends BaseController
{
    /**
     * Auth user'ın erişebildiği FamilyProfile'ı döndürür.
     *
     * - Owner ise doğrudan owner_user_id ile bulur.
     * - Co-parent olarak eklendiyse family_members üzerinden bulur.
     */
    protected function getFamilyProfile(): ?FamilyProfile
    {
        $userId = $this->user()->id;

        // Önce owner olarak bak
        $profile = FamilyProfile::withoutGlobalScope('tenant')
            ->where('owner_user_id', $userId)
            ->first();

        if ($profile) {
            return $profile;
        }

        // Co-parent olarak eklenmiş mi?
        $member = FamilyMember::withoutGlobalScope('tenant')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();

        if (! $member) {
            return null;
        }

        return FamilyProfile::withoutGlobalScope('tenant')
            ->find($member->family_profile_id);
    }

    /**
     * Auth user'ın erişebildiği aile profiline ait çocuğu döndürür.
     *
     * @param  int|string  $childId  Integer PK veya ULID (hibrit ULID mimarisi)
     */
    protected function findOwnedChild(int|string $childId): ?Child
    {
        $familyProfile = $this->getFamilyProfile();

        if (! $familyProfile) {
            return null;
        }

        $query = Child::withoutGlobalScope('tenant')
            ->where('family_profile_id', $familyProfile->id);

        // ULID (26-char alphanum) veya integer PK ile çözümle
        if (is_numeric($childId)) {
            $query->where('id', (int) $childId);
        } else {
            $query->where('ulid', $childId);
        }

        return $query->first();
    }
}
