<?php

namespace App\Models;

// Illuminate\Foundation\Auth\User as Authenticatable
use App\Models\Base\Country;
use App\Models\Base\Role;
use App\Models\Base\UserContactNumber;
use App\Models\Base\UserRole;
use App\Models\Child\FamilyProfile;
use App\Models\School\School;
use App\Models\School\TeacherProfile;
use App\Models\Tenant\Tenant;
use App\Traits\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUlid, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'ulid',
        'role_id',
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
        'ulid' => 'string',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_login_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Rol Yardımcıları
    |--------------------------------------------------------------------------
    */

    public function isSuperAdmin(): bool
    {
        return $this->role_id === UserRole::SUPER_ADMIN;
    }

    public function isTenant(): bool
    {
        return $this->role_id === UserRole::TENANT;
    }

    public function isTeacher(): bool
    {
        return $this->role_id === UserRole::TEACHER;
    }

    public function isParent(): bool
    {
        return $this->role_id === UserRole::PARENT;
    }

    public function isStudent(): bool
    {
        return $this->role_id === UserRole::STUDENT;
    }

    public function canAccessTenantPanel(): bool
    {
        return in_array($this->role_id, UserRole::TENANT_PANEL_ROLES, true);
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

    /**
     * Kullanıcının tenant'ına ait okullar.
     * User.tenant_id → Tenant.id → School.tenant_id
     */
    public function schools(): HasManyThrough
    {
        return $this->hasManyThrough(
            School::class,
            Tenant::class,
            'id',        // tenants.id = users.tenant_id
            'tenant_id', // schools.tenant_id = tenants.id
            'tenant_id', // users.tenant_id (local key)
            'id',        // tenants.id (second local key)
        );
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

    /** Ana rol (user_roles lookup tablosu — doğrudan FK) */
    public function userRole()
    {
        return $this->belongsTo(UserRole::class, 'role_id');
    }

    /** Eski çoktan-çoğa roller (geriye dönük uyumluluk için korundu) */
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

    /**
     * Kullanıcı tipine göre şifre sıfırlama URL'si üretir.
     * - Parent (mobil) → deep link
     * - Tenant admin (web) → TENANT_FRONTEND_URL/reset-password
     */
    public function sendPasswordResetNotification($token): void
    {
        $isParent = is_null($this->tenant_id);

        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function ($notifiable, string $resetToken) use ($isParent) {
            if ($isParent) {
                return 'parentmobileapp://reset-password?token='.$resetToken.'&email='.urlencode($notifiable->email);
            }

            $frontendUrl = config('app.tenant_frontend_url', 'http://localhost:3002');

            return $frontendUrl.'/reset-password?token='.$resetToken.'&email='.urlencode($notifiable->email);
        });

        $this->notify(new \Illuminate\Auth\Notifications\ResetPassword($token));
    }
}
