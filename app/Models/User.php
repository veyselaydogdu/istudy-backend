<?php

namespace App\Models;

// Illuminate\Foundation\Auth\User as Authenticatable
use App\Models\Base\Country;
use App\Models\Base\Role;
use App\Models\Base\UserContactNumber;
use App\Models\Child\FamilyProfile;
use App\Models\School\TeacherProfile;
use App\Models\Tenant\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'surname',
        'email',
        'password',
        'phone',
        'country_id',
        'locale',
        'last_login_at',
        'created_by',
        'updated_by',
        'tenant_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_login_at' => 'datetime',
    ];

    /**
     * Check if user is super admin.
     * This logic depends on Roles implementation.
     */
    public function isSuperAdmin(): bool
    {
        // Role check logic here
        return $this->roles()->where('name', 'super_admin')->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by')->withDefault();
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by')->withDefault();
    }

    public function tenants()
    {
        // User might own tenants or belong to them. Assuming 'owner_user_id' in tenants table for ownership.
        return $this->hasMany(Tenant::class, 'owner_user_id');
    }

    // If users table had tenant_id, belongsTo would be appropriate.
    // The prompt says "Kullanıcı birden fazla tenant’a bağlanabilir." implies pivot or ownership.
    // However, "tenant_id" column is mentioned in index rules but not explicitly in Users table fields list in Request.
    // Let's stick to explicit relations requested: tenants(), teacherProfiles(), familyProfiles(), roles().

    public function teacherProfiles()
    {
        return $this->hasMany(TeacherProfile::class, 'user_id');
    }

    public function familyProfiles()
    {
        return $this->hasMany(FamilyProfile::class, 'owner_user_id');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id')->withTimestamps();
    }

    /**
     * Ek iletişim numaraları (WhatsApp, Telegram vb.)
     */
    public function contactNumbers()
    {
        return $this->hasMany(UserContactNumber::class, 'user_id')->ordered();
    }

    /**
     * Ülke
     */
    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Tam ad (name + surname)
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->name} {$this->surname}");
    }
}
