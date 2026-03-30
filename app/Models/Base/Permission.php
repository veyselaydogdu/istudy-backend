<?php

namespace App\Models\Base;

class Permission extends BaseModel
{
    protected $table = 'permissions';

    protected $fillable = [
        'name',
        'label',
        'created_by',
        'updated_by',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'permission_role', 'permission_id', 'role_id');
    }
}
