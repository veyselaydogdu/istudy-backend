<?php

namespace App\Models\School;

use App\Models\Academic\AcademicYear;
use App\Models\Academic\SchoolClass;
use App\Models\Activity\Homework;
use App\Models\Activity\ReportTemplate;
use App\Models\Base\BaseModel;
use App\Models\Billing\ChildPricingSetting;
use App\Models\Child\Child;
use App\Models\Health\MealMenuSchedule;
use App\Models\Notification\SystemNotification;
use App\Models\Tenant\Tenant;

class School extends BaseModel
{
    protected $table = 'schools';

    protected $fillable = [
        'tenant_id',
        'country_id',
        'name',
        'description',
        'code',
        'registration_code',
        'invite_token',
        'address',
        'city',
        'phone',
        'fax',
        'gsm',
        'whatsapp',
        'email',
        'website',
        'logo',
        'timezone',
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

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id')->withDefault();
    }

    public function country()
    {
        return $this->belongsTo(\App\Models\Base\Country::class, 'country_id')->withDefault();
    }

    public function academicYears()
    {
        return $this->hasMany(AcademicYear::class, 'school_id');
    }

    public function classes()
    {
        return $this->hasMany(SchoolClass::class, 'school_id');
    }

    public function teachers()
    {
        return $this->hasMany(TeacherProfile::class, 'school_id');
    }

    public function children()
    {
        return $this->hasMany(Child::class, 'school_id');
    }

    /**
     * Okula gelen kayıt talepleri
     */
    public function enrollmentRequests()
    {
        return $this->hasMany(SchoolEnrollmentRequest::class, 'school_id');
    }

    /**
     * Okula kayıtlı veliler (onaylananlar)
     */
    public function families()
    {
        return $this->belongsToMany(
            \App\Models\Child\FamilyProfile::class,
            'school_family_assignments',
            'school_id',
            'family_profile_id'
        )->withPivot(['enrollment_request_id', 'is_active', 'joined_at'])
            ->withTimestamps()
            ->wherePivot('is_active', true);
    }

    /**
     * Davet tokeni ile okul bul
     */
    public static function findByInviteToken(string $token): ?self
    {
        return static::where('invite_token', $token)->where('is_active', true)->first();
    }

    /**
     * Davet tokenini yenile (UUID)
     */
    public function regenerateInviteToken(): string
    {
        $token = \Illuminate\Support\Str::uuid()->toString();
        $this->update(['invite_token' => $token]);

        return $token;
    }

    /**
     * Okula özel roller
     */
    public function schoolRoles()
    {
        return $this->hasMany(SchoolRole::class, 'school_id');
    }

    /**
     * Okul duyuruları
     */
    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'school_id');
    }

    /**
     * Okul ödevleri
     */
    public function homework()
    {
        return $this->hasMany(Homework::class, 'school_id');
    }

    /**
     * Yemek menü takvimi
     */
    public function mealSchedules()
    {
        return $this->hasMany(MealMenuSchedule::class, 'school_id');
    }

    /**
     * Rapor şablonları
     */
    public function reportTemplates()
    {
        return $this->hasMany(ReportTemplate::class, 'school_id');
    }

    /**
     * Bildirimler
     */
    public function notifications()
    {
        return $this->hasMany(SystemNotification::class, 'school_id');
    }

    /**
     * Çocuk fiyatlandırma ayarları
     */
    public function pricingSettings()
    {
        return $this->hasMany(ChildPricingSetting::class, 'school_id');
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
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Kayıt kodu ile okul ara
     */
    public static function findByRegistrationCode(string $code): ?self
    {
        return static::where('registration_code', $code)->active()->first();
    }

    /**
     * Benzersiz kayıt kodu oluştur
     */
    public static function generateRegistrationCode(): string
    {
        do {
            $code = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
        } while (static::where('registration_code', $code)->exists());

        return $code;
    }
}
