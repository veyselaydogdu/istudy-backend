# iStudy — Birleşik Proje Hafıza Dosyası

> **Son Güncelleme:** 2026-02-27 — **TÜM TESTLER GEÇTİ: 136/136 ✅ — BUG-001→012 tamamı düzeltildi — Sosyal Ağ (SocialPost) özelliği eklendi**
> **Kapsam:** Tüm sistem — Laravel Backend + Frontend Admin + Frontend Tenant & Website
> **Amaç:** Projeye yeni dahil olan her AI agent, yazılım mühendisi, iş analisti ve proje mimarı bu tek dosyadan tüm sistemi baştan sona anlayabilmeli.

---

## İÇİNDEKİLER

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Teknoloji Yığını](#2-teknoloji-yığını)
3. [Altyapı ve Docker](#3-altyapı-ve-docker)
4. [Backend — Laravel API](#4-backend--laravel-api)
5. [Veritabanı Şeması](#5-veritabanı-şeması)
6. [API Route Yapısı](#6-api-route-yapısı)
7. [Temel Backend Bileşenler](#7-temel-backend-bileşenleri)
8. [Controller Kodlama Standartları](#8-controller-kodlama-standartları)
9. [Güvenlik Katmanları](#9-güvenlik-katmanları)
10. [B2B Paket Sistemi](#10-b2b-paket-sistemi)
11. [Activity Log Sistemi](#11-activity-log-sistemi)
12. [Para Birimi Sistemi](#12-para-birimi-sistemi)
13. [Test Suite](#13-test-suite)
14. [Frontend Admin Paneli](#14-frontend-admin-paneli)
15. [Frontend Tenant & Website](#15-frontend-tenant--website)
16. [Bilinen Hatalar (Bug Listesi)](#16-bilinen-hatalar-bug-listesi)
17. [Bekleyen Görevler](#17-bekleyen-görevler)
18. [Geliştirme Komutları](#18-geliştirme-komutları)
19. [Yeni Özellik Eklerken Kontrol Listesi](#19-yeni-özellik-eklerken-kontrol-listesi)

---

## 1. Proje Genel Bakış

**iStudy**, anaokulu ve kreşlerin yönetimi için tasarlanmış çok kiracılı (multi-tenant) SaaS platformudur.

```
┌──────────────────────────────────────────────────────────────┐
│                       iStudy SaaS                            │
├─────────────────────┬────────────────────────────────────────┤
│  SUPER ADMIN        │  TENANT (Kurum)                        │
│  Admin Paneli       │  → Tenant Dashboard + Public Website   │
│  /admin/*           │  → Okullar, Sınıflar, Çocuklar,       │
│  (port 3001)        │    Yemekler, Etkinlikler, Allerjenler  │
│                     │  (port 3002)                           │
└─────────────────────┴────────────────────────────────────────┘
              ↕ REST API (JSON)
┌─────────────────────────────────────────────────────────────┐
│              Laravel 12 Backend API (port 8000/443)         │
│              Multi-Tenant → Tenant İzolasyonu BaseModel     │
└─────────────────────────────────────────────────────────────┘
```

### Temel İş Kavramları

| Kavram | Açıklama |
|--------|----------|
| **Tenant** | Müşteri kurum (anaokulu/kreş zinciri). Birden fazla okul barındırabilir. |
| **School** | Okullar/Şubeler. Tenant'a bağlı. |
| **B2B** | Platform → Tenant arası paket satışı (Admin yönetir) |
| **B2C** | Okul → Aile arası abonelikler (Tenant yönetir) |
| **Package** | Tenant'ın satın aldığı plan (max_schools, max_students limitleri) |
| **AcademicYear** | Eğitim dönemi (2025-2026). Sınıf, etkinlik, yemek buna bağlı. |

### Rol Hiyerarşisi

| Rol | Açıklama | Erişim |
|-----|----------|--------|
| `super_admin` | Platform sahibi | Tüm veriler, tüm tenant'lar |
| `tenant_owner` | Kurum sahibi | Kendi tenant'ı |
| `school_admin` | Okul yöneticisi | Atandığı okul |
| `teacher` | Öğretmen | Kendi sınıfları |
| `parent` | Veli | Kendi çocukları |

---

## 2. Teknoloji Yığını

### Backend

| Bileşen | Teknoloji | Versiyon |
|---------|-----------|---------|
| Dil | PHP | 8.4 |
| Framework | Laravel | 12 |
| Auth | Laravel Sanctum | Token-based |
| DB | MySQL | 8.0 (Docker), üretimde MySQL/PostgreSQL |
| Audit DB | MySQL (ayrı `istudy_audit` veya Docker'da aynı DB) | — |
| Cache/Queue | Redis | 7 |
| Kod Formatlama | Laravel Pint | 1 |
| Test | PHPUnit | 11 |
| AI Asistan | Laravel Boost (MCP server) | 1 |

### Frontend Admin (port 3001)

| Bileşen | Teknoloji |
|---------|-----------|
| Framework | Next.js 16 (App Router) |
| Dil | TypeScript 5 |
| CSS | **Tailwind v3** (v4 DEĞİL) |
| UI Tema | **Vristo** (Redux tabanlı) |
| State | Redux Toolkit + react-redux |
| API | Axios (`admin_token`) |
| Form | React Hook Form + Zod v4 |
| Toast | Sonner |
| Dialog | SweetAlert2 + @headlessui/react |
| Grafik | ApexCharts (dynamic import, SSR-safe) |
| Token | `localStorage.admin_token` |

### Frontend Tenant & Website (port 3002)

| Bileşen | Teknoloji |
|---------|-----------|
| Framework | Next.js 16 (App Router) |
| Dil | TypeScript 5 |
| CSS | **Tailwind v3** (v4 DEĞİL) |
| UI Tema | **Vristo** (aynı Admin teması) |
| State | Redux Toolkit + react-redux |
| API | Axios (`tenant_token`) |
| Form | React Hook Form + Zod v4 |
| Toast | Sonner |
| Dialog | SweetAlert2 + @headlessui/react |
| Token | `localStorage.tenant_token` |

---

## 3. Altyapı ve Docker

### Servis Portları

| Servis | Host Port | URL | Notlar |
|--------|-----------|-----|--------|
| Laravel API (HTTPS) | 443 | https://localhost/api | Nginx reverse proxy |
| Laravel API (HTTP, yerel) | 8000 | http://localhost:8000/api | Geliştirmede |
| Frontend Admin | **3001** | http://localhost:3001 | `admin_token` |
| Frontend Tenant | **3002** | http://localhost:3002 | `tenant_token` |
| PHPMyAdmin | 8080 | http://localhost:8080 | |
| MySQL | 3306 (internal) | | |
| Redis | 6379 (internal) | | |

### Docker Yapısı

```
dockerfiles/
├── docker-compose.yml
├── php/Dockerfile          ← PHP 8.4-FPM + Redis + intl + opcache + GD
├── node/Dockerfile         ← Node 22 Alpine (Admin)
├── node/Dockerfile.tenant  ← Node 22 Alpine (Tenant)
├── nginx/conf.d/default.conf ← HTTP→HTTPS, gzip, güvenlik header'ları
└── ssl/                    ← Self-signed sertifika (prod: Let's Encrypt)
```

### Temel Docker Komutları

```bash
cd dockerfiles
docker compose up -d --build   # İlk kurulum
docker compose up -d           # Başlat
docker compose down            # Durdur
docker exec -it istudy-app php artisan migrate
docker logs istudy-app
```

### .env Kritik Değişkenler

```env
# Veritabanı
DB_CONNECTION=mysql
DB_HOST=db
DB_DATABASE=istudy

# Redis
REDIS_CLIENT=phpredis

# Audit Log (Docker: ana DB'yi kullan)
AUDIT_DB_CONNECTION=mysql  # Production'da: AUDIT_DB_DATABASE=istudy_audit

# Para birimi
CURRENCY_API_SOURCE=exchangerate-api
CURRENCY_BASE=USD
```

### Bileşenler Arası İlişki

```
[Frontend Admin: 3001] ──── POST/GET ──→ [Laravel API: 443/8000]
[Frontend Tenant: 3002] ─── POST/GET ──→ [Laravel API: 443/8000]
[Laravel API] ─────────────────────────→ [MySQL: 3306]
[Laravel API] ─────────────────────────→ [Redis: 6379] (cache + queue)
[Laravel API] ─── Audit Connection ────→ [MySQL: istudy_audit veya istudy]
```

---

## 4. Backend — Laravel API

### Proje Yolu

```
/Users/veysel.aydogdu/Desktop/WebProjects/iStudy/istudy-backend/
```

### Dizin Yapısı (Kritik Dosyalar)

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Base/BaseController.php       ← successResponse(), errorResponse(), paginatedResponse()
│   │   ├── Auth/AuthController.php       ← Register, Login, Logout, Me
│   │   ├── Admin/                        ← Super Admin: packages, health, tenants, activity-logs
│   │   ├── Schools/
│   │   │   ├── BaseSchoolController.php  ← school_id doğrulama (⚠️ BUG-010: User::schools() eksik)
│   │   │   ├── SchoolController.php      ← CRUD + ChecksPackageLimits trait
│   │   │   ├── ClassController.php
│   │   │   ├── ClassManagementController.php ← Öğretmen-sınıf atama + supply list
│   │   │   ├── ActivityController.php    ← start/end date + class_ids sync
│   │   │   ├── AcademicYearController.php← CRUD + set-current + close + transition
│   │   │   ├── TenantMealController.php  ← Yemek + besin öğesi + allerjen sync
│   │   │   ├── TenantAllergenController.php ← Tenant allerjen CRUD
│   │   │   └── SocialPostController.php  ← Sosyal feed CRUD + react + comment (BaseController'dan türer)
│   │   ├── Tenant/ ... Parents/ ... Teachers/
│   │   └── Admin/AdminHealthController.php ← /admin/allergens, /admin/food-ingredients vb.
│   ├── Middleware/
│   │   ├── EnsureActiveSubscription.php  ← subscription.active alias, super admin bypass
│   │   ├── EnsureSuperAdmin.php          ← super.admin alias
│   │   └── ForceJsonResponse.php         ← Tüm /api/* → Accept: application/json
│   ├── Requests/                         ← StoreXxxRequest / UpdateXxxRequest
│   └── Resources/                        ← XxxResource (Eloquent API Resources)
├── Models/
│   ├── Base/BaseModel.php                ← SoftDeletes + TenantScope + HistoryObserver
│   ├── User.php                          ← Authenticatable (BaseModel'den TÜREMEZ)
│   ├── Tenant/Tenant.php                 ← canCreateSchool(), canCreateClass(), canEnrollStudent()
│   ├── Package/Package.php, TenantSubscription.php, TenantPayment.php
│   ├── School/School.php, TeacherProfile.php + CV modelleri
│   ├── Academic/AcademicYear.php, SchoolClass.php
│   ├── Activity/Activity.php, Material.php, DailyChildReport.php, Attendance.php
│   ├── Health/Allergen.php, FoodIngredient.php, Meal.php
│   ├── Child/Child.php, FamilyProfile.php
│   ├── Billing/Invoice.php, Transaction.php, Currency.php, ExchangeRate.php
│   └── Social/                           ← Sosyal Ağ modelleri
│       ├── SocialPost.php                ← scopeForSchool() + scopeVisibleTo(User)
│       ├── SocialPostMedia.php           ← image/video/file, disk+path, sort_order
│       ├── SocialPostReaction.php        ← like/heart/clap, unique(post_id,user_id)
│       └── SocialPostComment.php         ← parent_id ile iç içe yanıt desteği
├── Services/                             ← BaseService + 15 somut service (SocialPostService dahil)
├── Policies/                             ← BasePolicy (super_admin bypass) + 9 policy (SocialPostPolicy dahil)
├── Observers/HistoryObserver.php         ← İki katmanlı audit log
├── Jobs/WriteActivityLog.php             ← Asenkron log yazma
└── Traits/
    ├── ChecksPackageLimits.php           ← Okul/sınıf/öğrenci limit kontrolü
    └── Auditable.php                     ← Model bazlı audit özelleştirme
bootstrap/
└── app.php                               ← Middleware alias + Global Exception Handler (401/422/404/500)
routes/api.php                            ← 4 katmanlı erişim
tests/
├── TestCase.php                          ← PHP 8.4+SQLite fix (TestSQLiteConnection)
├── Database/TestSQLiteConnection.php     ← SQLite transaction fix
├── Traits/ApiTestHelpers.php             ← createAuthenticatedTenant(), createSchool(), createMeal() vb.
└── Feature/API/                          ← Feature testleri
```

---

## 5. Veritabanı Şeması

### Temel Tablolar

#### Auth & Kullanıcı
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `users` | `User` | Tüm kullanıcılar. Authenticatable'dan türer, BaseModel'den değil. |
| `roles` | `Role` | 5 rol: super_admin, tenant_owner, school_admin, teacher, parent |
| `permissions` | `Permission` | İzinler |
| `role_user` | Pivot | Kullanıcı-Rol (M2M) |

#### Kurum
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `tenants` | `Tenant` | Kiracı kurumlar. `owner_user_id` FK. |
| `schools` | `School` | Okullar. `tenant_id`, `country_id?`, city, fax, gsm, whatsapp, description, website, registration_code |
| `academic_years` | `AcademicYear` | Eğitim dönemleri. `is_current` flag. |

#### Akademik
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `classes` | `SchoolClass` | **Model adı SchoolClass** (PHP'de Class reserved). Alanlar: `school_id, academic_year_id, name, description, age_min (tinyInt), age_max (tinyInt), color, logo, capacity` |
| `child_class_assignments` | Pivot | Çocuk-Sınıf (M2M, cascadeOnDelete) |
| `class_teacher_assignments` | Pivot | Öğretmen-Sınıf (M2M) |
| `activity_class_assignments` | Pivot | Etkinlik-Sınıf (M2M) — `activity_id, class_id` |

#### Aktivite & Takip
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `activities` | `Activity` | `school_id, academic_year_id, name, description, is_paid, price, start_date (date nullable), end_date (date nullable)` |
| `attendances` | `Attendance` | Yoklama (present/absent/late/excused) |
| `daily_child_reports` | `DailyChildReport` | Günlük çocuk raporu |
| `materials` | `Material` | İhtiyaç listesi — `school_id, class_id, academic_year_id (NOT NULL), name, description, quantity, due_date` |

#### Sosyal Ağ
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `social_posts` | `SocialPost` | `tenant_id, school_id, author_id, visibility(school\|class), content, is_pinned, published_at` |
| `social_post_media` | `SocialPostMedia` | `post_id, type(image\|video\|file), disk, path(500), thumbnail_path, original_name, file_size, mime_type, sort_order` |
| `social_post_class_tags` | Pivot | `post_id, class_id` — hangi sınıfların göreceğini tanımlar |
| `social_post_reactions` | `SocialPostReaction` | `post_id, user_id, type(like\|heart\|clap)` — unique(post_id,user_id) |
| `social_post_comments` | `SocialPostComment` | `post_id, user_id, parent_id(nullable), content` — SoftDeletes |

#### Sağlık & Beslenme
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `allergens` | `Allergen` | `tenant_id=NULL` → Global (admin); `tenant_id=X` → Kuruma özel |
| `food_ingredients` | `FoodIngredient` | `allergens()` ilişkisinde `withoutGlobalScopes()` zorunlu (global allerjenler scope ile filtrelenir) |
| `meals` | `Meal` | `school_id, academic_year_id (NOT NULL), name, meal_type` |
| `food_ingredient_allergens` | Pivot | Besin-Allerjen (M2M) |
| `meal_ingredient_pivot` | Pivot | Yemek-Besin (M2M) |

#### Finans (B2B)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `packages` | `Package` | max_schools, max_classes_per_school, max_students, monthly_price, yearly_price |
| `package_features` | `PackageFeature` | key, label, value_type('bool'\|'text'), display_order |
| `package_feature_pivot` | Pivot | package_id, package_feature_id, value |
| `tenant_subscriptions` | `TenantSubscription` | status: active/cancelled/expired |
| `tenant_payments` | `TenantPayment` | Ödeme kayıtları |

#### Finans (B2C)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `subscription_plans` | `SubscriptionPlan` | Okul-Aile abonelik planları |
| `family_subscriptions` | `FamilySubscription` | Aile abonelikleri |
| `payments` | `Payment` | Stripe/iyzico ödemeleri |
| `invoices` | `Invoice` | B2B/B2C faturalar |
| `invoice_items` | `InvoiceItem` | Fatura kalemleri |
| `transactions` | `Transaction` | Sanal POS işlemleri |

#### Para Birimi
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `currencies` | `Currency` | ISO 4217, is_base, sembol, format |
| `exchange_rates` | `ExchangeRate` | Günlük kurlar |
| `exchange_rate_logs` | `ExchangeRateLog` | API güncelleme logları |

#### Audit Log (Ayrı DB)
| Tablo | Veritabanı | Açıklama |
|-------|------------|----------|
| `activity_logs` | AUDIT DB | Merkezi CRUD log — old/new values, changed_fields, denormalize user |
| `activity_logs_archive` | AUDIT DB | Eski logların arşivi |
| `activity_log_summaries` | AUDIT DB | Günlük özet (dashboard performansı) |

#### History Tabloları (Geriye Dönük Uyumluluk)
Her ana tablo için `{tablo_adı}_histories` mevcuttur. `snapshot` (JSON) kaydeder.

### FK Stratejisi

| Durum | Strateji |
|-------|----------|
| Soft-delete'li tablo FK | `->restrictOnDelete()` — hard delete engellenir |
| Pivot/junction tablo FK | `->cascadeOnDelete()` — pivot silinince cascade |
| Opsiyonel FK | `->nullOnDelete()` |

### Standart Alanlar (Her Ana Tabloda)

```sql
id bigint PK, created_by FK→users, updated_by FK→users nullable,
created_at, updated_at, deleted_at (SoftDeletes)
```

### İlişki Haritası (ER Özet)

```
Tenant ──hasMany──> School ──hasMany──> AcademicYear ──hasMany──> SchoolClass
                                                      ──hasMany──> Activity
                                                      ──hasMany──> Meal
                          ──hasMany──> TeacherProfile
                          ──hasMany──> Child

SchoolClass ──M2M──> Child (child_class_assignments)
SchoolClass ──M2M──> TeacherProfile (class_teacher_assignments)
SchoolClass ──M2M──> Activity (activity_class_assignments)

FoodIngredient ──M2M──> Allergen (food_ingredient_allergens)
Meal ──M2M──> FoodIngredient (meal_ingredient_pivot)

SocialPost ──belongsTo──> School, User(author)
SocialPost ──hasMany────> SocialPostMedia, SocialPostReaction, SocialPostComment
SocialPost ──M2M────────> SchoolClass (social_post_class_tags)
SocialPostComment ──hasMany──> SocialPostComment (replies, parent_id)

Package ──hasMany──> TenantSubscription ──belongsTo──> Tenant
```

---

## 6. API Route Yapısı

```
1️⃣  HERKESE AÇIK
    GET  /api/health
    POST /api/auth/register
    POST /api/auth/login
    GET  /api/packages

2️⃣  AUTH GEREKLİ (token, abonelik gerekmez)
    POST /api/auth/logout
    GET  /api/auth/me
    POST /api/tenant/subscribe
    GET  /api/tenant/subscription
    GET  /api/tenant/subscription/usage
    GET  /api/tenant/subscription/history
    POST /api/tenant/subscription/cancel

3️⃣  ABONELİK GEREKLİ (middleware: subscription.active)
    apiResource: schools
    schools/{id}/classes (CRUD)
    schools/{id}/classes/{classId}/teachers (GET/POST/DELETE)
    schools/{id}/classes/{classId}/supply-list (CRUD)
    schools/{id}/activities (CRUD)
    schools/{id}/children (CRUD)
    schools/{id}/families (CRUD)
    schools/{id}/teachers (GET)
    academic-years (GET/POST/PUT/DELETE + PATCH set-current + PATCH close + POST transition)
    food-ingredients (GET/POST/PUT/DELETE)
    meals (GET/POST/PUT/DELETE)
    allergens (GET/POST/PUT/DELETE — tenant allerjen yönetimi)
    schools/{id}/social/posts (GET/POST)
    schools/{id}/social/posts/{post} (GET/PUT/DELETE)
    schools/{id}/social/posts/{post}/react (POST — like/heart/clap toggle)
    schools/{id}/social/posts/{post}/comments (GET/POST)
    schools/{id}/social/posts/{post}/comments/{comment} (DELETE)
    meal-menus/monthly (GET)
    notifications (GET/POST/PATCH read/PATCH read-all)
    invoices/tenant (GET)

4️⃣  ADMIN ONLY (middleware: super.admin)
    admin/packages (CRUD)
    admin/package-features (CRUD)
    admin/tenants (CRUD)
    admin/schools (CRUD)
    admin/users (CRUD)
    admin/subscriptions (GET/PATCH)
    admin/allergens (CRUD)
    admin/food-ingredients (CRUD)
    admin/medical-conditions (CRUD)
    admin/medications (CRUD)
    admin/invoices (GET)
    admin/transactions (GET/stats)
    admin/currencies (CRUD + fetch-rates + set-base + toggle-status)
    admin/countries (GET + sync + toggle-active)
    admin/activity-logs (GET + stats + archive + vb.)
    admin/system/notifications (GET/POST)
```

---

## 7. Temel Backend Bileşenleri

### BaseModel (`app/Models/Base/BaseModel.php`)

Tüm modellerin atası. Sağladıkları:

| Özellik | Açıklama |
|---------|----------|
| **SoftDeletes** | `deleted_at` ile geri dönüşlü silme |
| **Tenant Global Scope** | Login kullanıcının `tenant_id`'sine göre otomatik filtreleme. Super Admin bypass. |
| **Auto created_by / updated_by** | creating/updating event'lerinde otomatik doldurulur |
| **HistoryObserver** | create/update/delete'te activity_logs + {tablo}_histories kaydeder |
| **Auditable trait** | `$auditExclude`, `$auditInclude`, `$auditLabel` ile özelleştirme |

> ⚠️ **KRİTİK:** `User` modeli `BaseModel`'den türemez (Authenticatable'dan türer). User için tenant scope ve history yoktur.

### BaseController (`app/Http/Controllers/Base/BaseController.php`)

```php
protected function user(): ?User  // Nullable — kimliksiz isteklerde TypeError olmaz

// Başarılı: { success: true, message: "...", data: {...} }
protected function successResponse(mixed $data, ?string $message, int $code = 200): JsonResponse

// Hatalı: { success: false, message: "...", data: null }
protected function errorResponse(string $message, int $code = 400): JsonResponse

// Sayfalı: { success: true, data: [...], meta: {current_page, last_page, per_page, total} }
// ResourceCollection veya plain Paginator alır. ->resource kullanma!
protected function paginatedResponse(mixed $collection): JsonResponse
```

> ⚠️ **paginatedResponse:** `Resource::collection($paginator)` direkt geçilir. `.resource` yazılırsa resource dönüşümü kaybolur.

### BaseSchoolController

`validateSchoolAccess()` → `$user->schools()->where(...)` çağırır.
⚠️ **BUG-010 (DÜZELTİLDİ):** `User::schools()` `hasManyThrough` olarak eklendi.

### SocialPostController

**BaseController'dan türer** (BaseSchoolController'dan değil) — ebeveynleri de desteklemek için kendi `validateSchoolAccess(int $schoolId)` metodunu içerir:
- `parent` rolü → `familyProfiles → children → school_id` kontrolü
- Diğer roller → `User::schools()` hasManyThrough kontrolü

Policy: `SocialPostPolicy` (create → school_admin/teacher; update/delete → author veya admin)

### BasePolicy

`before()` hook'u ile Super Admin tüm işlemlere otomatik izinlidir.

### API Response Formatı

```json
// Tekil
{ "success": true, "message": "...", "data": { ... } }

// Sayfalı
{ "success": true, "message": "...", "data": [...], "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 73 } }

// Hata
{ "success": false, "message": "...", "data": null }
```

Frontend erişim: `res.data.data` → veri, `res.data.meta` → pagination, `res.data.data.token` → auth token.

### HistoryObserver — İki Katmanlı Audit

```
BaseModel → HistoryObserver
  ├── 1. activity_logs (AUDIT DB) — old_values + new_values + changed_fields
  └── 2. {tablo}_histories (ANA DB) — snapshot (geriye dönük uyumluluk)
```

### Naming Conventions

| Konu | Kural | Örnek |
|------|-------|-------|
| Model | PascalCase, tekil | `SchoolClass`, `Package` |
| Tablo | snake_case, çoğul | `packages`, `tenant_subscriptions` |
| Controller | PascalCase + Controller | `PackageController` |
| FormRequest | Store/Update + Model + Request | `StorePackageRequest` |
| Service | Model + Service | `PackageService` |
| Policy | Model + Policy | `PackagePolicy` |
| Resource | Model + Resource | `PackageResource` |

---

## 8. Controller Kodlama Standartları

### Temel Kurallar

1. **`validate()` try-catch DIŞINDA olmalı** → 422 garantisi
2. **`firstOrFail()` yerine `first()` + null kontrolü** → 404 garantisi
3. **Catch bloğunda `$e->getMessage()` response'a yazılmamalı** → generic mesaj
4. **Write işlemleri:** `DB::beginTransaction()` + `DB::commit()` / `DB::rollBack()`
5. **Read işlemleri:** Transaction kullanılmaz
6. **Early return varsa** `DB::rollBack()` çağırılmalı (transaction leak!)

```php
// Doğru pattern:
public function store(StoreXxxRequest $request): JsonResponse
{
    // validate() FormRequest'te — buraya gelmez
    DB::beginTransaction();
    try {
        $data = $request->validated();
        $data['created_by'] = $this->user()->id;
        $item = $this->service->create($data);
        DB::commit();
        return $this->successResponse(XxxResource::make($item), 'Kayıt oluşturuldu.', 201);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
        DB::rollBack();
        return $this->errorResponse('Kayıt bulunamadı.', 404);
    } catch (\Throwable $e) {
        DB::rollBack();
        Log::error('XxxController::store Error: ' . $e->getMessage());
        return $this->errorResponse('İşlem sırasında bir hata oluştu.', 500);
    }
}
```

---

## 9. Güvenlik Katmanları

| Katman | Çözüm | Dosya |
|--------|-------|-------|
| Stack trace | `APP_DEBUG=false` | `.env` |
| Global Exception Handler | Auth→401, Validation→422, ModelNotFound/NotFound→404, Generic→500 | `bootstrap/app.php` |
| XSS | `regex:/^[^<>&"\']*$/` health alanları | `AdminHealthController.php` |
| Rate Limiting | `throttle:5,1` login, `throttle:10,1` register | `routes/api.php` |
| Force JSON | `ForceJsonResponse` middleware | Tüm `/api/*` |
| Tenant İzolasyonu | `BaseModel` global scope | Tüm modeller |
| Super Admin Bypass | `isSuperAdmin()` | `EnsureActiveSubscription.php` |
| Nginx | X-Frame-Options, HSTS, X-XSS-Protection | `nginx/conf.d/default.conf` |

---

## 10. B2B Paket Sistemi

### Paketler

| Paket | Okul Limiti | Sınıf/Okul | Öğrenci | Aylık ₺ | Yıllık ₺ |
|-------|------------|------------|---------|---------|----------|
| Başlangıç | 1 | 3 | 30 | 299 | 2.990 |
| Profesyonel | 3 | 10 | 200 | 799 | 7.990 |
| Kurumsal | ∞ | ∞ | ∞ | 1.999 | 19.990 |

`0` = sınırsız. Limitler `packages` tablosunda `max_schools`, `max_classes_per_school`, `max_students`.

### Limit Kontrolü

```php
// Tenant modeli helper metodları:
$tenant->canCreateSchool()         // Okul oluşturulabilir mi?
$tenant->canCreateClass($schoolId) // Bu okulda sınıf eklenebilir mi?
$tenant->canEnrollStudent()        // Öğrenci kaydedilebilir mi?

// Controller/Service'de:
use App\Traits\ChecksPackageLimits;
$this->checkSchoolLimit($tenant); // Limit aşıldıysa exception fırlatır
```

### İş Akışı

```
1. POST /auth/register → User + Tenant oluşur, tenant_owner rolü atanır
2. GET /packages → Mevcut paketleri listele
3. POST /tenant/subscribe { package_id, billing_cycle } → Abonelik oluşur
4. subscription.active middleware → Okul/Sınıf/Öğrenci oluşturmaya izin verir
```

---

## 11. Activity Log Sistemi

### Mimari

```
BaseModel → HistoryObserver → 1. activity_logs (AUDIT DB — yeni, ana sistem)
                            → 2. {tablo}_histories (ANA DB — eski uyumluluk)
Queue (async=true): WriteActivityLog Job
Cron (03:00): audit:maintain (arşivleme + özet)
```

### activity_logs Alanları

```
id, user_id, user_name, user_email (denormalize — JOIN gerektirmez)
model_type, model_label, model_id
action (created/updated/deleted/restored/force_deleted)
old_values (JSON), new_values (JSON), changed_fields (JSON)
tenant_id, school_id, ip_address, user_agent, url, method
created_at (INSERT-only)
```

### .env

```env
AUDIT_DB_CONNECTION=mysql       # Docker: ana DB; Production: ayrı
AUDIT_DB_DATABASE=istudy_audit  # Production'da ayrı DB
AUDIT_ASYNC=false               # true → queue
AUDIT_RETENTION_DAYS=365
AUDIT_ONLY_DIRTY=true
```

---

## 12. Para Birimi Sistemi

- Tüm fiyatlar **baz birim** cinsinden saklanır (`is_base=true` para birimi)
- Dönüşüm: `tutar × kur = hedef birim`
- API kaynakları: ExchangeRate-API, Open Exchange Rates, Fixer.io
- Cron: `currency:update-rates` her gün 09:00

```env
CURRENCY_BASE=USD
CURRENCY_API_SOURCE=exchangerate-api
EXCHANGERATE_API_KEY=
```

---

## 13. Test Suite

### Durum (2026-02-27) ✅

```bash
php artisan test          → 136 passing / 0 failing  ← TÜM TESTLER GEÇİYOR
php artisan test --group=bug → 37 passing / 0 failing  ← Bug testleri de geçiyor
```

**BUG-001→BUG-012 tamamı düzeltildi.** `@group bug` annotasyonlu testler artık belgelenmiş değil — **gerçek testler** olarak çalışıyor.

### Test Altyapısı — PHP 8.4 + SQLite Fix

PHP 8.4'te SQLite+RefreshDatabase çakışması:
- `exec("BEGIN DEFERRED TRANSACTION")` → PDO `inTransaction()` bayrağını güncellemez
- `performRollBack(0)` → flag false → rollback atlanır → "cannot start a transaction within a transaction"

**Düzeltme:**
- `tests/Database/TestSQLiteConnection.php` — `executeBeginTransactionStatement()` → `PDO::beginTransaction()`, `performRollBack(0)` → `exec('ROLLBACK')` direkt
- `tests/TestCase.php` — `Connection::resolverFor('sqlite', ...)` ile kayıt

### Test Yazım Kuralları

```php
// Soft-delete assertDatabaseMissing — deleted_at ekle!
$this->assertDatabaseMissing('allergens', ['id' => $id, 'deleted_at' => null]);

// createMeal() → academic_year_id yoksa otomatik AcademicYear oluşturur
$meal = $this->createMeal($school, $user);

// FoodIngredient::allergens() withoutGlobalScopes() var
// Global allerjenler (tenant_id=null) relationship'te her zaman görünür
```

### ApiTestHelpers Trait

```php
createAuthenticatedTenant()  → User + Tenant + Package + Subscription + Sanctum auth
createSchool($tenant, $user) → School
createAcademicYear($school, $user) → AcademicYear
createClass($school, $year, $user) → SchoolClass
createMeal($school, $user)   → Meal (academic_year_id otomatik)
createGlobalAllergen($user)  → Allergen (tenant_id=null)
createTenantAllergen($tenant, $user) → Allergen (tenant specific)
createGlobalIngredient($user) → FoodIngredient (tenant_id=null)
createTenantIngredient($tenant, $user) → FoodIngredient
assertApiSuccess($response, 200)
assertApiError($response, 422)
```

---

## 14. Frontend Admin Paneli

### Proje Kimliği

- **Yol:** `istudy-backend/frontend-admin/`
- **Port:** 3001
- **Token:** `localStorage.admin_token`
- **Giriş sonrası redirect:** `/tenants` (dashboard `/` yerine — route çakışması önlemek için)

### Dizin Yapısı

```
frontend-admin/
├── app/
│   ├── page.tsx               ← Root: admin_token → /tenants, yoksa /login
│   ├── layout.tsx             ← Geist font, Sonner Toaster, lang="tr"
│   ├── globals.css            ← Tailwind v3
│   ├── (auth)/
│   │   ├── layout.tsx         ← ⚠️ SADECE: return <>{children}</>
│   │   └── login/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx         ← admin_token check, Sidebar + Header
│       ├── page.tsx           ← Finance dashboard (ApexCharts)
│       ├── tenants/ ... schools/ ... users/ ... packages/
│       ├── finance/ ... health/ ... subscriptions/
│       ├── activity-logs/ ... notifications/ ... settings/
│       └── apps/invoice/list + preview
├── components/
│   ├── icon/                  ← Vristo SVG ikonları
│   └── layouts/               ← ⚠️ "layouts" (çoğul)
│       ├── sidebar.tsx        ← 6 nav grubu
│       ├── header.tsx
│       └── provider-component.tsx ← Redux Provider
├── lib/apiClient.ts           ← Axios, admin_token, 401→/login
├── lib/exportUtils.ts         ← exportToCsv() (BOM+Türkçe Excel)
└── types/index.ts
```

### Auth Akışı

```
1. localStorage.admin_token var → /tenants
2. /login: POST /auth/login → response.data.data.token → localStorage.admin_token
3. (dashboard)/layout.tsx: token yoksa → /login
4. apiClient: 401 → localStorage.clear + /login redirect
```

### Sidebar Navigasyon Grupları

```
ANA MENÜ    → / (Dashboard)
YÖNETİM     → /tenants, /schools, /users, /health
FİNANS      → /packages, /finance, /subscriptions
UYGULAMALAR → /apps/invoice/list
UI          → /ui/* (buttons, alerts, forms, tabs, modals, accordions, dropdowns, sweetalerts, pricing)
SİSTEM      → /activity-logs, /notifications, /settings
```

### Admin Backend Endpoint Eşleşmeleri

| Sayfa | Endpoint'ler |
|-------|-------------|
| Dashboard | `GET /admin/dashboard/stats`, `recent-activities`, `activity-logs/daily-summary`, `subscriptions/stats` |
| Tenants | `GET /admin/tenants`, `POST /auth/register`, `DELETE /admin/tenants/:id` |
| Tenant Detay | `GET /admin/tenants/:id` → `{ tenant, stats }` nested |
| Schools | `GET /admin/schools`, `PATCH toggle-status`, `DELETE` |
| Users | `GET /admin/users (?role,?search,?page)`, `POST`, `DELETE` |
| Packages | `GET/POST/PUT/DELETE /admin/packages`, `GET/POST/PUT/DELETE /admin/package-features` |
| Finance | `GET /admin/invoices`, `GET /admin/transactions + /stats` |
| Health | `GET/POST/PUT/DELETE /admin/allergens` + medical-conditions + food-ingredients + medications |
| Subscriptions | `GET /admin/subscriptions`, `PATCH status/extend` |
| Activity Logs | `GET /admin/activity-logs + /stats` |
| Notifications | `GET/POST /admin/system/notifications` |
| Settings | Countries: `GET + sync + toggle`, Currencies: full CRUD + fetch-rates + set-base |

### Önemli Admin Notları

- **ActivityLog Nested Yapı:** `log.user.name`, `log.context.ip_address`, `log.changes.old_values` (flat değil)
- **Tenant detay:** `tenantRes.data.data.tenant` (nested response)
- **Dashboard stats mapping:** `d.tenants.total` → `total_tenants`, `d.subscriptions.total_revenue` → `monthly_revenue`
- **Grafik:** ApexCharts → `dynamic(() => import('react-apexcharts'), { ssr: false })` zorunlu
- **CSV Export:** `lib/exportUtils.ts` → `exportToCsv()` — BOM ile Türkçe Excel uyumlu
- **Baz para birimi:** Silme butonu gösterilmez (`is_base=true` guard)

---

## 15. Frontend Tenant & Website

### Proje Kimliği

- **Yol:** `istudy-backend/frontend-tenant-and-website/`
- **Port:** 3002
- **Token:** `localStorage.tenant_token` (**Hiçbir yerde `admin_token` yazma!**)
- **Kaynak:** frontend-admin kopyasından türetildi (Vristo, Tailwind v3, Redux aynı)

### Uygulama Katmanları

```
(website)/          → Kamuya açık (/,  /pricing, /about, /contact)
                      Server component layout: PublicNavbar + PublicFooter
(auth)/             → Login + Register (2 adım)
                      ⚠️ Layout: SADECE return <>{children}</> — başka hiçbir şey!
(tenant)/           → Korumalı dashboard
                      Layout: tenant_token guard + Sidebar + Header
```

### Route → Sayfa → API Eşleşmesi

| Sayfa | Endpoint'ler |
|-------|-------------|
| `/dashboard` | `/auth/me`, `/tenant/subscription`, `/tenant/subscription/usage`, `/schools` |
| `/schools` | `GET/POST/PUT/DELETE /schools`, `GET /countries` |
| `/schools/[id]` | `GET /schools/{id}`, sınıf CRUD, `GET /academic-years?school_id`, öğretmen atama |
| `/schools/[id]/classes/[classId]` | supply-list CRUD, devamsızlık, `GET /meal-menus/monthly` |
| `/meals` | `/meals` (3 tab: Yemekler + Besinler + Allerjenler) |
| `/activities` | `/schools/{id}/activities` (start/end date + class_ids) |
| `/social` | `/schools/{id}/social/posts` CRUD + react + comments |
| `/academic-years` | `/academic-years` CRUD + set-current + close |
| `/subscription` | `/tenant/subscription`, `/packages`, plan değiştir, iptal |
| `/invoices` | `GET /invoices/tenant` |
| `/notifications` | GET/PATCH inbox + POST gönder |
| `/profile` | `GET/PUT /auth/me`, `POST /auth/change-password` |

### Sidebar Navigasyon

```typescript
// ANA MENÜ: Dashboard
// YÖNETİM: Okullarım, Yemekler, Etkinlikler, Sosyal Ağ, Eğitim Yılları
// HESAP: Aboneliğim, Faturalar
// SİSTEM: Bildirimler, Profil
```

### TypeScript Tipleri (Kritik)

```typescript
Allergen      // id, name, risk_level?, tenant_id?: number|null
              // tenant_id=null → Global, tenant_id=X → Kuruma özel

FoodIngredient // id, name, is_custom?, allergens?: Allergen[]
               // allergen_info kaldırıldı — allergen_ids ile sync

SchoolClass   // id, school_id, academic_year_id?, name, description?
              // age_min?: number, age_max?: number  ← iki ayrı int (age_group YOK)

Activity      // id, school_id, academic_year_id?, name, start_date?, end_date?,
              // classes?: SchoolClass[]

Meal          // id, school_id, name, meal_type?, ingredients?
              // ⚠️ academic_year_id backend'de NOT NULL

SocialPostMedia   // id, type: 'image'|'video'|'file', url, original_name, file_size, mime_type?, sort_order?
SocialPost        // id, school_id, visibility: 'school'|'class', content?, is_pinned, published_at?,
                  // author: {id, name, avatar?}, media: SocialPostMedia[], classes?: {id,name}[],
                  // reactions_count, user_reaction?: 'like'|'heart'|'clap'|null, comments_count, created_at
SocialPostComment // id, user: {id, name, avatar?}, content, parent_id?, replies?: SocialPostComment[], created_at
                  // ⚠️ lucide-react'te 'Clap' ikonu yok → klap için 'Zap' kullanıldı
```

### Sayfa Detay Notları

**Schools Detail (`/schools/[id]`):**
- Sınıf formunda `age_min` + `age_max` — iki ayrı `<input type="number">`, aralarında `—`
- `academic_year_id` zorunlu — modal açılınca `GET /academic-years?school_id` ile fetch, aktif yıl auto-seç
- Tabloda gösterim: `"3–5 yaş"` / `"3+ yaş"` / `—`

**Meals (`/meals`) — 3 Tab:**
- **Yemekler:** Okul seçici + kart grid + modal (ingredient checkbox)
- **Besin Öğeleri:** Global (düzenlenemez) + tenant özel. Modal: name + allerjen checkbox (2 grup: Global / Kuruma Özel)
- **Allerjenler:** Global salt okunur + Tenant CRUD (`GET/POST/PUT/DELETE /allergens`)

**Activities (`/activities`):**
- Kart'ta: tarih aralığı + atanmış sınıf sayısı
- Modal: start_date (date), end_date (date), sınıf çoklu checkbox

**Social (`/social`):**
- Okul seçici → `GET /schools/{id}/social/posts` (sayfalı feed)
- "Paylaşım Ekle" modal: visibility toggle (Tüm Okul / Sınıfa Özel), sınıf çoklu checkbox, textarea, medya file input (multiple, drag-drop önizleme), sabitle checkbox
- `POST` multipart/form-data → `media[]` array
- Post kart: yazar avatar (ilk harf), zaman, visibility ikonu, sınıf tag badge'leri, medya grid (image/video/file)
- Tepki bar: ThumbsUp(like) / Heart(heart) / Zap(clap) — toggle; `POST posts/{id}/react { type }`
- Yorum toggle: `GET posts/{id}/comments`, inline form + `POST posts/{id}/comments`
- "Daha Fazla Yükle" pagination (page increment)
- ⚠️ lucide-react'te `Clap` ikonu yok → `Zap` kullanıldı

### Kodlama Standartları (Frontend)

```tsx
// Sayfa şablonu
'use client';
export default function XxxPage() {
    const [items, setItems] = useState<Type[]>([]);
    const [loading, setLoading] = useState(true);
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/endpoint');
            if (res.data?.data) setItems(res.data.data);
        } catch {
            toast.error('Yüklenirken hata oluştu.');
        } finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);
}

// Hata yakalama
catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    toast.error(error.response?.data?.message ?? 'İşlem sırasında hata oluştu.');
}

// SweetAlert2 onay
const result = await Swal.fire({ title: '...', showCancelButton: true, ... });
if (!result.isConfirmed) return;

// Zod v4 + RHF
import * as z from 'zod';  // ← named import değil, * as z
// Generic schema: (useForm as any)({ resolver: zodResolver(schema as any) })
```

### Kritik Bug Fix'ler (Bunları Tekrarlama)

```tsx
// 1. (auth)/layout.tsx — SADECE passthrough
export default function AuthLayout({ children }) { return <>{children}</>; }

// 2. App.tsx — `relative` class OLMAMALI (login bg bozulur)
<div className={`${themeConfig.sidebar ? 'toggle-sidebar' : ''} ...`}>

// 3. app/page.tsx OLUŞTURMA — (website)/page.tsx zaten / URL'sini alır

// 4. components/layouts — çoğul (layout değil)
import Sidebar from '@/components/layouts/sidebar';  // ✅

// 5. withCredentials KALDIRILDI — token-based auth, cookie değil

// 6. tenant_token — hiçbir yerde admin_token yazma
localStorage.setItem('tenant_token', token);

// 7. ApexCharts — SSR güvenli
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
```

### Vristo Tema CSS Sınıfları

```html
<div className="panel">                          <!-- Kart -->
<button className="btn btn-primary">             <!-- Buton -->
<button className="btn btn-outline-danger">
<input className="form-input" />                 <!-- Input -->
<span className="badge badge-outline-success">Aktif</span>
<span className="badge badge-outline-danger">İptal</span>
<div className="table-responsive">
  <table className="table-hover">
<div className={errors.field ? 'has-error' : ''}>  <!-- Form hata -->
```

---

## 16. Bilinen Hatalar (Bug Listesi)

> **Durum: TÜM BUGLAR DÜZELTİLDİ ✅** (2026-02-27)
> Test dosyaları: `tests/Feature/API/` klasörü, `@group bug` annotasyonlu 37 test — hepsi geçiyor.

| Bug | Açıklama | Etki | Durum | Düzeltme |
|-----|----------|------|-------|---------|
| **BUG-010** | `User::schools()` eksik → BaseSchoolController 500 | KRİTİK 🔴 | ✅ Düzeltildi | `User.php`'ye `hasManyThrough` eklendi |
| **BUG-003** | Cross-tenant yemek güncelleme/silme güvenlik açığı | KRİTİK 🔴 | ✅ Düzeltildi | `TenantMealController` tenant ownership kontrolü |
| **BUG-001** | Global allerjenler (tenant_id=null) index'te görünmüyor | Yüksek 🟠 | ✅ Düzeltildi | `withoutGlobalScope('tenant')` eklendi |
| **BUG-002** | Global besin öğeleri index'te görünmüyor | Yüksek 🟠 | ✅ Düzeltildi | `withoutGlobalScope('tenant')` eklendi |
| **BUG-006** | `mealIndex()` validate() try-catch içinde → 500 | Orta 🟡 | ✅ Düzeltildi | validate() try-catch dışına alındı |
| **BUG-007** | `AcademicYearController` validate() try-catch içinde → 500 | Orta 🟡 | ✅ Düzeltildi | `$data = $request->validate([...])` return değeri |
| **BUG-004** | `TenantAllergenController::update()` firstOrFail → 500 yerine 404 | Orta 🟡 | ✅ Düzeltildi | `ModelNotFoundException` catch eklendi |
| **BUG-005** | `TenantMealController::ingredientUpdate()` aynı sorun | Orta 🟡 | ✅ Düzeltildi | `ModelNotFoundException` catch eklendi |
| **BUG-011** | `assignTeacher()` catch'de iç hata mesajı sızıyor | Düşük 🟢 | ✅ Düzeltildi | Generic mesaj kullanıldı |
| **BUG-008** | `AcademicYearController` `$request->all()` güvensiz | Düşük 🟢 | ✅ Düzeltildi | `$data = $request->validate([...])` return değeri |
| **BUG-009** | `paginatedResponse` `.resource` anti-pattern | Düşük 🟢 | ✅ Düzeltildi | `.resource` kaldırıldı + `resolve()` fix |
| **BUG-012** | Nested route positional arg hatası (ClassController/ActivityController) | KRİTİK 🔴 | ✅ Düzeltildi | `show/update/destroy`'a `int $school_id` eklendi |

### Kritik Düzeltme Notları (Tekrar Edilmesin)

**BUG-008 (Plain Request `validated()` sorunu):**
```php
// ❌ YANLIŞ: Plain Request'te $request->validated() çalışmaz
$request->validate([...]);
$data = $request->validated(); // → TypeError

// ✅ DOĞRU: validate() return değerini yakala
$data = $request->validate([...]); // return değeri validated data'dır
```

**BUG-009 (`paginatedResponse` + `resolve()`):**
```php
// ❌ YANLIŞ: .resource → ham paginator → resource dönüşümü kaybolur
return $this->paginatedResponse(AcademicYearResource::collection($years)->resource);

// ❌ YANLIŞ: toArray() → whenLoaded() MissingValue → first() on null → 500
$data = collect($paginator->items())->map(fn($item) => (new $resourceClass($item))->toArray(request()));

// ✅ DOĞRU: ResourceCollection direkt + resolve() ile MissingValue filtrelenir
return $this->paginatedResponse(AcademicYearResource::collection($years));
// BaseController'da:
$data = collect($paginator->items())->map(fn($item) => (new $resourceClass($item))->resolve(request()));
```

**BUG-012 (Nested Route Positional Arg):**
```php
// ❌ YANLIŞ: Route prefix {school_id} varken model binding 2. param oluyor
// callAction(...array_values(['school_id' => '5', 'class' => SchoolClass]))
// → show('5') → $class = '5' → TypeError
public function show(SchoolClass $class): JsonResponse { }

// ✅ DOĞRU: int $school_id absorbs the prefix param positionally
public function show(int $school_id, SchoolClass $class): JsonResponse { }
```

---

## 17. Bekleyen Görevler

### Kritik — Migration Çalıştırılmadı

```bash
php artisan migrate   # Docker DB ayağa kalkınca çalıştırılacak
```

Bekleyen 3 migration:
1. `2026_02_24_104108_add_contact_fields_to_schools_table.php`
   — schools'a: country_id, city, fax, gsm, whatsapp
2. `2026_02_24_120000_add_fields_to_classes_and_activities.php`
   — classes'a: description, age_min (tinyInt), age_max (tinyInt)
   — activities'e: start_date, end_date
   — Yeni pivot: activity_class_assignments (activity_id, class_id)
3. `2026_02_27_115618_create_social_posts_tables.php`
   — Yeni: social_posts, social_post_media, social_post_class_tags,
            social_post_reactions, social_post_comments

### Diğer Bekleyenler

| Konu | Durum |
|------|-------|
| Ödeme entegrasyonu (iyzico/Stripe) | ⏳ Simüle |
| Frontend Admin test dosyaları | ⏳ Bekliyor |
| Frontend: Eğitim Yılı yönetim sayfası (`/academic-years`) | ⏳ Bekliyor |
| Frontend: Sınıf formunda `academic_year_id` seçimi | ⏳ Bekliyor |
| Frontend: Yemek besin öğesi allerjen checkbox (Global / Kuruma Özel) | ⏳ Bekliyor |
| Frontend: Etkinlik formu — tarih + sınıf çoklu seçimi | ⏳ Bekliyor |
| **Sosyal Ağ — Backend** (SocialPostController + Service + Policy + Models + Resources) | ✅ Tamamlandı |
| **Sosyal Ağ — Frontend** (`/social/page.tsx` + sidebar + header + types) | ✅ Tamamlandı |

---

## 18. Geliştirme Komutları

### Backend (Laravel)

```bash
# Geliştirme ortamı başlat (server + queue + logs)
composer dev

# Migration
php artisan migrate
php artisan migrate:fresh --seed

# Test suite
php artisan test                       # Tüm testler
php artisan test --exclude-group=bug   # Sadece gerçek testler
php artisan test --filter=SchoolApiTest

# Kod formatlama (ZORUNLU — commit öncesi)
vendor/bin/pint --dirty

# Yeni model oluştur
php artisan make:model XxxName --no-interaction

# DB sıfırla (geliştirme — Docker)
docker exec istudy-db mysql -uroot -proot -e \
  "DROP DATABASE IF EXISTS istudy; CREATE DATABASE istudy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker restart istudy-app
```

### Frontend

```bash
# Tenant (port 3002)
cd frontend-tenant-and-website
npm run dev

# Admin (port 3001)
cd frontend-admin
npm run dev

# Build (değişiklik UI'da görünmüyorsa)
npm run build

# TypeScript kontrol
npx tsc --noEmit
```

### Docker

```bash
cd dockerfiles
docker compose up -d --build   # İlk kurulum
docker compose up -d           # Başlat
docker compose down            # Durdur
docker logs istudy-app         # Laravel logları
docker exec -it istudy-app php artisan migrate
docker compose build frontend-admin && docker compose up -d frontend-admin
docker compose build frontend-tenant && docker compose up -d frontend-tenant
```

---

## 19. Yeni Özellik Eklerken Kontrol Listesi

### Backend

1. ✅ Migration oluştur (`php artisan make:migration`)
2. ✅ Model oluştur — `BaseModel`'den türet (otomatik tenant scope + audit log)
3. ✅ İsteğe bağlı: `$auditExclude`, `$auditLabel` ile audit özelleştir
4. ✅ `StoreXxxRequest` / `UpdateXxxRequest` oluştur
5. ✅ `XxxResource` oluştur
6. ✅ `XxxService` oluştur (BaseService'ten türet)
7. ✅ Policy oluştur (BasePolicy: super_admin bypass dahil)
8. ✅ Controller oluştur — uygun Base'den türet
9. ✅ `validate()` her zaman try-catch **dışında** olmalı — `$data = $request->validate([...])` ile return değeri yakala
10. ✅ `firstOrFail()` yerine `first()` + null kontrolü
11. ✅ Catch bloğunda generic mesaj — `$e->getMessage()` response'a yazma
12. ✅ Transaction leak'e dikkat: early return öncesi `DB::rollBack()` çağır
13. ✅ Route ekle (`routes/api.php`)
14. ✅ **Nested resource route** (`prefix('schools/{school_id}')` + `apiResource`) → show/update/destroy'a `int $school_id` EKLE
15. ✅ **Nested FormRequest** → `prepareForValidation()`'da `$this->route('school_id')` merge et
16. ✅ `paginatedResponse()` çağırırken ResourceCollection direkt ver (`.resource` yazma)
17. ✅ Test yaz (`php artisan make:test XxxApiTest`)
18. ✅ `vendor/bin/pint --dirty` çalıştır

### Frontend

1. ✅ Token: `tenant_token` kullan (hiçbir yerde `admin_token` yazma)
2. ✅ Route: `(tenant)` / `(website)` / `(auth)` grubunu belirle
3. ✅ Sidebar + header'a eklenecekse `sidebar.tsx` + `header.tsx` güncelle
4. ✅ `'use client'` directive + `useState` + `useCallback` + `useEffect` pattern
5. ✅ Loading state: `useState(true)` + spinner
6. ✅ Hata yakalama: `catch` + `toast.error(...)`
7. ✅ Silme: SweetAlert2 onay dialogu
8. ✅ Tailwind v3 kullan — v4 sözdizimi yazma
9. ✅ `app/page.tsx` OLUŞTURMA (tenant projesinde)
10. ✅ `(auth)/layout.tsx`'e wrapper EKLEME
11. ✅ Yeni tip: `types/index.ts`'e ekle
12. ✅ `npm run build` ile değişikliği test et

---

> 📝 **Not:** Bu dosya projeye yeni dahil olan herkesin (AI agent, mühendis, analist, mimar) sistemi baştan sona anlayabilmesi için tasarlanmıştır.
> Yeni modül, migration veya mimari kararların ardından güncellenmelidir.
> Kaynak: `PROJECT_MEMORY.md` + `PROJECT_MEMORY_FRONTEND.md` + `PROJECT_MEMORY_FRONTEND_ADMIN.md` (2026-02-27 güncelleme — 136/136 test ✅)
