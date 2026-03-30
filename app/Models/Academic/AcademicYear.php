<?php

namespace App\Models\Academic;

use App\Models\Activity\Activity;
use App\Models\Activity\Event;
use App\Models\Activity\Homework;
use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\School\School;

class AcademicYear extends BaseModel
{
    protected $table = 'academic_years';

    protected $fillable = [
        'school_id',
        'name',
        'start_date',
        'end_date',
        'is_active',
        'is_current',
        'description',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'is_current' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id')->withDefault();
    }

    public function classes()
    {
        return $this->hasMany(SchoolClass::class, 'academic_year_id');
    }

    public function activities()
    {
        return $this->hasMany(Activity::class, 'academic_year_id');
    }

    public function events()
    {
        return $this->hasMany(Event::class, 'academic_year_id');
    }

    public function homework()
    {
        return $this->hasMany(Homework::class, 'academic_year_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Sadece aktif eğitim yıllarını getir
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Şu anki eğitim yılını getir
     */
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    /**
     * Belirli bir okula ait eğitim yıllarını getir
     */
    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Bu eğitim yılını aktif/güncel yap (diğerlerini pasif yap)
     */
    public function makeCurrent(): self
    {
        // Aynı okuldaki diğer yılların is_current'ını kaldır
        static::where('school_id', $this->school_id)
            ->where('id', '!=', $this->id)
            ->update(['is_current' => false]);

        $this->update(['is_current' => true, 'is_active' => true]);

        return $this->fresh();
    }

    /**
     * Eğitim yılını kapat
     */
    public function close(): self
    {
        $this->update(['is_active' => false, 'is_current' => false]);

        return $this->fresh();
    }

    /**
     * Bu eğitim yılındaki toplam öğrenci sayısı
     */
    public function totalStudents(): int
    {
        return Child::whereHas('classes', function ($q) {
            $q->where('academic_year_id', $this->id);
        })->count();
    }

    /**
     * Bu eğitim yılındaki toplam sınıf sayısı
     */
    public function totalClasses(): int
    {
        return $this->classes()->count();
    }

    /**
     * Eğitim yılı tamamlandı mı? (end_date geçmiş mi?)
     */
    public function isCompleted(): bool
    {
        return $this->end_date && $this->end_date->isPast();
    }

    /**
     * Eğitim yılı henüz başlamadı mı?
     */
    public function isUpcoming(): bool
    {
        return $this->start_date && $this->start_date->isFuture();
    }

    /**
     * Eğitim yılı devam ediyor mu?
     */
    public function isOngoing(): bool
    {
        return $this->start_date && $this->end_date
            && $this->start_date->isPast()
            && $this->end_date->isFuture();
    }
}
