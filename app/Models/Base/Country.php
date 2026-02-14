<?php

namespace App\Models\Base;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Country — Ülke Modeli
 *
 * RestCountries API'den senkronize edilen global ülke verileri.
 * BaseModel'den türetilmez çünkü tenant'a bağlı değildir (global veri).
 *
 * Kullanım alanları:
 * - Telefon/GSM ülke kodu seçimi
 * - Para birimi eşleştirme
 * - Ülke bazlı filtreleme
 * - Kullanıcı profili ülke seçimi
 */
class Country extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'countries';

    protected $fillable = [
        'name',
        'official_name',
        'native_name',
        'iso2',
        'iso3',
        'numeric_code',
        'phone_code',
        'phone_root',
        'phone_suffixes',
        'currency_code',
        'currency_name',
        'currency_symbol',
        'region',
        'subregion',
        'capital',
        'continents',
        'timezones',
        'latitude',
        'longitude',
        'languages',
        'flag_emoji',
        'flag_png',
        'flag_svg',
        'population',
        'is_active',
        'sort_order',
        'extra_data',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'phone_suffixes' => 'array',
        'continents'     => 'array',
        'timezones'      => 'array',
        'languages'      => 'array',
        'extra_data'     => 'array',
        'is_active'      => 'boolean',
        'population'     => 'integer',
        'sort_order'     => 'integer',
        'latitude'       => 'decimal:7',
        'longitude'      => 'decimal:7',
    ];

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Sadece aktif ülkeler
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Bölgeye göre filtrele
     */
    public function scopeByRegion(Builder $query, string $region): Builder
    {
        return $query->where('region', $region);
    }

    /**
     * Para birimi koduna göre filtrele
     */
    public function scopeByCurrency(Builder $query, string $currencyCode): Builder
    {
        return $query->where('currency_code', $currencyCode);
    }

    /**
     * ISO koduna göre bul
     */
    public function scopeByIso2(Builder $query, string $iso2): Builder
    {
        return $query->where('iso2', strtoupper($iso2));
    }

    /**
     * Telefon koduna göre filtrele
     */
    public function scopeByPhoneCode(Builder $query, string $phoneCode): Builder
    {
        return $query->where('phone_code', $phoneCode);
    }

    /**
     * Metin araması (isim, ISO kodu, GSM kodu)
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
              ->orWhere('official_name', 'LIKE', "%{$term}%")
              ->orWhere('native_name', 'LIKE', "%{$term}%")
              ->orWhere('iso2', 'LIKE', "%{$term}%")
              ->orWhere('iso3', 'LIKE', "%{$term}%")
              ->orWhere('phone_code', 'LIKE', "%{$term}%")
              ->orWhere('capital', 'LIKE', "%{$term}%");
        });
    }

    /**
     * Sıralama: sort_order öncelikli, sonra isim
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderByDesc('sort_order')->orderBy('name');
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Tam telefon kodu (root + suffix)
     */
    public function getFullPhoneCodeAttribute(): string
    {
        if ($this->phone_code) {
            return $this->phone_code;
        }

        $root     = $this->phone_root ?? '';
        $suffixes = $this->phone_suffixes ?? [];

        return $root . ($suffixes[0] ?? '');
    }

    /**
     * Birincil dil
     */
    public function getPrimaryLanguageAttribute(): ?string
    {
        $languages = $this->languages;
        if (empty($languages)) {
            return null;
        }

        return array_values($languages)[0] ?? null;
    }

    /**
     * Kısa özet bilgi
     */
    public function getSummaryAttribute(): string
    {
        return "{$this->flag_emoji} {$this->name} ({$this->iso2}) {$this->phone_code}";
    }
}
