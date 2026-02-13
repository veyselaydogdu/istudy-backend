<?php

namespace App\Models\School;

use App\Models\Academic\AcademicYear;
use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\Tenant\Tenant;

class School extends BaseModel
{
    protected $table = 'schools';

    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'address',
        'phone',
        'email',
        'logo',
        'timezone',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id')->withDefault();
    }

    public function academicYears()
    {
        return $this->hasMany(AcademicYear::class, 'school_id');
    }

    public function classes()
    {
        return $this->hasMany(SchoolClass::class, 'school_id');
    }

    public function teachers()
    {
        return $this->hasMany(TeacherProfile::class, 'school_id');
    }

    public function children()
    {
        return $this->hasMany(Child::class, 'school_id');
    }
}
