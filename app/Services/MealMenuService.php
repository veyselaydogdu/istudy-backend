<?php

namespace App\Services;

use App\Models\Health\MealMenuSchedule;

/**
 * Yemek Menü Takvimi Servisi
 *
 * Günlük, haftalık ve aylık yemek menüsü planlaması.
 * Sınıfa özel veya okul geneli menü oluşturma.
 */
class MealMenuService extends BaseService
{
    protected function model(): string
    {
        return MealMenuSchedule::class;
    }

    /**
     * Belirli bir tarih ve sınıf için menü getir
     */
    public function getMenuForDate(int $schoolId, string $date, ?int $classId = null)
    {
        $query = MealMenuSchedule::where('school_id', $schoolId)
            ->where('menu_date', $date)
            ->with(['meal.ingredients.allergens']);

        if ($classId) {
            $query->where(function ($q) use ($classId) {
                $q->where('class_id', $classId)
                    ->orWhereNull('class_id');
            });
        }

        return $query->get();
    }

    /**
     * Haftalık menü getir
     */
    public function getWeeklyMenu(int $schoolId, string $startDate, ?int $classId = null)
    {
        $endDate = date('Y-m-d', strtotime($startDate.' +6 days'));

        $query = MealMenuSchedule::where('school_id', $schoolId)
            ->whereBetween('menu_date', [$startDate, $endDate])
            ->with(['meal.ingredients.allergens'])
            ->orderBy('menu_date');

        if ($classId) {
            $query->where(function ($q) use ($classId) {
                $q->where('class_id', $classId)
                    ->orWhereNull('class_id');
            });
        }

        return $query->get()->groupBy('menu_date');
    }

    /**
     * Aylık menü getir
     */
    public function getMonthlyMenu(int $schoolId, int $year, int $month, ?int $classId = null)
    {
        $startDate = sprintf('%04d-%02d-01', $year, $month);
        $endDate = date('Y-m-t', strtotime($startDate));

        $query = MealMenuSchedule::where('school_id', $schoolId)
            ->whereBetween('menu_date', [$startDate, $endDate])
            ->with(['meal.ingredients.allergens'])
            ->orderBy('menu_date');

        if ($classId) {
            $query->where(function ($q) use ($classId) {
                $q->where('class_id', $classId)
                    ->orWhereNull('class_id');
            });
        }

        return $query->get()->groupBy('menu_date');
    }

    /**
     * Toplu menü oluştur (haftalık veya aylık)
     */
    public function createBulkSchedule(array $schedules): array
    {
        $created = [];

        foreach ($schedules as $schedule) {
            $created[] = $this->create($schedule);
        }

        return $created;
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

        if (! empty($filters['menu_date'])) {
            $query->where('menu_date', $filters['menu_date']);
        }

        if (! empty($filters['schedule_type'])) {
            $query->where('schedule_type', $filters['schedule_type']);
        }

        if (! empty($filters['date_from']) && ! empty($filters['date_to'])) {
            $query->whereBetween('menu_date', [$filters['date_from'], $filters['date_to']]);
        }
    }
}
