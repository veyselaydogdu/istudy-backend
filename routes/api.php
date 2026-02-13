<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Tüm API route'ları burada tanımlanır.
| Prefix: /api (bootstrap/app.php'de tanımlı)
|
| Route Grupları:
| 1. Herkese Açık — Auth gerektirmez
| 2. Auth Gerekli — Token gerekir ama abonelik gerekmez
| 3. Abonelik Gerekli — Aktif paket gerekir
| 4. Admin Only — Super Admin gerekir
*/

// ═══════════════════════════════════════════════════════════
// 1️⃣ HERKESE AÇIK
// ═══════════════════════════════════════════════════════════
Route::get('/health', fn () => response()->json(['status' => 'ok', 'timestamp' => now()]));

// Auth endpoint'leri
Route::prefix('auth')->group(function () {
    Route::post('/register', [\App\Http\Controllers\Auth\AuthController::class, 'register']);
    Route::post('/login', [\App\Http\Controllers\Auth\AuthController::class, 'login']);
});

// Aktif paketleri listele (kayıt öncesi gösterilir)
Route::get('/packages', [\App\Http\Controllers\Tenant\PackageSelectionController::class, 'availablePackages']);

// ═══════════════════════════════════════════════════════════
// 2️⃣ AUTH GEREKLİ (Abonelik gerektirmez)
// ═══════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->group(function () {

    // Auth işlemleri
    Route::post('/auth/logout', [\App\Http\Controllers\Auth\AuthController::class, 'logout']);
    Route::get('/auth/me', [\App\Http\Controllers\Auth\AuthController::class, 'me']);

    // Paket seçimi ve abonelik yönetimi
    Route::prefix('tenant')->group(function () {
        Route::post('/subscribe', [\App\Http\Controllers\Tenant\PackageSelectionController::class, 'subscribe']);
        Route::get('/subscription', [\App\Http\Controllers\Tenant\PackageSelectionController::class, 'currentSubscription']);
        Route::get('/subscription/history', [\App\Http\Controllers\Tenant\PackageSelectionController::class, 'subscriptionHistory']);
        Route::get('/subscription/usage', [\App\Http\Controllers\Tenant\PackageSelectionController::class, 'usageReport']);
        Route::post('/subscription/cancel', [\App\Http\Controllers\Tenant\PackageSelectionController::class, 'cancelSubscription']);
    });

    // Tenant CRUD (abonelik gerekmez, tenant yönetimi için)
    Route::apiResource('tenants', \App\Http\Controllers\Tenant\TenantController::class)
        ->except(['store']);

    // ═══════════════════════════════════════════════════════
    // 3️⃣ ABONELİK GEREKLİ (Aktif paket zorunlu)
    // ═══════════════════════════════════════════════════════
    Route::middleware('subscription.active')->group(function () {

        // Aile abonelikleri (B2C)
        Route::apiResource('subscriptions', \App\Http\Controllers\Tenant\SubscriptionController::class);

        // Okul işlemleri
        Route::apiResource('schools', \App\Http\Controllers\Schools\SchoolController::class);

        // Okul altındaki kaynaklar (nested routes)
        Route::prefix('schools/{school_id}')->group(function () {
            Route::apiResource('classes', \App\Http\Controllers\Schools\ClassController::class);
            Route::apiResource('children', \App\Http\Controllers\Schools\ChildController::class);
            Route::apiResource('activities', \App\Http\Controllers\Schools\ActivityController::class);
            Route::apiResource('families', \App\Http\Controllers\Schools\FamilyProfileController::class);
        });
    });

    // ═══════════════════════════════════════════════════════
    // 4️⃣ ADMIN ONLY (Super Admin)
    // ═══════════════════════════════════════════════════════
    Route::prefix('admin')->group(function () {
        Route::apiResource('packages', \App\Http\Controllers\Admin\PackageController::class);
    });
});
