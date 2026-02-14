<?php

namespace App\Services;

use App\Models\Activity\Homework;

/**
 * Ödev Servisi
 *
 * Ödev ve okul sonrası etkinlik oluşturma, sınıflara atama.
 */
class HomeworkService extends BaseService
{
    protected function model(): string
    {
        return Homework::class;
    }

    /**
     * Ödev oluştur ve sınıflara ata
     */
    public function createAndAssign(array $data, array $classIds = []): Homework
    {
        $homework = $this->create($data);

        if (! empty($classIds)) {
            $homework->classes()->attach($classIds);
        }

        return $homework->load('classes');
    }

    /**
     * Ödev güncelle ve sınıf atamalarını güncelle
     */
    public function updateAndAssign(Homework $homework, array $data, array $classIds = []): Homework
    {
        $this->update($homework, $data);

        if (! empty($classIds)) {
            $homework->classes()->sync($classIds);
        }

        return $homework->fresh('classes');
    }

    /**
     * Çocuk için ödev tamamla
     */
    public function markCompletion(int $homeworkId, int $childId, bool $isCompleted, ?string $notes = null): void
    {
        $homework = Homework::findOrFail($homeworkId);

        $homework->completions()->updateOrCreate(
            ['child_id' => $childId],
            [
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? now() : null,
                'notes' => $notes,
                'marked_by' => auth()->id(),
                'created_by' => auth()->id(),
            ]
        );
    }

    /**
     * Filtreleme
     */
    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['class_id'])) {
            $query->whereHas('classes', fn ($q) => $q->where('classes.id', $filters['class_id']));
        }

        if (! empty($filters['due_date_from'])) {
            $query->where('due_date', '>=', $filters['due_date_from']);
        }

        if (! empty($filters['due_date_to'])) {
            $query->where('due_date', '<=', $filters['due_date_to']);
        }

        if (! empty($filters['upcoming'])) {
            $query->upcoming();
        }
    }
}
