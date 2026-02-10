<?php

namespace App\Models\Activity;

use App\Models\Base\BaseModel;
use App\Models\School\School;
use App\Models\Academic\AcademicYear;
use App\Models\Child\Child;

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
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_activity_enrollments', 'activity_id', 'child_id')->withTimestamps();
    }
    
    public function school() { return $this->belongsTo(School::class)->withDefault(); }
    public function academicYear() { return $this->belongsTo(AcademicYear::class)->withDefault(); }
}
