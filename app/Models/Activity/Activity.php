<?php

namespace App\Models\Activity;

use App\Models\Academic\AcademicYear;
use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\School\School;

class Activity extends BaseModel
{
    protected $table = 'activities';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'name',
        'description',
        'is_paid',
        'price',
        'start_date',
        'end_date',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'price' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_activity_enrollments', 'activity_id', 'child_id')->withTimestamps();
    }

    public function school()
    {
        return $this->belongsTo(School::class)->withDefault();
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class)->withDefault();
    }

    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class, 'activity_class_assignments', 'activity_id', 'class_id')->withTimestamps();
    }
}
