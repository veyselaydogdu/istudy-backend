<?php

namespace App\Models\Health;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\User;

class MedicalCondition extends BaseModel
{
    protected $table = 'medical_conditions';

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'status',
        'suggested_by_user_id',
        'created_by',
        'updated_by',
    ];

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_conditions', 'condition_id', 'child_id')->withTimestamps();
    }

    public function suggestedBy()
    {
        return $this->belongsTo(User::class, 'suggested_by_user_id')->withDefault();
    }
}
