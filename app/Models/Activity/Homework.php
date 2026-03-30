<?php

namespace App\Models\Activity;

use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\School\School;

/**
 * Ödev / Okul Sonrası Etkinlik
 *
 * Okullar ve sınıflar ödev veya okul sonrası yapılacak etkinlik
 * kaydedip bunu sınıflara atayabilir.
 * Tür: homework (ödev), after_school_activity (okul sonrası etkinlik)
 */
class Homework extends BaseModel
{
    protected $table = 'homework';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'title',
        'description',
        'type',
        'assigned_date',
        'due_date',
        'priority',
        'attachments',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'due_date' => 'date',
        'attachments' => 'array',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(\App\Models\Academic\AcademicYear::class);
    }

    /**
     * Ödevin atandığı sınıflar
     */
    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class, 'homework_class_assignments', 'homework_id', 'class_id')
            ->withTimestamps();
    }

    /**
     * Ödev tamamlama durumları (çocuk bazlı)
     */
    public function completions()
    {
        return $this->hasMany(HomeworkCompletion::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeUpcoming($query)
    {
        return $query->where('due_date', '>=', now()->toDateString());
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now()->toDateString());
    }

    public function scopeHomeworkType($query)
    {
        return $query->where('type', 'homework');
    }

    public function scopeAfterSchoolActivity($query)
    {
        return $query->where('type', 'after_school_activity');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Belirli bir çocuğun tamamlama durumu
     */
    public function isCompletedBy(int $childId): bool
    {
        return $this->completions()
            ->where('child_id', $childId)
            ->where('is_completed', true)
            ->exists();
    }

    /**
     * Tamamlama oranı
     */
    public function completionRate(): float
    {
        $total = $this->completions()->count();
        if ($total === 0) {
            return 0;
        }

        $completed = $this->completions()->where('is_completed', true)->count();

        return round(($completed / $total) * 100, 2);
    }
}
