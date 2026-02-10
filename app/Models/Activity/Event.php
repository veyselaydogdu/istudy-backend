<?php

namespace App\Models\Activity;

use App\Models\Base\BaseModel;
use App\Models\School\School;
use App\Models\Academic\AcademicYear;
use App\Models\Child\Child;

class Event extends BaseModel
{
    protected $table = 'events';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'title',
        'description',
        'event_date',
        'is_paid',
        'price',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'price' => 'decimal:2',
        'event_date' => 'datetime',
    ];

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_event_participations', 'event_id', 'child_id')->withTimestamps();
    }
    
    public function school() { return $this->belongsTo(School::class)->withDefault(); }
    public function academicYear() { return $this->belongsTo(AcademicYear::class)->withDefault(); }
}
