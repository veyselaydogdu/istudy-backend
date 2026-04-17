<?php

namespace Database\Seeders\old_seeders;

use App\Models\Base\Country;
use App\Models\Billing\Currency;
use App\Models\Health\Allergen;
use App\Models\Health\FoodIngredient;
use App\Models\Health\MedicalCondition;
use Illuminate\Database\Seeder;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Para Birimleri ───────────────────────────────────────────────────
        $currencies = [
            [
                'code' => 'TRY',
                'name' => 'Turkish Lira',
                'name_tr' => 'Türk Lirası',
                'symbol' => '₺',
                'symbol_position' => 'before',
                'thousands_separator' => '.',
                'decimal_separator' => ',',
                'decimal_places' => 2,
                'is_active' => true,
                'is_base' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'USD',
                'name' => 'US Dollar',
                'name_tr' => 'Amerikan Doları',
                'symbol' => '$',
                'symbol_position' => 'before',
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'decimal_places' => 2,
                'is_active' => true,
                'is_base' => false,
                'sort_order' => 2,
            ],
            [
                'code' => 'EUR',
                'name' => 'Euro',
                'name_tr' => 'Euro',
                'symbol' => '€',
                'symbol_position' => 'before',
                'thousands_separator' => '.',
                'decimal_separator' => ',',
                'decimal_places' => 2,
                'is_active' => true,
                'is_base' => false,
                'sort_order' => 3,
            ],
            [
                'code' => 'GBP',
                'name' => 'British Pound',
                'name_tr' => 'İngiliz Sterlini',
                'symbol' => '£',
                'symbol_position' => 'before',
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'decimal_places' => 2,
                'is_active' => true,
                'is_base' => false,
                'sort_order' => 4,
            ],
        ];

        foreach ($currencies as $currency) {
            Currency::updateOrCreate(['code' => $currency['code']], $currency);
        }

        // ─── Ülkeler ──────────────────────────────────────────────────────────
        $countries = [
            [
                'name' => 'Turkey',
                'official_name' => 'Republic of Türkiye',
                'native_name' => 'Türkiye',
                'iso2' => 'TR',
                'iso3' => 'TUR',
                'numeric_code' => '792',
                'phone_code' => '+90',
                'currency_code' => 'TRY',
                'currency_name' => 'Turkish lira',
                'currency_symbol' => '₺',
                'region' => 'Asia',
                'subregion' => 'Western Asia',
                'capital' => 'Ankara',
                'flag_emoji' => '🇹🇷',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Northern Cyprus',
                'official_name' => 'Turkish Republic of Northern Cyprus',
                'native_name' => 'Kuzey Kıbrıs',
                'iso2' => 'CY',
                'iso3' => 'CYP',
                'numeric_code' => '196',
                'phone_code' => '+90',
                'currency_code' => 'TRY',
                'currency_name' => 'Turkish lira',
                'currency_symbol' => '₺',
                'region' => 'Europe',
                'subregion' => 'Southern Europe',
                'capital' => 'Lefkoşa',
                'flag_emoji' => '🇨🇾',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Germany',
                'official_name' => 'Federal Republic of Germany',
                'native_name' => 'Deutschland',
                'iso2' => 'DE',
                'iso3' => 'DEU',
                'numeric_code' => '276',
                'phone_code' => '+49',
                'currency_code' => 'EUR',
                'currency_name' => 'Euro',
                'currency_symbol' => '€',
                'region' => 'Europe',
                'subregion' => 'Western Europe',
                'capital' => 'Berlin',
                'flag_emoji' => '🇩🇪',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'United Kingdom',
                'official_name' => 'United Kingdom of Great Britain and Northern Ireland',
                'native_name' => 'United Kingdom',
                'iso2' => 'GB',
                'iso3' => 'GBR',
                'numeric_code' => '826',
                'phone_code' => '+44',
                'currency_code' => 'GBP',
                'currency_name' => 'British pound',
                'currency_symbol' => '£',
                'region' => 'Europe',
                'subregion' => 'Northern Europe',
                'capital' => 'London',
                'flag_emoji' => '🇬🇧',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Netherlands',
                'official_name' => 'Kingdom of the Netherlands',
                'native_name' => 'Nederland',
                'iso2' => 'NL',
                'iso3' => 'NLD',
                'numeric_code' => '528',
                'phone_code' => '+31',
                'currency_code' => 'EUR',
                'currency_name' => 'Euro',
                'currency_symbol' => '€',
                'region' => 'Europe',
                'subregion' => 'Western Europe',
                'capital' => 'Amsterdam',
                'flag_emoji' => '🇳🇱',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'United States',
                'official_name' => 'United States of America',
                'native_name' => 'United States',
                'iso2' => 'US',
                'iso3' => 'USA',
                'numeric_code' => '840',
                'phone_code' => '+1',
                'currency_code' => 'USD',
                'currency_name' => 'US dollar',
                'currency_symbol' => '$',
                'region' => 'Americas',
                'subregion' => 'North America',
                'capital' => 'Washington D.C.',
                'flag_emoji' => '🇺🇸',
                'is_active' => true,
                'sort_order' => 6,
            ],
        ];

        foreach ($countries as $country) {
            Country::updateOrCreate(['iso2' => $country['iso2']], $country);
        }

        // ─── Global Alerjenler (tenant_id = null) ─────────────────────────────
        $allergens = [
            [
                'name' => 'Gluten',
                'description' => 'Buğday, arpa, çavdar ve yulaf gibi tahıllarda bulunan protein. Çölyak hastalığında ciddi reaksiyonlara yol açar.',
                'risk_level' => 'high',
                'status' => 'approved',
            ],
            [
                'name' => 'Süt / Laktoz',
                'description' => 'İnek, koyun ve keçi sütü ile süt ürünlerinde (peynir, yoğurt, tereyağı) bulunan protein ve şeker.',
                'risk_level' => 'high',
                'status' => 'approved',
            ],
            [
                'name' => 'Yumurta',
                'description' => 'Tavuk ve diğer kuş yumurtalarında bulunan protein. Bebeklik döneminde en yaygın gıda alerjilerinden biri.',
                'risk_level' => 'high',
                'status' => 'approved',
            ],
            [
                'name' => 'Fıstık (Yerfıstığı)',
                'description' => 'Anafilaksiye neden olabilen güçlü bir alerjen. Küçük miktarlar bile ciddi reaksiyon yaratabilir.',
                'risk_level' => 'high',
                'status' => 'approved',
            ],
            [
                'name' => 'Bal kabağı / Polen',
                'description' => 'Mevsimsel bitki polenleriyle çapraz reaktivite gösteren gıdalar. Bahar aylarında semptomlar artabilir.',
                'risk_level' => 'low',
                'status' => 'approved',
            ],
        ];

        foreach ($allergens as $allergen) {
            Allergen::withoutGlobalScopes()->updateOrCreate(
                ['name' => $allergen['name'], 'tenant_id' => null],
                array_merge($allergen, ['tenant_id' => null])
            );
        }

        // ─── Global Hastalıklar (tenant_id = null) ────────────────────────────
        $conditions = [
            [
                'name' => 'Astım',
                'description' => 'Kronik hava yolu iltihabı. Egzersiz, soğuk hava veya alerjenlerle tetiklenebilir. İnhaler kullanımı gerektirebilir.',
                'status' => 'approved',
            ],
            [
                'name' => 'Tip 1 Diyabet',
                'description' => 'Pankreas yeterli insülin üretemez. Kan şekeri takibi ve insülin uygulaması gerektirir. Okul saatlerinde şeker takibi önemlidir.',
                'status' => 'approved',
            ],
            [
                'name' => 'Epilepsi (Sara)',
                'description' => 'Tekrarlayan nöbet geçirme durumu. Nöbet anında müdahale protokolü bilinmeli, okul personeli bilgilendirilmeli.',
                'status' => 'approved',
            ],
            [
                'name' => 'Serebral Palsi',
                'description' => 'Beyin gelişimindeki bozukluk nedeniyle hareket ve kas kontrolünde güçlük. Fiziksel destek ve erişilebilirlik önemlidir.',
                'status' => 'approved',
            ],
            [
                'name' => 'DEHB (Dikkat Eksikliği)',
                'description' => 'Dikkat güçlüğü, aşırı hareketlilik ve dürtüsellik ile karakterize nörogelişimsel bozukluk. Yapılandırılmış ortam önerilir.',
                'status' => 'approved',
            ],
        ];

        foreach ($conditions as $condition) {
            MedicalCondition::withoutGlobalScopes()->updateOrCreate(
                ['name' => $condition['name'], 'tenant_id' => null],
                array_merge($condition, ['tenant_id' => null])
            );
        }

        // ─── Global Besin Öğeleri (tenant_id = null) ──────────────────────────
        $ingredients = [
            [
                'name' => 'Mercimek',
                'allergen_info' => 'Baklagil ailesine aittir. Bazı bireylerde legümin alerjisi olabilir.',
            ],
            [
                'name' => 'Yulaf',
                'allergen_info' => 'Çölyak veya gluten hassasiyeti olan çocuklar için kontrol edilmeli.',
            ],
            [
                'name' => 'Tam Buğday Unu',
                'allergen_info' => 'Gluten içerir. Çölyak ve buğday alerjisi olanlarda kullanılmamalı.',
            ],
            [
                'name' => 'Zeytinyağı',
                'allergen_info' => 'Genellikle güvenlidir. Zeytin alerjisi nadirdir.',
            ],
            [
                'name' => 'Süt',
                'allergen_info' => 'Laktoz intoleransı veya süt proteini alerjisi olan çocuklar için uygun alternatif sunulmalı.',
            ],
        ];

        foreach ($ingredients as $ingredient) {
            FoodIngredient::withoutGlobalScopes()->updateOrCreate(
                ['name' => $ingredient['name'], 'tenant_id' => null],
                array_merge($ingredient, ['tenant_id' => null])
            );
        }
    }
}
