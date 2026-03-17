<?php

namespace App\Models\Child;

use App\Models\Base\BaseModel;
use App\Models\Base\Country;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmergencyContact extends BaseModel
{
    use SoftDeletes;

    protected $table = 'emergency_contacts';

    protected $fillable = [
        'family_profile_id',
        'first_name',
        'last_name',
        'phone',
        'phone_country_code',
        'relationship',
        'photo',
        'identity_number',
        'passport_number',
        'nationality_country_id',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class, 'family_profile_id')->withDefault();
    }

    public function nationality()
    {
        return $this->belongsTo(Country::class, 'nationality_country_id')->withDefault();
    }
}
