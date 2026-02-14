<?php

namespace App\Models\Health;

use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\School\School;

/**
 * Yemek Menü Takvimi
 *
 * Yemeklerin günlük, haftalık veya aylık olarak sınıflara atanması.
 * class_id null ise okul geneli, dolu ise sınıfa özel menü.
 */
class MealMenuSchedule extends BaseModel
{
    protected $table = 'meal_menu_schedules';

    protected $fillable = [
        'school_id',
        'class_id',
        'meal_id',
        'menu_date',
        'schedule_type',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'menu_date' => 'date',
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

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function meal()
    {
        return $this->belongsTo(Meal::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeForDate($query, string $date)
    {
        return $query->where('menu_date', $date);
    }

    public function scopeForClass($query, int $classId)
    {
        return $query->where(function ($q) use ($classId) {
            $q->where('class_id', $classId)
              ->orWhereNull('class_id'); // Okul geneli menü dahil
        });
    }

    public function scopeDaily($query)
    {
        return $query->where('schedule_type', 'daily');
    }

    public function scopeWeekly($query)
    {
        return $query->where('schedule_type', 'weekly');
    }
}
