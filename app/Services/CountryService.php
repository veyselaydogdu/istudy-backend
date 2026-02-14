<?php

namespace App\Services;

use App\Models\Base\Country;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * CountryService — Ülke Yönetim Servisi
 *
 * RestCountries API'den ülke verilerini çekme, senkronize etme,
 * listeleme, filtreleme ve CRUD işlemleri.
 */
class CountryService
{
    /**
     * RestCountries API URL
     */
    private const API_URL = 'https://restcountries.com/v3.1';

    /**
     * Öncelikli ülkeler (sort_order yüksek)
     */
    private const PRIORITY_COUNTRIES = [
        'TR' => 100,  // Türkiye
        'US' => 95,   // ABD
        'GB' => 90,   // İngiltere
        'DE' => 85,   // Almanya
        'FR' => 80,   // Fransa
        'NL' => 75,   // Hollanda
        'SA' => 70,   // Suudi Arabistan
        'AE' => 65,   // BAE
        'AZ' => 60,   // Azerbaycan
    ];

    /**
     * Ülkeleri listele (filtrelenmiş, sayfalanmış)
     */
    public function list(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = Country::query();

        // Filtreleme
        if (! empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (! empty($filters['region'])) {
            $query->byRegion($filters['region']);
        }

        if (! empty($filters['currency_code'])) {
            $query->byCurrency($filters['currency_code']);
        }

        if (! empty($filters['phone_code'])) {
            $query->byPhoneCode($filters['phone_code']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        } else {
            $query->active(); // Varsayılan: sadece aktifler
        }

        // Sıralama
        $query->ordered();

        return $query->paginate($perPage);
    }

    /**
     * Telefon kodlarını listele (dropdown için)
     */
    public function phoneCodeList(): array
    {
        return Cache::remember('countries:phone_codes', 3600, function () {
            return Country::active()
                ->whereNotNull('phone_code')
                ->ordered()
                ->get(['id', 'name', 'iso2', 'phone_code', 'flag_emoji'])
                ->map(fn ($c) => [
                    'id'         => $c->id,
                    'name'       => $c->name,
                    'iso2'       => $c->iso2,
                    'phone_code' => $c->phone_code,
                    'flag'       => $c->flag_emoji,
                    'label'      => "{$c->flag_emoji} {$c->name} ({$c->phone_code})",
                ])
                ->toArray();
        });
    }

    /**
     * Bölgeleri listele (benzersiz)
     */
    public function regions(): array
    {
        return Cache::remember('countries:regions', 3600, function () {
            return Country::active()
                ->whereNotNull('region')
                ->distinct()
                ->pluck('region')
                ->sort()
                ->values()
                ->toArray();
        });
    }

    /**
     * RestCountries API'den tüm ülkeleri çek ve kaydet
     */
    public function syncFromApi(): array
    {
        $startTime = microtime(true);
        $stats = ['created' => 0, 'updated' => 0, 'errors' => 0, 'total' => 0];

        try {
            $response = Http::timeout(30)->get(self::API_URL . '/all');

            if (! $response->successful()) {
                Log::error('RestCountries API hatası', [
                    'status' => $response->status(),
                    'body'   => substr($response->body(), 0, 500),
                ]);

                return array_merge($stats, ['error' => 'API yanıt vermedi: ' . $response->status()]);
            }

            $countries = $response->json();
            $stats['total'] = count($countries);

            foreach ($countries as $data) {
                try {
                    $iso2 = $data['cca2'] ?? null;
                    if (! $iso2) {
                        $stats['errors']++;
                        continue;
                    }

                    $mapped = $this->mapApiData($data);

                    $existing = Country::withTrashed()->where('iso2', $iso2)->first();

                    if ($existing) {
                        $existing->update($mapped);
                        if ($existing->trashed()) {
                            $existing->restore();
                        }
                        $stats['updated']++;
                    } else {
                        Country::create($mapped);
                        $stats['created']++;
                    }
                } catch (\Throwable $e) {
                    $stats['errors']++;
                    Log::warning('Ülke senkronizasyon hatası', [
                        'iso2'  => $iso2 ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Cache temizle
            Cache::forget('countries:phone_codes');
            Cache::forget('countries:regions');

            $stats['duration'] = round(microtime(true) - $startTime, 2);

            Log::info('Ülke senkronizasyonu tamamlandı', $stats);

        } catch (\Throwable $e) {
            Log::error('RestCountries API bağlantı hatası', ['error' => $e->getMessage()]);
            $stats['error'] = $e->getMessage();
        }

        return $stats;
    }

    /**
     * Belirli bir ülkeyi API'den çek ve güncelle
     */
    public function syncCountry(string $iso2): ?Country
    {
        try {
            $response = Http::timeout(15)->get(self::API_URL . '/alpha/' . strtoupper($iso2));

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();
            // API tek ülke için de array döndürür
            $countryData = is_array($data) && isset($data[0]) ? $data[0] : $data;

            $mapped = $this->mapApiData($countryData);

            return Country::updateOrCreate(
                ['iso2' => strtoupper($iso2)],
                $mapped
            );

        } catch (\Throwable $e) {
            Log::error('Tek ülke senkronizasyon hatası', [
                'iso2'  => $iso2,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * API verisini veritabanı formatına dönüştür
     */
    private function mapApiData(array $data): array
    {
        $iso2 = $data['cca2'] ?? '';

        // Telefon kodu oluştur
        $phoneRoot     = $data['idd']['root'] ?? '';
        $phoneSuffixes = $data['idd']['suffixes'] ?? [];
        $phoneCode     = $phoneRoot . ($phoneSuffixes[0] ?? '');

        // Para birimi bilgisi (ilk para birimi)
        $currencyCode   = null;
        $currencyName   = null;
        $currencySymbol = null;
        if (! empty($data['currencies'])) {
            $firstCurrency  = array_key_first($data['currencies']);
            $currencyCode   = $firstCurrency;
            $currencyName   = $data['currencies'][$firstCurrency]['name'] ?? null;
            $currencySymbol = $data['currencies'][$firstCurrency]['symbol'] ?? null;
        }

        // Yerel isim
        $nativeName = null;
        if (! empty($data['name']['nativeName'])) {
            $firstNative = array_values($data['name']['nativeName']);
            $nativeName  = $firstNative[0]['common'] ?? null;
        }

        // Koordinatlar
        $latitude  = $data['latlng'][0] ?? null;
        $longitude = $data['latlng'][1] ?? null;

        return [
            'name'            => $data['name']['common'] ?? $iso2,
            'official_name'   => $data['name']['official'] ?? null,
            'native_name'     => $nativeName,
            'iso2'            => $iso2,
            'iso3'            => $data['cca3'] ?? null,
            'numeric_code'    => $data['ccn3'] ?? null,
            'phone_code'      => $phoneCode ?: null,
            'phone_root'      => $phoneRoot ?: null,
            'phone_suffixes'  => ! empty($phoneSuffixes) ? $phoneSuffixes : null,
            'currency_code'   => $currencyCode,
            'currency_name'   => $currencyName,
            'currency_symbol' => $currencySymbol,
            'region'          => $data['region'] ?? null,
            'subregion'       => $data['subregion'] ?? null,
            'capital'         => is_array($data['capital'] ?? null) ? ($data['capital'][0] ?? null) : ($data['capital'] ?? null),
            'continents'      => $data['continents'] ?? null,
            'timezones'       => $data['timezones'] ?? null,
            'latitude'        => $latitude,
            'longitude'       => $longitude,
            'languages'       => $data['languages'] ?? null,
            'flag_emoji'      => $data['flag'] ?? null,
            'flag_png'        => $data['flags']['png'] ?? null,
            'flag_svg'        => $data['flags']['svg'] ?? null,
            'population'      => $data['population'] ?? 0,
            'sort_order'      => self::PRIORITY_COUNTRIES[$iso2] ?? 0,
            'extra_data'      => $this->buildExtraData($data),
        ];
    }

    /**
     * extra_data JSON alanı için ek bilgiler
     */
    private function buildExtraData(array $data): ?array
    {
        $extra = [];

        if (! empty($data['tld'])) {
            $extra['tld'] = $data['tld'];
        }
        if (! empty($data['borders'])) {
            $extra['borders'] = $data['borders'];
        }
        if (! empty($data['car'])) {
            $extra['car'] = $data['car'];
        }
        if (! empty($data['startOfWeek'])) {
            $extra['start_of_week'] = $data['startOfWeek'];
        }
        if (! empty($data['postalCode'])) {
            $extra['postal_code'] = $data['postalCode'];
        }
        if (isset($data['independent'])) {
            $extra['independent'] = $data['independent'];
        }
        if (isset($data['landlocked'])) {
            $extra['landlocked'] = $data['landlocked'];
        }
        if (! empty($data['area'])) {
            $extra['area'] = $data['area'];
        }
        if (! empty($data['demonyms'])) {
            $extra['demonyms'] = $data['demonyms'];
        }
        if (! empty($data['gini'])) {
            $extra['gini'] = $data['gini'];
        }
        if (! empty($data['coatOfArms'])) {
            $extra['coat_of_arms'] = $data['coatOfArms'];
        }

        return ! empty($extra) ? $extra : null;
    }

    /**
     * Ülke aktif/pasif durumunu değiştir
     */
    public function toggleActive(Country $country): Country
    {
        $country->update(['is_active' => ! $country->is_active]);

        Cache::forget('countries:phone_codes');

        return $country->fresh();
    }

    /**
     * Sıralama güncelle
     */
    public function updateSortOrder(Country $country, int $sortOrder): Country
    {
        $country->update(['sort_order' => $sortOrder]);

        Cache::forget('countries:phone_codes');

        return $country->fresh();
    }

    /**
     * Ülke istatistikleri
     */
    public function stats(): array
    {
        return Cache::remember('countries:stats', 3600, function () {
            return [
                'total'    => Country::count(),
                'active'   => Country::active()->count(),
                'inactive' => Country::where('is_active', false)->count(),
                'regions'  => Country::active()->distinct()->pluck('region')->filter()->count(),
            ];
        });
    }
}
