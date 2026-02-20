<?php

namespace App\Services;

use App\Models\Package\Package;

class PackageService extends BaseService
{
    protected function model(): string
    {
        return Package::class;
    }

    /**
     * Tüm kayıtları sayfalı listele (packageFeatures ile)
     */
    public function getAll(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = $this->model()::query()->with('packageFeatures');

        $this->applyFilters($query, $filters);

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
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

    /**
     * Paket oluştur ve özelliklerini senkronize et
     */
    public function create(array $data): Package
    {
        $packageFeatures = $data['package_features'] ?? null;
        unset($data['package_features']);

        $package = parent::create($data);

        if ($packageFeatures) {
            $this->syncPackageFeatures($package, $packageFeatures);
            $package->load('packageFeatures');
        }

        return $package;
    }

    /**
     * Paket güncelle ve özelliklerini senkronize et
     */
    public function update(\Illuminate\Database\Eloquent\Model $model, array $data): \Illuminate\Database\Eloquent\Model
    {
        $packageFeatures = $data['package_features'] ?? null;
        unset($data['package_features']);

        $model = parent::update($model, $data);

        if ($packageFeatures !== null) {
            $this->syncPackageFeatures($model, $packageFeatures);
        }

        return $model->load('packageFeatures');
    }

    /**
     * Paket özelliklerini senkronize et
     */
    protected function syncPackageFeatures(Package $package, array $features): void
    {
        $syncData = [];
        foreach ($features as $feature) {
            if (isset($feature['feature_id'])) {
                $syncData[$feature['feature_id']] = [
                    'value' => $feature['value'] ?? null,
                ];
            }
        }

        $package->packageFeatures()->sync($syncData);
    }
}
