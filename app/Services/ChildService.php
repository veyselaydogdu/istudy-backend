<?php

namespace App\Services;

use App\Models\Child\Child;

class ChildService extends BaseService
{
    protected function model(): string
    {
        return Child::class;
    }

    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['family_profile_id'])) {
            $query->where('family_profile_id', $filters['family_profile_id']);
        }

        if (! empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('first_name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('last_name', 'like', '%'.$filters['search'].'%');
            });
        }
    }
}
