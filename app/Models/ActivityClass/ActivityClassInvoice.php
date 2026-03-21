<?php

namespace App\Models\ActivityClass;

use App\Models\Billing\Invoice;
use App\Models\Child\Child;
use App\Models\Child\FamilyProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityClassInvoice extends Model
{
    use SoftDeletes;

    protected $table = 'activity_class_invoices';

    protected $fillable = [
        'main_invoice_id',
        'activity_class_enrollment_id',
        'activity_class_id',
        'child_id',
        'family_profile_id',
        'invoice_number',
        'invoice_type',
        'original_invoice_id',
        'refund_reason',
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

    public function mainInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'main_invoice_id')->withDefault();
    }

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

    public function originalInvoice()
    {
        return $this->belongsTo(self::class, 'original_invoice_id')->withDefault();
    }

    public function refundInvoice()
    {
        return $this->hasOne(self::class, 'original_invoice_id');
    }

    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
