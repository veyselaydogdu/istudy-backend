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

    /**
     * Yetkili alıcılar (çocukları okuldan alabilecek kişiler)
     */
    public function authorizedPickups()
    {
        return $this->hasMany(AuthorizedPickup::class, 'family_profile_id');
    }

    /**
     * Velinin kayıtlı olduğu okullar (onaylananlar)
     */
    public function schools()
    {
        return $this->belongsToMany(
            \App\Models\School\School::class,
            'school_family_assignments',
            'family_profile_id',
            'school_id'
        )->withPivot(['enrollment_request_id', 'is_active', 'joined_at'])
            ->withTimestamps();
    }
}
