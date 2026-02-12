<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Tüm API route'ları burada tanımlanır.
| Prefix: /api (bootstrap/app.php'de tanımlı)
| Middleware: auth:sanctum
|
*/

// ─── Herkese Açık ──────────────────────────────────────────
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// ─── Auth Gerekli ──────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Aktif kullanıcı bilgisi
    Route::get('/user', fn () => request()->user());

    // ─── Tenant İşlemleri ──────────────────────────────────
    Route::apiResource('tenants', \App\Http\Controllers\Tenant\TenantController::class)
        ->except(['store']); // Tenant store Super Admin panel'den yapılır

    // ─── Abonelik İşlemleri ────────────────────────────────
    Route::apiResource('subscriptions', \App\Http\Controllers\Tenant\SubscriptionController::class);

    // ─── Okul İşlemleri ────────────────────────────────────
    Route::apiResource('schools', \App\Http\Controllers\Schools\SchoolController::class);

    // ─── Okul Altındaki Kaynaklar ──────────────────────────
    Route::prefix('schools/{school_id}')->group(function () {
        Route::apiResource('classes', \App\Http\Controllers\Schools\ClassController::class);
        Route::apiResource('children', \App\Http\Controllers\Schools\ChildController::class);
        Route::apiResource('activities', \App\Http\Controllers\Schools\ActivityController::class);
        Route::apiResource('families', \App\Http\Controllers\Schools\FamilyProfileController::class);
    });
});
