<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Audit Sistemi Konfigürasyonu
    |--------------------------------------------------------------------------
    |
    | History ve audit log sistemi için merkezi konfigürasyon.
    | Ayrı veritabanı, asenkron loglama, arşivleme ve
    | performans ayarları burada yönetilir.
    */

    /*
    |--------------------------------------------------------------------------
    | Veritabanı Bağlantısı
    |--------------------------------------------------------------------------
    | Audit loglarının yazılacağı DB bağlantısı.
    | 'audit' → Ayrı veritabanı (config/database.php'de tanımlı)
    | null    → Ana veritabanını kullan
    */
    'connection' => env('AUDIT_DB_CONNECTION', 'audit'),

    /*
    |--------------------------------------------------------------------------
    | Asenkron Loglama (Queue)
    |--------------------------------------------------------------------------
    | true → Loglar queue üzerinden asenkron yazılır (performans++)
    | false → Loglar senkron yazılır (gerçek zamanlı ama daha yavaş)
    */
    'async' => env('AUDIT_ASYNC', false),

    /*
    |--------------------------------------------------------------------------
    | Queue Ayarları
    |--------------------------------------------------------------------------
    */
    'queue' => [
        'name'       => env('AUDIT_QUEUE_NAME', 'audit'),
        'connection' => env('AUDIT_QUEUE_CONNECTION', null), // null = varsayılan queue driver
    ],

    /*
    |--------------------------------------------------------------------------
    | Batch Insert Boyutu
    |--------------------------------------------------------------------------
    | Asenkron modda kaç log kaydı biriktiğinde toplu insert yapılacak.
    */
    'batch_size' => env('AUDIT_BATCH_SIZE', 50),

    /*
    |--------------------------------------------------------------------------
    | Saklama Süresi (Gün)
    |--------------------------------------------------------------------------
    | Activity loglarının kaç gün saklanacağı.
    | Bu süreden eski loglar cron job ile arşivlenir/silinir.
    */
    'retention_days' => env('AUDIT_RETENTION_DAYS', 365),

    /*
    |--------------------------------------------------------------------------
    | Arşivleme
    |--------------------------------------------------------------------------
    | Eski logların silinmeden önce arşivlenmesi.
    */
    'archive' => [
        'enabled'    => env('AUDIT_ARCHIVE_ENABLED', true),
        'disk'       => env('AUDIT_ARCHIVE_DISK', 'local'),          // storage disk
        'path'       => env('AUDIT_ARCHIVE_PATH', 'audit-archives'), // arşiv klasörü
        'format'     => 'json',                                       // json, csv
    ],

    /*
    |--------------------------------------------------------------------------
    | Hariç Tutulan Modeller
    |--------------------------------------------------------------------------
    | Bu listede belirtilen model sınıfları loglanmaz.
    */
    'excluded_models' => [
        \App\Models\Base\AuditLog::class,
        // Çok sık güncellenen performans-kritik modeller eklenebilir
    ],

    /*
    |--------------------------------------------------------------------------
    | Hariç Tutulan Alanlar
    |--------------------------------------------------------------------------
    | Tüm modeller için loglanmayacak hassas/gereksiz alan isimleri.
    */
    'excluded_fields' => [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'email_verified_at',
        'updated_at', // değişiklik olarak kaydedilmesi gereksiz
    ],

    /*
    |--------------------------------------------------------------------------
    | Sadece Değişenleri Kaydet
    |--------------------------------------------------------------------------
    | true  → Sadece değişen alanları old/new_values olarak kaydeder (kompakt)
    | false → Tüm model verilerini snapshot olarak kaydeder
    */
    'only_dirty' => env('AUDIT_ONLY_DIRTY', true),

    /*
    |--------------------------------------------------------------------------
    | Maksimum JSON Boyutu (byte)
    |--------------------------------------------------------------------------
    | old_values ve new_values JSON'larının maksimum boyutu.
    | Aşılırsa veri truncate edilir (çok büyük text alanları koruma).
    */
    'max_json_size' => env('AUDIT_MAX_JSON_SIZE', 65535), // 64KB

];
