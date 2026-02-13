<?php

namespace App\Models\School;

use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\User;

class TeacherProfile extends BaseModel
{
    protected $table = 'teacher_profiles';

    protected $fillable = [
        'user_id',
        'school_id',
        'bio',
        'education_summary',
        'experience_years',
        'languages',
        'certifications',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'languages' => 'array',
        'certifications' => 'array',
        'experience_years' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withDefault();
    }

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id')->withDefault();
    }

    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class, 'class_teacher_assignments', 'teacher_profile_id', 'class_id')
            ->withTimestamps();
    }
}
