<?php

namespace App\Models\Child;

use App\Models\Base\BaseModel;

/**
 * Yetkili Alıcı (Authorized Pickup)
 *
 * Ebeveyn yerine çocuğu okuldan alacak kişilerin kaydı.
 * Ad, soyad, telefon ve adres bilgisi zorunlu olacak.
 */
class AuthorizedPickup extends BaseModel
{
    protected $table = 'authorized_pickups';

    protected $fillable = [
        'child_id',
        'family_profile_id',
        'first_name',
        'last_name',
        'phone',
        'relation',
        'address',
        'id_number',
        'photo',
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

    public function child()
    {
        return $this->belongsTo(Child::class);
    }

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class);
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

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
