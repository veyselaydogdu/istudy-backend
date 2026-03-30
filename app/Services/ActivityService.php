<?php

namespace App\Services;

use App\Models\Activity\Activity;
use App\Models\Activity\ActivityEnrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ActivityService extends BaseService
{
    protected function model(): string
    {
        return Activity::class;
    }

    /**
     * Etkinliği sil — önce tüm kayıt faturalarını iptal et.
     */
    public function delete(Model $model): bool
    {
        /** @var Activity $model */
        DB::transaction(function () use ($model) {
            $invoiceService = new ActivityInvoiceService;

            ActivityEnrollment::where('activity_id', $model->id)
                ->whereNotNull('invoice_id')
                ->get()
                ->each(fn ($enrollment) => $invoiceService->handleEnrollmentCancellation(
                    $enrollment,
                    "Etkinlik silindi: {$model->name}"
                ));

            $model->delete();
        });

        return true;
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

        // Silinen etkinlikler dahil et
        if (! empty($filters['with_trashed'])) {
            $query->withTrashed();
        }

        // Durum filtresi: active (bitmemiş), ended (end_date geçmiş), deleted (soft-deleted)
        if (! empty($filters['status'])) {
            match ($filters['status']) {
                'active' => $query->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString())),
                'ended' => $query->whereNotNull('end_date')->where('end_date', '<', now()->toDateString()),
                'deleted' => $query->onlyTrashed(),
                default => null,
            };
        }
    }
}
