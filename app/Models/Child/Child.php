<?php

namespace App\Models\Child;

use App\Models\Academic\AcademicYear;
use App\Models\Academic\SchoolClass;
use App\Models\Activity\Activity;
use App\Models\Activity\Attendance;
use App\Models\Activity\DailyChildReport;
use App\Models\Activity\Event;
use App\Models\Activity\HomeworkCompletion;
use App\Models\Base\BaseModel;
use App\Models\Billing\ActivityPayment;
use App\Models\Billing\EventPayment;
use App\Models\Health\Allergen;
use App\Models\Health\MedicalCondition;
use App\Models\Health\Medication;
use App\Models\School\School;

class Child extends BaseModel
{
    protected $table = 'children';

    protected $fillable = [
        'family_profile_id',
        'school_id',
        'academic_year_id',
        'first_name',
        'last_name',
        'birth_date',
        'gender',
        'blood_type',
        'profile_photo',
        'enrollment_date',
        'status',
        'special_notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'enrollment_date' => 'date',
    ];

    // Helper to get full name
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class, 'family_profile_id')->withDefault();
    }

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id')->withDefault();
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id')->withDefault();
    }

    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class, 'child_class_assignments', 'child_id', 'class_id')->withTimestamps();
    }

    public function allergens()
    {
        return $this->belongsToMany(Allergen::class, 'child_allergens', 'child_id', 'allergen_id')->withTimestamps();
    }

    public function medications()
    {
        return $this->belongsToMany(Medication::class, 'child_medications', 'child_id', 'medication_id')->withTimestamps();
    }

    public function conditions()
    {
        return $this->belongsToMany(MedicalCondition::class, 'child_conditions', 'child_id', 'condition_id')->withTimestamps();
    }

    public function dailyReports()
    {
        return $this->hasMany(DailyChildReport::class, 'child_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'child_id');
    }

    public function activities()
    {
        return $this->belongsToMany(Activity::class, 'child_activity_enrollments', 'child_id', 'activity_id')
            ->withPivot(['status', 'enrolled_at'])
            ->withTimestamps();
    }

    public function events()
    {
        return $this->belongsToMany(Event::class, 'child_event_participations', 'child_id', 'event_id')
            ->withPivot(['status', 'payment_required', 'payment_completed'])
            ->withTimestamps();
    }

    /**
     * Çocuğu okuldan alabilecek yetkili kişiler
     */
    public function authorizedPickups()
    {
        return $this->hasMany(AuthorizedPickup::class, 'child_id');
    }

    /**
     * Ödev tamamlama durumları
     */
    public function homeworkCompletions()
    {
        return $this->hasMany(HomeworkCompletion::class, 'child_id');
    }

    /**
     * Etkinlik ödemeleri
     */
    public function eventPayments()
    {
        return $this->hasMany(EventPayment::class, 'child_id');
    }

    /**
     * Aktivite ödemeleri
     */
    public function activityPayments()
    {
        return $this->hasMany(ActivityPayment::class, 'child_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
