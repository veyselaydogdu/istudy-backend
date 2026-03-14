<?php

namespace App\Models\Child;

use App\Models\Base\BaseModel;
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
        'relationship',
        'photo',
        'identity_number',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class, 'family_profile_id')->withDefault();
    }
}
