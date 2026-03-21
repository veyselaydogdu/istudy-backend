<?php

namespace App\Models\ActivityClass;

use App\Models\Child\Child;
use App\Models\Child\FamilyProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityClassInvoice extends Model
{
    use SoftDeletes;

    protected $table = 'activity_class_invoices';

    protected $fillable = [
        'activity_class_enrollment_id',
        'activity_class_id',
        'child_id',
        'family_profile_id',
        'invoice_number',
        'amount',
        'currency',
        'status',
        'payment_required',
        'due_date',
        'paid_at',
        'payment_method',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_required' => 'boolean',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function enrollment()
    {
        return $this->belongsTo(ActivityClassEnrollment::class, 'activity_class_enrollment_id');
    }

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

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by')->withDefault();
    }
}
