<?php

namespace App\Models\Health;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;

class Allergen extends BaseModel
{
    protected $table = 'allergens';

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'risk_level',
        'created_by',
        'updated_by'
    ];

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_allergens', 'allergen_id', 'child_id')->withTimestamps();
    }
}
