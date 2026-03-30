<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

/**
 * Tüm servislerin atası. Basit CRUD işlemlerini standartlaştırır.
 */
abstract class BaseService
{
    /**
     * Model sınıfını döndür (alt sınıflar override eder)
     */
    abstract protected function model(): string;

    /**
     * Tüm kayıtları sayfalı listele
     *
     * @param  array<string, mixed>  $filters
     */
    public function getAll(array $filters = []): LengthAwarePaginator
    {
        $query = $this->model()::query();

        $this->applyFilters($query, $filters);

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /**
     * Yeni kayıt oluştur
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Model
    {
        return $this->model()::create($data);
    }

    /**
     * Kaydı güncelle
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Model $model, array $data): Model
    {
        $model->update($data);

        return $model->fresh();
    }

    /**
     * Kaydı sil (soft delete)
     */
    public function delete(Model $model): bool
    {
        return $model->delete();
    }

    /**
     * Filtreleri uygula — Alt sınıflar override edebilir
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Model>  $query
     * @param  array<string, mixed>  $filters
     */
    protected function applyFilters($query, array $filters): void
    {
        // Alt sınıflar kendi filtrelerini ekleyebilir
    }
}
