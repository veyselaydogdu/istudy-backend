<?php

namespace App\Models\Health;

use App\Models\Academic\AcademicYear;
use App\Models\Base\BaseModel;
use App\Models\School\School;

class Meal extends BaseModel
{
    protected $table = 'meals';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'name',
        'meal_type',
        'photo',
        'created_by',
        'updated_by',
    ];

    public function ingredients()
    {
        return $this->belongsToMany(FoodIngredient::class, 'meal_ingredient_pivot', 'meal_id', 'ingredient_id')->withTimestamps();
    }

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id')->withDefault();
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id')->withDefault();
    }
}
