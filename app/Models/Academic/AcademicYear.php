<?php

namespace App\Models\Academic;

use App\Models\Base\BaseModel;
use App\Models\School\School;
use App\Models\Activity\Activity;
use App\Models\Activity\Event;

class AcademicYear extends BaseModel
{
    protected $table = 'academic_years';

    protected $fillable = [
        'school_id',
        'name',
        'start_date',
        'end_date',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
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
}
