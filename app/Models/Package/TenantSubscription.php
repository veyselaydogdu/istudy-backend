<?php

namespace App\Models\Package;

use App\Models\Base\BaseModel;
use App\Models\Tenant\Tenant;

class TenantSubscription extends BaseModel
{
    protected $table = 'tenant_subscriptions';

    protected $fillable = [
        'tenant_id',
        'package_id',
        'billing_cycle',
        'price',
        'start_date',
        'end_date',
        'status',
        'auto_renew',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'auto_renew' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function payments()
    {
        return $this->hasMany(TenantPayment::class, 'tenant_subscription_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('end_date', '>=', now());
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->status === 'active' && now()->lte($this->end_date);
    }

    public function isExpired(): bool
    {
        return now()->gt($this->end_date);
    }
}
