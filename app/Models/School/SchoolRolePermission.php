<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;

/**
 * Okul Rolü İzni
 *
 * Okul rollerine atanmış izin anahtarları.
 * Örnek: manage_meals, view_reports, manage_attendance, manage_events
 */
class SchoolRolePermission extends BaseModel
{
    protected $table = 'school_role_permissions';

    protected $fillable = [
        'school_role_id',
        'permission',
        'created_by',
        'updated_by',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function schoolRole()
    {
        return $this->belongsTo(SchoolRole::class);
    }
}
