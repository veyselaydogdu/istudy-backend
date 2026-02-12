<?php

namespace App\Services;

use App\Models\Child\FamilyProfile;

class FamilyProfileService extends BaseService
{
    protected function model(): string
    {
        return FamilyProfile::class;
    }

    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (! empty($filters['search'])) {
            $query->where('family_name', 'like', '%'.$filters['search'].'%');
        }
    }
}
