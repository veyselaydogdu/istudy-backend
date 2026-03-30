<?php

namespace App\Models\Billing;

use App\Models\Base\BaseModel;
use App\Models\School\School;

/**
 * Çocuk Fiyatlandırma Ayarı
 *
 * Çocuk sayısına göre kademeli fiyatlandırma:
 * 1. çocuk: 10$, 2. çocuk ve üzeri: indirimli
 * Bu ayarlar admin veya okul yöneticisi tarafından düzenlenebilir.
 */
class ChildPricingSetting extends BaseModel
{
    protected $table = 'child_pricing_settings';

    protected $fillable = [
        'school_id',
        'child_order',
        'price',
        'discount_percentage',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
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

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePlatformLevel($query)
    {
        return $query->whereNull('school_id');
    }

    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where(function ($q) use ($schoolId) {
            $q->where('school_id', $schoolId)
              ->orWhereNull('school_id');
        })->orderByRaw('school_id IS NULL ASC')  // Okul özel olanı önce
          ->orderBy('child_order');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Belirli bir sıradaki çocuğun fiyatını hesapla
     */
    public static function calculatePrice(int $childOrder, ?int $schoolId = null): float
    {
        $setting = static::active()
            ->where('child_order', $childOrder)
            ->when($schoolId, function ($q) use ($schoolId) {
                $q->where(function ($q2) use ($schoolId) {
                    $q2->where('school_id', $schoolId)
                       ->orWhereNull('school_id');
                })->orderByRaw('school_id IS NULL ASC');
            }, function ($q) {
                $q->whereNull('school_id');
            })
            ->first();

        if (!$setting) {
            // Varsayılan: 1. çocuk $10, sonraki $8 (20% indirim)
            return $childOrder === 1 ? 10.00 : 8.00;
        }

        return (float) $setting->price;
    }

    /**
     * Toplam aile fiyatını hesapla
     */
    public static function calculateTotalFamilyPrice(int $childCount, ?int $schoolId = null): float
    {
        $total = 0;
        for ($i = 1; $i <= $childCount; $i++) {
            $total += static::calculatePrice($i, $schoolId);
        }

        return $total;
    }
}
