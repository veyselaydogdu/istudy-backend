<?php

namespace App\Models\Billing;

use App\Models\Base\BaseModel;
use App\Models\Child\FamilyProfile;

class FamilySubscription extends BaseModel
{
    protected $table = 'family_subscriptions';

    protected $fillable = [
        'family_profile_id',
        'plan_id',
        'start_date',
        'end_date',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function family()
    {
        return $this->belongsTo(FamilyProfile::class, 'family_profile_id')->withDefault();
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id')->withDefault();
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'family_subscription_id');
    }
}
