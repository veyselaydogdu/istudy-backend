<?php

namespace App\Models\ActivityClass;

use App\Models\Child\Child;
use App\Models\Child\FamilyProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityClassEnrollment extends Model
{
    use SoftDeletes;

    protected $table = 'activity_class_enrollments';

    protected $fillable = [
        'activity_class_id',
        'child_id',
        'family_profile_id',
        'status',
        'enrolled_by',
        'enrolled_by_user_id',
        'enrolled_at',
        'cancelled_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function activityClass()
    {
        return $this->belongsTo(ActivityClass::class);
    }

    public function child()
    {
        return $this->belongsTo(Child::class);
    }

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class)->withDefault();
    }

    public function enrolledByUser()
    {
        return $this->belongsTo(User::class, 'enrolled_by_user_id')->withDefault();
    }

    public function invoice()
    {
        return $this->hasOne(ActivityClassInvoice::class, 'activity_class_enrollment_id');
    }
}
