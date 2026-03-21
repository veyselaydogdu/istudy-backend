<?php

namespace App\Models\ActivityClass;

use Illuminate\Database\Eloquent\Model;

class ActivityClassMaterial extends Model
{
    protected $table = 'activity_class_materials';

    protected $fillable = [
        'activity_class_id',
        'name',
        'description',
        'quantity',
        'is_required',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function activityClass()
    {
        return $this->belongsTo(ActivityClass::class);
    }
}
