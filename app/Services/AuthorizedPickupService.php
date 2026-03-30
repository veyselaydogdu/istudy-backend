<?php

namespace App\Services;

use App\Models\Child\AuthorizedPickup;

/**
 * Yetkili Alıcı Servisi
 *
 * Ebeveyn dışında çocuğu okuldan alabilecek kişilerin yönetimi.
 */
class AuthorizedPickupService extends BaseService
{
    protected function model(): string
    {
        return AuthorizedPickup::class;
    }

    /**
     * Filtreleme
     */
    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['child_id'])) {
            $query->where('child_id', $filters['child_id']);
        }

        if (! empty($filters['family_profile_id'])) {
            $query->where('family_profile_id', $filters['family_profile_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }
    }
}
