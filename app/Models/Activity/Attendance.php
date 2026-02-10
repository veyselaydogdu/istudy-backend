<?php

namespace App\Models\Activity;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\Academic\SchoolClass;

class Attendance extends BaseModel
{
    protected $table = 'attendances';

    protected $fillable = [
        'child_id',
        'class_id',
        'attendance_date',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'attendance_date' => 'date',
    ];

    public function child()
    {
        return $this->belongsTo(Child::class, 'child_id')->withDefault();
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id')->withDefault();
    }
}
