<?php

namespace App\Models\Billing;

use App\Models\Base\BaseModel;

class Payment extends BaseModel
{
    protected $table = 'payments';

    protected $fillable = [
        'family_subscription_id',
        'amount',
        'currency',
        'payment_provider',
        'provider_payment_id',
        'paid_at',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function subscription()
    {
        return $this->belongsTo(FamilySubscription::class, 'family_subscription_id')->withDefault();
    }

    public function revenueShares()
    {
        return $this->hasMany(RevenueShare::class, 'payment_id');
    }
}
