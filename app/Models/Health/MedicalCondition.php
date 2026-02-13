<?php

namespace App\Models\Health;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;

class MedicalCondition extends BaseModel
{
    protected $table = 'medical_conditions';

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'created_by',
        'updated_by',
    ];

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_conditions', 'condition_id', 'child_id')->withTimestamps();
    }
}
