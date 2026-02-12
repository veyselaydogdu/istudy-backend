<?php

namespace App\Services;

use App\Models\Activity\Activity;

class ActivityService extends BaseService
{
    protected function model(): string
    {
        return Activity::class;
    }

    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (! empty($filters['is_paid'])) {
            $query->where('is_paid', filter_var($filters['is_paid'], FILTER_VALIDATE_BOOLEAN));
        }
    }
}
