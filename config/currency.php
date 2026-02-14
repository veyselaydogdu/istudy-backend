<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Baz Para Birimi (Base Currency)
    |--------------------------------------------------------------------------
    | Tüm fiyatlar ve kurlar bu para birimi üzerinden hesaplanır.
    | Veritabanındaki is_base=true kayıt bu değeri override eder.
    | Örnek: 'USD', 'TRY', 'EUR'
    */
    'base' => env('CURRENCY_BASE', 'USD'),

    /*
    |--------------------------------------------------------------------------
    | Varsayılan Gösterim Para Birimi
    |--------------------------------------------------------------------------
    | Müşteriye varsayılan olarak gösterilecek para birimi.
    | Tenant/kullanıcı bazında override edilebilir.
    */
    'display' => env('CURRENCY_DISPLAY', 'TRY'),

    /*
    |--------------------------------------------------------------------------
    | Kur API Kaynağı
    |--------------------------------------------------------------------------
    | Desteklenen kaynaklar:
    | - 'exchangerate-api'    → exchangerate-api.com (ücretsiz, API key opsiyonel)
    | - 'openexchangerates'   → openexchangerates.org (API key zorunlu)
    | - 'fixer'               → fixer.io (API key zorunlu)
    | - 'tcmb'                → TCMB XML (ücretsiz, API key gerektirmez)
    */
    'api_source' => env('CURRENCY_API_SOURCE', 'exchangerate-api'),

    /*
    |--------------------------------------------------------------------------
    | API Anahtarları
    |--------------------------------------------------------------------------
    */
    'exchangerate_api_key'   => env('EXCHANGERATE_API_KEY', null),    // Opsiyonel (open API ise null bırakın)
    'openexchangerates_key'  => env('OPENEXCHANGERATES_KEY', null),
    'fixer_key'              => env('FIXER_KEY', null),

    /*
    |--------------------------------------------------------------------------
    | Otomatik Güncelleme Ayarları (Cron)
    |--------------------------------------------------------------------------
    */
    'auto_update' => [
        'enabled'    => env('CURRENCY_AUTO_UPDATE', true),           // Cron ile otomatik güncelleme
        'frequency'  => env('CURRENCY_UPDATE_FREQUENCY', 'daily'),   // hourly, daily, twicedaily
        'time'       => env('CURRENCY_UPDATE_TIME', '09:00'),        // daily/twicedaily için çalışma saati
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Süresi (Saniye)
    |--------------------------------------------------------------------------
    */
    'cache_ttl' => env('CURRENCY_CACHE_TTL', 3600), // 1 saat

    /*
    |--------------------------------------------------------------------------
    | Varsayılan Para Birimleri (Seeder için)
    |--------------------------------------------------------------------------
    | Sistem kurulumunda yüklenecek para birimleri.
    */
    'default_currencies' => [
        [
            'code'     => 'USD',
            'name'     => 'US Dollar',
            'name_tr'  => 'Amerikan Doları',
            'symbol'   => '$',
            'symbol_position' => 'before',
            'is_base'  => true,
            'sort_order' => 1,
        ],
        [
            'code'     => 'TRY',
            'name'     => 'Turkish Lira',
            'name_tr'  => 'Türk Lirası',
            'symbol'   => '₺',
            'symbol_position' => 'after',
            'thousands_separator' => '.',
            'decimal_separator'   => ',',
            'sort_order' => 2,
        ],
        [
            'code'     => 'EUR',
            'name'     => 'Euro',
            'name_tr'  => 'Euro',
            'symbol'   => '€',
            'symbol_position' => 'before',
            'sort_order' => 3,
        ],
        [
            'code'     => 'GBP',
            'name'     => 'British Pound',
            'name_tr'  => 'İngiliz Sterlini',
            'symbol'   => '£',
            'symbol_position' => 'before',
            'sort_order' => 4,
        ],
    ],

];
