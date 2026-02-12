<?php

namespace App\Services;

use App\Models\School\School;

class SchoolService extends BaseService
{
    protected function model(): string
    {
        return School::class;
    }

    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (! empty($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
        }
    }
}
