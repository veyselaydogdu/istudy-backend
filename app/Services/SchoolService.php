<?php

namespace App\Services;

use App\Models\School\School;
use Illuminate\Database\Eloquent\Model;

class SchoolService extends BaseService
{
    protected function model(): string
    {
        return School::class;
    }

    /**
     * Okul silme — öğrenci kaydı varsa silinemez.
     */
    public function delete(Model $model): bool
    {
        /** @var School $model */
        $hasEnrollments = $model->children()->exists()
            || $model->classes()->whereHas('children')->exists();

        if ($hasEnrollments) {
            throw new \Exception('Öğrenci kaydı bulunan okul silinemez. Önce tüm öğrenci kayıtlarını kaldırın.', 422);
        }

        return parent::delete($model);
    }

    protected function applyFilters($query, array $filters): void
    {
        $query->withCount(['classes', 'children']);

        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
        }
    }
}
