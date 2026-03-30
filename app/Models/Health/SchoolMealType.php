<?php

namespace App\Models\Health;

use App\Models\Base\BaseModel;
use App\Models\School\School;

class SchoolMealType extends BaseModel
{
    protected $table = 'school_meal_types';

    protected $fillable = [
        'school_id',
        'name',
        'sort_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id')->withDefault();
    }
}
