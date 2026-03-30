<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Döviz Kuru Modeli
 *
 * Baz para birimine göre günlük kur değerlerini saklar.
 * Örnek: Baz USD ise → 1 USD = 32.50 TRY (rate=32.50)
 */
class ExchangeRate extends Model
{
    protected $table = 'exchange_rates';

    protected $fillable = [
        'currency_id',
        'base_currency',
        'rate',
        'buy_rate',
        'sell_rate',
        'source',
        'fetched_at',
        'rate_date',
    ];

    protected $casts = [
        'rate'       => 'decimal:8',
        'buy_rate'   => 'decimal:8',
        'sell_rate'  => 'decimal:8',
        'fetched_at' => 'datetime',
        'rate_date'  => 'date',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeForDate($query, string $date)
    {
        return $query->where('rate_date', $date);
    }

    public function scopeLatestRates($query)
    {
        return $query->orderByDesc('rate_date');
    }

    public function scopeForCurrency($query, string $currencyCode)
    {
        return $query->whereHas('currency', fn ($q) => $q->where('code', $currencyCode));
    }

    public function scopeFromApi($query)
    {
        return $query->where('source', 'api');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Belirli bir tarih için kur al (cache ile)
     */
    public static function getRate(string $targetCode, ?string $date = null): float
    {
        $baseCode = Currency::getBaseCurrencyCode();

        // Baz para birimiden kendine dönüşüm
        if (strtoupper($targetCode) === strtoupper($baseCode)) {
            return 1.0;
        }

        $date = $date ?? now()->toDateString();
        $cacheKey = "rate_{$baseCode}_{$targetCode}_{$date}";

        return (float) cache()->remember($cacheKey, 3600, function () use ($targetCode, $date) {
            $rate = static::whereHas('currency', fn ($q) => $q->where('code', strtoupper($targetCode)))
                ->where('rate_date', '<=', $date)
                ->orderByDesc('rate_date')
                ->first();

            return $rate?->rate ?? 0;
        });
    }

    /**
     * Tutarı baz para biriminden hedef para birimine çevir
     *
     * Örnek: convertFromBase(100, 'TRY') → 100 USD = 3250 TRY
     */
    public static function convertFromBase(float $amount, string $targetCode): float
    {
        $rate = static::getRate($targetCode);

        if ($rate <= 0) {
            return $amount; // Kur bulunamazsa orijinal tutarı döndür
        }

        return round($amount * $rate, 2);
    }

    /**
     * Tutarı hedef para biriminden baz para birimine çevir
     *
     * Örnek: convertToBase(3250, 'TRY') → 3250 TRY = 100 USD
     */
    public static function convertToBase(float $amount, string $fromCode): float
    {
        $rate = static::getRate($fromCode);

        if ($rate <= 0) {
            return $amount;
        }

        return round($amount / $rate, 2);
    }

    /**
     * İki para birimi arasında çapraz kur hesapla
     *
     * Örnek: convert(100, 'EUR', 'TRY') → 100 EUR = ? TRY
     */
    public static function convert(float $amount, string $fromCode, string $toCode): float
    {
        if (strtoupper($fromCode) === strtoupper($toCode)) {
            return $amount;
        }

        // Önce baz para birimine çevir, sonra hedefe çevir
        $baseAmount = static::convertToBase($amount, $fromCode);

        return static::convertFromBase($baseAmount, $toCode);
    }
}
