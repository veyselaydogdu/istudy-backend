<?php

namespace App\Models\Child;

use App\Models\Base\BaseModel;
use App\Models\Billing\FamilySubscription;
use App\Models\User;
use App\Traits\HasUlid;

class FamilyProfile extends BaseModel
{
    use HasUlid;

    protected $table = 'family_profiles';

    protected $fillable = [
        'ulid',
        'owner_user_id',
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
     * Acil durum kişileri
     */
    public function emergencyContacts()
    {
        return $this->hasMany(EmergencyContact::class, 'family_profile_id')->orderBy('sort_order');
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
