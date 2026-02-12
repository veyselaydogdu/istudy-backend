<?php

namespace App\Services;

use App\Models\Academic\SchoolClass;

class ClassService extends BaseService
{
    protected function model(): string
    {
        return SchoolClass::class;
    }

    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (! empty($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
        }
    }
}
