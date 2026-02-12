<?php

namespace App\Services;

use App\Models\Tenant\Tenant;

class TenantService extends BaseService
{
    protected function model(): string
    {
        return Tenant::class;
    }

    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
        }
    }
}
