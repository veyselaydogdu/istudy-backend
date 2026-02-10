<?php

namespace App\Models\Base;

use App\Models\Base\BaseModel;
use App\Models\User;

class Role extends BaseModel
{
    protected $table = 'roles';

    protected $fillable = [
        'name',
        'label',
        'created_by',
        'updated_by'
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'role_user', 'role_id', 'user_id');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'permission_role', 'role_id', 'permission_id');
    }
}
