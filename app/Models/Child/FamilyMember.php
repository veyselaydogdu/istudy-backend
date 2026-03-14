<?php

namespace App\Models\Child;

use App\Models\Base\BaseModel;
use App\Models\User;

class FamilyMember extends BaseModel
{
    protected $table = 'family_members';

    protected $fillable = [
        'family_profile_id',
        'user_id',
        'relation_type',
        'role',
        'is_active',
        'invited_by_user_id',
        'accepted_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'accepted_at' => 'datetime',
        ];
    }

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class, 'family_profile_id')->withDefault();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withDefault();
    }

    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by_user_id')->withDefault();
    }
}
