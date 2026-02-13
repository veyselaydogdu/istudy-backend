<?php

namespace App\Services;

use App\Models\Package\Package;

class PackageService extends BaseService
{
    protected function model(): string
    {
        return Package::class;
    }

    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
        }

        $query->orderBy('sort_order');
    }

    /**
     * Herkese açık aktif paketleri listele (sayfalama olmadan)
     */
    public function getActivePackages(): \Illuminate\Database\Eloquent\Collection
    {
        return Package::where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }
}
