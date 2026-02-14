<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;
use App\Models\User;

/**
 * Okul Rolü
 *
 * Okul ve sınıf bazlı özel roller (Müdür Yardımcısı, Beslenme Sorumlusu vb.)
 * Her okul kendi rollerini oluşturabilir ve bu rollere yetkiler atayabilir.
 * class_id null ise okul geneli, dolu ise sınıfa özel roldür.
 */
class SchoolRole extends BaseModel
{
    protected $table = 'school_roles';

    protected $fillable = [
        'school_id',
        'class_id',
        'name',
        'slug',
        'description',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(\App\Models\Academic\SchoolClass::class, 'class_id');
    }

    public function permissions()
    {
        return $this->hasMany(SchoolRolePermission::class);
    }

    public function userRoles()
    {
        return $this->hasMany(SchoolUserRole::class);
    }

    public function users()
    {
        return $this->hasManyThrough(
            User::class,
            SchoolUserRole::class,
            'school_role_id', // Foreign key on school_user_roles
            'id',             // Foreign key on users
            'id',             // Local key on school_roles
            'user_id'         // Local key on school_user_roles
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSchoolLevel($query)
    {
        return $query->whereNull('class_id');
    }

    public function scopeClassLevel($query)
    {
        return $query->whereNotNull('class_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Bu rolün belirli bir izni var mı?
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->where('permission', $permission)->exists();
    }

    /**
     * İzin ekle
     */
    public function grantPermission(string $permission): void
    {
        $this->permissions()->firstOrCreate([
            'permission' => $permission,
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * İzin kaldır
     */
    public function revokePermission(string $permission): void
    {
        $this->permissions()->where('permission', $permission)->delete();
    }
}
