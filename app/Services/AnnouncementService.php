<?php

namespace App\Services;

use App\Models\School\Announcement;

/**
 * Duyuru Servisi
 *
 * Okul ve sınıf bazlı duyuru yönetimi.
 */
class AnnouncementService extends BaseService
{
    protected function model(): string
    {
        return Announcement::class;
    }

    /**
     * Filtreleme
     */
    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['class_id'])) {
            $query->forClass($filters['class_id']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_pinned'])) {
            $query->where('is_pinned', $filters['is_pinned']);
        }

        if (isset($filters['active_only']) && $filters['active_only']) {
            $query->active();
        }
    }
}
