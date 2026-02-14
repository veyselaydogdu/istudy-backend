<?php

namespace App\Models\Billing;

use App\Models\Activity\Activity;
use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\Child\FamilyProfile;

/**
 * Aktivite Ödemesi
 *
 * Ücretli aktivitelerin ödeme takibi.
 * Her çocuk için ayrı ödeme kaydı oluşturulur.
 */
class ActivityPayment extends BaseModel
{
    protected $table = 'activity_payments';

    protected $fillable = [
        'activity_id',
        'child_id',
        'family_profile_id',
        'amount',
        'currency',
        'status',
        'payment_provider',
        'provider_payment_id',
        'paid_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }

    public function child()
    {
        return $this->belongsTo(Child::class);
    }

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function markAsPaid(string $provider = null, string $providerPaymentId = null): void
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_provider' => $provider,
            'provider_payment_id' => $providerPaymentId,
        ]);
    }
}
