<?php

namespace App\Models\Academic;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\School\School;
use App\Models\School\TeacherProfile;
use App\Traits\HasUlid;

// "CLASS" keyword issue -> naming it SchoolClass
class SchoolClass extends BaseModel
{
    use HasUlid;

    protected $table = 'classes';

    protected $fillable = [
        'ulid',
        'school_id',
        'academic_year_id',
        'name',
        'description',
        'age_min',
        'age_max',
        'color',
        'logo',
        'capacity',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'ulid' => 'string',
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

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id')->withDefault();
    }

    public function children()
    {
        // Many to Many via child_class_assignments
        return $this->belongsToMany(Child::class, 'child_class_assignments', 'class_id', 'child_id')->withTimestamps();
    }

    public function teachers()
    {
        // Assuming teachers are assigned to classes.
        // Prompt says "teachers()" relation mandatory.
        // No direct teacher_class pivot in migration provided?
        // Wait, "TEACHER_PROFILES" migration didn't have class_id.
        // "CLASSES" didn't have teacher_id.
        // Maybe "child_class_assignments" is for children.
        // Is there a teacher assignment? Not in migration listing "TABLOLAR".
        // But prompt says "teachers()" on CLASS model.
        // Assuming logic to be implemented later or inferred.
        // I will denote this as an empty relation or assume a pivot `teacher_class_assignments` exists or will exist.
        // Or using `child_class_reports` to find teachers? No.
        // I'll leave it as a placeholder BelongsToMany.
        // Wait, typically teachers are assigned to classes. I'll add the relation assuming table `class_teacher` or similar.
        // Actually, let's look at `TEACHER_PROFILES`. It has `school_id` and `user_id`.
        // Maybe it's missing from migration request but required in Model relations.
        // I will expect a pivot table `class_teacher` or similar.
        return $this->belongsToMany(TeacherProfile::class, 'class_teacher_assignments', 'class_id', 'teacher_profile_id')
            ->withTimestamps();
    }
}
