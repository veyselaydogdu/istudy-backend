<?php

namespace App\Models\Tenant;

use App\Models\Base\BaseModel;
use App\Models\Package\TenantSubscription;
use App\Models\School\School;
use App\Models\User;

class Tenant extends BaseModel
{
    protected $table = 'tenants';

    protected $fillable = [
        'name',
        'owner_user_id',
        'country',
        'currency',
        'created_by',
        'updated_by',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id')->withDefault();
    }

    public function schools()
    {
        return $this->hasMany(School::class, 'tenant_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(TenantSubscription::class, 'tenant_id');
    }

    /**
     * Tenant'ın aktif aboneliğini döndür
     */
    public function activeSubscription()
    {
        return $this->hasOne(TenantSubscription::class, 'tenant_id')
            ->where('status', 'active')
            ->where('end_date', '>=', now())
            ->latest();
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Tenant'ın aktif paketi var mı?
     */
    public function hasActiveSubscription(): bool
    {
        return $this->activeSubscription()->exists();
    }

    /**
     * Mevcut paketteki okul limitini kontrol et
     */
    public function canCreateSchool(): bool
    {
        $package = $this->activeSubscription?->package;

        if (! $package) {
            return false;
        }

        if ($package->hasUnlimitedSchools()) {
            return true;
        }

        return $this->schools()->count() < $package->max_schools;
    }

    /**
     * Tenant genelinde toplam öğrenci limitini kontrol et
     */
    public function canEnrollStudent(): bool
    {
        $package = $this->activeSubscription?->package;

        if (! $package) {
            return false;
        }

        if ($package->hasUnlimitedStudents()) {
            return true;
        }

        $totalStudents = \App\Models\Child\Child::whereIn(
            'school_id',
            $this->schools()->pluck('id')
        )->count();

        return $totalStudents < $package->max_students;
    }

    /**
     * Belirli bir okulda sınıf limiti kontrolü
     */
    public function canCreateClass(int $schoolId): bool
    {
        $package = $this->activeSubscription?->package;

        if (! $package) {
            return false;
        }

        if ($package->hasUnlimitedClasses()) {
            return true;
        }

        $classCount = \App\Models\Academic\SchoolClass::where('school_id', $schoolId)->count();

        return $classCount < $package->max_classes_per_school;
    }
}
