<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Para Birimi Modeli
 *
 * ISO 4217 standardına uygun para birimi tanımları.
 * Baz para birimi (is_base=true) tüm dönüşümlerin referans noktasıdır.
 */
class Currency extends Model
{
    use SoftDeletes;

    protected $table = 'currencies';

    protected $fillable = [
        'code',
        'name',
        'name_tr',
        'symbol',
        'symbol_position',
        'thousands_separator',
        'decimal_separator',
        'decimal_places',
        'is_active',
        'is_base',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'is_base'        => 'boolean',
        'decimal_places'  => 'integer',
        'sort_order'     => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function exchangeRates(): HasMany
    {
        return $this->hasMany(ExchangeRate::class, 'currency_id');
    }

    /**
     * En güncel kuru al
     */
    public function latestRate()
    {
        return $this->hasOne(ExchangeRate::class, 'currency_id')
            ->latestOfMany('rate_date');
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

    public function scopeBase($query)
    {
        return $query->where('is_base', true);
    }

    public function scopeNonBase($query)
    {
        return $query->where('is_base', false);
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('code', strtoupper($code));
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Baz para birimini döndür (cache ile)
     */
    public static function getBaseCurrency(): ?self
    {
        return cache()->remember('base_currency', 3600, function () {
            return static::base()->first();
        });
    }

    /**
     * Baz para birimi kodunu döndür
     */
    public static function getBaseCurrencyCode(): string
    {
        return static::getBaseCurrency()?->code ?? config('currency.base', 'USD');
    }

    /**
     * Bu para birimini baz olarak ayarla (diğerlerinin is_base'ini false yap)
     */
    public function setAsBase(): self
    {
        static::where('is_base', true)->update(['is_base' => false]);
        $this->update(['is_base' => true]);

        // Cache temizle
        cache()->forget('base_currency');
        cache()->forget('exchange_rates');
        cache()->forget('active_currencies');

        return $this;
    }

    /**
     * Tutarı bu para birimi formatında göster
     */
    public function format(float $amount): string
    {
        $formatted = number_format(
            $amount,
            $this->decimal_places,
            $this->decimal_separator,
            $this->thousands_separator
        );

        if ($this->symbol_position === 'before') {
            return $this->symbol . $formatted;
        }

        return $formatted . $this->symbol;
    }

    /**
     * Baz para birimi mi?
     */
    public function isBase(): bool
    {
        return $this->is_base;
    }

    /**
     * En güncel kur değerini al
     */
    public function getCurrentRate(): float
    {
        if ($this->isBase()) {
            return 1.0;
        }

        return (float) ($this->latestRate?->rate ?? 0);
    }
}
