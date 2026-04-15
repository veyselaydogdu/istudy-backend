# iStudy Backend — AI Hafıza Dosyası

> Son Güncelleme: 2026-04-30 | Laravel 12 / PHP 8.4 / MySQL 8 / Sanctum

---

## 1. Proje & Mimari

**Tip:** Multi-tenant SaaS anaokulu yönetimi. Katman: `Request → Route → Middleware → Controller → Service → Model → DB`

Tenant hiyerarşisi: `Super Admin → Tenant (Kurum) → School → Class → Child/Teacher/Family`

Rol hiyerarşisi: `super_admin > tenant_owner > school_admin > teacher > parent`

İki ayrı abonelik sistemi:
- **B2B** (Platform ↔ Tenant): `packages` + `tenant_subscriptions` + `tenant_payments`
- **B2C** (Okul ↔ Aile): `subscription_plans` + `family_subscriptions` + `payments`

---

## 2. Dizin Yapısı (Özet)

```
app/
  Http/
    Controllers/
      Auth/         AuthController
      Admin/        PackageController, AdminDashboardController, AdminHealthController
      Base/         BaseController
      Schools/      BaseSchoolController, SchoolController, ClassController,
                    ClassManagementController, ChildController, ActivityController,
                    TenantMealController, TenantAllergenController,
                    TenantTeacherController, TeacherRoleTypeController,
                    TenantActivityClassController, ActivityClassGalleryController,
                    FamilyProfileController
      Tenant/       BaseTenantController, TenantController, SubscriptionController
      Parents/      BaseParentController, ParentAuthController, ParentChildController,
                    ParentFamilyController, ParentSchoolController, ParentReferenceController,
                    ParentActivityClassController, ParentInvoiceController,
                    ParentActivityController, ParentMealMenuController, AuthorizedPickupController
      Teachers/     BaseTeacherController, TeacherAuthController, TeacherClassController,
                    TeacherChildController, TeacherMedicationController,
                    TeacherPickupController, TeacherAttendanceController, TeacherMealMenuController
    Middleware/     EnsureActiveSubscription, EnsureSuperAdmin, ForceJsonResponse
    Requests/       Auth/, Package/, Activity/, Teacher/, Child/, School/, SchoolClass/, Subscription/, Tenant/
    Resources/      PackageResource, TenantSubscriptionResource, UserResource, ActivityResource, vb.
  Models/
    Base/           BaseModel, Role, Permission, AuditLog, ActivityLog, Country, UserContactNumber, AppSetting
    Tenant/         Tenant
    ActivityClass/  ActivityClass, ActivityClassEnrollment, ActivityClassTeacher,
                    ActivityClassMaterial, ActivityClassGallery, ActivityClassInvoice
    Package/        Package, TenantSubscription, TenantPayment
    Billing/        Invoice, InvoiceItem, Transaction, Currency, ExchangeRate
    School/         School, TeacherProfile, TeacherEducation, TeacherCertificate, TeacherCourse, TeacherSkill
    Academic/       AcademicYear, SchoolClass, TeacherRoleType
    Child/          Child, FamilyProfile, FamilyMember, EmergencyContact
    Activity/       Activity, Event, Attendance, DailyChildReport, ReportTemplate, Material
    Health/         Allergen, MedicalCondition, Medication, FoodIngredient, Meal
  Services/         AuthService, SchoolService, ClassService, ChildService, TeacherProfileService,
                    MealMenuService, PackageService, TenantSubscriptionService, InvoiceService,
                    TransactionService, CurrencyService, ActivityLogService, CountryService
  Traits/           ChecksPackageLimits, Auditable
  Observers/        HistoryObserver
  Policies/         BasePolicy + 8 policy sınıfı
routes/
  api.php           4 katmanlı erişim
  console.php       currency:update-rates (09:00), audit:maintain (03:00), countries:sync
bootstrap/app.php   middleware alias + exception handler
```

---

## 3. Veritabanı Şeması (Tablo Listesi)

### Auth & Kullanıcı
`users`, `roles`, `permissions`, `role_user`, `permission_role`

### Kurum & Okul
`tenants`, `schools`, `academic_years`

### Öğretmen
`teacher_profiles` (tenant_id eklendi, school_id nullable), `school_teacher_assignments` (school_id, teacher_profile_id, employment_type, start_date, end_date, is_active, teacher_role_type_id), `teacher_role_types`, `teacher_educations`, `teacher_certificates`, `teacher_courses`, `teacher_skills`, `teacher_tenant_memberships` (status: pending/active/inactive/removed, invite_type: teacher_request/tenant_invite), `class_teacher_assignments`

### Akademik
`classes` (SchoolClass — PHP reserved keyword), `child_class_assignments`, `activity_class_assignments`

### Çocuk & Aile
`children` (school_id nullable, passport_number, nationality_country_id), `family_profiles` (tenant_id nullable!), `family_members`, `emergency_contacts`, `blood_types`, `authorized_pickups`, `school_child_enrollment_requests`

### Sağlık & Beslenme
`allergens` (tenant_id=NULL: global, tenant_id=X: kuruma özel), `medical_conditions`, `medications`, `food_ingredients`, `food_ingredient_allergens`, `meals`, `meal_menu_schedules`, `child_allergens`, `child_medications`, `child_conditions`

> Allergens + medical_conditions + medications tablolarında `status` (pending/approved) + `suggested_by_user_id` alanları var.

### Etkinlik & Takip
`activities` (capacity nullable, address nullable, start_date, end_date), `events`, `attendances`, `daily_child_reports`, `report_templates`, `report_template_inputs`, `report_input_values`, `materials` (supply list), `child_activity_enrollments`, `child_pickup_logs`, `child_medication_logs`

### Etkinlik Sınıfları
`activity_classes` (school_id nullable = tenant-wide), `activity_class_enrollments` (plain Model, NOT BaseModel), `activity_class_teachers`, `activity_class_materials`, `activity_class_gallery`, `activity_class_invoices`, `activity_class_school_class_assignments`

### Finans
`packages`, `package_features`, `package_feature_pivot`, `tenant_subscriptions`, `tenant_payments`, `invoices`, `invoice_items`, `transactions`, `subscription_plans`, `family_subscriptions`, `payments`, `revenue_shares`

### Para Birimi
`currencies`, `exchange_rates`, `exchange_rate_logs`

### Sistem
`countries` (phone_code "+90" formatında), `user_contact_numbers`, `activity_logs` (audit DB), `activity_log_summaries`, `app_settings`, `system_notifications`, `social_posts`, `social_post_media`, `social_post_reactions`, `social_post_comments`, `teacher_blog_posts`, `teacher_blog_likes`, `teacher_blog_comments`, `teacher_follows`

### Blog
`teacher_blog_posts`, `teacher_blog_likes`, `teacher_blog_comments` (self-FK reply/quote), `teacher_follows`

Her ana tabloda: `id, created_by, updated_by, created_at, updated_at, deleted_at` standart alanlar.

---

## 4. Temel Mimari Bileşenler

### BaseModel
- Tüm modellerin atası (User hariç — Authenticatable'dan türer)
- SoftDeletes, HasFactory, Auto created_by/updated_by
- **Tenant Global Scope**: `WHERE {table}.tenant_id = auth()->user()->tenant_id` — tabloda tenant_id varsa otomatik
- HistoryObserver: Her create/update/delete → `activity_logs` (audit DB) + `{table}_histories`
- Auditable trait: `$auditExclude`, `$auditInclude`, `$auditLabel` ile özelleştirilebilir

**KRITIK: User modeli BaseModel'den türemez** → tenant scope otomatik uygulanmaz.

**KRITIK: Veli kullanıcılar tenant_id=NULL** → FamilyProfile, Child health verileri yüklenirken `withoutGlobalScope('tenant')` ZORUNLU.

### BaseController response helper'ları
```php
protected function successResponse(mixed $data, ?string $message, int $code = 200): JsonResponse
protected function errorResponse(string $message, int $code = 400): JsonResponse
protected function paginatedResponse(mixed $collection): JsonResponse
// ResourceCollection direkt geçilir — ->resource KULLANMA
```

### Role-Specific Base Controller'lar
- `BaseSchoolController`: `validateSchoolAccess()` constructor'da çalışır, `$this->school` sağlar. Nested route: `show(int $school_id, Child $child)` — int $school_id ZORUNLU.
- `BaseTenantController`: `$this->tenant()` helper
- `BaseParentController`: `getFamilyProfile()` + `findOwnedChild(int $id)`
- `BaseTeacherController`: `$this->teacherProfile()` helper

### BasePolicy
`before()` hook → Super Admin tüm işlemlere otomatik izinli.

### HistoryObserver
İki katmanlı: 1) `activity_logs` (ayrı audit DB, denormalize user, old+new values) 2) `{table}_histories` (snapshot, geriye dönük uyumluluk).

---

## 5. Controller Kodlama Standartları

```php
class XxxController extends BaseSchoolController
{
    public function __construct(private XxxService $service) { parent::__construct(); }

    // READ → Transaction YOK
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Model::class);
            return $this->paginatedResponse(XxxResource::collection($this->service->getAll(request()->all())));
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // WRITE → DB::beginTransaction/commit/rollBack
    public function store(StoreXxxRequest $request): JsonResponse
    {
        // FormRequest validate() her zaman try-catch DIŞINDA (422 garantisi)
        try {
            DB::beginTransaction();
            $this->authorize('create', Model::class);
            $item = $this->service->create($request->validated() + ['created_by' => $this->user()->id]);
            DB::commit();
            return $this->successResponse(XxxResource::make($item), 'Kayıt oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
```

**Temel Kurallar:** Try-catch her method, write işlemlerinde transaction, `Log::error` catch'te, FormRequest try-catch DIŞINDA, `firstOrFail()` yerine `first() + null kontrolü` (404 garantisi), catch'te `$e->getMessage()` response'a yazma → generic mesaj.

---

## 6. Auth Sistemi

### Endpoint'ler
```
POST /api/auth/register    → User + Tenant oluşturur, tenant_owner rolü atar, token döner
POST /api/auth/login       → token döner
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/logout      (auth:sanctum)
GET  /api/auth/me          (auth:sanctum)
```

### Şifre Sıfırlama Akışı
- `tenant_id NULL` (veli): deep link `parentmobileapp://reset-password?token=...&email=...`
- `tenant_id NOT NULL` (tenant): web URL `{TENANT_FRONTEND_URL}/reset-password?...`
- `TENANT_FRONTEND_URL` env → `config/app.php tenant_frontend_url` (varsayılan: `http://localhost:3002`)

### Şifre Kuralları
`min:8 + regex:/[A-Z]/ + regex:/[0-9]/ + regex:/[^A-Za-z0-9]/`

---

## 7. API Route Yapısı

```
HERKESE AÇIK:
  GET  /api/health
  POST /api/auth/register|login|forgot-password|reset-password
  GET  /api/packages
  GET  /api/countries/phone-codes

AUTH GEREKLİ (token, abonelik gerekmez):
  POST /api/auth/logout
  GET  /api/auth/me
  POST /api/tenant/subscribe
  GET  /api/tenant/subscription|history|usage
  POST /api/tenant/subscription/cancel

ABONELİK GEREKLİ (middleware: subscription.active):
  apiResource: schools, schools/{id}/classes, schools/{id}/children
  GET/POST/DELETE: schools/{id}/classes/{classId}/teachers, supply-list
  GET/POST/PUT/DELETE: schools/{id}/teachers (?detailed=1)
  GET/POST/PUT/DELETE: teacher-role-types
  GET/POST/PUT/DELETE: teachers (tenant-level)
  GET/PATCH: schools/{id}/child-enrollment-requests (+ approve/reject)
  apiResource: schools/{id}/activities
  GET/POST/PUT/DELETE: academic-years (+ set-current, close)
  GET/POST/PUT/DELETE: meals, food-ingredients, allergens
  GET: meal-menus/monthly
  GET/POST: notifications (+ PATCH read/read-all)
  GET: invoices/tenant
  GET/POST/PUT/DELETE: activity-classes (+ enrollments/teachers/materials/gallery/invoices)
  GET/POST/PUT/DELETE: schools/{id}/activity-classes

VELİ MOBIL (prefix: /api/parent/, auth:sanctum):
  POST parent/auth/register|login|logout|forgot-password|reset-password
  GET  parent/auth/me
  CRUD parent/children (+ allergens/medications/conditions sync, profile-photo, photo, stats)
  CRUD parent/family/members, parent/family/emergency-contacts
  GET/POST parent/schools, POST parent/schools/join
  GET  parent/schools/{id}/feed, parent/feed/global
  GET  parent/activity-classes (+ enroll/unenroll/gallery/my-enrollments)
  GET  parent/activities (+ enroll/unenroll/gallery)
  GET  parent/meal-menus/children, parent/meal-menus
  GET  parent/invoices|invoices/stats|invoices/{id}
  GET  parent/allergens|conditions|medications|countries|blood-types
  POST parent/children/{id}/suggest-allergen|suggest-condition|suggest-medication

ÖĞRETMEN (prefix: /api/teacher/, auth:sanctum):
  POST teacher/auth/register|login|forgot-password|reset-password
  GET  teacher/auth/me, POST teacher/auth/logout
  GET  teacher/classes (+ {id} + {id}/students)
  GET  teacher/children/{id} (+ health, pickup, medications/today, medications/logs)
  POST teacher/medications/{childId}/mark-given
  GET  teacher/pickup/{childId}/authorized, POST teacher/pickup/{childId}/record
  POST teacher/attendance
  GET  teacher/meal-menu (+ allergen warnings)
  GET/PATCH/DELETE teacher/memberships (+ invitations, join, accept, reject)
  GET/POST/PUT/DELETE teacher/blogs (+ {id}/image signed)

ADMIN ONLY (super_admin):
  apiResource: admin/packages, admin/package-features
  GET/POST/PUT/DELETE admin/allergens|medical-conditions|food-ingredients|medications
  GET/PATCH admin/tenants|schools|users|subscriptions|invoices|transactions
  GET admin/dashboard/stats|recent-activities
  GET admin/activity-logs (+ stats, daily-summary, models, archive)
  GET/POST admin/currencies (+ fetch-rates, set-base, toggle-status)
  GET/POST admin/countries (+ sync, toggle-active)
  GET/POST admin/system/notifications
  GET/POST admin/health-suggestions
  GET/POST/PUT/DELETE admin/blood-types
```

---

## 8. Kritik Mimari Notlar

### 8.1 Nested Route Positional Arg (KRİTİK)
```php
// YANLIŞ — route schools/{school_id}/children/{child}:
public function show(Child $child): JsonResponse

// DOĞRU:
public function show(int $school_id, Child $child): JsonResponse
```
Tüm nested apiResource metodları için geçerli (show/update/destroy).

### 8.2 paginatedResponse Kullanımı
```php
// DOĞRU:
return $this->paginatedResponse(ChildResource::collection($paginator));

// YANLIŞ — ->resource raw paginator döndürür, resource dönüşümü kaybolur:
return $this->paginatedResponse(ChildResource::collection($paginator)->resource);

// getCollection map için:
$paginator->getCollection()->map(fn($item) => [...]);
$paginator->setCollection($result);
return $this->paginatedResponse(ChildResource::collection($paginator));
```

### 8.3 Veli Tenant Scope (KRİTİK)
Veli kullanıcılar `tenant_id=NULL` → FamilyProfile + health verileri yüklenirken `withoutGlobalScope('tenant')` ZORUNLU:
```php
->with(['familyProfile' => fn($q) => $q->withoutGlobalScope('tenant')->with('owner')])
'allergens' => fn($q) => $q->withoutGlobalScope('tenant'),
```

### 8.4 Laravel 12 Filesystem (KRİTİK)
- `Storage::disk('local')` = `storage/app/private/` — web'den erişilemez ✓
- `Storage::disk('private')` → **HATA** — bu isimde disk yok
- Private dosya: `Storage::disk('local')->response($path)` + signed route

**Signed URL Pattern — auth:sanctum + signed kombinasyonu:**
```php
$signedUrl = URL::temporarySignedRoute('route.name', now()->addHours(2), ['param' => $id]);
Route::middleware(['auth:sanctum', 'signed'])->group(function () {
    Route::get('/parent/children/{child}/photo', [ParentChildController::class, 'servePhoto'])
        ->name('parent.child.photo');
});
```

**BaseSchoolController extends eden controller'larda** serveLogo/serveImage gibi auth dışı metodlar OLAMAZ (constructor'da validateSchoolAccess → unauthenticated context'te 500). Ayrı `app/Http/Controllers/Media/` controller kullan.

### 8.5 BelongsToMany Pivot Accessor Bug
Constraint callback'li eager load'da `->pivot` çalışmaz:
```php
// YANLIŞ — pivot accessor çalışmayabilir:
->with(['teachers' => fn($q) => $q->where(...)->withPivot(...)])
$teacher->pivot->employment_type // Call to undefined relationship [pivot]

// DOĞRU — direkt DB::table:
$pivotMap = DB::table('school_teacher_assignments')
    ->where('school_id', $schoolId)->get()->keyBy('teacher_profile_id');
```

### 8.6 MySQL FK 64-Karakter Limiti
Uzun tablo adlarında explicit kısa FK ismi zorunlu:
```php
$table->foreign('activity_class_id', 'acsc_activity_class_fk')->...
```

### 8.7 Docker PHP Opcache
PHP kodu değiştikten sonra container yeniden başlat (opcache sıfırlanması için):
```bash
docker compose -f dockerfiles/docker-compose.yml restart app
```

### 8.8 Güvenlik Katmanları
- `$request->validate()` her zaman try-catch **DIŞINDA** → 422 garantisi
- `firstOrFail()` yerine `first() + null kontrolü` → 404 garantisi
- Catch bloğunda `$e->getMessage()` response'a YAZMA → generic mesaj
- Rate limiting: `throttle:5,1` login, `throttle:10,1` register
- ForceJsonResponse middleware: tüm /api/* rotalarında `Accept: application/json`
- Global Exception Handler: `bootstrap/app.php` — 401/422/404/HttpException/500

### 8.9 ActivityClass Mimarisi
- `activity_classes.school_id` nullable → null = tenant-wide
- `ActivityClassEnrollment` extends plain `Model` (NOT BaseModel) — parent users tenant_id=NULL
- Tenant endpoint: `subscription.active` altında
- Parent endpoint: `auth:sanctum` prefix=parent altında

### 8.10 TenantTeacherController
- `store()` → **405 döner** (Tenant doğrudan öğretmen ekleyemez)
- Sadece `invite()` (email ile davet) veya `approveJoinRequest()` kullanılabilir
- `index()`: `teacher_tenant_memberships` üzerinden sorgulanır (status: active/inactive)
- `activate/deactivate/removeMembership`: membership_id ile çalışır (teacher profile id değil)

### 8.11 Tek Sınıf Kuralı
Bir öğrenci yalnızca **tek** sınıfa kayıt olabilir. `ClassManagementController::assignChild` başka sınıf kontrolü yapar → 422 "X zaten Y sınıfına kayıtlı. Önce çıkarın."

### 8.12 validate() Pozisyonu
```php
// DOĞRU:
public function store(StoreRequest $request): JsonResponse  // FormRequest
{
    try {
        DB::beginTransaction();
        // ...
    } catch (\Throwable $e) { ... }
}

// validate() inline kullanıyorsan try-catch DIŞINA al:
$validated = $request->validate([...]); // TRY-CATCH ÖNCESI
try { ... }
```

---

## 9. B2B Paket Sistemi

| Paket | Okul | Sınıf/Okul | Öğrenci | Aylık ₺ |
|-------|------|------------|---------|---------|
| Başlangıç | 1 | 3 | 30 | 299 |
| Profesyonel | 3 | 10 | 200 | 799 |
| Kurumsal | ∞ | ∞ | ∞ | 1.999 |

Limitler: `packages.max_schools`, `max_classes_per_school`, `max_students` (0=sınırsız).
Kontrol: `ChecksPackageLimits` trait → `checkSchoolLimit($tenant)`, `checkClassLimit()`, `checkStudentLimit()`.
Middleware: `subscription.active` (alias) — Super Admin bypass var.

---

## 10. Ülkeler Sistemi

- `countries` tablosu: RestCountries API ile senkronize (250 ülke)
- `phone_code` DB'de `+90` formatında saklanır
- Frontend'de `+` prefix kaldırılmalı: `.replace(/^\+/, '')` → `90`
- `sort_order` ile öncelikli ülkeler (TR:100, US:95, GB:90...)

```bash
# Sync komutları:
docker compose -f dockerfiles/docker-compose.yml exec app php artisan countries:sync
```

Endpoint'ler:
- `GET /api/countries/phone-codes` (auth yok) → telefon kodu dropdown
- `GET /api/countries` (auth yok) → tüm aktif ülkeler
- `GET /api/parent/auth/countries` (auth yok) → mobil public
- `GET /api/parent/countries` (auth gerekli) → mobil auth

`CountryService::phoneCodeList()` → `Cache::remember('countries:phone_codes', 3600)` — 1 saat cache.

---

## 11. Activity Log Sistemi

- **Ayrı audit DB** (`istudy_audit`) — Docker'da ana DB kullanılır (`AUDIT_DB_CONNECTION=mysql`)
- `activity_logs` tablosu: user_id, user_name (denormalize), model_type, model_id, action, old_values, new_values, changed_fields, tenant_id, ip_address
- `HistoryObserver` her BaseModel'de otomatik çalışır
- Async desteği: `AUDIT_ASYNC=true` → queue üzerinden
- Cron: `audit:maintain` (03:00) — arşivleme + özet
- MongoDB geçişine hazır (FK yok, document-friendly)

---

## 12. Para Birimi Sistemi

- `currencies`: ISO 4217, is_base alanı (tek baz para birimi)
- `exchange_rates`: günlük kurlar, baz birime göre
- Cron: `currency:update-rates` (09:00)
- Admin API: `GET/POST/PUT/DELETE /api/admin/currencies` + `fetch-rates`, `set-base`, `toggle-status`

---

## 13. Öğretmen Çok-Tenant Mimarisi

- Öğretmenler bağımsız hesap oluşturur (`/api/teacher/auth/register`)
- `teacher_tenant_memberships`: bir öğretmen birden çok tenant'a üye olabilir
- `tenants.invite_code` (UUID): tenant'a katılmak için kullanılır
- Öğretmen sınıf erişim kontrolü: `whereHas('teachers', fn($q) => $q->where('teacher_profile_id', $profile->id))`
- Teslim fotoğrafı: `Storage::disk('local')` → `storage/app/private/pickups/{childId}/`

---

## 14. Geliştirme Komutları

```bash
# Docker
cd dockerfiles && docker compose up -d
docker compose -f dockerfiles/docker-compose.yml exec app php artisan migrate
docker compose -f dockerfiles/docker-compose.yml restart app   # PHP değişikliği sonrası
docker compose -f dockerfiles/docker-compose.yml exec app php artisan route:clear  # 404 ise

# Kod kalitesi
vendor/bin/pint --dirty    # Her PHP değişikliği sonrası

# Yerel
composer dev     # server + queue + logs
php artisan migrate
```

---

## 15. API Response Formatı

```json
// Tekil: { "success": true, "message": "...", "data": { ... } }
// Sayfalı: { "success": true, "data": [...], "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 73 } }
// Hata: { "success": false, "message": "...", "data": null }
```

---

## 16. Çocuk Okul Kayıt Talebi Sistemi

- Tablo: `school_child_enrollment_requests` — unique (school_id, child_id)
- Controller: `ChildEnrollmentRequestController` extends `BaseController` (BaseSchoolController DEĞİL)
- Parent: `POST /api/parent/schools/{school}/enroll-child`
- Tenant: `GET/PATCH /api/schools/{id}/child-enrollment-requests` (pending/approve/reject)
- Onay: `children.school_id = schoolId` set edilir
