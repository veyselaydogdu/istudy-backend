<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;
use App\Models\Tenant\Tenant;

class TeacherRoleType extends BaseModel
{
    protected $table = 'teacher_role_types';

    protected $fillable = [
        'tenant_id',
        'name',
        'sort_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class)->withDefault();
    }
}
