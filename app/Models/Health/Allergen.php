<?php

namespace App\Models\Health;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\User;

class Allergen extends BaseModel
{
    protected $table = 'allergens';

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'risk_level',
        'status',
        'suggested_by_user_id',
        'created_by',
        'updated_by',
    ];

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_allergens', 'allergen_id', 'child_id')->withTimestamps();
    }

    public function suggestedBy()
    {
        return $this->belongsTo(User::class, 'suggested_by_user_id')->withDefault();
    }
}
