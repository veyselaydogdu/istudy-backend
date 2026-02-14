<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;
use App\Models\User;

/**
 * Kullanıcı Okul Rol Ataması
 *
 * Bir kullanıcıya okul veya sınıf bazlı rol ataması.
 * class_id null ise okul geneli, dolu ise sınıf bazlı.
 */
class SchoolUserRole extends BaseModel
{
    protected $table = 'school_user_roles';

    protected $fillable = [
        'user_id',
        'school_role_id',
        'school_id',
        'class_id',
        'created_by',
        'updated_by',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schoolRole()
    {
        return $this->belongsTo(SchoolRole::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(\App\Models\Academic\SchoolClass::class, 'class_id');
    }
}
