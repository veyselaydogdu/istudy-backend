<?php

namespace App\Http\Controllers\Parents;

use App\Http\Controllers\Base\BaseController;
use App\Models\Child\Child;
use App\Models\Child\FamilyMember;
use App\Models\Child\FamilyProfile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Tüm Parent controller'larının atası.
 * Bir parent birden fazla aileye sahip olabilir / birden fazla ailede co_parent olabilir.
 */
abstract class BaseParentController extends BaseController
{
    /**
     * Auth user'ın birincil FamilyProfile'ını döndürür.
     * Önce sahip olduğu (owner_user_id), sonra kabul edilmiş co_parent üyeliğine göre.
     */
    protected function getFamilyProfile(): ?FamilyProfile
    {
        $userId = $this->user()->id;

        $profile = FamilyProfile::withoutGlobalScope('tenant')
            ->where('owner_user_id', $userId)
            ->first();

        if ($profile) {
            return $profile;
        }

        $member = FamilyMember::withoutGlobalScope('tenant')
            ->where('user_id', $userId)
            ->where('invitation_status', 'accepted')
            ->where('is_active', true)
            ->first();

        if (! $member) {
            return null;
        }

        return FamilyProfile::withoutGlobalScope('tenant')
            ->find($member->family_profile_id);
    }

    /**
     * Auth user'ın erişebildiği tüm aile profillerini döndürür.
     * Sahip olduğu aileler + kabul edilmiş co_parent üyelikleri.
     */
    protected function getFamilyProfiles(): Collection
    {
        $userId = $this->user()->id;

        $ownedIds = FamilyProfile::withoutGlobalScope('tenant')
            ->where('owner_user_id', $userId)
            ->pluck('id');

        $memberIds = FamilyMember::withoutGlobalScope('tenant')
            ->where('user_id', $userId)
            ->where('invitation_status', 'accepted')
            ->where('is_active', true)
            ->pluck('family_profile_id');

        $allIds = $ownedIds->merge($memberIds)->unique()->values();

        return FamilyProfile::withoutGlobalScope('tenant')
            ->whereIn('id', $allIds)
            ->get();
    }

    /**
     * Auth user'ın verilen aile profillerindeki erişebileceği çocuk ID'lerini toplar.
     *
     * Co-parent üyeliğinde `family_member_children` tablosunda atanmış çocuklar varsa
     * yalnızca onlar dahil edilir; tablo boşsa tüm aile çocukları erişilebilir.
     * Owner ise her zaman tüm çocuklara erişir.
     */
    protected function collectAccessibleChildIds(Collection $familyProfiles): Collection
    {
        $userId = $this->user()->id;
        $allIds = collect();

        foreach ($familyProfiles as $family) {
            if ($family->owner_user_id === $userId) {
                $allIds = $allIds->merge(
                    Child::withoutGlobalScope('tenant')
                        ->where('family_profile_id', $family->id)
                        ->pluck('id')
                );
            } else {
                $member = FamilyMember::withoutGlobalScope('tenant')
                    ->where('family_profile_id', $family->id)
                    ->where('user_id', $userId)
                    ->where('invitation_status', 'accepted')
                    ->where('is_active', true)
                    ->first();

                if (! $member) {
                    continue;
                }

                // permissions = [] (boş dizi) → hiçbir çocuğa erişim yok
                if ($member->permissions !== null && count($member->permissions) === 0) {
                    continue;
                }

                $restrictedChildIds = DB::table('family_member_children')
                    ->where('family_member_id', $member->id)
                    ->pluck('child_id');

                if ($restrictedChildIds->isEmpty()) {
                    // Kısıtlama yok — tüm aile çocukları erişilebilir
                    $allIds = $allIds->merge(
                        Child::withoutGlobalScope('tenant')
                            ->where('family_profile_id', $family->id)
                            ->pluck('id')
                    );
                } else {
                    $allIds = $allIds->merge($restrictedChildIds);
                }
            }
        }

        return $allIds->unique()->values();
    }

    /**
     * Auth user'ın verilen çocuk için co-parent mi olduğunu döndürür.
     * super_parent (owner) için false döner.
     */
    protected function isCoParentForChild(Child $child): bool
    {
        $userId = $this->user()->id;

        $family = FamilyProfile::withoutGlobalScope('tenant')
            ->find($child->family_profile_id);

        if (! $family) {
            return false;
        }

        if ($family->owner_user_id === $userId) {
            return false;
        }

        $member = FamilyMember::withoutGlobalScope('tenant')
            ->where('family_profile_id', $family->id)
            ->where('user_id', $userId)
            ->where('invitation_status', 'accepted')
            ->first();

        return $member !== null && $member->role !== 'super_parent';
    }

    /**
     * Auth user'ın verilen çocuk üzerinde belirli izne sahip olup olmadığını kontrol eder.
     */
    protected function coParentHasPermission(Child $child, string $permission): bool
    {
        $userId = $this->user()->id;

        $family = FamilyProfile::withoutGlobalScope('tenant')
            ->find($child->family_profile_id);

        if (! $family) {
            return false;
        }

        if ($family->owner_user_id === $userId) {
            return true;
        }

        $member = FamilyMember::withoutGlobalScope('tenant')
            ->where('family_profile_id', $family->id)
            ->where('user_id', $userId)
            ->where('invitation_status', 'accepted')
            ->where('is_active', true)
            ->first();

        if (! $member) {
            return false;
        }

        return $member->hasPermission($permission);
    }

    /**
     * Auth user'ın erişebildiği tüm aile profillerine ait çocuğu döndürür.
     * Co-parent çocuk kısıtlamalarını dikkate alır.
     *
     * @param  int|string  $childId  Integer PK veya ULID (hibrit ULID mimarisi)
     */
    protected function findOwnedChild(int|string $childId): ?Child
    {
        $familyProfiles = $this->getFamilyProfiles();

        if ($familyProfiles->isEmpty()) {
            return null;
        }

        $accessibleChildIds = $this->collectAccessibleChildIds($familyProfiles);

        if ($accessibleChildIds->isEmpty()) {
            return null;
        }

        $query = Child::withoutGlobalScope('tenant')
            ->whereIn('id', $accessibleChildIds);

        if (is_numeric($childId)) {
            $query->where('id', (int) $childId);
        } else {
            $query->where('ulid', $childId);
        }

        return $query->first();
    }
}
