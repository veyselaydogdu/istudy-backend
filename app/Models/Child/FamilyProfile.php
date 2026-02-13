<?php

namespace App\Models\Child;

use App\Models\Base\BaseModel;
use App\Models\Billing\FamilySubscription;
use App\Models\Tenant\Tenant;
use App\Models\User;

class FamilyProfile extends BaseModel
{
    protected $table = 'family_profiles';

    protected $fillable = [
        'owner_user_id',
        'tenant_id',
        'family_name',
        'created_by',
        'updated_by',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id')->withDefault();
    }

    // Explicit relation to tenant usually handled by GlobalScope but here explicitly requested or useful for admin
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id')->withDefault();
    }

    public function members()
    {
        return $this->hasMany(FamilyMember::class, 'family_profile_id');
    }

    public function children()
    {
        return $this->hasMany(Child::class, 'family_profile_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(FamilySubscription::class, 'family_profile_id');
    }
}
