<?php

namespace App\Models\Package;

use App\Models\Base\BaseModel;

class Package extends BaseModel
{
    protected $table = 'packages';

    protected $fillable = [
        'name',
        'description',
        'max_schools',
        'max_classes_per_school',
        'max_students',
        'monthly_price',
        'yearly_price',
        'is_active',
        'features',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'max_schools' => 'integer',
        'max_classes_per_school' => 'integer',
        'max_students' => 'integer',
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'is_active' => 'boolean',
        'features' => 'array',
        'sort_order' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function subscriptions()
    {
        return $this->hasMany(TenantSubscription::class, 'package_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Belirtilen döngüye göre fiyatı döndür
     */
    public function priceFor(string $billingCycle): string
    {
        return $billingCycle === 'yearly' ? $this->yearly_price : $this->monthly_price;
    }

    /**
     * Limitin sınırsız olup olmadığını kontrol et (0 = sınırsız)
     */
    public function hasUnlimitedSchools(): bool
    {
        return $this->max_schools === 0;
    }

    public function hasUnlimitedClasses(): bool
    {
        return $this->max_classes_per_school === 0;
    }

    public function hasUnlimitedStudents(): bool
    {
        return $this->max_students === 0;
    }
}
