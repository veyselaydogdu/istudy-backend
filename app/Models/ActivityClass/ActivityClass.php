<?php

namespace App\Models\ActivityClass;

use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\School\School;
use App\Models\School\TeacherProfile;
use App\Models\Tenant\Tenant;

class ActivityClass extends BaseModel
{
    protected $table = 'activity_classes';

    protected $fillable = [
        'tenant_id',
        'school_id',
        'name',
        'description',
        'language',
        'age_min',
        'age_max',
        'capacity',
        'is_school_wide',
        'is_active',
        'is_paid',
        'price',
        'currency',
        'invoice_required',
        'start_date',
        'end_date',
        'schedule',
        'location',
        'address',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_school_wide' => 'boolean',
            'is_active' => 'boolean',
            'is_paid' => 'boolean',
            'invoice_required' => 'boolean',
            'price' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class)->withDefault();
    }

    public function schoolClasses()
    {
        return $this->belongsToMany(SchoolClass::class, 'activity_class_school_class_assignments', 'activity_class_id', 'school_class_id')->withTimestamps();
    }

    public function enrollments()
    {
        return $this->hasMany(ActivityClassEnrollment::class);
    }

    public function activeEnrollments()
    {
        return $this->hasMany(ActivityClassEnrollment::class)->where('status', 'active');
    }

    public function children()
    {
        return $this->belongsToMany(Child::class, 'activity_class_enrollments', 'activity_class_id', 'child_id')
            ->withPivot(['status', 'enrolled_by', 'enrolled_at'])
            ->withTimestamps();
    }

    public function teachers()
    {
        return $this->belongsToMany(TeacherProfile::class, 'activity_class_teachers', 'activity_class_id', 'teacher_profile_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function materials()
    {
        return $this->hasMany(ActivityClassMaterial::class)->orderBy('sort_order');
    }

    public function gallery()
    {
        return $this->hasMany(ActivityClassGalleryItem::class)->orderBy('sort_order');
    }

    public function invoices()
    {
        return $this->hasMany(ActivityClassInvoice::class);
    }
}
