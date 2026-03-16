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

// Auth endpoint'leri (rate limiting: brute-force koruması)
Route::prefix('auth')->group(function () {
    Route::middleware('throttle:10,1')->post('/register', [\App\Http\Controllers\Auth\AuthController::class, 'register']);
    Route::middleware('throttle:5,1')->post('/login', [\App\Http\Controllers\Auth\AuthController::class, 'login']);
    Route::middleware('throttle:5,1')->post('/forgot-password', [\App\Http\Controllers\Auth\AuthController::class, 'forgotPassword']);
    Route::middleware('throttle:5,1')->post('/reset-password', [\App\Http\Controllers\Auth\AuthController::class, 'resetPassword']);
});

// Aktif paketleri listele (kayıt öncesi gösterilir)
Route::get('/packages', [\App\Http\Controllers\Tenant\PackageSelectionController::class, 'availablePackages']);

// İletişim formu (herkese açık, rate limiting ile korunur)
Route::middleware('throttle:10,1')->post('/contact', [\App\Http\Controllers\ContactRequestController::class, 'store']);

// Kayıt kodu ile okul ara (veli tarafı, auth gerekmez)
Route::post('/schools/search', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'searchSchool']);

// Davet linki bilgisi — token ile okul bilgisini döndür (auth gerekmez)
Route::get('/invite/{token}', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'inviteInfo']);

// Anonim veli kayıt talebi gönder (davet kodu veya link ile, auth gerekmez)
Route::middleware('throttle:10,1')->post('/schools/join', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'publicJoin']);

// ───────────────────────────────────────────────────
// SANAL POS CALLBACK (Auth gerektirmez — webhook endpoint'leri)
// ───────────────────────────────────────────────────
Route::prefix('payment')->group(function () {
    Route::post('/callback', [\App\Http\Controllers\Billing\InvoiceController::class, 'paymentCallback']);
    Route::post('/success', [\App\Http\Controllers\Billing\InvoiceController::class, 'paymentSuccess']);
    Route::post('/fail', [\App\Http\Controllers\Billing\InvoiceController::class, 'paymentFail']);
});

// ───────────────────────────────────────────────────
// PARA BİRİMİ & DÖVİZ KURLARI (Herkese açık)
// ───────────────────────────────────────────────────
Route::prefix('currencies')->group(function () {
    Route::get('/', [\App\Http\Controllers\Billing\CurrencyController::class, 'index']);
    Route::get('/rates', [\App\Http\Controllers\Billing\CurrencyController::class, 'rates']);
    Route::get('/convert', [\App\Http\Controllers\Billing\CurrencyController::class, 'convert']);
    Route::get('/history/{code}', [\App\Http\Controllers\Billing\CurrencyController::class, 'history']);
});

// ───────────────────────────────────────────────────
// ÜLKELER (Herkese açık — dropdown, telefon kodu seçimi)
// ───────────────────────────────────────────────────
Route::prefix('countries')->group(function () {
    Route::get('/', [\App\Http\Controllers\Schools\CountryController::class, 'index']);
    Route::get('/phone-codes', [\App\Http\Controllers\Schools\CountryController::class, 'phoneCodes']);
    Route::get('/regions', [\App\Http\Controllers\Schools\CountryController::class, 'regions']);
});

// ═══════════════════════════════════════════════════════════
// VELİ AUTH (Public — Mobil uygulama)
// ═══════════════════════════════════════════════════════════
Route::prefix('parent/auth')->group(function () {
    Route::middleware('throttle:10,1')->post('/register', [\App\Http\Controllers\Parents\ParentAuthController::class, 'register']);
    Route::middleware('throttle:5,1')->post('/login', [\App\Http\Controllers\Parents\ParentAuthController::class, 'login']);
    Route::post('/forgot-password', [\App\Http\Controllers\Parents\ParentAuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [\App\Http\Controllers\Parents\ParentAuthController::class, 'resetPassword']);
    Route::get('/verify-email/{id}/{hash}', [\App\Http\Controllers\Parents\ParentAuthController::class, 'verifyEmail'])->name('parent.verification.verify');
    Route::get('/countries', [\App\Http\Controllers\Parents\ParentReferenceController::class, 'countries']);
    Route::get('/blood-types', [\App\Http\Controllers\Parents\ParentReferenceController::class, 'bloodTypes']);
});

// ═══════════════════════════════════════════════════════════
// VELİ API (Auth gerekli — Mobil uygulama)
// ═══════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->prefix('parent')->group(function () {
    // Auth
    Route::post('/auth/logout', [\App\Http\Controllers\Parents\ParentAuthController::class, 'logout']);
    Route::get('/auth/me', [\App\Http\Controllers\Parents\ParentAuthController::class, 'me']);
    Route::post('/auth/resend-verification', [\App\Http\Controllers\Parents\ParentAuthController::class, 'resendVerification']);

    // Çocuklar
    Route::apiResource('children', \App\Http\Controllers\Parents\ParentChildController::class);
    Route::post('/children/{child}/allergens', [\App\Http\Controllers\Parents\ParentChildController::class, 'syncAllergens']);
    Route::post('/children/{child}/medications', [\App\Http\Controllers\Parents\ParentChildController::class, 'syncMedications']);
    Route::post('/children/{child}/conditions', [\App\Http\Controllers\Parents\ParentChildController::class, 'syncConditions']);

    // Aile üyeleri
    Route::get('/family/members', [\App\Http\Controllers\Parents\ParentFamilyController::class, 'members']);
    Route::post('/family/members', [\App\Http\Controllers\Parents\ParentFamilyController::class, 'addMember']);
    Route::delete('/family/members/{userId}', [\App\Http\Controllers\Parents\ParentFamilyController::class, 'removeMember']);

    // Acil durum kişileri
    Route::get('/family/emergency-contacts', [\App\Http\Controllers\Parents\ParentFamilyController::class, 'emergencyContacts']);
    Route::post('/family/emergency-contacts', [\App\Http\Controllers\Parents\ParentFamilyController::class, 'storeEmergencyContact']);
    Route::put('/family/emergency-contacts/{contact}', [\App\Http\Controllers\Parents\ParentFamilyController::class, 'updateEmergencyContact']);
    Route::delete('/family/emergency-contacts/{contact}', [\App\Http\Controllers\Parents\ParentFamilyController::class, 'destroyEmergencyContact']);

    // Okullar
    Route::get('/schools', [\App\Http\Controllers\Parents\ParentSchoolController::class, 'mySchools']);
    Route::post('/schools/join', [\App\Http\Controllers\Parents\ParentSchoolController::class, 'joinSchool']);
    Route::get('/my-enrollment-requests', [\App\Http\Controllers\Parents\ParentSchoolController::class, 'myEnrollmentRequests']);
    Route::get('/schools/{school}', [\App\Http\Controllers\Parents\ParentSchoolController::class, 'schoolDetail']);
    Route::get('/schools/{school}/feed', [\App\Http\Controllers\Parents\ParentSchoolController::class, 'socialFeed']);

    // Akış
    Route::get('/feed/global', [\App\Http\Controllers\Parents\ParentSchoolController::class, 'globalFeed']);
    Route::get('/feed/schools', [\App\Http\Controllers\Parents\ParentSchoolController::class, 'mySchoolsFeed']);

    // Referans veriler
    Route::get('/allergens', [\App\Http\Controllers\Parents\ParentReferenceController::class, 'allergens']);
    Route::get('/conditions', [\App\Http\Controllers\Parents\ParentReferenceController::class, 'conditions']);
    Route::get('/medications', [\App\Http\Controllers\Parents\ParentReferenceController::class, 'medications']);
    Route::get('/countries', [\App\Http\Controllers\Parents\ParentReferenceController::class, 'countries']);
    Route::get('/blood-types', [\App\Http\Controllers\Parents\ParentReferenceController::class, 'bloodTypes']);

    // Veli önerileri (özel sağlık girişleri)
    Route::post('/children/{child}/suggest-allergen', [\App\Http\Controllers\Parents\ParentChildController::class, 'suggestAllergen']);
    Route::post('/children/{child}/suggest-condition', [\App\Http\Controllers\Parents\ParentChildController::class, 'suggestCondition']);
    Route::post('/children/{child}/suggest-medication', [\App\Http\Controllers\Parents\ParentChildController::class, 'suggestMedication']);
});

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

    // ───────────────────────────────────────────────────────
    // VELİ TARAFI — Kayıt Talebi & Yetkili Alıcı
    // ───────────────────────────────────────────────────────
    Route::prefix('parent')->group(function () {
        // Okul kayıt talebi gönder
        Route::post('/enrollment-requests', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'store']);
        Route::get('/enrollment-requests', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'index']);

        // Yetkili alıcılar (çocuğu okuldan alacak kişiler)
        Route::apiResource('authorized-pickups', \App\Http\Controllers\Parents\AuthorizedPickupController::class);
    });

    // ───────────────────────────────────────────────────────
    // BİLDİRİM SİSTEMİ (Auth gerekli, abonelik gerekmez)
    // ───────────────────────────────────────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Schools\NotificationController::class, 'index']);
        Route::get('/unread', [\App\Http\Controllers\Schools\NotificationController::class, 'unread']);
        Route::get('/unread-count', [\App\Http\Controllers\Schools\NotificationController::class, 'unreadCount']);
        Route::patch('/{notification}/read', [\App\Http\Controllers\Schools\NotificationController::class, 'markAsRead']);
        Route::patch('/read-all', [\App\Http\Controllers\Schools\NotificationController::class, 'markAllAsRead']);
        Route::get('/preferences', [\App\Http\Controllers\Schools\NotificationController::class, 'preferences']);
        Route::put('/preferences', [\App\Http\Controllers\Schools\NotificationController::class, 'updatePreferences']);
    });

    // ───────────────────────────────────────────────────
    // EK İLETİŞİM NUMARALARI (WhatsApp, Telegram vb.)
    // ───────────────────────────────────────────────────
    Route::prefix('contact-numbers')->group(function () {
        Route::get('/', [\App\Http\Controllers\Auth\UserContactController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Auth\UserContactController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\Auth\UserContactController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Auth\UserContactController::class, 'destroy']);
        Route::get('/types', [\App\Http\Controllers\Auth\UserContactController::class, 'types']);
    });

    // ───────────────────────────────────────────────────
    // ÖĞRETMEN PROFİLİ — Kendi CV/Özgeçmiş Yönetimi
    // ───────────────────────────────────────────────────
    Route::prefix('teacher/profile')->group(function () {
        // Profil
        Route::get('/', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'myProfile']);
        Route::put('/', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'updateMyProfile']);

        // Eğitim Geçmişi
        Route::get('/educations', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'educations']);
        Route::post('/educations', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'storeEducation']);
        Route::put('/educations/{educationId}', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'updateEducation']);
        Route::delete('/educations/{educationId}', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'destroyEducation']);

        // Sertifikalar (onay gerektirir)
        Route::get('/certificates', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'certificates']);
        Route::post('/certificates', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'storeCertificate']);
        Route::put('/certificates/{certificateId}', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'updateCertificate']);
        Route::delete('/certificates/{certificateId}', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'destroyCertificate']);

        // Kurs & Seminer (onay gerektirir)
        Route::get('/courses', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'courses']);
        Route::post('/courses', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'storeCourse']);
        Route::put('/courses/{courseId}', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'updateCourse']);
        Route::delete('/courses/{courseId}', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'destroyCourse']);

        // Yetenekler
        Route::get('/skills', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'skills']);
        Route::post('/skills', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'storeSkill']);
        Route::put('/skills/{skillId}', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'updateSkill']);
        Route::delete('/skills/{skillId}', [\App\Http\Controllers\Teachers\TeacherProfileController::class, 'destroySkill']);
    });

    // ───────────────────────────────────────────────────
    // ÖĞRETMEN GÜNLÜK RAPORLAMA (Teacher Daily Report)
    // ───────────────────────────────────────────────────
    Route::prefix('teacher/daily-reports')->group(function () {
        Route::get('/', [\App\Http\Controllers\Teachers\TeacherDailyReportController::class, 'index']); // Liste
        Route::get('/{childId}/{date}', [\App\Http\Controllers\Teachers\TeacherDailyReportController::class, 'show']); // Tekil detay + şablon
        Route::post('/', [\App\Http\Controllers\Teachers\TeacherDailyReportController::class, 'store']); // Tekil Kayıt
        Route::post('/bulk', [\App\Http\Controllers\Teachers\TeacherDailyReportController::class, 'bulkStore']); // Toplu Kayıt
    });

    // ───────────────────────────────────────────────────
    // FATURA & ÖDEME SİSTEMİ
    // ───────────────────────────────────────────────────
    Route::prefix('invoices')->group(function () {
        Route::get('/', [\App\Http\Controllers\Billing\InvoiceController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Billing\InvoiceController::class, 'store']);
        Route::get('/tenant', [\App\Http\Controllers\Billing\InvoiceController::class, 'tenantInvoices']);
        Route::get('/{invoice}', [\App\Http\Controllers\Billing\InvoiceController::class, 'show']);
        Route::get('/{invoice}/transactions', [\App\Http\Controllers\Billing\InvoiceController::class, 'transactions']);
        Route::post('/{invoice}/pay', [\App\Http\Controllers\Billing\InvoiceController::class, 'initiatePayment']);
    });

    // ═══════════════════════════════════════════════════════
    // 3️⃣ ABONELİK GEREKLİ (Aktif paket zorunlu)
    // ═══════════════════════════════════════════════════════
    Route::middleware('subscription.active')->group(function () {

        // Aile abonelikleri (B2C)
        Route::apiResource('subscriptions', \App\Http\Controllers\Tenant\SubscriptionController::class);

        // Okul işlemleri
        Route::apiResource('schools', \App\Http\Controllers\Schools\SchoolController::class);
        Route::patch('schools/{school}/toggle-status', [\App\Http\Controllers\Schools\SchoolController::class, 'toggleStatus']);

        // ───────────────────────────────────────────────────
        // KAYIT TALEPLERİ (Genel — eski uyumluluk için pending)
        // ───────────────────────────────────────────────────
        Route::prefix('enrollment-requests')->group(function () {
            Route::get('/pending', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'pending']);
        });

        // ───────────────────────────────────────────────────
        // OKUL BAZLI ROLLER VE YETKİLENDİRME
        // ───────────────────────────────────────────────────
        Route::prefix('school-roles')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\SchoolRoleController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Schools\SchoolRoleController::class, 'store']);
            Route::get('/{schoolRole}', [\App\Http\Controllers\Schools\SchoolRoleController::class, 'show']);
            Route::put('/{schoolRole}', [\App\Http\Controllers\Schools\SchoolRoleController::class, 'update']);
            Route::delete('/{schoolRole}', [\App\Http\Controllers\Schools\SchoolRoleController::class, 'destroy']);
            Route::post('/assign', [\App\Http\Controllers\Schools\SchoolRoleController::class, 'assignRole']);
            Route::post('/remove', [\App\Http\Controllers\Schools\SchoolRoleController::class, 'removeRole']);
        });

        // ───────────────────────────────────────────────────
        // RAPOR ŞABLONLARI
        // ───────────────────────────────────────────────────
        Route::apiResource('report-templates', \App\Http\Controllers\Schools\ReportTemplateController::class);

        // ───────────────────────────────────────────────────
        // ÖDEV YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::apiResource('homework', \App\Http\Controllers\Schools\HomeworkController::class);
        Route::post('/homework/mark-completion', [\App\Http\Controllers\Schools\HomeworkController::class, 'markCompletion']);

        // ───────────────────────────────────────────────────
        // YEMEK MENÜ TAKVİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('meal-menus')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\MealMenuController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Schools\MealMenuController::class, 'store']);
            Route::post('/bulk', [\App\Http\Controllers\Schools\MealMenuController::class, 'bulkStore']);
            Route::delete('/{id}', [\App\Http\Controllers\Schools\MealMenuController::class, 'destroy']);
            Route::get('/daily', [\App\Http\Controllers\Schools\MealMenuController::class, 'daily']);
            Route::get('/weekly', [\App\Http\Controllers\Schools\MealMenuController::class, 'weekly']);
            Route::get('/monthly', [\App\Http\Controllers\Schools\MealMenuController::class, 'monthly']);
        });

        // ───────────────────────────────────────────────────
        // BİLDİRİM OLUŞTURMA (Okul yöneticisi/öğretmen tarafı)
        // ───────────────────────────────────────────────────
        Route::post('/notifications', [\App\Http\Controllers\Schools\NotificationController::class, 'store']);

        // ───────────────────────────────────────────────────
        // DUYURULAR
        // ───────────────────────────────────────────────────
        Route::apiResource('announcements', \App\Http\Controllers\Schools\AnnouncementController::class);

        // ───────────────────────────────────────────────────
        // EĞİTİM YILI YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('academic-years')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\AcademicYearController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Schools\AcademicYearController::class, 'store']);
            Route::get('/global-list', [\App\Http\Controllers\Schools\AcademicYearController::class, 'globalList']);
            Route::get('/current', [\App\Http\Controllers\Schools\AcademicYearController::class, 'current']);
            Route::get('/{academicYear}', [\App\Http\Controllers\Schools\AcademicYearController::class, 'show']);
            Route::put('/{academicYear}', [\App\Http\Controllers\Schools\AcademicYearController::class, 'update']);
            Route::delete('/{academicYear}', [\App\Http\Controllers\Schools\AcademicYearController::class, 'destroy']);
            Route::patch('/{academicYear}/set-current', [\App\Http\Controllers\Schools\AcademicYearController::class, 'setCurrent']);
            Route::patch('/{academicYear}/close', [\App\Http\Controllers\Schools\AcademicYearController::class, 'close']);
            Route::post('/transition', [\App\Http\Controllers\Schools\AcademicYearController::class, 'transition']);
            Route::post('/{academicYear}/classes', [\App\Http\Controllers\Schools\AcademicYearController::class, 'addClass']);
            Route::delete('/{academicYear}/classes/{classId}', [\App\Http\Controllers\Schools\AcademicYearController::class, 'removeClass']);
        });

        // Okul bazlı öğün türleri
        Route::prefix('schools/{school_id}/meal-types')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\SchoolMealTypeController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Schools\SchoolMealTypeController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Schools\SchoolMealTypeController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Schools\SchoolMealTypeController::class, 'destroy']);
        });

        // Okul altındaki kaynaklar (nested routes)
        Route::prefix('schools/{school_id}')->group(function () {
            Route::apiResource('classes', \App\Http\Controllers\Schools\ClassController::class);
            Route::patch('classes/{class}/toggle-status', [\App\Http\Controllers\Schools\ClassController::class, 'toggleStatus']);
            Route::apiResource('children', \App\Http\Controllers\Schools\ChildController::class);
            Route::apiResource('activities', \App\Http\Controllers\Schools\ActivityController::class);
            Route::apiResource('families', \App\Http\Controllers\Schools\FamilyProfileController::class);

            // ───────────────────────────────────────────────────
            // YOKLAMA YÖNETİMİ (Attendance)
            // ───────────────────────────────────────────────────
            Route::get('/attendances', [\App\Http\Controllers\Schools\AttendanceController::class, 'index']);
            Route::post('/attendances', [\App\Http\Controllers\Schools\AttendanceController::class, 'store']); // Toplu ve tekli kayıt

            // ───────────────────────────────────────────────────
            // SINIF YÖNETİMİ — Öğretmen Atama & İhtiyaç Listesi
            // ───────────────────────────────────────────────────
            Route::prefix('classes/{class_id}')->group(function () {
                // Öğretmen atama
                Route::get('/teachers', [\App\Http\Controllers\Schools\ClassManagementController::class, 'classTeachers']);
                Route::post('/teachers', [\App\Http\Controllers\Schools\ClassManagementController::class, 'assignTeacher']);
                Route::delete('/teachers/{teacher_profile_id}', [\App\Http\Controllers\Schools\ClassManagementController::class, 'removeTeacher']);

                // İhtiyaç listesi (supply list)
                Route::get('/supply-list', [\App\Http\Controllers\Schools\ClassManagementController::class, 'supplyList']);
                Route::post('/supply-list', [\App\Http\Controllers\Schools\ClassManagementController::class, 'addSupplyItem']);
                Route::put('/supply-list/{material_id}', [\App\Http\Controllers\Schools\ClassManagementController::class, 'updateSupplyItem']);
                Route::delete('/supply-list/{material_id}', [\App\Http\Controllers\Schools\ClassManagementController::class, 'deleteSupplyItem']);
            });

            // ───────────────────────────────────────────────────
            // VELİ YÖNETİMİ (Davet kodu + kayıt talepleri + veli listesi)
            // ───────────────────────────────────────────────────
            Route::get('/invite-info', [\App\Http\Controllers\Schools\SchoolParentController::class, 'inviteInfo']);
            Route::post('/invite/regenerate', [\App\Http\Controllers\Schools\SchoolParentController::class, 'regenerateInvite']);
            Route::get('/parents', [\App\Http\Controllers\Schools\SchoolParentController::class, 'index']);
            Route::prefix('enrollment-requests')->group(function () {
                Route::get('/', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'schoolIndex']);
                Route::patch('/{id}/approve', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'approve']);
                Route::patch('/{id}/reject', [\App\Http\Controllers\Schools\EnrollmentRequestController::class, 'reject']);
            });

            // Okuldaki öğretmenler (?detailed=1 ile zengin veri)
            Route::get('/teachers', [\App\Http\Controllers\Schools\ClassManagementController::class, 'schoolTeachers']);
            // Okula öğretmen ata / çıkar (school_teacher_assignments)
            Route::post('/teachers', [\App\Http\Controllers\Schools\ClassManagementController::class, 'assignTeacherToSchool']);
            Route::delete('/teachers/{teacher_profile_id}', [\App\Http\Controllers\Schools\ClassManagementController::class, 'removeTeacherFromSchool']);

            // ───────────────────────────────────────────────────
            // SOSYAL AĞ (Social Feed)
            // ───────────────────────────────────────────────────
            Route::prefix('social')->group(function () {
                Route::get('posts', [\App\Http\Controllers\Schools\SocialPostController::class, 'index']);
                Route::post('posts', [\App\Http\Controllers\Schools\SocialPostController::class, 'store']);
                Route::get('posts/{social_post}', [\App\Http\Controllers\Schools\SocialPostController::class, 'show']);
                Route::put('posts/{social_post}', [\App\Http\Controllers\Schools\SocialPostController::class, 'update']);
                Route::delete('posts/{social_post}', [\App\Http\Controllers\Schools\SocialPostController::class, 'destroy']);
                Route::post('posts/{social_post}/react', [\App\Http\Controllers\Schools\SocialPostController::class, 'react']);
                Route::get('posts/{social_post}/comments', [\App\Http\Controllers\Schools\SocialPostController::class, 'comments']);
                Route::post('posts/{social_post}/comments', [\App\Http\Controllers\Schools\SocialPostController::class, 'comment']);
                Route::delete('posts/{social_post}/comments/{comment}', [\App\Http\Controllers\Schools\SocialPostController::class, 'deleteComment']);
            });
        });

        // ───────────────────────────────────────────────────
        // ÖĞRETMEN GÖREV TÜRLERİ (Tenant düzeyinde)
        // ───────────────────────────────────────────────────
        Route::prefix('teacher-role-types')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\TeacherRoleTypeController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Schools\TeacherRoleTypeController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Schools\TeacherRoleTypeController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Schools\TeacherRoleTypeController::class, 'destroy']);
        });

        // ───────────────────────────────────────────────────
        // ÖĞRETMEN YÖNETİMİ (Tenant düzeyinde)
        // ───────────────────────────────────────────────────
        Route::prefix('teachers')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\TenantTeacherController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Schools\TenantTeacherController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Schools\TenantTeacherController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Schools\TenantTeacherController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Schools\TenantTeacherController::class, 'destroy']);

            // Okul atamaları
            Route::get('/{id}/schools', [\App\Http\Controllers\Schools\TenantTeacherController::class, 'schoolAssignments']);
            Route::post('/{id}/schools', [\App\Http\Controllers\Schools\TenantTeacherController::class, 'assignToSchool']);
            Route::delete('/{id}/schools/{schoolId}', [\App\Http\Controllers\Schools\TenantTeacherController::class, 'removeFromSchool']);
        });

        // ───────────────────────────────────────────────────
        // ALLERJEN YÖNETİMİ (Tenant tarafı)
        // ───────────────────────────────────────────────────
        Route::prefix('allergens')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\TenantAllergenController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Schools\TenantAllergenController::class, 'store']);
            Route::put('/{allergen_id}', [\App\Http\Controllers\Schools\TenantAllergenController::class, 'update']);
            Route::delete('/{allergen_id}', [\App\Http\Controllers\Schools\TenantAllergenController::class, 'destroy']);
        });

        // ───────────────────────────────────────────────────
        // TIBBİ DURUM YÖNETİMİ (Tenant tarafı)
        // ───────────────────────────────────────────────────
        Route::prefix('medical-conditions')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\TenantMedicalConditionController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Schools\TenantMedicalConditionController::class, 'store']);
            Route::put('/{condition_id}', [\App\Http\Controllers\Schools\TenantMedicalConditionController::class, 'update']);
            Route::delete('/{condition_id}', [\App\Http\Controllers\Schools\TenantMedicalConditionController::class, 'destroy']);
        });

        // Veli önerileri onay (tenant)
        Route::get('/health-suggestions', [\App\Http\Controllers\Schools\TenantHealthSuggestionController::class, 'index']);
        Route::post('/health-suggestions/approve', [\App\Http\Controllers\Schools\TenantHealthSuggestionController::class, 'approve']);
        Route::post('/health-suggestions/reject', [\App\Http\Controllers\Schools\TenantHealthSuggestionController::class, 'reject']);

        // ───────────────────────────────────────────────────
        // BESİN ÖĞELERİ & YEMEK YÖNETİMİ (Tenant tarafı)
        // ───────────────────────────────────────────────────
        Route::prefix('food-ingredients')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\TenantMealController::class, 'ingredientIndex']);
            Route::post('/', [\App\Http\Controllers\Schools\TenantMealController::class, 'ingredientStore']);
            Route::put('/{id}', [\App\Http\Controllers\Schools\TenantMealController::class, 'ingredientUpdate']);
            Route::delete('/{id}', [\App\Http\Controllers\Schools\TenantMealController::class, 'ingredientDestroy']);
        });

        Route::prefix('meals')->group(function () {
            Route::get('/', [\App\Http\Controllers\Schools\TenantMealController::class, 'mealIndex']);
            Route::post('/', [\App\Http\Controllers\Schools\TenantMealController::class, 'mealStore']);
            Route::put('/{id}', [\App\Http\Controllers\Schools\TenantMealController::class, 'mealUpdate']);
            Route::delete('/{id}', [\App\Http\Controllers\Schools\TenantMealController::class, 'mealDestroy']);
        });

        // ───────────────────────────────────────────────────
        // ÖĞRETMEN ONAY İŞLEMLERİ (Okul Admin)
        // ───────────────────────────────────────────────────
        Route::prefix('teacher-approvals')->group(function () {
            Route::get('/pending', [\App\Http\Controllers\Schools\TeacherApprovalController::class, 'pendingApprovals']);
            Route::patch('/certificates/{certificateId}/approve', [\App\Http\Controllers\Schools\TeacherApprovalController::class, 'approveCertificate']);
            Route::patch('/certificates/{certificateId}/reject', [\App\Http\Controllers\Schools\TeacherApprovalController::class, 'rejectCertificate']);
            Route::patch('/courses/{courseId}/approve', [\App\Http\Controllers\Schools\TeacherApprovalController::class, 'approveCourse']);
            Route::patch('/courses/{courseId}/reject', [\App\Http\Controllers\Schools\TeacherApprovalController::class, 'rejectCourse']);
            Route::post('/bulk-approve', [\App\Http\Controllers\Schools\TeacherApprovalController::class, 'bulkApprove']);
        });
    });

    // ═══════════════════════════════════════════════════════
    // 4️⃣ ADMIN ONLY (Super Admin)
    // ═══════════════════════════════════════════════════════
    Route::prefix('admin')->middleware('super.admin')->group(function () {

        // ───────────────────────────────────────────────────
        // DASHBOARD — Sistem İstatistikleri
        // ───────────────────────────────────────────────────
        Route::prefix('dashboard')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'stats']);
            Route::get('/revenue', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'revenue']);
            Route::get('/growth', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'growth']);
            Route::get('/top-schools', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'topSchools']);
            Route::get('/package-distribution', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'packageDistribution']);
            Route::get('/recent-activities', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'recentActivities']);
        });

        // ───────────────────────────────────────────────────
        // PAKET YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::apiResource('packages', \App\Http\Controllers\Admin\PackageController::class);
        Route::apiResource('package-features', \App\Http\Controllers\Admin\PackageFeatureController::class);

        // ───────────────────────────────────────────────────
        // KULLANICI YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('users')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminUserController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Admin\AdminUserController::class, 'store']);
            Route::get('/{user}', [\App\Http\Controllers\Admin\AdminUserController::class, 'show']);
            Route::put('/{user}', [\App\Http\Controllers\Admin\AdminUserController::class, 'update']);
            Route::delete('/{user}', [\App\Http\Controllers\Admin\AdminUserController::class, 'destroy']);
            Route::post('/{user}/assign-role', [\App\Http\Controllers\Admin\AdminUserController::class, 'assignRole']);
            Route::post('/{user}/remove-role', [\App\Http\Controllers\Admin\AdminUserController::class, 'removeRole']);
            Route::post('/{userId}/restore', [\App\Http\Controllers\Admin\AdminUserController::class, 'restore']);
        });

        // ───────────────────────────────────────────────────
        // TENANT YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('tenants')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminTenantController::class, 'index']);
            Route::get('/{tenant}', [\App\Http\Controllers\Admin\AdminTenantController::class, 'show']);
            Route::put('/{tenant}', [\App\Http\Controllers\Admin\AdminTenantController::class, 'update']);
            Route::delete('/{tenant}', [\App\Http\Controllers\Admin\AdminTenantController::class, 'destroy']);
            Route::get('/{tenant}/subscriptions', [\App\Http\Controllers\Admin\AdminTenantController::class, 'subscriptionHistory']);
            Route::get('/{tenant}/schools', [\App\Http\Controllers\Admin\AdminTenantController::class, 'schools']);
        });

        // ───────────────────────────────────────────────────
        // OKUL YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('schools')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminSchoolController::class, 'index']);
            Route::get('/{school}', [\App\Http\Controllers\Admin\AdminSchoolController::class, 'show']);
            Route::put('/{school}', [\App\Http\Controllers\Admin\AdminSchoolController::class, 'update']);
            Route::delete('/{school}', [\App\Http\Controllers\Admin\AdminSchoolController::class, 'destroy']);
            Route::patch('/{school}/toggle-status', [\App\Http\Controllers\Admin\AdminSchoolController::class, 'toggleStatus']);
            Route::get('/{school}/classes', [\App\Http\Controllers\Admin\AdminSchoolController::class, 'classes']);
            Route::get('/{school}/children', [\App\Http\Controllers\Admin\AdminSchoolController::class, 'children']);
        });

        // ───────────────────────────────────────────────────
        // ABONELİK YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('subscriptions')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Admin\AdminSubscriptionController::class, 'stats']);
            Route::get('/', [\App\Http\Controllers\Admin\AdminSubscriptionController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Admin\AdminSubscriptionController::class, 'store']);
            Route::get('/{subscription}', [\App\Http\Controllers\Admin\AdminSubscriptionController::class, 'show']);
            Route::patch('/{subscription}/status', [\App\Http\Controllers\Admin\AdminSubscriptionController::class, 'updateStatus']);
            Route::patch('/{subscription}/extend', [\App\Http\Controllers\Admin\AdminSubscriptionController::class, 'extend']);
        });

        // ───────────────────────────────────────────────────
        // SİSTEM YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('system')->group(function () {
            Route::get('/health', [\App\Http\Controllers\Admin\AdminSystemController::class, 'healthCheck']);
            Route::get('/settings', [\App\Http\Controllers\Admin\AdminSystemController::class, 'settings']);
            Route::get('/notifications', [\App\Http\Controllers\Admin\AdminSystemController::class, 'notifications']);
            Route::post('/notifications', [\App\Http\Controllers\Admin\AdminSystemController::class, 'sendSystemNotification']);
            Route::get('/announcements', [\App\Http\Controllers\Admin\AdminSystemController::class, 'announcements']);
            Route::get('/enrollments/pending', [\App\Http\Controllers\Admin\AdminSystemController::class, 'pendingEnrollments']);
            Route::get('/enrollments', [\App\Http\Controllers\Admin\AdminSystemController::class, 'allEnrollments']);
        });

        // ───────────────────────────────────────────────────
        // FATURA & TRANSACTION YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('transactions')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminTransactionController::class, 'index']);
            Route::get('/stats', [\App\Http\Controllers\Admin\AdminTransactionController::class, 'stats']);
            Route::get('/monthly', [\App\Http\Controllers\Admin\AdminTransactionController::class, 'monthlyStats']);
            Route::get('/school/{schoolId}', [\App\Http\Controllers\Admin\AdminTransactionController::class, 'schoolTransactions']);
            Route::get('/{id}', [\App\Http\Controllers\Admin\AdminTransactionController::class, 'show']);
        });

        Route::prefix('invoices')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminTransactionController::class, 'invoices']);
            Route::get('/stats', [\App\Http\Controllers\Admin\AdminTransactionController::class, 'invoiceStats']);
        });

        // ───────────────────────────────────────────────────
        // PARA BİRİMİ & DÖVİZ KURU YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('currencies')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'store']);
            Route::get('/stats', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'stats']);
            Route::get('/logs', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'logs']);
            Route::post('/fetch-rates', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'fetchRates']);
            Route::post('/rates', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'setRate']);
            Route::post('/rates/bulk', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'setBulkRates']);
            Route::get('/{currency}', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'show']);
            Route::put('/{currency}', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'update']);
            Route::delete('/{currency}', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'destroy']);
            Route::patch('/{currency}/toggle-status', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'toggleStatus']);
            Route::patch('/{currency}/set-base', [\App\Http\Controllers\Admin\AdminCurrencyController::class, 'setBase']);
        });

        // ───────────────────────────────────────────────────
        // ACTIVITY LOG & HİSTORY YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('activity-logs')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'index']);
            Route::get('/stats', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'stats']);
            Route::get('/daily-summary', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'dailySummary']);
            Route::get('/models', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'availableModels']);
            Route::post('/archive', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'archive']);
            Route::get('/user/{userId}', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'userActivity']);
            Route::get('/model/{modelType}/{modelId}', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'modelHistory']);
            Route::get('/version/{modelType}/{modelId}/{logId}', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'version']);
            Route::get('/{id}', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'show']);
        });

        // ───────────────────────────────────────────────────
        // ÜLKE YÖNETİMİ (RestCountries API Entegrasyonu)
        // ───────────────────────────────────────────────────
        Route::prefix('countries')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminCountryController::class, 'index']);
            Route::get('/stats', [\App\Http\Controllers\Admin\AdminCountryController::class, 'stats']);
            Route::get('/regions', [\App\Http\Controllers\Admin\AdminCountryController::class, 'regions']);
            Route::post('/sync', [\App\Http\Controllers\Admin\AdminCountryController::class, 'syncFromApi']);
            Route::post('/sync/{iso2}', [\App\Http\Controllers\Admin\AdminCountryController::class, 'syncCountry']);
            Route::get('/{id}', [\App\Http\Controllers\Admin\AdminCountryController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Admin\AdminCountryController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminCountryController::class, 'destroy']);
            Route::patch('/{id}/toggle-active', [\App\Http\Controllers\Admin\AdminCountryController::class, 'toggleActive']);
            Route::patch('/{id}/sort-order', [\App\Http\Controllers\Admin\AdminCountryController::class, 'updateSortOrder']);
        });

        // ───────────────────────────────────────────────────
        // SAĞLIK & BESLENME VERİ YÖNETİMİ (Global havuz)
        // ───────────────────────────────────────────────────
        Route::prefix('allergens')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'allergenIndex']);
            Route::post('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'allergenStore']);
            Route::put('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'allergenUpdate']);
            Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'allergenDestroy']);
        });

        Route::prefix('medical-conditions')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'conditionIndex']);
            Route::post('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'conditionStore']);
            Route::put('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'conditionUpdate']);
            Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'conditionDestroy']);
        });

        Route::prefix('food-ingredients')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'ingredientIndex']);
            Route::post('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'ingredientStore']);
            Route::put('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'ingredientUpdate']);
            Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'ingredientDestroy']);
        });

        Route::prefix('medications')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'medicationIndex']);
            Route::post('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'medicationStore']);
            Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'medicationDestroy']);
        });

        // ───────────────────────────────────────────────────
        // KAN GRUPLARI
        // ───────────────────────────────────────────────────
        Route::prefix('blood-types')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'bloodTypeIndex']);
            Route::post('/', [\App\Http\Controllers\Admin\AdminHealthController::class, 'bloodTypeStore']);
            Route::put('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'bloodTypeUpdate']);
            Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminHealthController::class, 'bloodTypeDestroy']);
        });

        // ───────────────────────────────────────────────────
        // VELİ ÖNERİLERİ (Global Onay)
        // ───────────────────────────────────────────────────
        Route::get('/health-suggestions', [\App\Http\Controllers\Admin\AdminHealthController::class, 'pendingSuggestions']);
        Route::post('/health-suggestions/approve', [\App\Http\Controllers\Admin\AdminHealthController::class, 'approveSuggestion']);
        Route::post('/health-suggestions/reject', [\App\Http\Controllers\Admin\AdminHealthController::class, 'rejectSuggestion']);

        // ───────────────────────────────────────────────────
        // İLETİŞİM TALEPLERİ YÖNETİMİ
        // ───────────────────────────────────────────────────
        Route::prefix('contact-requests')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Admin\AdminContactRequestController::class, 'stats']);
            Route::get('/', [\App\Http\Controllers\Admin\AdminContactRequestController::class, 'index']);
            Route::get('/{contactRequest}', [\App\Http\Controllers\Admin\AdminContactRequestController::class, 'show']);
            Route::patch('/{contactRequest}/status', [\App\Http\Controllers\Admin\AdminContactRequestController::class, 'updateStatus']);
            Route::delete('/{contactRequest}', [\App\Http\Controllers\Admin\AdminContactRequestController::class, 'destroy']);
        });

        // ───────────────────────────────────────────────────
        // ÇOCUK FİYATLANDIRMA AYARLARI (Platform geneli)
        // ───────────────────────────────────────────────────
        Route::prefix('pricing')->group(function () {
            Route::get('/', function () {
                return response()->json([
                    'success' => true,
                    'data' => \App\Models\Billing\ChildPricingSetting::platformLevel()->orderBy('child_order')->get(),
                ]);
            });
            Route::post('/', function (\Illuminate\Http\Request $request) {
                $request->validate([
                    'child_order' => 'required|integer|min:1',
                    'price' => 'required|numeric|min:0',
                    'discount_percentage' => 'nullable|numeric|min:0|max:100',
                ]);

                $setting = \App\Models\Billing\ChildPricingSetting::updateOrCreate(
                    ['school_id' => null, 'child_order' => $request->child_order],
                    [
                        'price' => $request->price,
                        'discount_percentage' => $request->discount_percentage ?? 0,
                        'is_active' => true,
                        'created_by' => auth()->id(),
                    ]
                );

                return response()->json(['success' => true, 'data' => $setting], 201);
            });
        });
    });
});
