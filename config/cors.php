<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CORS Ayarları
    |--------------------------------------------------------------------------
    | Frontend (Next.js) → Backend (Laravel API) isteklerine izin verir.
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // M-1: İzin verilen HTTP metodları — gerekli olanlarla sınırlı
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // M-1: Production domain'leri .env'den okunur; localhost sadece local/testing ortamında
    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_TENANT_URL'),
        env('FRONTEND_ADMIN_URL'),
        env('FRONTEND_WEBSITE_URL'),
        // Yerel geliştirme ortamında localhost'lara izin ver
        app()->isLocal() ? 'http://localhost:3000' : null,
        app()->isLocal() ? 'http://localhost:3001' : null,
        app()->isLocal() ? 'http://localhost:3002' : null,
        app()->isLocal() ? 'https://localhost' : null,
        app()->isLocal() ? 'http://localhost' : null,
    ])),

    'allowed_origins_patterns' => [],

    // M-1: Sadece gerekli başlıklar — hepsi değil
    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,
];
