<?php

namespace App\Models\Health;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;

class Medication extends BaseModel
{
    protected $table = 'medications';

    protected $fillable = [
        'tenant_id',
        'name',
        'usage_notes',
        'created_by',
        'updated_by',
    ];

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_medications', 'medication_id', 'child_id')->withTimestamps();
    }
}
