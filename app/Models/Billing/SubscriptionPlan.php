<?php

namespace App\Models\Billing;

use App\Models\Base\BaseModel;

class SubscriptionPlan extends BaseModel
{
    protected $table = 'subscription_plans';

    protected $fillable = [
        'name',
        'billing_cycle',
        'base_price',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
    ];
}
