# 🤖 iStudy — AI Master Context (Tüm Proje Hafızası)

> **Oluşturulma:** 2026-04-09 | **Kaynak:** CLAUDE.md, PROJECT_MEMORY.md, PROJECT_MEMORY_FRONTEND.md, PROJECT_MEMORY_FRONTEND_ADMIN.md, PROJECT_MEMORY_MOBILE.md, TASKS_FOR_FIX.md, TASKS_NEW_2026_03_01.md, memory.md
> **Amaç:** Bu dosya, projeye dahil olan her AI ajanının projeyi sıfırdan anlayabilmesi için tüm hafıza dosyalarının birleştirilmiş, sıkıştırılmış ve önceliklendirilmiş özetidir. Tek dosyadan tüm sistemi anlamak için tasarlanmıştır.

---

## ⚡ HIZLI BAŞLANGIÇ — Hangi Dosyayı Oku?

| Görev | Okunacak Bölüm |
|-------|---------------|
| Backend API yazmak | §4 Backend Mimarisi, §5 Kritik Kurallar, §6 DB Şeması |
| Frontend Tenant sayfası | §9 Frontend Tenant |
| Frontend Admin sayfası | §10 Frontend Admin |
| React Native/Expo ekranı | §11 Mobil Uygulama |
| Yeni modül eklemek | §5.5 Modül Checklist |
| Bug düzeltmek | §13 Bilinen Hatalar, §30 Güvenlik Açıkları |
| Docker/Deployment | §3 Altyapı |
| **Projeyi ilk kez kurmak** | **§29 Day-1 Kurulum Rehberi** |
| **Super Admin ekranları** | **§23 Rol: Super Admin** |
| **Tenant yönetim ekranları** | **§24 Rol: Tenant Owner** |
| **Veli mobil akışları** | **§25 Rol: Veli** |
| **Öğretmen mobil akışları** | **§26 Rol: Öğretmen** |
| **Hangi dosya neyi yönetiyor** | **§28 Master Dosya-Ekran Referansı** |
| **Güvenlik açıkları ve durumları** | **§30 Güvenlik Audit Özeti** |
| **Model ilişkileri** | **§31 Eloquent İlişki Haritası** |
| **HTTP durum kodları** | **§32 HTTP Status Kodu Rehberi** |
| **Production'a çıkış** | **§33 Production Kontrol Listesi** |
| **Git/Branch kuralları** | **§34 Git ve Geliştirme Akışı** |

---

## 1. 📋 PROJE KİMLİĞİ

**iStudy**, anaokulu ve kreşlerin yönetimi için tasarlanmış **çok kiracılı (multi-tenant) SaaS** platformudur.

| Alan | Değer |
|------|-------|
| **Proje Türü** | SaaS Multi-Tenant Anaokulu/Kreş Yönetim Sistemi |
| **Dil** | Türkçe UI + Türkçe yorumlar |
| **Proje Kökü** | `/Users/veysel.aydogdu/Desktop/WebProjects/iStudy/istudy-backend/` |
| **Son Güncelleme** | 2026-04-09 (Hibrit ULID mimarisi, 8 model, ULID backfill) |

---

## 2. 🗺️ SİSTEM MİMARİSİ HARİTASI

```
┌──────────────────────────────────────────────────────────┐
│                    iStudy SaaS Platform                    │
├──────────────────┬───────────────────┬───────────────────┤
│  Super Admin     │  Tenant (Kurum)   │  Veli Mobil       │
│  Frontend Admin  │  Frontend Tenant  │  React Native     │
│  port 3001       │  port 3002        │  Expo             │
│  admin_token     │  tenant_token     │  parent_token     │
│                  │  (localStorage)   │  (AsyncStorage)   │
└──────────┬───────┴─────────┬─────────┴──────────┬────────┘
           │                 │                     │
           └─────────────────┼─────────────────────┘
                             ↓ REST API (JSON)
             ┌───────────────────────────────────┐
             │  Laravel 12 Backend API            │
             │  PHP 8.4 | MySQL 8 | Redis         │
             │  Sanctum Token Auth                │
             │  port 8000 (dev) / 443 (prod)      │
             └───────────────────────────────────┘
```

### Katman Haritası

| Katman | Teknoloji | Port | Token Anahtarı |
|--------|-----------|------|----------------|
| **Backend** | Laravel 12 / PHP 8.4, MySQL 8, Sanctum, Docker | 8000 / 443 | Bearer (Sanctum) |
| **Frontend Admin** | Next.js 16, TypeScript 5, Tailwind v3, Vristo | 3001 | `admin_token` (localStorage) |
| **Frontend Tenant** | Next.js 16, TypeScript 5, Tailwind v3, Vristo | 3002 | `tenant_token` (localStorage) |
| **Mobil (Veli)** | React Native 0.83.2 + Expo ~55, Expo Router v3 | Android: `10.0.2.2:8000` / iOS: `localhost:8000` | `parent_token` (AsyncStorage) |
| **Mobil (Öğretmen)** | Aynı uygulama, `(teacher-app)` route grubu | Aynı API | `teacher_token` (AsyncStorage) |

### Proje Dizin Yolları

```
istudy-backend/                          ← Backend (Laravel)
istudy-backend/frontend-admin/           ← Super Admin Paneli
istudy-backend/frontend-tenant-and-website/ ← Tenant Portalı + Kamuya Açık Site
istudy-backend/parent-mobile-app/        ← Veli + Öğretmen Mobil Uygulaması
```

---

## 3. 🐳 ALTYAPI VE DOCKER

### Docker Servis Portları

| Servis | Host Port | URL |
|--------|-----------|-----|
| Laravel API (HTTPS) | 443 | https://localhost/api |
| Laravel API (HTTP, yerel) | 8000 | http://localhost:8000/api |
| Frontend Admin | **3001** | http://localhost:3001 |
| Frontend Tenant | **3002** | http://localhost:3002 |
| PHPMyAdmin | 8080 | http://localhost:8080 |
| MySQL | 3306 (internal) | — |
| Redis | 6379 (internal) | — |

### Docker Dizini

```
dockerfiles/
├── docker-compose.yml
├── php/Dockerfile          ← PHP 8.4-FPM + Redis + intl + opcache + GD
├── node/Dockerfile         ← Node 22 Alpine (Admin)
├── node/Dockerfile.tenant  ← Node 22 Alpine (Tenant)
├── nginx/conf.d/default.conf ← HTTP→HTTPS, gzip, güvenlik headerları
└── ssl/                    ← Self-signed sertifika
```

### Kritik Docker Komutları

```bash
cd dockerfiles && docker compose up -d        # Başlat
docker compose up -d --build                  # İlk kurulum (build ile)
docker compose down                           # Durdur

# PHP değişikliği sonrası ZORUNLU (opcache flush):
docker compose -f dockerfiles/docker-compose.yml restart app

# Yeni route 404 veriyorsa:
docker compose -f dockerfiles/docker-compose.yml exec app php artisan route:clear
docker compose -f dockerfiles/docker-compose.yml restart app

# Migration çalıştırma:
docker compose -f dockerfiles/docker-compose.yml exec app php artisan migrate

# Ülkeler sync:
docker compose -f dockerfiles/docker-compose.yml exec app php artisan countries:sync
```

### .env Kritik Değişkenler

```env
DB_CONNECTION=mysql
DB_HOST=db
DB_DATABASE=istudy
DB_USERNAME=istudy
DB_PASSWORD=password
REDIS_HOST=redis
REDIS_CLIENT=phpredis

# Docker ortamında audit loglar ana DB'ye (istudy_audit ayrı DB gerekmez):
AUDIT_DB_CONNECTION=mysql

# Production'da ayrı DB:
# AUDIT_DB_DATABASE=istudy_audit

AUDIT_ASYNC=false
AUDIT_RETENTION_DAYS=365
AUDIT_ONLY_DIRTY=true

CURRENCY_BASE=USD
CURRENCY_API_SOURCE=exchangerate-api

TENANT_FRONTEND_URL=http://localhost:3002

APP_DEBUG=false  # KRİTİK — stack trace güvenlik açığı
```

---

## 4. ⚙️ BACKEND MİMARİSİ

### 4.1 Multi-Tenant Yapı

```
SUPER ADMIN → Tüm tenant'lar
  Tenant (Kurum) → 1..N Schools → Classes → Children / Teachers / Families
```

**Rol Hiyerarşisi:** `super_admin` > `tenant_owner` > `school_admin` > `teacher` > `parent`

**Tenant İzolasyonu:**
- `BaseModel` → `WHERE {table}.tenant_id = auth()->user()->tenant_id` global scope otomatik
- `User` modeli `Authenticatable`'dan türer → scope YOK
- **Veli kullanıcılar `tenant_id = NULL`** → `withoutGlobalScope('tenant')` her parent ilişkisinde ZORUNLU

### 4.2 Katmanlı Mimarisi

```
Request → Route → Middleware → Controller → Service → Model → Database
                                    ↓
                              FormRequest (Validation)
                                    ↓
                              JsonResponse (API Resource)
```

### 4.3 Temel Backend Bileşenler

| Bileşen | Dosya | Görev |
|---------|-------|-------|
| `BaseModel` | `app/Models/Base/BaseModel.php` | SoftDeletes, TenantScope, HistoryObserver, created_by/updated_by |
| `BaseController` | `app/Http/Controllers/Base/BaseController.php` | successResponse(), errorResponse(), paginatedResponse() |
| `BaseSchoolController` | `Controllers/Schools/BaseSchoolController.php` | school_id doğrulama, ULID/int çift desteği |
| `BaseTenantController` | `Controllers/Tenant/BaseTenantController.php` | tenant() helper via tenant_id |
| `BaseParentController` | `Controllers/Parents/BaseParentController.php` | getFamilyProfile(), findOwnedChild() |
| `BasePolicy` | `Policies/BasePolicy.php` | Super Admin otomatik tüm işlemlere izinli (before hook) |
| `BaseService` | `Services/BaseService.php` | getAll(), create(), update(), delete() |

### 4.4 API Response Formatı (Değiştirilemez Standart)

```json
// Tekil başarı:
{ "success": true, "message": "...", "data": { ... } }

// Sayfalı liste:
{ "success": true, "message": "...", "data": [...], "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 73 } }

// Hata:
{ "success": false, "message": "...", "data": null }
```

**Frontend erişim kalıbı:** `res.data.data` → veri, `res.data.meta` → pagination, `res.data.data.token` → auth token

---

## 5. 🚨 KRİTİK BACKEND KURALLARI (AI AJAN ZORUNLULUKLARİ)

### 5.1 Nested Route Positional Arg — EN SIK YAPILAN HATA

```php
// YANLIŞ — TypeError fırlatır:
public function show(Child $child): JsonResponse

// DOĞRU (schools/{school_id}/children/{child} route için):
public function show(int $school_id, Child $child): JsonResponse
public function update(UpdateChildRequest $request, int $school_id, Child $child): JsonResponse
public function destroy(int $school_id, Child $child): JsonResponse
```

### 5.2 paginatedResponse — Kritik Kullanım

```php
// DOĞRU:
return $this->paginatedResponse(ChildResource::collection($paginator));

// YANLIŞ — resource dönüşümü kaybolur:
return $this->paginatedResponse(ChildResource::collection($paginator)->resource);

// Custom alan eklemek için (plain Collection almaz!):
$result = $data->getCollection()->map(fn($item) => [...]);
$data->setCollection($result);
// Sonra: $data->items(), $data->currentPage() vb. kullan
```

### 5.3 validate() Konumu

```php
// DOĞRU — try-catch DIŞINDA (422 garantisi için):
public function store(Request $request): JsonResponse
{
    $request->validate([...]);  // ← TRY-CATCH ÖNCESI
    DB::beginTransaction();
    try {
        ...
    } catch (\Throwable $e) { ... }
}
```

### 5.4 Laravel 12 Filesystem (Private Disk)

```php
Storage::disk('local')   // DOĞRU — storage/app/private/, web'den erişilemez
Storage::disk('private') // HATA — Laravel 12'de bu disk YOK

// Private dosya → signed route zorunlu:
$signedUrl = URL::signedRoute('route.name', ['model' => $id], now()->addHours(1));
// Route middleware: 'signed' (auth:sanctum OLMADAN — Image header gönderemez)
```

### 5.5 BelongsToMany Pivot Accessor Bug

```php
// Constraint callback'li eager load'da ->pivot çalışmaz:
// Çözüm: DB::table() kullan:
$pivotMap = DB::table('school_teacher_assignments')
    ->where('school_id', $schoolId)
    ->whereIn('teacher_profile_id', $teacherIds)
    ->get()
    ->keyBy('teacher_profile_id');
```

### 5.6 MySQL FK 64-Karakter Limiti

```php
// Uzun tablo adlarında explicit kısa FK ismi zorunlu:
$table->foreign('activity_class_id', 'acsc_activity_class_fk')->references('id')->on('activity_classes');
$table->unique(['activity_class_id', 'school_class_id'], 'acsc_unique');
```

### 5.7 Tenant Scope — Veli Verisi

```php
// Veli kullanıcıların tenant_id = NULL → withoutGlobalScope zorunlu:
$child->load([
    'familyProfile' => fn($q) => $q->withoutGlobalScope('tenant')->with(['owner', 'members.user']),
    'allergens' => fn($q) => $q->withoutGlobalScope('tenant'),
    'medications' => fn($q) => $q->withoutGlobalScope('tenant'),
]);
```

### 5.8 ActivityClassEnrollment — plain Model

```php
// ActivityClassEnrollment: plain Model (NOT BaseModel)
// Neden: Parent tenant_id=NULL, BaseModel scope bozar
class ActivityClassEnrollment extends Model { ... }  // Authenticatable değil, BaseModel değil
```

### 5.9 config/cors.php — app()->isLocal() Kullanılmaz

```php
// YANLIŞ (crash eder — app henüz boot olmamış):
app()->isLocal() ? 'http://localhost:3002' : null,

// DOĞRU:
in_array(env('APP_ENV'), ['local', 'testing']) ? 'http://localhost:3002' : null,
```

### 5.10 FoodIngredient::allergens() — withoutGlobalScopes Zorunlu

```php
// Global allerjenler (tenant_id=null) scope ile filtrelenir:
return $this->belongsToMany(Allergen::class, 'food_ingredient_allergens', ...)
    ->withoutGlobalScopes();  // ← ZORUNLU
```

### 5.11 Yeni Modül Ekleme Checklist

```
1. Migration + Model (BaseModel'den türet) + Factory + Seeder
2. FormRequest (Store, Update) + API Resource + Service + Policy
3. Controller (uygun base'den türet) + Route (routes/api.php)
4. Tests (Feature) + vendor/bin/pint --dirty
5. php artisan route:clear + docker compose restart app
```

### 5.12 Kod Formatlama

```bash
vendor/bin/pint --dirty   # Her PHP değişikliği sonrası ZORUNLU
```

---

## 6. 🗄️ VERİTABANI ŞEMASI

### 6.1 Temel Tablolar Özeti

#### Auth & Kullanıcı
| Tablo | Model | Notlar |
|-------|-------|--------|
| `users` | `User` | Authenticatable'dan türer, BaseModel DEĞİL |
| `roles` | `Role` | super_admin, tenant_owner, school_admin, teacher, parent |
| `role_user` | (Pivot) | M2M |

#### Kurum
| Tablo | Model | Önemli Alanlar |
|-------|-------|---------------|
| `tenants` | `Tenant` | `owner_user_id` FK |
| `schools` | `School` | `tenant_id, country_id?, city, fax, gsm, whatsapp, registration_code, is_active` |
| `academic_years` | `AcademicYear` | `is_current` flag |

#### Akademik
| Tablo | Model | Önemli Alanlar |
|-------|-------|---------------|
| `classes` | `SchoolClass` | **Model adı SchoolClass** (PHP'de Class reserved keyword!) `age_min(tinyInt), age_max(tinyInt), is_active` |
| `child_class_assignments` | Pivot | cascadeOnDelete |
| `activity_class_assignments` | Pivot | `activity_id, class_id` |

#### Kişiler
| Tablo | Model | Notlar |
|-------|-------|--------|
| `teacher_profiles` | `TeacherProfile` | `tenant_id` eklendi (schema v2). schools() via pivot |
| `school_teacher_assignments` | Pivot | `school_id, teacher_profile_id, employment_type, teacher_role_type_id` |
| `teacher_role_types` | `TeacherRoleType` | Tenant-level görev türleri |
| `family_profiles` | `FamilyProfile` | `tenant_id = NULL` (veliler) |
| `children` | `Child` | `school_id nullable, academic_year_id nullable` |

#### Sağlık & Beslenme
| Tablo | Model | Notlar |
|-------|-------|--------|
| `allergens` | `Allergen` | `tenant_id=NULL` → Global; `tenant_id=X` → Kuruma özel |
| `food_ingredients` | `FoodIngredient` | allergens() ilişkisinde withoutGlobalScopes() zorunlu |
| `meals` | `Meal` | `academic_year_id nullable` (2026-03) |
| `food_ingredient_allergens` | Pivot | Besin-Allerjen M2M |

#### Finans (B2B)
| Tablo | Açıklama |
|-------|---------|
| `packages` | max_schools, max_classes_per_school, max_students, monthly_price, yearly_price |
| `package_features` | key, label, value_type('bool'\|'text'), display_order |
| `package_feature_pivot` | package_id, package_feature_id, value |
| `tenant_subscriptions` | status: active/cancelled/expired |
| `tenant_payments` | Ödeme kayıtları |

#### Finans (B2C)
| Tablo | Açıklama |
|-------|---------|
| `subscription_plans` | Okul-Aile abonelik planları |
| `family_subscriptions` | Aile abonelikleri (active/cancelled/expired) |
| `invoices` | B2B/B2C faturalar (module: activity_class/subscription/manual/event) |
| `invoice_items` | Fatura kalemleri |
| `transactions` | Sanal POS işlemleri |

#### Etkinlik Sınıfları (ActivityClass modülü — 2026-04)
| Tablo | Model | Notlar |
|-------|-------|--------|
| `activity_classes` | `ActivityClass` | `school_id nullable` = tenant-wide; BaseModel'den türer |
| `activity_class_enrollments` | `ActivityClassEnrollment` | **plain Model (NOT BaseModel)** — parent scope bozar |
| `activity_class_teachers` | `ActivityClassTeacher` | Pivot |
| `activity_class_materials` | `ActivityClassMaterial` | Materyal listesi |
| `activity_class_gallery` | `ActivityClassGallery` | Private storage + signed URL |
| `activity_class_invoices` | `ActivityClassInvoice` | Ücretli kayıt faturası; main_invoice_id → invoices.id |

#### Ülkeler
| Tablo | Notlar |
|-------|--------|
| `countries` | `name, iso2, phone_code (+90 formatında), flag_emoji, sort_order` — **name_tr yok!** |

> **⚠️ phone_code formatı:** DB'de `+90` prefix ile saklanır. Frontend'de `phone_code.replace(/^\+/, '')` ile normalize edilmeli.

#### Sosyal Ağ
| Tablo | Model | Açıklama |
|-------|-------|---------|
| `social_posts` | `SocialPost` | `tenant_id, school_id, author_id, visibility(school\|class)` |
| `social_post_media` | `SocialPostMedia` | image/video/file, disk+path |
| `social_post_reactions` | `SocialPostReaction` | like/heart/clap, unique(post_id,user_id) |
| `social_post_comments` | `SocialPostComment` | parent_id ile nested reply |

#### Audit Log (Ayrı DB bağlantısı)
| Tablo | Açıklama |
|-------|---------|
| `activity_logs` | Merkezi CRUD log — old/new values, changed_fields, denormalize user |
| `activity_logs_archive` | Eski loglar |
| `activity_log_summaries` | Günlük özet (dashboard için) |

#### History Tabloları (Geriye Dönük Uyumluluk)
Her ana tablo için `{tablo_adı}_histories` mevcuttur: `id, original_id, operation_type, snapshot(JSON), operated_by, timestamps`

### 6.2 Standart Alanlar (Her Ana Tabloda)

```sql
id bigint PK, created_by FK→users, updated_by FK→users nullable,
created_at, updated_at, deleted_at (SoftDeletes)
```

### 6.3 FK Stratejisi

| Durum | Strateji |
|-------|---------|
| Soft-delete'li tablo FK | `restrictOnDelete()` — hard delete engellenir |
| Pivot/junction tablo FK | `cascadeOnDelete()` |
| Opsiyonel FK | `nullOnDelete()` |

### 6.4 Hibrit ULID Mimarisi (2026-04-06)

**Etkilenen modeller:** `User`, `Child`, `TeacherProfile`, `FamilyProfile`, `School`, `SchoolClass`, `ActivityClass`, `AuthorizedPickup`

```php
// HasUlid trait:
// - bootHasUlid: creating event'te otomatik ULID oluşturur
// - getRouteKeyName(): 'ulid' döner → route binding ULID ile çalışır
// Her etkilenen Resource'da: 'id' => $this->ulid
// İç ilişkilerde INT id hâlâ kullanılabilir (kasıtlı)

// BaseSchoolController::validateSchoolAccess():
// ULID (26-char) → WHERE ulid = $param
// Sayısal → WHERE id = $param (legacy)
// request()->route()->setParameter('school_id', $school->id); // INT'e normalize
```

---

## 7. 🛣️ API ROUTE YAPISI (4 Katmanlı)

### Katman 1: Herkese Açık

```
GET  /api/health
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/packages
GET  /api/countries/phone-codes
```

### Katman 2: Auth Gerekli (Token, Abonelik Gerekmez)

```
POST /api/auth/logout
GET  /api/auth/me
POST /api/tenant/subscribe
GET  /api/tenant/subscription
GET  /api/tenant/subscription/history
GET  /api/tenant/subscription/usage
POST /api/tenant/subscription/cancel
```

### Katman 3: Abonelik Gerekli (subscription.active middleware)

```
CRUD: schools
CRUD: schools/{id}/classes
CRUD: schools/{id}/children
CRUD: schools/{id}/activities
CRUD: schools/{id}/families
GET/POST/DELETE: schools/{id}/classes/{classId}/teachers
GET/POST/PUT/DELETE: schools/{id}/classes/{classId}/supply-list
GET/POST/PUT/DELETE: schools/{id}/teachers (?detailed=1)
GET/POST/PUT/DELETE: teachers (tenant-level)
GET/POST/PUT/DELETE: teacher-role-types
GET/POST/DELETE: schools/{id}/teachers/{id}/schools
CRUD: academic-years (+ PATCH set-current + PATCH close)
GET:  academic-years/global-list
CRUD: food-ingredients
CRUD: meals
CRUD: allergens (tenant)
CRUD: activity-classes (tenant-level, school_id opsiyonel)
CRUD: activity-classes/{id}/enrollments
POST/DELETE: activity-classes/{id}/teachers
CRUD: activity-classes/{id}/materials
GET/POST/DELETE: activity-classes/{id}/gallery
GET/PATCH: activity-classes/{id}/invoices
GET:  meal-menus/monthly
GET/POST/PATCH: notifications
GET:  invoices/tenant
CRUD: schools/{id}/social/posts
POST: schools/{id}/social/posts/{post}/react
GET/POST/DELETE: schools/{id}/social/posts/{post}/comments
PATCH: schools/{id}/child-enrollment-requests/{id}/approve|reject
```

### Veli Mobil API (/api/parent/ prefix, auth:sanctum)

```
POST /parent/auth/register|login|logout|forgot-password|reset-password
GET  /parent/auth/me
GET  /parent/auth/countries (public)
GET  /parent/auth/blood-types (public)
CRUD /parent/children
POST /parent/children/{id}/allergens|medications|conditions
GET  /parent/children/{id}/photo (signed URL)
POST /parent/children/{id}/profile-photo
GET  /parent/children/{id}/stats
CRUD /parent/family/members
CRUD /parent/family/emergency-contacts
GET  /parent/schools
POST /parent/schools/join
GET  /parent/schools/{id}/feed
GET  /parent/feed/global
GET  /parent/activity-classes (+ enroll/unenroll/gallery)
GET  /parent/activities (+ show/enroll/unenroll/gallery)
GET  /parent/meal-menus/children + /parent/meal-menus
GET  /parent/invoices|invoices/stats|invoices/{id}
GET  /parent/allergens|conditions|medications|countries|blood-types
GET/POST/DELETE: /parent/teachers/{id} + follow/unfollow
GET  /parent/teacher-feed
GET/POST/DELETE: /parent/teacher-blogs/{id}/like|comments
```

### Öğretmen API (/api/teacher/ prefix)

```
POST /teacher/auth/register|login|forgot-password|reset-password
GET  /teacher/auth/me
POST /teacher/auth/logout
GET  /teacher/classes + classes/{id} + classes/{id}/children
GET  /teacher/children/{id} + today-medications + authorized-pickups
POST /teacher/children/{id}/record-pickup
GET  /teacher/children/{id}/pickup-logs
POST /teacher/medications/mark-given
GET  /teacher/medications/given-logs/{childId}
GET/POST /teacher/attendance
GET  /teacher/meal-menus
CRUD /teacher/blogs
GET/POST/DELETE /teacher/memberships + invitations + join
```

### Katman 4: Admin Only (super.admin middleware)

```
CRUD: admin/packages + admin/package-features
GET/DELETE: admin/tenants (+ GET :id/schools + :id/subscriptions)
GET/PATCH/DELETE: admin/schools (+ GET :id/classes + :id/children)
GET/POST/DELETE: admin/users
GET/PATCH: admin/subscriptions + stats
CRUD: admin/allergens + medical-conditions + food-ingredients + medications
GET: admin/invoices + admin/transactions + stats
CRUD: admin/currencies (+ fetch-rates + set-base + toggle-status)
GET/POST + PATCH toggle-active: admin/countries + sync
GET + stats + archive + models: admin/activity-logs
GET/POST: admin/system/notifications
GET/POST: admin/dashboard/stats + recent-activities
```

---

## 8. 🔐 AUTH SİSTEMLERİ

### 8.1 Tenant Auth

```
POST /api/auth/register →
  User (password hash otomatik) + Tenant (institution_name→name) + tenant_owner role + Sanctum token

POST /api/auth/login → { data: { token, user } }
  → localStorage.setItem('tenant_token', token)

Şifre Güçlülük Kuralı (tenant + parent):
  min:8, en az 1 büyük harf, en az 1 rakam, en az 1 özel karakter

Şifre Sıfırlama Yönlendirme:
  tenant_id NULL → mobile deep link: parentmobileapp://reset-password?token=...&email=...
  tenant_id NOT NULL → web URL: {TENANT_FRONTEND_URL}/reset-password?token=...&email=...
```

### 8.2 Veli Auth (Mobil)

```
POST /api/parent/auth/register → { token, user } → AsyncStorage.setItem('parent_token', token)
401 response → authEvent.trigger() → _layout.tsx signOut → (auth)/login
```

### 8.3 Öğretmen Auth (Mobil — Aynı Uygulamada)

```
POST /api/teacher/auth/register + /api/teacher/auth/login → teacher_token
(teacher-app)/_layout.tsx → teacherToken guard
Öğretmenler kendi hesaplarını açar, tenant'la bağımsız
Tenant → öğretmeni davet eder (invite_code) VEYA öğretmen tenant'a katılma talebi gönderir
```

### 8.4 Güvenlik Katmanları

| Katman | Çözüm |
|--------|-------|
| Stack trace OFF | `APP_DEBUG=false` (.env) |
| Global Exception Handler | Auth→401, Validation→422, ModelNotFound→404, Generic→500 (`bootstrap/app.php`) |
| Rate Limiting | `throttle:5,1` login, `throttle:10,1` register |
| Force JSON | `ForceJsonResponse` middleware tüm /api/* |
| XSS Koruması | `regex:/^[^<>&"\']*$/` health text alanları |
| Tenant İzolasyonu | BaseModel global scope |
| Nginx Headers | X-Frame-Options, HSTS, X-XSS-Protection, Referrer-Policy |

---

## 9. 🖥️ FRONTEND TENANT (port 3002)

### 9.1 Proje Kimliği

| Alan | Değer |
|------|-------|
| **Framework** | Next.js 16 (App Router) |
| **Dil** | TypeScript 5 |
| **CSS** | **Tailwind CSS v3** — v4 YAZMA! |
| **UI Tema** | Vristo (Redux tabanlı) |
| **Token** | **`tenant_token`** — `admin_token` ASLA YAZMA |
| **Port** | 3002 |
| **API Client** | `lib/apiClient.ts` → `NEXT_PUBLIC_API_URL=http://localhost:8000/api` |

### 9.2 Route Grupları

```
(website)/   → Kamuya açık (/, /pricing, /about, /contact)
              → Layout: PublicNavbar + PublicFooter (server component)
(auth)/      → Login, Register, Register/Plans
              → Layout: SADECE <>{children}</> — wrapper DIV EKLEME!
(tenant)/    → Dashboard, Schools, Meals, Activities, vb.
              → Layout: Auth + Subscription guard, Sidebar + Header
```

### 9.3 Kritik Kurallar

```typescript
// Token — HEP tenant_token:
localStorage.setItem('tenant_token', token)
localStorage.getItem('tenant_token')

// app/page.tsx OLUŞTURMA — (website)/page.tsx zaten / URL'ini alır
// (auth)/layout.tsx SADECE:
export default function AuthLayout({ children }) { return <>{children}</>; }

// App.tsx root div'de relative class OLMAMALI:
// Yanlış: <div className={`relative ${...}`}>
// Doğru: <div className={`${...}`}>

// Tab Fetch Flag (data.length === 0 YANLIŞ):
const [xxxFetched, setXxxFetched] = useState(false);
if (tab === 'xxx' && !xxxFetched && !loading) { fetchXxx(); }

// Zod v4:
import * as z from 'zod';  // named import DEĞİL

// ApexCharts:
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Tailwind v3 (globals.css):
@tailwind base;
@tailwind components;
@tailwind utilities;
// YANLIŞ: @import "tailwindcss"; (v4 sözdizimi)

// components/layouts — çoğul:
import Sidebar from '@/components/layouts/sidebar';  // ✅

// Hata yakalama:
} catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    toast.error(error.response?.data?.message ?? 'İşlem sırasında hata oluştu.');
}
```

### 9.4 Sayfa Listesi & API Eşleşmeleri

| Sayfa | Endpoint'ler |
|-------|-------------|
| `(website)/page.tsx` | `GET /packages` |
| `(auth)/login` | `POST /auth/login` |
| `(auth)/register` | `POST /auth/register` |
| `(auth)/register/plans` | `GET /packages`, `POST /tenant/subscribe` |
| `(tenant)/dashboard` | `GET /auth/me`, `GET /tenant/subscription`, `GET /tenant/subscription/usage`, `GET /schools` |
| `(tenant)/schools` | `GET /schools (?page,?search)`, `GET /countries`, `POST/PUT/DELETE /schools` |
| `(tenant)/schools/[id]` | `GET /schools/{id}`, `GET/POST/PUT/DELETE /schools/{id}/classes`, `GET /schools/{id}/teachers?detailed=1`, `GET /teachers`, `GET /teacher-role-types`, `GET/POST/DELETE /schools/{id}/classes/{classId}/teachers` |
| `(tenant)/schools/[id]/classes/[classId]` | supply-list CRUD, attendances, `GET /meal-menus/monthly` |
| `(tenant)/meals` | `GET/POST/PUT/DELETE /meals`, `/food-ingredients`, `/allergens` |
| `(tenant)/activities` | `GET/POST/PUT/DELETE /schools/{id}/activities` + `GET /academic-years`, `/schools/{id}/classes` |
| `(tenant)/academic-years` | `GET /academic-years?school_id`, `POST/PUT/DELETE /academic-years`, `PATCH set-current/close` |
| `(tenant)/teachers` | `GET/POST/PUT/DELETE /teachers`, `GET /teachers/{id}/schools`, `POST/DELETE /teachers/{id}/schools/{schoolId}` |
| `(tenant)/activity-classes` | `GET/POST/PUT/DELETE /activity-classes` + alt-kaynaklar (enrollments, teachers, materials, gallery, invoices) |
| `(tenant)/subscription` | `GET/POST /tenant/subscription`, `GET /packages` |
| `(tenant)/invoices` | `GET /invoices/tenant (?page)` |
| `(tenant)/notifications` | `GET/PATCH /notifications`, `POST /notifications` |
| `(tenant)/profile` | `GET/PUT /auth/me`, `POST /auth/change-password` |

### 9.5 Vristo UI Sınıfları

```html
<div className="panel">...</div>
<button className="btn btn-primary">Kaydet</button>
<button className="btn btn-outline-danger">Sil</button>
<input className="form-input" />
<div className="table-responsive"><table className="table-hover">...</table></div>
<span className="badge badge-outline-success">Aktif</span>
<span className="badge badge-outline-danger">İptal</span>
<span className="badge badge-outline-warning">Bekliyor</span>
```

---

## 10. 🖥️ FRONTEND ADMIN (port 3001)

### 10.1 Proje Kimliği

| Alan | Değer |
|------|-------|
| **Framework** | Next.js 16 (App Router) |
| **Token** | `admin_token` (localStorage) |
| **Port** | 3001 |
| **Giriş Sonrası** | `/tenants` (dashboard değil — route çakışması önlemek için) |

### 10.2 Route Grupları

```
(auth)/login        → Vristo Login Boxed style
(dashboard)/        → Auth guard (admin_token), Sidebar + Header
(dashboard)/page.tsx ← Finance dashboard (ApexCharts)
```

### 10.3 Sidebar Navigasyon (2026-04-06 güncel)

```
GENEL BAKIŞ     → / (Dashboard)
YÖNETİM         → /tenants, /schools, /users
PAKET & SATIŞ   → /packages, /subscriptions, /finance
GLOBAL VERİLER  → /global/allergens, /global/medical-conditions, /global/medications,
                   /global/food-ingredients, /global/countries, /global/currencies
DESTEK          → /contact-requests
SİSTEM          → /activity-logs, /notifications, /settings
```

### 10.4 Kritik Admin Notları

```typescript
// ActivityLogResource nested yapı:
log.user.name, log.user.email      // (flat user_name değil)
log.model.label, log.model.type
log.context.ip_address, log.context.url
log.changes.old_values, log.changes.new_values

// AdminTenantController::show() nested response:
tenantRes.data.data.tenant  // Tenant nesnesi buradan çıkarılır
tenantRes.data.data.stats   // Stats ayrı nested

// Dashboard stats mapping:
d.tenants.total → total_tenants
d.tenants.with_active_subscription → active_tenants
d.subscriptions.total_revenue → monthly_revenue + total_revenue
```

### 10.5 Admin Backend Endpoint Eşleşmeleri

| Sayfa | Endpoint'ler |
|-------|-------------|
| Dashboard | `GET /admin/dashboard/stats + recent-activities + activity-logs/daily-summary + subscriptions/stats` |
| Tenants | `GET /admin/tenants`, `POST /auth/register`, `DELETE /admin/tenants/:id` |
| Schools | `GET /admin/schools`, `PATCH toggle-status`, `DELETE` |
| Users | `GET /admin/users (?role,?search,?page)`, `POST`, `DELETE` |
| Packages | `GET/POST/PUT/DELETE /admin/packages`, `GET/POST/PUT/DELETE /admin/package-features` |
| Finance | `GET /admin/invoices + transactions + stats` |
| Health | `GET/POST/PUT/DELETE /admin/allergens + medical-conditions + food-ingredients + medications` |
| Subscriptions | `GET /admin/subscriptions + stats`, `PATCH :id/status + :id/extend` |
| Activity Logs | `GET /admin/activity-logs + stats + archive` |
| Countries | `GET /admin/countries`, `POST /admin/countries/sync`, `PATCH :id/toggle-active` |
| Currencies | `GET/POST/PUT/DELETE /admin/currencies` + `fetch-rates + set-base + toggle-status` |

---

## 11. 📱 MOBİL UYGULAMA (React Native + Expo)

### 11.1 Proje Kimliği

| Alan | Değer |
|------|-------|
| **Framework** | React Native 0.83.2 + Expo ~55 |
| **Routing** | Expo Router v3 (file-based, `src/app/`) |
| **State** | React Context (AuthContext) |
| **HTTP** | Axios + AsyncStorage interceptor |
| **Token (Veli)** | `parent_token` (AsyncStorage) |
| **Token (Öğretmen)** | `teacher_token` (AsyncStorage) |
| **API Base** | Android: `http://10.0.2.2:8000/api`, iOS: `http://localhost:8000/api` |

### 11.2 Dizin Yapısı

```
parent-mobile-app/src/app/
├── _layout.tsx              ← Root (AuthContext Provider + authEvent)
├── (auth)/
│   ├── login.tsx            ← Veli giriş
│   ├── teacher-login.tsx    ← Öğretmen giriş → teacher_token
│   ├── teacher-register.tsx ← Öğretmen kayıt
│   └── register.tsx, forgot-password.tsx, verify-email.tsx
├── (teacher-app)/           ← Öğretmen uygulaması (bağımsız)
│   ├── _layout.tsx          ← 5 tab + teacherToken guard
│   ├── index.tsx, profile.tsx
│   ├── classes/[classId]/ → index, attendance, reports
│   ├── children/[childId]/ → index, health, pickup
│   ├── daily/index.tsx
│   └── meal-menu/index.tsx
└── (app)/                   ← Veli uygulaması
    ├── _layout.tsx          ← 5 görünür tab (invoices+teachers gizli)
    ├── index.tsx            ← Global feed + okul feed
    ├── children/ → index, add, [id]/(index, edit, health)
    ├── schools/ → _layout.tsx (Stack), index, join, [id]/index
    ├── meal-menu/ → _layout.tsx, index
    ├── activities/ → _layout.tsx, index, [id].tsx
    ├── teachers/ → _layout.tsx, [id]/(index, blog/[blogId])
    ├── activity-classes/ → _layout.tsx, index, [id].tsx
    ├── invoices/ → _layout.tsx, index, [id].tsx
    ├── family/ → index, emergency.tsx
    └── profile.tsx
```

### 11.3 Kritik Mobil Kurallar

```typescript
// Expo Router Stack Layout ZORUNLU (alt ekran ayrı tab olmasın diye):
// Klasörde _layout.tsx ile Stack navigator tanımlanmalı:
export default function XxxLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

// iOS Nested Modal YASAK — inline dropdown pattern kullan:
// Modal içinde Modal açılmaz (iOS kısıtı)

// Signed URL mobilde Image auth header gönderemez:
// Route middleware: 'signed' (auth:sanctum OLMADAN)
// Frontend: <Image source={{ uri: signedUrl }}> — normal URL kullanımı

// API prefix — tüm veli endpoint'leri /parent/ prefix'li:
api.get('/parent/activity-classes')  // DOĞRU
api.get('/activity-classes')          // YANLIŞ

// Phone code normalizasyonu:
phone_code.replace(/^\+/, '')  // "+90" → "90"

// Tab navigasyonu (2026-04-10 güncel):
// 5 görünür: Akış, Yemek Listesi, Etkinlikler, İstatistikler, Profil
// Gizli (href: null): children, schools, activity-classes, family, invoices
```

### 11.4 AuthEvent Paterni

```typescript
// authEvent.ts:
// authEvent.register(callback) → _layout.tsx'te signOut tetikler
// authEvent.trigger() → api.ts 401 interceptor'ından çağrılır
// authEvent.unregister() → component unmount'ta temizlenir

// 401 akışı:
// api.ts interceptor → AsyncStorage.multiRemove(['parent_token','parent_user'])
//                    → authEvent.trigger()
//                    → _layout.tsx signOut state sıfırla
//                    → (auth)/login'e yönlendir
```

### 11.5 Etkinlik & Yemek Menü (2026-04-11)

**Etkinlik Detay (`show()`):**
- Backend 403 DÖNDÜRMEZ (kayıtsız da erişebilir)
- `canSeeExtras = !is_enrollment_required || is_enrolled` → materials + gallery bu koşulda
- Mobil: ActivityCard HERTA tıklanabilir (`canOpen` kaldırıldı → `isLocked` sadece görsel)

**Yemek Takvimi:**
- `GET /parent/meal-menus/children` → çocuk seçici
- `GET /parent/meal-menus?child_id=X&year=Y&month=M` → aylık grup array
- Response: `[{ date, meals: [{schedule_type, meal: {name, ingredients[{name, allergens[{risk_level}]}]}}] }]`

### 11.6 Fatura Modülü (2026-04-07)

**Dual-strategy sorgu (canonical invoices tablosu):**
- `user_id = auth()->id()` (veli kayıt yaptırdığında)
- VEYA `payable_type = ActivityClassEnrollment` + `payable_id IN (ailenin enrollment_id'leri)` (tenant kayıt yaptırdığında)

---

## 12. 💰 B2B PAKET SİSTEMİ

### Paket Tier'ları

| Paket | Okul Limiti | Sınıf/Okul | Öğrenci | Aylık ₺ | Yıllık ₺ |
|-------|------------|------------|---------|---------|---------|
| **Başlangıç** | 1 | 3 | 30 | 299 | 2.990 |
| **Profesyonel** | 3 | 10 | 200 | 799 | 7.990 |
| **Kurumsal** | ∞ | ∞ | ∞ | 1.999 | 19.990 |

`0` = sınırsız. Limitler `packages` tablosunda `max_schools`, `max_classes_per_school`, `max_students`.

### Limit Kontrolü

```php
// Tenant helper metodları:
$tenant->canCreateSchool()         // Okul oluşturulabilir mi?
$tenant->canCreateClass($schoolId) // Bu okulda sınıf eklenebilir mi?
$tenant->canEnrollStudent()        // Öğrenci kaydedilebilir mi?

// Controller/Service'de:
use App\Traits\ChecksPackageLimits;
$this->checkSchoolLimit($tenant);  // Limit aşıldıysa Türkçe exception fırlatır
```

---

## 13. 🧪 TEST SÜİTİ

```bash
php artisan test                     # 105+ passing / 31 @group bug
php artisan test --exclude-group=bug # 99+ passing / 0 failing
php artisan test tests/Feature/API/  # Tüm API testleri
```

**PHP 8.4 + SQLite Fix:**
- `tests/Database/TestSQLiteConnection.php` — `executeBeginTransactionStatement()` → `PDO::beginTransaction()`
- `tests/TestCase.php` — `Connection::resolverFor('sqlite', ...)` ile kayıt

**Test Yazım Kuralları:**
```php
// Soft-delete assert — deleted_at ekle!
$this->assertDatabaseMissing('allergens', ['id' => $id, 'deleted_at' => null]);

// createMeal() → academic_year_id yoksa otomatik AcademicYear oluşturur
$meal = $this->createMeal($school, $user);
```

---

## 14. 🐛 BİLİNEN HATALAR VE ÇÖZÜM DURUMU

### Tüm Tamamlanan Bug'lar

| Bug ID | Durum | Açıklama |
|--------|-------|---------|
| BUG-001 | ✅ | Global allerjenler index'te görünmüyor → `withoutGlobalScope('tenant')` |
| BUG-002 | ✅ | Global besin öğeleri görünmüyor → aynı çözüm |
| BUG-003 | ✅ | Meal cross-tenant güvenlik → school'a göre tenant kontrolü |
| BUG-004 | ✅ | TenantAllergenController firstOrFail catch → ModelNotFoundException ekle |
| BUG-005 | ✅ | TenantMealController aynı sorun → düzeltildi |
| BUG-006 | ✅ | mealIndex validate() try-catch içinde → dışarı taşındı |
| BUG-007 | ✅ | AcademicYearController aynı sorun → düzeltildi |
| BUG-008 | ✅ | $request->all() → $request->validated() |
| BUG-009 | ✅ | paginatedResponse .resource anti-pattern → kaldırıldı |
| BUG-010 | ✅ | User::schools() eksik → hasManyThrough eklendi |
| BUG-011 | ✅ | assignTeacher iç hata mesajı sızıyor → generic mesaj |
| BUG-012 | ✅ | ClassController/ActivityController nested route positional arg |
| BUG-013 | ✅ | ChildController show/update/destroy positional arg |
| BUG-014 | ✅ | ChildController::show FamilyProfile tenant scope → withoutGlobalScope |
| BUG-015 | ✅ | ChildController::index FamilyProfile scope |
| BUG-016 | ✅ | ParentActivityClassController plain Collection → paginatedResponse fix |
| BUG-017 | ✅ | Mobil activity-classes /parent prefix eksikti → 404/403 |
| BUG-018 | ✅ | Route cache stale → route:clear + container restart |

---

## 15. 📋 BEKLEYEN GÖREVLER

### Backend

| Task ID | Öncelik | Açıklama |
|---------|---------|---------|
| Backend tests | ⏳ | PHP Unit/Feature test dosyaları henüz yazılmamış |
| Payment | ⏳ | iyzico/Stripe gerçek ödeme entegrasyonu (şu an simüle) |
| BUG-004 update | ⏳ | TenantAllergenController::update() firstOrFail → first+null |
| BUG-005 update | ⏳ | TenantMealController::ingredientUpdate() aynı |

### Frontend

| Alan | Durum |
|------|-------|
| Test dosyaları | ⏳ Bekliyor |
| Form validation | ✅ Uygulandı (BE-001→007, FE-001→006 serileri) |

---

## 16. 🏗️ CONTROLLER KODLAMA STANDARDI (Şablon)

```php
class XxxController extends BaseSchoolController  // veya BaseTenantController, BaseController
{
    public function __construct(XxxService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    // READ — Transaction KULLANILmaz
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Model::class);
            $data = $this->service->getAll(request()->all());
            return $this->paginatedResponse($data);
        } catch (\Throwable $e) {
            Log::error('XxxController::index Error', ['message' => $e->getMessage()]);
            return $this->errorResponse('Listeleme hatası.', $e->getCode() ?: 400);
        }
    }

    // WRITE — Transaction KULLANILIR, validate() DIŞARIDA
    public function store(StoreXxxRequest $request): JsonResponse
    {
        // FormRequest validation burada zaten çalışmış → try dışına taşımaya gerek yok
        DB::beginTransaction();
        try {
            $this->authorize('create', Model::class);
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
            Log::error('XxxController::store Error', ['message' => $e->getMessage()]);
            return $this->errorResponse('İşlem sırasında bir hata oluştu.', 500);
        }
    }
}
```

---

## 17. 🌍 ÜLKELER (COUNTRIES) SİSTEMİ

```php
// 250 ülke, RestCountries API v3.1'den senkronize
// Kolon adları: name, iso2, phone_code (+90 formatında), flag_emoji
// NOT: name_tr KOLONU YOK → name kullan
// Sıralama: sort_order (TR:100, US:95, GB:90, DE:85...)
// phone_code üretme: single suffix → root+suffix (+90), multiple → root (+1)

// Frontend normalizasyonu:
const phone_code = c.phone_code.replace(/^\+/, '');  // "+90" → "90"
// Gönderirken:
const fullPhone = `+${selectedCode.phone_code}${phoneNumber}`;  // "+905551234567"
```

---

## 18. 📊 AKTİVİTE LOG SİSTEMİ

```
BaseModel → HistoryObserver
  ├── 1. activity_logs (AUDIT DB) — old_values + new_values + changed_fields
  │      (MongoDB geçişine hazır — FK yok, document-friendly)
  └── 2. {tablo}_histories (ANA DB) — snapshot (geriye dönük uyumluluk)

Queue (AUDIT_ASYNC=true): WriteActivityLog Job
Cron (03:00): audit:maintain (arşivleme + özet + temizleme)
```

**Saklama süresi:** `AUDIT_RETENTION_DAYS=365` (default)
**JSON boyutu:** 64KB limit, auto-truncate

---

## 19. 💱 PARA BİRİMİ SİSTEMİ

```
Tüm fiyatlar BAZ birim (is_base=true) cinsinden saklanır
Dönüşüm: tutar × kur = hedef para birimi
Cron: currency:update-rates (her gün 09:00)
API kaynakları: ExchangeRate-API (default), Open Exchange Rates, Fixer.io
```

```env
CURRENCY_BASE=USD
CURRENCY_API_SOURCE=exchangerate-api
EXCHANGERATE_API_KEY=...
CURRENCY_AUTO_UPDATE=true
CURRENCY_UPDATE_TIME=09:00
```

---

## 20. 🏗️ ETKİNLİK SINIFI (ActivityClass) MİMARİSİ

```
ActivityClass
├── school_id = null  → Tenant geneli (tüm okullarda görünür)
├── school_id = X     → Okul-specific (sadece o okul)
├── is_school_wide    → Okuldaki tüm sınıflar mı?
└── school_class_ids  → Belirli sınıflar (activity_class_school_class_assignments)

ActivityClassEnrollment  ← plain Model (NOT BaseModel)
└── Neden: Parent tenant_id=NULL, BaseModel scope bozar

ActivityClassInvoice  ← is_paid=true kayıtta otomatik oluşur
```

**ParentActivityClassController::index() sorgu mantığı:**

```php
// Ailenin çocuklarının okul + tenant'ları üzerinden etkinlik keşfi:
$schoolIds = Child::withoutGlobalScope('tenant')
    ->where('family_profile_id', $familyProfile->id)
    ->whereNotNull('school_id')->pluck('school_id')->unique()->filter();

$tenantIds = School::whereIn('id', $schoolIds)->pluck('tenant_id')->unique()->filter();

ActivityClass::withoutGlobalScope('tenant')
    ->where('is_active', true)
    ->where(function ($q) use ($schoolIds, $tenantIds) {
        $q->whereIn('school_id', $schoolIds)
          ->orWhere(fn($q2) => $q2->whereNull('school_id')->whereIn('tenant_id', $tenantIds));
    });
```

---

## 21. 🔢 HİBRİT ULID MİMARİSİ

- **Dahili:** INT primary key — ORM ilişkileri, join'ler, pivotlar
- **Harici:** ULID (26 karakter) — API yanıtlarında `id` alanı

**Etkilenen modeller:** User, Child, TeacherProfile, FamilyProfile, School, SchoolClass, ActivityClass, AuthorizedPickup

```php
// HasUlid trait kullanımı:
class School extends BaseModel {
    use HasUlid;
    protected $fillable = ['ulid', ...]; // fillable'a ekle
}

// Factory'de:
'ulid' => (string) Str::ulid()

// Resource'da:
'id' => $this->ulid

// BaseSchoolController çift desteği:
// ULID (26 char) → WHERE ulid = $param
// Integer → WHERE id = $param (legacy uyumluluk)
```

---

## 22. 💡 SIK YAPILAN HATALAR VE ÇÖZÜMLERI

| Hata | Neden | Çözüm |
|------|-------|-------|
| `Storage::disk('private')` crash | Laravel 12'de bu disk yok | `Storage::disk('local')` kullan |
| `app()->isLocal()` config'de crash | App henüz boot olmamış | `env('APP_ENV')` kullan |
| validate() 500 verdi | try-catch içinde | try-catch dışına taşı |
| paginatedResponse resource dönüşümü kayboldu | `.resource` eklendi | `.resource` kaldır |
| API 404 ama route doğru | Route cache | `route:clear` + container restart |
| Veli verisi NULL döndü | tenant scope filtreledi | `withoutGlobalScope('tenant')` |
| `pivot` accessor çalışmadı | Constraint callback eager load | `DB::table(pivot_table)` kullan |
| FK constraint çok uzun | Tablo adı 25+ karakter | Explicit kısa isim ver |
| `ActivityClassEnrollment` tenant filtresi | BaseModel'den türüyor | `plain Model` kullan |
| Mobil Image signed URL çalışmıyor | `auth:sanctum` middleware header gerektiriyor | Yalnızca `signed` middleware kullan |
| Expo Router alt ekran ayrı tab oldu | `_layout.tsx` eksik | Stack navigator tanımla |
| iOS Modal içinde Modal açılmıyor | iOS kısıtı | Inline dropdown pattern kullan |
| Tab'da boş listeyi yeniden fetch ediyor | `data.length === 0` kontrolü | `xxxFetched` flag kullan |
| Docker API eski kod dönüyor | PHP opcache | Container restart (`docker compose restart app`) |
| Tailwind v4 sözdizimi kullandım | `@import "tailwindcss"` | `@tailwind base/components/utilities` |
| `admin_token` yerine `tenant_token` kullandım | Frontend token karışıklığı | Tenant: `tenant_token`, Admin: `admin_token`, Mobil veli: `parent_token`, Mobil öğretmen: `teacher_token` |

---

---

# 🗺️ ROL BAZLI KULLANICI YOLCULUKLARI VE EKRAN HARİTASI

> Bu bölüm, her rolün sistemde hangi adımları izlediğini, hangi ekranlarda neler yapabildiğini ve bu işlemlerin **frontend/backend'de hangi dosyalar tarafından yönetildiğini** kod düzeyinde gösterir. Projeye yeni dahil olan bir yazılımcı bu bölümden hangi dosyayı açması gerektiğini tek bakışta anlamalıdır.

---

## §23. 👑 ROL 1: SUPER ADMIN — Platform Yöneticisi

**Giriş:** `http://localhost:3001/login` | **Token:** `admin_token` (localStorage)

```
Super Admin akışı:
  Giriş → Dashboard → [Tenants | Schools | Users | Packages | Finance | Global Data | System]
```

### Ekran 1: Giriş (`/login`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(auth)/login/page.tsx` |
| **Frontend Layout** | `frontend-admin/app/(auth)/layout.tsx` → sadece `<>{children}</>` |
| **Backend Controller** | `app/Http/Controllers/Auth/AuthController.php` → `login()` |
| **Backend Route** | `POST /api/auth/login` |
| **Yapılabilenler** | E-posta + şifre ile giriş → `admin_token` localStorage'a kaydedilir → `/tenants` yönlendirme |

---

### Ekran 2: Dashboard (`/`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/page.tsx` |
| **Frontend Bileşen** | `frontend-admin/components/dashboard/components-dashboard-istudy.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/AdminDashboardController.php` |
| **Backend Routes** | `GET /api/admin/dashboard/stats`, `GET /api/admin/dashboard/recent-activities`, `GET /api/admin/activity-logs/daily-summary`, `GET /api/admin/subscriptions/stats` |
| **Yapılabilenler** | Toplam tenant/okul/abone sayısı, aktivite grafiği (AreaChart), abonelik dağılımı (BarChart), son aktiviteler listesi |

---

### Ekran 3: Kurumlar / Tenants (`/tenants`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/tenants/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/AdminTenantController.php` |
| **Backend Routes** | `GET /api/admin/tenants`, `POST /api/auth/register`, `DELETE /api/admin/tenants/:id` |
| **Yapılabilenler** | Tüm kurumları listeleme (sayfalı+arama), yeni kurum oluşturma (`auth/register`'a yönlendirir), kurum silme (SweetAlert2 onay), CSV export |

#### Kurum Detay (`/tenants/[id]`)
| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/tenants/[id]/page.tsx` |
| **Backend Routes** | `GET /api/admin/tenants/:id` → `{ tenant, stats }` nested |
| **Yapılabilenler** | Kurum bilgileri, bağlı okullar listesi, abonelik geçmişi tab'ları |
| **⚠️ Dikkat** | `tenantRes.data.data.tenant` ile Tenant nesnesi çıkarılır; `.data.data` değil! |

---

### Ekran 4: Okullar (`/schools`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/schools/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/AdminSchoolController.php` |
| **Backend Routes** | `GET /api/admin/schools`, `PATCH /api/admin/schools/:id/toggle-status`, `DELETE /api/admin/schools/:id` |
| **Yapılabilenler** | Tüm okulları listeleme, arama/filtre, aktif/pasif toggle, okul silme, CSV export |

#### Okul Detay (`/schools/[id]`)
| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/schools/[id]/page.tsx` |
| **Backend Routes** | `GET /api/admin/schools/:id`, `GET /api/admin/schools/:id/classes`, `GET /api/admin/schools/:id/children` |
| **Yapılabilenler** | Okul bilgileri, sınıf listesi, öğrenci listesi (tab'lar) |

---

### Ekran 5: Kullanıcılar (`/users`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/users/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/AdminUserController.php` |
| **Backend Routes** | `GET /api/admin/users (?role,?search,?page)`, `POST /api/admin/users`, `DELETE /api/admin/users/:id` |
| **Yapılabilenler** | Rol bazlı tab (öğretmen/veli/öğrenci/tümü), arama, sayfalama, kullanıcı oluşturma, silme, profil dialog |

---

### Ekran 6: Paketler (`/packages`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/packages/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/PackageController.php`, `PackageFeatureController.php` |
| **Backend Routes** | `GET/POST/PUT/DELETE /api/admin/packages`, `GET/POST/PUT/DELETE /api/admin/package-features` |
| **Yapılabilenler** | **Tab 1 — Paketler:** Kart görünümü, CRUD modal (max_schools, max_students, fiyatlar, özellik seçimi); **Tab 2 — Özellikler:** Tablo + CRUD (key, label, value_type: bool/text, display_order). Pivot: paket-özellik değeri |

---

### Ekran 7: Abonelikler (`/subscriptions`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/subscriptions/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/AdminSubscriptionController.php` |
| **Backend Routes** | `GET /api/admin/subscriptions`, `GET /api/admin/subscriptions/stats`, `PATCH /api/admin/subscriptions/:id/status`, `PATCH /api/admin/subscriptions/:id/extend` |
| **Yapılabilenler** | Abonelik listesi (durum filtresi), istatistik kartları (aktif/iptal/dolmuş/askıda), abonelik uzatma, iptal |

---

### Ekran 8: Finans (`/finance`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/finance/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/AdminTransactionController.php`, `Billing/InvoiceController.php` |
| **Backend Routes** | `GET /api/admin/invoices`, `GET /api/admin/transactions`, `GET /api/admin/transactions/stats` |
| **Yapılabilenler** | Fatura listesi, POS işlemleri, gelir istatistik kartları |

---

### Ekran 9: Global Veriler (`/global/*`)

| Sayfa | Dosya | Backend Controller | Yapılabilenler |
|-------|-------|--------------------|---------------|
| `/global/allergens` | `frontend-admin/app/(dashboard)/global/allergens/page.tsx` | `AdminHealthController.php` | Allerjen CRUD (ad, açıklama, risk: low/medium/high), XSS regex koruması |
| `/global/medical-conditions` | `global/medical-conditions/page.tsx` | `AdminHealthController.php` | Tıbbi durum CRUD |
| `/global/medications` | `global/medications/page.tsx` | `AdminHealthController.php` | İlaç CRUD (silme hariç güncelleme yok) |
| `/global/food-ingredients` | `global/food-ingredients/page.tsx` | `AdminHealthController.php` | Besin öğesi CRUD + allerjen çoklu seçim (checkbox) |
| `/global/countries` | `global/countries/page.tsx` | `AdminCountryController.php` | 250 ülke listesi, aktif/pasif toggle, API'den sync |
| `/global/currencies` | `global/currencies/page.tsx` | `AdminCurrencyController.php` | Para birimi CRUD, kur güncelleme, baz birim seçimi — baz silinemez |

---

### Ekran 10: Aktivite Logları (`/activity-logs`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/activity-logs/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/AdminActivityLogController.php` |
| **Backend Routes** | `GET /api/admin/activity-logs (?model,?action,?user_id,?date_from,?date_to,?page)`, `GET /api/admin/activity-logs/stats` |
| **Yapılabilenler** | Filtreli log listesi, değişiklik detay dialog (old/new values), istatistik kartları |
| **⚠️ Nested yapı** | `log.user.name`, `log.model.label`, `log.context.ip_address`, `log.changes.old_values` |

---

### Ekran 11: Bildirimler (`/notifications`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-admin/app/(dashboard)/notifications/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Admin/AdminSystemController.php` |
| **Backend Routes** | `GET /api/admin/system/notifications`, `POST /api/admin/system/notifications` |
| **Yapılabilenler** | Geçmiş bildirimler listesi, yeni sistem bildirimi gönderme (hedef kitle seçimi) |

---

## §24. 🏢 ROL 2: TENANT OWNER — Kurum Yöneticisi

**Giriş:** `http://localhost:3002/login` | **Token:** `tenant_token` (localStorage)

```
Tenant Owner akışı:
  Kayıt → Paket Seçimi (Onboarding) → Dashboard
  → [Dashboard | Okullar | Öğretmenler | Yemekler | Etkinlikler | Etkinlik Sınıfları
     | Eğitim Yılları | Abonelik | Faturalar | Bildirimler | Profil]
```

### Onboarding Akışı (İlk Kullanım)

```
1. /register   → Kurum adı + ad/soyad + e-posta + şifre
2. /register/plans → Paket seçimi (aylık/yıllık toggle, plan kartları)
3. /dashboard  → Tam erişim
```

| Adım | Dosya | Backend |
|------|-------|---------|
| Kayıt | `frontend-tenant-and-website/app/(auth)/register/page.tsx` | `Auth/AuthController.php → register()` |
| Paket Seçimi | `frontend-tenant-and-website/app/(auth)/register/plans/page.tsx` | `GET /api/packages`, `POST /api/tenant/subscribe` |
| Dashboard | `frontend-tenant-and-website/app/(tenant)/dashboard/page.tsx` | `GET /api/auth/me`, `/api/tenant/subscription/usage`, `/api/schools` |

---

### Ekran 12: Dashboard (`/dashboard`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/dashboard/page.tsx` |
| **Backend API** | `GET /api/auth/me`, `GET /api/tenant/subscription`, `GET /api/tenant/subscription/usage`, `GET /api/schools` |
| **Yapılabilenler** | Kullanım istatistikleri (okul/sınıf/öğrenci limiti progress bar'ları), son okullar tablosu |

---

### Ekran 13: Okullar (`/schools`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/schools/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Schools/SchoolController.php` |
| **Kullanılan Trait** | `app/Traits/ChecksPackageLimits.php` |
| **Backend Routes** | `GET /api/schools (?page,?search)`, `POST /api/schools`, `PUT /api/schools/{id}`, `DELETE /api/schools/{id}` |
| **Yapılabilenler** | Okul listesi (arama+sayfalama), okul ekleme (modal: ad, şehir, ülke, gsm, whatsapp, fax, registration_code), düzenleme, silme (öğrenci/sınıf varsa 422 hatası), aktif/pasif toggle |

---

### Ekran 14: Okul Detayı (`/schools/[id]`)

Bu sayfa, okulla ilgili tüm yönetimi tek sayfada sunar. **6 sekme** içerir.

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/schools/[id]/page.tsx` (**~160 KB, en büyük dosya**) |
| **Backend Controller'lar** | `SchoolController.php`, `ClassController.php`, `ClassManagementController.php`, `ChildController.php`, `ChildEnrollmentRequestController.php`, `EnrollmentRequestController.php`, `TenantTeacherController.php` |

#### Sekme 1: Sınıflar (`classes`)

| Yapılabilenler | Backend Endpoint |
|----------------|-----------------|
| Sınıf listesi | `GET /api/schools/{id}/classes` |
| Sınıf ekleme/düzenleme/silme | `POST/PUT/DELETE /api/schools/{id}/classes` |
| Sınıfı aktif/pasif yapma | `PATCH /api/schools/{id}/classes/{id}/toggle-status` |
| Öğrenci atama butonu (Baby ikonu) | Sınıfsız öğrencileri listeler, `POST /api/schools/{id}/classes/{classId}/children` |
| Öğretmen atama | `GET/POST/DELETE /api/schools/{id}/classes/{classId}/teachers` |
| Sınıfa tıkla → Detay sayfası | `/schools/[id]/classes/[classId]` |

#### Sekme 2: Öğrenciler (`children`)

| Yapılabilenler | Backend Endpoint |
|----------------|-----------------|
| Öğrenci listesi (veli adı + sınıf badge) | `GET /api/schools/{id}/children` |
| Öğrenci detay modal (sağlık + aile + sınıf) | `GET /api/schools/{id}/children/{id}` |
| Sınıfa ata / Sınıftan çıkar | `POST/DELETE /api/schools/{id}/classes/{classId}/children` |

#### Sekme 3: Öğretmenler (`teachers`)

| Yapılabilenler | Backend Endpoint |
|----------------|-----------------|
| Okul öğretmenleri listesi | `GET /api/schools/{id}/teachers?detailed=1` |
| Öğretmen davet gönder | `POST /api/teachers/invite` |
| Katılma taleplerini görüntüle/onayla/reddet | `GET/PATCH /api/teachers/join-requests/{id}/approve|reject` |
| Öğretmeni okuldan çıkar | `DELETE /api/teachers/{id}/membership` |

#### Sekme 4: Kayıt Talepleri (`requests`) — Veli Talepleri

| Yapılabilenler | Backend Endpoint |
|----------------|-----------------|
| Veli kayıt talepleri listesi | `GET /api/schools/{id}/enrollment-requests` |
| Talebi onayla | `PATCH .../approve` → veli okul üyesi olur |
| Talebi reddet (gerekçe ile) | `PATCH .../reject` |

#### Sekme 5: Veliler (`parents`)

| Yapılabilenler | Backend Endpoint |
|----------------|-----------------|
| Onaylı veliler listesi | `GET /api/schools/{id}/families` |
| Veli detayı (çocukları ile) | `EnrollmentRequestController.php → parentsForSchool()` |

#### Sekme 6: Onay Bekleyen Öğrenciler (`child-requests`)

| Yapılabilenler | Backend Endpoint |
|----------------|-----------------|
| Çocuk kayıt talepleri | `GET /api/schools/{id}/child-enrollment-requests` |
| Talebi onayla → `children.school_id` set | `PATCH .../approve` |
| Talebi reddet (min 5 karakter gerekçe) | `PATCH .../reject` |
| **Backend Controller** | `app/Http/Controllers/Schools/ChildEnrollmentRequestController.php` |

---

### Ekran 15: Sınıf Detayı (`/schools/[id]/classes/[classId]`)

**4 sekme** içerir.

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/schools/[id]/classes/[classId]/page.tsx` |
| **Backend Controller'lar** | `ClassManagementController.php`, `AttendanceController.php`, `MealMenuController.php` |

| Sekme | Yapılabilenler | Backend Endpoint |
|-------|----------------|-----------------|
| **Öğrenciler** | Sınıfın öğrenci listesi, öğrenci çıkarma | `GET /api/schools/{id}/classes/{classId}/children` |
| **Devamsızlık** | Tarih seç, öğrenci başına durum (present/absent/late/excused) | `GET/POST /api/schools/{id}/attendances ?class_id&date` |
| **İhtiyaç Listesi** | Materyal CRUD (ad, miktar, teslim tarihi), soft-delete | `GET/POST/PUT/DELETE /api/schools/{id}/classes/{classId}/supply-list` |
| **Yemek Takvimi** | Aylık ızgara görünümü, günlük yemek ataması | `GET /api/meal-menus/monthly ?school_id&year&month` |

---

### Ekran 16: Öğretmenler (`/teachers`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/teachers/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Schools/TenantTeacherController.php` |
| **Backend Routes** | `GET /api/teachers`, `POST /api/teachers/invite`, `PUT /api/teachers/{id}`, `DELETE /api/teachers/{id}/membership`, `GET/POST/DELETE /api/teachers/{id}/schools/{schoolId}` |
| **Yapılabilenler** | Tenant öğretmen listesi, öğretmen davet (e-posta), katılma talepleri onay/red, okul atama, deaktif/aktif etme, profil güncelleme. **Öğretmen ekleme (POST /teachers) 405 döner** — yalnızca davet veya katılma talebi ile eklenebilir |

---

### Ekran 17: Yemekler (`/meals`)

**3 sekme** içerir.

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/meals/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Schools/TenantMealController.php`, `TenantAllergenController.php` |

| Sekme | Yapılabilenler | Backend Endpoint |
|-------|----------------|-----------------|
| **Yemekler** | Okul seçici, yemek listesi, yemek ekleme (ad + öğün türü dropdown + besin öğesi checkbox, min 1 zorunlu), düzenleme, silme | `GET/POST/PUT/DELETE /api/meals` |
| **Besin Öğeleri** | Global (tenant_id=null) + kuruma özel listesi; yeni besin ekleme (allerjen checkbox multi-select); düzenleme (sadece kendi tenant'ı); silme (sadece is_custom=true) | `GET/POST/PUT/DELETE /api/food-ingredients` |
| **Allerjenler** | Tenant özel allerjen CRUD | `GET/POST/PUT/DELETE /api/allergens` |

---

### Ekran 18: Etkinlikler (`/activities`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/activities/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Schools/ActivityController.php` |
| **Backend Routes** | `GET/POST/PUT/DELETE /api/schools/{id}/activities`, `GET /api/schools/{id}/activities/{id}/enrollments`, `GET/POST/DELETE /api/schools/{id}/activities/{id}/gallery` |

| Yapılabilenler | Detay |
|----------------|-------|
| Okul seçici + etkinlik listesi (kart grid) | Kart: ad, tarih aralığı, ücret badge, sınıf listesi |
| Etkinlik ekleme/düzenleme (modal) | Ad, açıklama, okul (required), sınıf checkbox, is_paid + fiyat, start_date + end_date, start_time + end_time, cancellation_allowed + cancellation_deadline, materyaller (string[] JSON) |
| Etkinlik silme | SweetAlert2 onay |
| Etkinlik detay sayfası | `/activities/[id]` → 3 sekme: Detaylar, Katılımcılar, Galeri |
| Katılımcı listesi | `GET /api/schools/{id}/activities/{id}/enrollments` → veli adı + kayıt tarihi |
| Galeri yönetimi | `GET/POST /api/schools/{id}/activities/{id}/gallery`, `DELETE .../gallery/{id}` |

---

### Ekran 19: Etkinlik Sınıfları (`/activity-classes`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa (Liste)** | `frontend-tenant-and-website/app/(tenant)/activity-classes/page.tsx` |
| **Frontend Sayfa (Detay)** | `frontend-tenant-and-website/app/(tenant)/activity-classes/[id]/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Schools/TenantActivityClassController.php` |
| **Backend Routes** | `GET/POST/PUT/DELETE /api/activity-classes`, alt: `enrollments`, `teachers`, `materials`, `gallery`, `invoices` |

| Yapılabilenler | Detay |
|----------------|-------|
| Okul filtresi (opsiyonel — null = tüm tenant okulları) | `filterSchoolId` state ile liste filtresi |
| Etkinlik sınıfı ekleme/düzenleme | school_id opsiyonel, is_active, is_school_wide, sınıf checkbox listesi |
| **Detay sayfası 6 sekme** | Genel Bilgi, Kayıtlar, Öğretmenler, Materyaller, Galeri, Faturalar |
| Kayıt yönetimi | Çocuk ekle/çıkar, invoice durumu görüntüle |
| Galeri | Signed URL'ler (2 saatlik), upload, silme |

---

### Ekran 20: Eğitim Yılları (`/academic-years`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/academic-years/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Schools/AcademicYearController.php` |
| **Backend Routes** | `GET /api/academic-years ?school_id`, `GET /api/academic-years/global-list`, `POST/PUT/DELETE /api/academic-years`, `PATCH .../set-current`, `PATCH .../close` |

| Yapılabilenler | Detay |
|----------------|-------|
| Okul seçici | Eğitim yılları okul bazlı |
| Yıl seçimi (dropdown) | `GET /api/academic-years/global-list` → 100 yıllık liste → start_date/end_date otomatik dolar |
| Aktif Yap | `PATCH .../set-current` (SweetAlert2 onay) |
| Kapat | `PATCH .../close` |
| Silme | Aktif eğitim yılı silinemez (422) |

---

### Ekran 21: Abonelik (`/subscription`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/subscription/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Tenant/SubscriptionController.php` |
| **Backend Routes** | `GET /api/tenant/subscription`, `GET /api/tenant/subscription/history`, `GET /api/tenant/subscription/usage`, `POST /api/tenant/subscribe`, `POST /api/tenant/subscription/cancel` |
| **Yapılabilenler** | Mevcut plan kartı, kullanım çubukları (okul/sınıf/öğrenci), \"Planı Değiştir/Yükselt\" bölümü (tüm paket kartları), geçmiş listesi, iptal |

---

### Ekran 22: Faturalar (`/invoices`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/invoices/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Billing/InvoiceController.php` |
| **Backend Routes** | `GET /api/invoices/tenant (?page,?status,?module)` |
| **Yapılabilenler** | Sayfalı fatura listesi, durum badge (pending/paid/overdue/refunded/cancelled), modül filtresi |

---

### Ekran 23: Bildirimler (`/notifications`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/notifications/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Schools/NotificationController.php` |

| Sekme | Yapılabilenler | Backend Endpoint |
|-------|----------------|-----------------|
| **Gelen Kutusu** | Okunmamış → mavi nokta + bg-primary/5; bireysel okundu işaret; Tümünü okundu işaret; sayfalama | `GET /api/notifications`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all` |
| **Bildirim Gönder** | Okul (required), sınıf (opsiyonel), tür (announcement/event/activity/meal/attendance/material/homework/general), öncelik (low/normal/high/urgent), başlık, mesaj | `POST /api/notifications` |

---

### Ekran 24: Profil (`/profile`)

| Alan | Dosya |
|------|-------|
| **Frontend Sayfa** | `frontend-tenant-and-website/app/(tenant)/profile/page.tsx` |
| **Backend Controller** | `app/Http/Controllers/Auth/AuthController.php` |
| **Backend Routes** | `GET /api/auth/me`, `PUT /api/auth/me`, `POST /api/auth/change-password` |
| **Yapılabilenler** | **2 bağımsız kart:** (1) Profil formu: ad, soyad, e-posta → `PUT /auth/me`; (2) Şifre formu: current_password, password, password_confirmation → `POST /auth/change-password` |

---

## §25. 👪 ROL 3: VELİ — Mobil Uygulama Kullanıcısı

**Giriş:** Mobil uygulama — `parent_token` (AsyncStorage)

```
Veli Akışı:
  Kayıt / Giriş
  → Ana Akış (Tab: Akış | Yemek Listesi | Etkinlikler | İstatistikler | Profil)
  → Profil'den: Çocuklarım | Okullarım | Faturalarım | Aile Yönetimi
```

### Kayıt & Giriş

| Alan | Dosya | Backend |
|------|-------|---------|
| **Giriş Ekranı** | `src/app/(auth)/login.tsx` | `POST /api/parent/auth/login` → `parent_token` → AsyncStorage |
| **Kayıt Ekranı** | `src/app/(auth)/register.tsx` | `POST /api/parent/auth/register` |
| **Şifre Sıfırla** | `src/app/(auth)/forgot-password.tsx` | `POST /api/parent/auth/forgot-password` → deep link e-posta |
| **E-posta Doğrula** | `src/app/(auth)/verify-email.tsx` | `GET /api/parent/auth/verify-email/{id}/{hash}` |

---

### Tab 1: Akış (Ana Ekran) (`/(app)/index.tsx`)

| Alan | Dosya |
|------|-------|
| **Ekran** | `src/app/(app)/index.tsx` |
| **Backend Controller** | `app/Http/Controllers/Parents/ParentSchoolController.php` |
| **Backend Routes** | `GET /api/parent/feed/global`, `GET /api/parent/schools/{id}/feed` |
| **Yapılabilenler** | Global soysal feed + kayıtlı okulların feed'leri, gönderi react (like/heart/clap), yorum yapma, öğretmen profil kartına tıklama → `/(app)/teachers/[id]` |

---

### Tab 2: Yemek Listesi (`/(app)/meal-menu/`)

| Alan | Dosya |
|------|-------|
| **Ekran** | `src/app/(app)/meal-menu/index.tsx` |
| **Backend Controller** | `app/Http/Controllers/Parents/ParentMealMenuController.php` |
| **Backend Routes** | `GET /api/parent/meal-menus/children`, `GET /api/parent/meal-menus?child_id=X&year=Y&month=M` |
| **Yapılabilenler** | Çocuk seçici (tek çocukta otomatik), ay navigasyonu (gelecek aya geçilemez), accordion günler (DayCard), öğün listesi → besin öğeleri → allerjen chip+risk badge |

---

### Tab 3: Etkinlikler (`/(app)/activities/`)

| Alan | Dosya | Backend |
|------|-------|---------|
| **Liste Ekranı** | `src/app/(app)/activities/index.tsx` | `GET /api/parent/activities`, `GET /api/parent/activity-classes` |
| **Etkinlik Detay** | `src/app/(app)/activities/event/[id].tsx` | `GET /api/parent/activities/{id}` |
| **Etkinlik Sınıfı Detay** | `src/app/(app)/activities/[id].tsx` | `GET /api/parent/activity-classes/{id}` |

| Yapılabilenler | Detay |
|----------------|-------|
| 2 sekme: Etkinlikler / Etkinlik Sınıfları | Tab geçişi Animated.Value ile kayar gösterge |
| Etkinlik kartı tıklama | HER ZAMAN tıklanabilir (kilitli olsa da) — `isLocked` sadece görsel |
| Etkinliğe katıl | `POST /api/parent/activities/{id}/enroll` — ücretliyse backend otomatik fatura oluşturur |
| Etkinlikten ayrıl | `DELETE .../unenroll` — iptal politikası: cancellation_allowed + deadline kontrolü |
| Etkinlik Sınıfına kayıt | `POST /api/parent/activity-classes/{id}/enroll {child_id}` |
| Galeri | `GET /api/parent/activities/{id}/gallery` → signed URL (sadece kayıtlıya) |

---

### Profil'den Erişilen Ekranlar

#### Çocuklarım (`/(app)/children/`)

| Ekran | Dosya | Backend |
|-------|-------|---------|
| **Liste** | `src/app/(app)/children/index.tsx` | `GET /api/parent/children` |
| **Ekle** | `src/app/(app)/children/add.tsx` | `POST /api/parent/children` |
| **Detay** | `src/app/(app)/children/[id]/index.tsx` | `GET /api/parent/children/{id}` |
| **Düzenle** | `src/app/(app)/children/[id]/edit.tsx` | `PUT /api/parent/children/{id}` |
| **Sağlık** | `src/app/(app)/children/[id]/health.tsx` | `POST /api/parent/children/{id}/allergens\|medications\|conditions` |

| Yapılabilenler | Detay |
|----------------|-------|
| Çocuk profil fotoğrafı | Avatar tıkla → kamera/galeri alert → `POST /api/parent/children/{id}/profile-photo` (multipart) → signed URL döner |
| Allerjen/hastalık/ilaç ekleme | Listeden seç (approved) VEYA özel ekle (→ pending suggestion, amber badge) |
| Okul bilgisi | Kayıtlı okul varsa tıklanabilir mavi badge → okul detay |
| Kan grubu | Modal picker (8 seçenek) |
| Doğum tarihi | Custom ScrollView picker (YY/MM/GG) |
| Uyruk + Kimlik | TR: TC Kimlik No; Diğer: toggle TC/Pasaport |

#### Okullarım (`/(app)/schools/`)

| Ekran | Dosya | Backend |
|-------|-------|---------|
| **Liste** | `src/app/(app)/schools/index.tsx` | `GET /api/parent/schools` |
| **Okula Katıl** | `src/app/(app)/schools/join.tsx` | `POST /api/parent/schools/join {registration_code}` |
| **Okul Detay** | `src/app/(app)/schools/[id]/index.tsx` | `GET /api/parent/schools/{id}`, `POST /api/parent/schools/{id}/enroll-child` |

| Yapılabilenler | Detay |
|----------------|-------|
| Okulları listele / Okula katıl (davet kodu) | `registration_code` ile |
| Okul sosyal feed | `GET /api/parent/schools/{id}/feed` |
| Çocuğu okula ekle (kayıt talebi) | Henüz kayıtlı olmayan çocukları listeler → talebi oluştur → tenant onayına gider → `POST /api/parent/schools/{schoolId}/enroll-child {child_id}` |
| Etkinlik Sınıfları quick link | `/(app)/activity-classes` ekranına yönlendirir |

#### Faturalarım (`/(app)/invoices/`)

| Ekran | Dosya | Backend |
|-------|-------|---------|
| **Liste** | `src/app/(app)/invoices/index.tsx` | `GET /api/parent/invoices`, `GET /api/parent/invoices/stats` |
| **Detay** | `src/app/(app)/invoices/[id].tsx` | `GET /api/parent/invoices/{id}` |

| Yapılabilenler | Detay |
|----------------|-------|
| Stats kartları | Bekleyen / Gecikmiş / Ödendi |
| Fatura listesi | Modül badge (Etkinlik Sınıfı / Abonelik / vb.), durum badge, overdue → kırmızı, refund → mor |
| Fatura detayı | Kalemler tablosu, ödeme işlemleri geçmişi, iade/orijinal fatura iki yönlü link |

#### Aile Yönetimi (`/(app)/family/`)

| Ekran | Dosya | Backend |
|-------|-------|---------|
| **Üyeler** | `src/app/(app)/family/index.tsx` | `GET/POST/DELETE /api/parent/family/members` |
| **Acil Durum** | `src/app/(app)/family/emergency.tsx` | `GET/POST/PUT/DELETE /api/parent/family/emergency-contacts` |

| Yapılabilenler | Detay |
|----------------|-------|
| Ko-veli ekle | Sadece `super_parent` ekleyebilir; e-posta ile; hedef sistemde kayıtlı olmalı |
| Ko-veli çıkar | `super_parent` herkesi kaldırır; `co_parent` sadece kendini |
| Acil kişi | Telefon (ülke kodu dropdown), uyruk, kimlik/pasaport (opsiyonel) |
| **iOS kısıtı** | Modal içinde Modal açılmaz → inline dropdown zorunlu |

---

## §26. 👩‍🏫 ROL 4: ÖĞRETMEN — Mobil Uygulama (teacher-app grubu)

**Giriş:** Aynı mobil uygulama, `teacher-login.tsx` → `teacher_token` (AsyncStorage)

```
Öğretmen Akışı:
  Kayıt/Giriş → tenant'a davet bekle VEYA join kodu ile katıl
  → Ana Öğretmen App (Tab: Sınıflarım | Günlük | Yemek Menüsü | Profil)
```

### Kayıt & Tenant Bağlantısı

| Adım | Dosya | Backend |
|------|-------|---------|
| Öğretmen kaydı | `src/app/(auth)/teacher-register.tsx` | `POST /api/teacher/auth/register` — tenant'dan bağımsız kendi hesabı |
| Öğretmen girişi | `src/app/(auth)/teacher-login.tsx` | `POST /api/teacher/auth/login` → `teacher_token` |
| Davet kodu ile katıl | `/(teacher-app)/profile.tsx` modali | `POST /api/teacher/memberships/join {invite_code}` |
| Daveti kabul/reddet | `/(teacher-app)/profile.tsx` | `PATCH /api/teacher/memberships/{id}/accept\|reject` |

---

### Tab 1: Sınıflarım (`/(teacher-app)/classes/`)

| Ekran | Dosya | Backend |
|-------|-------|---------|
| **Sınıf Listesi** | `src/app/(teacher-app)/classes/index.tsx` | `GET /api/teacher/classes` — sadece atandığı sınıflar |
| **Sınıf Detayı** | `src/app/(teacher-app)/classes/[classId]/index.tsx` | `GET /api/teacher/classes/{classId}`, `/children` |
| **Yoklama** | `src/app/(teacher-app)/classes/[classId]/attendance.tsx` | `GET/POST /api/teacher/attendance` |
| **Günlük Raporlar** | `src/app/(teacher-app)/classes/[classId]/reports.tsx` | `TeacherDailyReportController.php` |

| Yapılabilenler | Detay |
|----------------|-------|
| Sınıf detayı | Öğrenci listesi: alerjen badge + ilaç badge |
| Yoklama girişi | Tarih seçici + her öğrenci için durum butonu (present/absent/late/excused) |
| Günlük rapor | Mood + iştah + notlar modal |

---

### Öğrenci Yönetimi (`/(teacher-app)/children/`)

| Ekran | Dosya | Backend |
|-------|-------|---------|
| **Öğrenci Detay** | `src/app/(teacher-app)/children/[childId]/index.tsx` | `GET /api/teacher/children/{childId}`, `today-medications` |
| **Sağlık Bilgileri** | `src/app/(teacher-app)/children/[childId]/health.tsx` | (read-only: allerjenler/hastalıklar/ilaçlar) |
| **Teslim İşlemi** | `src/app/(teacher-app)/children/[childId]/pickup.tsx` | `GET /api/teacher/children/{childId}/authorized-pickups`, `POST .../record-pickup` |

| Yapılabilenler | Detay |
|----------------|-------|
| İlaç ver | `POST /api/teacher/medications/mark-given {child_id, medication_id?, custom_name?, dose?, note?}` |
| Teslim et | Yetkili listesi + fotoğraf + `POST .../record-pickup` (multipart/form-data) |
| İlaç geçmişi | `GET /api/teacher/medications/given-logs/{childId}` |
| Teslim geçmişi | `GET /api/teacher/children/{childId}/pickup-logs` |

---

### Tab 2: Günlük Özet (`/(teacher-app)/daily/`)

| Ekran | Dosya | Backend |
|-------|-------|---------|
| **Günlük** | `src/app/(teacher-app)/daily/index.tsx` | `GET /api/teacher/attendance ?class_id&date` |
| **Yapılabilenler** | Tüm sınıfların günlük yoklama durumu özeti |

---

### Tab 3: Yemek Menüsü (`/(teacher-app)/meal-menu/`)

| Ekran | Dosya | Backend |
|-------|-------|---------|
| **Menü** | `src/app/(teacher-app)/meal-menu/index.tsx` | `GET /api/teacher/meal-menus ?class_id&date` |
| **Yapılabilenler** | Günün yemek menüsü + öğrenci alerjen uyarıları (allerjen × menü çapraz kontrolü) |

---

### Tab 4: Profil (`/(teacher-app)/profile.tsx`)

| Backend Controller | `app/Http/Controllers/Teachers/TeacherAuthController.php`, `TeacherMembershipController.php`, `TeacherBlogController.php` |
|---|---|
| **Yapılabilenler** | Bekleyen davetleri kabul/reddet, üyesi olduğu tenant listesi, daveti kabul et/reddet modal, tenant'a katılma talebi (invite_code gir), blog yazıları listesi, çıkış |

---

### Öğretmen Blog (Tenant Portalında Görünür, Veliler Takip Edebilir)

| Backend Controller | `app/Http/Controllers/Teachers/TeacherBlogController.php` |
|---|---|
| **Veli Takip** | `GET/POST/DELETE /api/parent/teachers/{id}/follow` |
| **Veli Feed** | `GET /api/parent/teacher-feed` → takip edilen öğretmenlerin blog akışı |
| **Veli Etkileşim** | `POST/DELETE /api/parent/teacher-blogs/{id}/like|comments` |
| **Blog görseli** | Signed route: `GET /api/teacher/blogs/{id}/image` → `middleware: 'signed'` |

---

## §27. 🌐 ROL 5: ZİYARETÇİ — Kamuya Açık Web Sitesi

**Erişim:** `http://localhost:3002` | **Token gerektirmez**

| Sayfa | Frontend Dosya | Yapılabilenler | Backend |
|-------|----------------|----------------|---------|
| **Ana Sayfa** | `frontend-tenant-and-website/app/(website)/page.tsx` | Platform tanıtımı, fiyatlandırma özeti, kayıt CTA | `GET /api/packages` |
| **Pricing** | `app/(website)/pricing/page.tsx` | Detaylı plan karşılaştırması, aylık/yıllık toggle | `GET /api/packages` |
| **About** | `app/(website)/about/page.tsx` | Hakkımızda içeriği | — |
| **Contact** | `app/(website)/contact/page.tsx` | İletişim formu | `POST /api/contact-requests` → `ContactRequestController.php` |

**Layout:** `PublicNavbar` + `PublicFooter` (server component, token gerekmez)

---

## §28. 📁 MASTER DOSYA-EKRAN REFERANSİ

Bu tablo, ekran adından ilgili backend ve frontend dosyalarına hızlıca ulaşmak içindir.

### Backend Controllers → Endpoint Grupları

| Controller | Yol | Yönettiği |
|------------|-----|-----------|
| `AuthController` | `app/Http/Controllers/Auth/` | Giriş, Kayıt, Şifre sıfırlama, Me, Çıkış |
| `SchoolController` | `Controllers/Schools/` | Okul CRUD, limit kontrol (ChecksPackageLimits) |
| `ClassController` | `Controllers/Schools/` | Sınıf CRUD, toggle-status |
| `ClassManagementController` | `Controllers/Schools/` | Öğretmen-sınıf ataması, supply-list, sınıf-öğrenci ataması |
| `ChildController` | `Controllers/Schools/` | Okul bazlı çocuk yönetimi |
| `ChildEnrollmentRequestController` | `Controllers/Schools/` | Çocuk kayıt talepleri (tenant tarafı) |
| `EnrollmentRequestController` | `Controllers/Schools/` | Veli kayıt talepleri, veli listesi |
| `ActivityController` | `Controllers/Schools/` | Etkinlik CRUD, gallery, enrollments |
| `AcademicYearController` | `Controllers/Schools/` | Eğitim yılı CRUD, set-current, close, global-list |
| `TenantMealController` | `Controllers/Schools/` | Yemek + besin öğesi CRUD |
| `TenantAllergenController` | `Controllers/Schools/` | Tenant allerjen CRUD |
| `TenantActivityClassController` | `Controllers/Schools/` | Etkinlik sınıfı CRUD + tüm alt kaynaklar |
| `TenantTeacherController` | `Controllers/Schools/` | Öğretmen üyeliği, davet, onay |
| `NotificationController` | `Controllers/Schools/` | Bildirim gönder/al |
| `MealMenuController` | `Controllers/Schools/` | Aylık yemek takvimi (tenant) |
| `SocialPostController` | `Controllers/Schools/` | Sosyal gönderi CRUD, react, yorum |
| `ParentAuthController` | `Controllers/Parents/` | Veli kayıt/giriş/şifre |
| `ParentChildController` | `Controllers/Parents/` | Çocuk CRUD, sağlık, fotoğraf |
| `ParentSchoolController` | `Controllers/Parents/` | Okul listesi, katılma, feed, çocuk kayıt talebi |
| `ParentActivityController` | `Controllers/Parents/` | Etkinlik keşif + kayıt/iptal |
| `ParentActivityClassController` | `Controllers/Parents/` | Etkinlik sınıfı keşif + kayıt/iptal |
| `ParentMealMenuController` | `Controllers/Parents/` | Çocuk yemek takvimi |
| `ParentInvoiceController` | `Controllers/Parents/` | Fatura listesi (dual-strategy sorgu) |
| `ParentFamilyController` | `Controllers/Parents/` | Aile üyesi + acil durum kişisi CRUD |
| `ParentTeacherController` | `Controllers/Parents/` | Öğretmen profil, takip |
| `ParentTeacherBlogController` | `Controllers/Parents/` | Blog beğeni + yorum |
| `TeacherAuthController` | `Controllers/Teachers/` | Öğretmen kayıt/giriş/me/çıkış |
| `TeacherClassController` | `Controllers/Teachers/` | Öğretmenin sınıfları |
| `TeacherChildController` | `Controllers/Teachers/` | Çocuk detay + bugünün ilaçları |
| `TeacherMedicationController` | `Controllers/Teachers/` | İlaç ver, log |
| `TeacherPickupController` | `Controllers/Teachers/` | Teslim talebi + fotoğraf + log |
| `TeacherAttendanceController` | `Controllers/Teachers/` | Yoklama giriş/sorgulama |
| `TeacherMealMenuController` | `Controllers/Teachers/` | Günlük menü + alerjen uyarısı |
| `TeacherBlogController` | `Controllers/Teachers/` | Blog CRUD + görsel (signed) |
| `TeacherMembershipController` | `Controllers/Teachers/` | Tenant bağlantısı, davet, join |
| `AdminDashboardController` | `Controllers/Admin/` | Sistem istatistikleri |
| `AdminTenantController` | `Controllers/Admin/` | Tenant listeleme + detay |
| `AdminSchoolController` | `Controllers/Admin/` | Okul yönetimi (admin) |
| `AdminUserController` | `Controllers/Admin/` | Kullanıcı yönetimi |
| `AdminHealthController` | `Controllers/Admin/` | Global allerjen/besin/ilaç/tıbbi durum CRUD |
| `AdminSubscriptionController` | `Controllers/Admin/` | Abonelik yönetimi |
| `AdminActivityLogController` | `Controllers/Admin/` | Aktivite log listeleme |
| `AdminCountryController` | `Controllers/Admin/` | Ülke yönetimi + sync |
| `AdminCurrencyController` | `Controllers/Admin/` | Para birimi + kur |
| `PackageController` | `Controllers/Admin/` | Paket CRUD |
| `PackageFeatureController` | `Controllers/Admin/` | Paket özelliği CRUD |

### Frontend Sayfa → Dosya Haritası (Tenant)

| URL | Dosya |
|-----|-------|
| `localhost:3002` | `frontend-tenant-and-website/app/(website)/page.tsx` |
| `localhost:3002/login` | `app/(auth)/login/page.tsx` |
| `localhost:3002/register` | `app/(auth)/register/page.tsx` |
| `localhost:3002/register/plans` | `app/(auth)/register/plans/page.tsx` |
| `localhost:3002/dashboard` | `app/(tenant)/dashboard/page.tsx` |
| `localhost:3002/schools` | `app/(tenant)/schools/page.tsx` |
| `localhost:3002/schools/[id]` | `app/(tenant)/schools/[id]/page.tsx` |
| `localhost:3002/schools/[id]/classes/[classId]` | `app/(tenant)/schools/[id]/classes/[classId]/page.tsx` |
| `localhost:3002/teachers` | `app/(tenant)/teachers/page.tsx` |
| `localhost:3002/meals` | `app/(tenant)/meals/page.tsx` |
| `localhost:3002/activities` | `app/(tenant)/activities/page.tsx` |
| `localhost:3002/activities/[id]` | `app/(tenant)/activities/[id]/page.tsx` |
| `localhost:3002/activity-classes` | `app/(tenant)/activity-classes/page.tsx` |
| `localhost:3002/activity-classes/[id]` | `app/(tenant)/activity-classes/[id]/page.tsx` |
| `localhost:3002/academic-years` | `app/(tenant)/academic-years/page.tsx` |
| `localhost:3002/subscription` | `app/(tenant)/subscription/page.tsx` |
| `localhost:3002/invoices` | `app/(tenant)/invoices/page.tsx` |
| `localhost:3002/notifications` | `app/(tenant)/notifications/page.tsx` |
| `localhost:3002/profile` | `app/(tenant)/profile/page.tsx` |

### Frontend Sayfa → Dosya Haritası (Admin)

| URL | Dosya |
|-----|-------|
| `localhost:3001` | `frontend-admin/app/page.tsx` (auth check + redirect) |
| `localhost:3001/login` | `frontend-admin/app/(auth)/login/page.tsx` |
| `localhost:3001/` → Dashboard | `frontend-admin/app/(dashboard)/page.tsx` |
| `localhost:3001/tenants` | `app/(dashboard)/tenants/page.tsx` |
| `localhost:3001/tenants/[id]` | `app/(dashboard)/tenants/[id]/page.tsx` |
| `localhost:3001/schools` | `app/(dashboard)/schools/page.tsx` |
| `localhost:3001/schools/[id]` | `app/(dashboard)/schools/[id]/page.tsx` |
| `localhost:3001/users` | `app/(dashboard)/users/page.tsx` |
| `localhost:3001/packages` | `app/(dashboard)/packages/page.tsx` |
| `localhost:3001/finance` | `app/(dashboard)/finance/page.tsx` |
| `localhost:3001/subscriptions` | `app/(dashboard)/subscriptions/page.tsx` |
| `localhost:3001/global/allergens` | `app/(dashboard)/global/allergens/page.tsx` |
| `localhost:3001/global/countries` | `app/(dashboard)/global/countries/page.tsx` |
| `localhost:3001/global/currencies` | `app/(dashboard)/global/currencies/page.tsx` |
| `localhost:3001/activity-logs` | `app/(dashboard)/activity-logs/page.tsx` |
| `localhost:3001/notifications` | `app/(dashboard)/notifications/page.tsx` |

### Mobil Ekran → Dosya Haritası

| Ekran | Dosya |
|-------|-------|
| Veli giriş | `src/app/(auth)/login.tsx` |
| Öğretmen giriş | `src/app/(auth)/teacher-login.tsx` |
| Ana akış (feed) | `src/app/(app)/index.tsx` |
| Yemek takvimi | `src/app/(app)/meal-menu/index.tsx` |
| Etkinlikler listesi | `src/app/(app)/activities/index.tsx` |
| Etkinlik detay | `src/app/(app)/activities/event/[id].tsx` |
| Etkinlik sınıfı detay | `src/app/(app)/activities/[id].tsx` |
| Çocuk listesi | `src/app/(app)/children/index.tsx` |
| Çocuk detay | `src/app/(app)/children/[id]/index.tsx` |
| Çocuk sağlık | `src/app/(app)/children/[id]/health.tsx` |
| Okul listesi | `src/app/(app)/schools/index.tsx` |
| Okul detay | `src/app/(app)/schools/[id]/index.tsx` |
| Faturalar | `src/app/(app)/invoices/index.tsx` |
| Aile yönetimi | `src/app/(app)/family/index.tsx` |
| Acil durum kişileri | `src/app/(app)/family/emergency.tsx` |
| Veli profil | `src/app/(app)/profile.tsx` |
| Öğretmen ana sayfa | `src/app/(teacher-app)/index.tsx` |
| Sınıf listesi (öğretmen) | `src/app/(teacher-app)/classes/index.tsx` |
| Sınıf detay (öğretmen) | `src/app/(teacher-app)/classes/[classId]/index.tsx` |
| Yoklama | `src/app/(teacher-app)/classes/[classId]/attendance.tsx` |
| Günlük raporlar | `src/app/(teacher-app)/classes/[classId]/reports.tsx` |
| Öğrenci detay (öğretmen) | `src/app/(teacher-app)/children/[childId]/index.tsx` |
| Sağlık (öğretmen görünümü) | `src/app/(teacher-app)/children/[childId]/health.tsx` |
| Teslim işlemi | `src/app/(teacher-app)/children/[childId]/pickup.tsx` |
| Yemek menüsü (öğretmen) | `src/app/(teacher-app)/meal-menu/index.tsx` |
| Öğretmen profil | `src/app/(teacher-app)/profile.tsx` |

---

---

# 🔧 PROFESYONELGÖRÜŞLEr — İYİLEŞTİRMELER VE DÜZELTMELER

> Bu bölüm, mevcut kaynak kodun profesyonel bir incelemesi sonucunda tespit edilen eksiklikler, güvenlik açıkları ve geliştirme önerileridir. Öncelik sırasıyla sıralanmıştır.

---

## §29. 🚀 DAY-1 KURULUM REHBERİ (Yeni Geliştirici)

### Ön Gereksinimler

| Araç | Minimum Versiyon | Kontrol Komutu |
|------|-----------------|----------------|
| PHP | 8.4 | `php --version` |
| Composer | 2.x | `composer --version` |
| Node.js | 22.x | `node --version` |
| Docker Desktop | 4.x | `docker --version` |
| Git | 2.x | `git --version` |

### Adım 1: Backend Kurulumu

```bash
# 1. Repoyu klonla
git clone <repo-url> istudy-backend
cd istudy-backend

# 2. PHP bağımlılıklarını yükle
composer install

# 3. .env dosyasını oluştur
cp .env.example .env

# 4. Uygulama anahtarı oluştur
php artisan key:generate
```

### Adım 2: .env Dosyasını Düzenle

```env
# Zorunlu değiştirilecekler:
DB_HOST=db          # Docker içinde 'db'
DB_DATABASE=istudy
DB_USERNAME=istudy
DB_PASSWORD=password

REDIS_HOST=redis    # Docker içinde 'redis'
REDIS_CLIENT=phpredis

AUDIT_DB_CONNECTION=mysql  # Docker'da ana DB'yi kullan

TENANT_FRONTEND_URL=http://localhost:3002

APP_DEBUG=false     # ASLA true bırakma
```

### Adım 3: Docker ile Başlat

```bash
cd dockerfiles
docker compose up -d --build   # İlk seferde --build ile

# Başarıyla başladığını doğrula:
docker compose ps              # Tüm servisler 'Up' olmalı
```

### Adım 4: Migration + Seed

```bash
# Migration çalıştır (önemli: container içinde!)
docker compose exec app php artisan migrate

# Ülke verilerini yükle
docker compose exec app php artisan countries:sync

# (Opsiyonel) Test verisi
docker compose exec app php artisan db:seed
```

### Adım 5: Frontend Admin Kurulumu

```bash
# Ayrı terminal - Admin paneli
cd frontend-admin
npm install
npm run dev      # http://localhost:3001
```

### Adım 6: Frontend Tenant Kurulumu

```bash
# Ayrı terminal - Tenant portalı
cd frontend-tenant-and-website
npm install
npm run dev      # http://localhost:3002
```

### Adım 7: Mobil Kurulum

```bash
# Ayrı terminal - Mobil uygulama
cd parent-mobile-app
npm install
npx expo start   # QR kodu tara (Expo Go) veya emülatör

# Android emülatör için API base:
# http://10.0.2.2:8000/api
# iOS simülatör için:
# http://localhost:8000/api
```

### Adım 8: Kurulumu Doğrula

```bash
# API çalışıyor mu?
curl http://localhost:8000/api/health
# → { "success": true, "message": "API is running" }

# Test suite geçiyor mu?
docker compose exec app php artisan test --exclude-group=bug
# → X tests passed, 0 failed

# Route'lar yüklü mü?
docker compose exec app php artisan route:list | head -30
```

### Sık Karşılaşılan Sorunlar

| Sorun | Neden | Çözüm |
|-------|-------|-------|
| API 404 döndürüyor | Route cache | `php artisan route:clear` + container restart |
| API eski kod döndürüyor | PHP opcache | `docker compose restart app` |
| Frontend "Network Error" | CORS veya API adresi yanlış | `.env.local` içinde `NEXT_PUBLIC_API_URL=http://localhost:8000/api` |
| Migration hatası | Eksik migration | `php artisan migrate:status` ile hangisinin eksik olduğunu bul |
| `composer install` PHP version hatası | PHP 8.4 gerektiriyor | `php --version` kontrol et |
| Docker container başlamıyor | Port çakışması | `lsof -i :8000` ile çakışan process'i bul |

---

## §30. 🔐 GÜVENLİK AUDIT ÖZETİ

> **Kaynak:** `SECURITY_AUDIT_REPORT.md` (2026-07-10 tarihli kapsamlı denetim)
> **Metodoloji:** OWASP Top 10, STRIDE, kaynak kod incelemesi + sızma testi analizi

### Genel Durum

| Seviye | Toplam | Çözüldü | AÇIK |
|--------|--------|---------|------|
| 🔴 CRITICAL | 7 | 6 | **1** |
| 🟠 HIGH | 8 | 8 | 0 |
| 🟡 MEDIUM | 5 | 5 | 0 |
| 🔵 LOW | 4 | 3 | **1** |

### ⚠️ AÇIK KALAN GÜVENLİK AÇIKLARI

#### C-1 🔴 CRITICAL — Payment Webhook HMAC Doğrulaması Devre Dışı

```
Dosya: app/Http/Controllers/Billing/InvoiceController.php
Endpoint'ler: POST /api/payment/success, /payment/fail, /payment/callback
Durum: ⏳ AÇIK — ödeme sağlayıcısı entegrasyonu bekleniyor
```

**Risk:** Saldırgan HMAC doğrulaması olmadan herhangi bir faturayı "ödendi" olarak işaretleyebilir. Çocuk ücretsiz etkinliğe kayıt yaptırabilir, tüm ödeme sistemi atlatılabilir.

```php
// MEVCUT DURUM (tehlikeli):
public function paymentSuccess(Request $request): JsonResponse
{
    // $this->verifyCallbackHash($request);  // ← TAMAMEN DEVRE DIŞI!
    $transaction = $this->invoiceService->handlePaymentSuccess(
        $request->input('order_id'),
        $request->all()   // Doğrulanmamış veri!
    );
}

// OLMASI GEREKEN:
public function paymentSuccess(Request $request): JsonResponse
{
    // 1. IP allowlist kontrolü
    if (!in_array($request->ip(), config('payment.allowed_ips', []))) {
        abort(403);
    }
    // 2. HMAC imza doğrulaması (PayTR/iyzico'ya göre)
    if (!$this->verifyCallbackHash($request, config('payment.default_gateway'))) {
        Log::warning('Invalid payment callback signature', $request->all());
        return response()->json(['status' => 'failed'], 400);
    }
    // ...
}
```

**Acil Yapılacak:** iyzico veya PayTR entegre edildiğinde `verifyCallbackHash()` metodunu etkinleştir. Ödeme sağlayıcısının HMAC dokümanını referans al.

---

#### L-1 🔵 LOW — APP_ENV Production'da `local` Kalmamalı

```
Dosya: .env
Durum: ⏳ AÇIK — deployment pipeline kurulacak
```

```env
# MEVCUT (hatalı):
APP_ENV=local

# OLMASI GEREKEN:
APP_ENV=production
```

**Çözüm:** Deploy pipeline'a eklenmeli:
```bash
if [ "$APP_ENV" != "production" ]; then
    echo "HATA: APP_ENV production değil!" && exit 1
fi
```

---

### ✅ Düzeltilmiş Kritik Bulgular (Referans)

| ID | Açıklama | Düzeltilen Dosya |
|----|----------|------------------|
| C-2 | İlaç logu sınıf ataması kontrolü | `TeacherMedicationController.php` |
| C-3 | Teslim kaydı sınıf ataması kontrolü | `TeacherPickupController.php` |
| C-4 | Öğrenci detayı IDOR | `TeacherChildController.php` |
| C-5 | Etkinlik sınıfı IDOR (tenant izolasyonu) | `ParentActivityClassController.php` |
| C-6 | Çocuk kayıt talebi tenant doğrulaması | `ChildEnrollmentRequestController.php` → `BaseSchoolController`'a taşındı |
| C-7 | Yetkili alıcı listesi sınıf kontrolü | `TeacherPickupController.php` |
| H-1 | Fatura school_id tenant doğrulaması | `InvoiceController.php` |
| H-2 | Exception mesajı sızıntısı | `BaseController.php` + `bootstrap/app.php` |
| H-3 | Veli/Öğretmen şifre güçlülük kuralı | `ParentAuthController.php`, `TeacherAuthController.php` |
| H-4 | Galeri yetki kontrolü | `ParentActivityClassController.php` |
| H-5 | Kayıt race condition | `ParentActivityClassController.php` → `lockForUpdate()` |
| H-6 | Çocuk fotoğrafı Cache-Control | `ParentChildController.php` |
| H-7 | forgot-password throttle | `routes/api.php` (`throttle:3,1`) |
| H-8 | BaseModel `Schema::hasColumn` N+1 | `BaseModel.php` → static cache |
| M-1 | CORS production domain'leri | `config/cors.php` |
| M-2 | İmzalı URL süresi (2h → 30dk/1h) | `ActivityClassGalleryController.php` |
| M-3 | Parent forgot-password throttle | `routes/api.php` |
| M-4 | Security HTTP headers | `SecurityHeaders.php` middleware (yeni) |
| M-5 | Yoklama child_id doğrulaması | `TeacherAttendanceController.php` |
| L-2 | Sanctum token scope ayrımı | `ParentAuthController.php`, `TeacherAuthController.php` |
| L-3 | Dosya adı sanitize | `ActivityClassGalleryController.php` |
| L-4 | errorResponse HTTP kod validasyonu | `BaseController.php` |

### Güvenlik Pattern'leri (Kod Yazarken Kullan)

```php
// ✅ Tenant izolasyonu — withoutGlobalScope kullanan her sorguda kontrol:
$activityClass = ActivityClass::withoutGlobalScope('tenant')
    ->where(fn($q) => $q
        ->whereIn('school_id', $allowedSchoolIds)
        ->orWhere(fn($q2) => $q2->whereNull('school_id')->whereIn('tenant_id', $allowedTenantIds))
    )
    ->findOrFail($id);

// ✅ Race condition — kapasite/duplicate kontrolü:
DB::transaction(function () use ($activityClass, $child) {
    $count = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
        ->lockForUpdate()->count();
    if ($count >= $activityClass->capacity) {
        throw new \RuntimeException('Kapasite dolu.');
    }
    ActivityClassEnrollment::create([...]);
});

// ✅ Öğretmen — sınıf ataması kontrolü:
$isAssigned = SchoolClass::whereHas('teachers', fn($q) =>
    $q->where('teacher_profile_id', $profile->id)
)->whereHas('children', fn($q) =>
    $q->where('children.id', $childId)
)->exists();
if (!$isAssigned) return $this->errorResponse('Erişim yetkiniz yok.', 403);

// ✅ Exception mesajı sızdırma önleme:
} catch (\Throwable $e) {
    DB::rollBack();
    Log::error('ModuleController::store Error', ['message' => $e->getMessage()]);
    return $this->errorResponse('İşlem sırasında bir hata oluştu.', 500); // iç mesajı gizle
}
```

---

## §31. 🔗 ELOQUENT İLİŞKİ HARİTASI

Bu harita, model ilişkilerini kodlayacak AI ajanlar ve yeni geliştiriciler için hızlı referanstır.

### Temel İlişki Zincirleri

```
User
  ├── hasMany(TeacherProfile, 'user_id')        → Bir user'ın öğretmen profili
  └── belongsTo(Tenant, 'tenant_id')            → Hangi tenant'a ait

Tenant
  ├── hasMany(School)
  ├── hasMany(TenantSubscription)
  ├── hasMany(Package) [through subscription]
  └── hasOne(TenantSubscription) → activeSubscription()

School
  ├── belongsTo(Tenant)
  ├── hasMany(AcademicYear)
  ├── hasMany(SchoolClass, 'school_id')
  ├── hasMany(Activity)
  ├── hasMany(Meal)
  ├── hasMany(TeacherProfile) [through school_teacher_assignments]
  ├── hasMany(Child)                            → school_id ile
  └── hasManyThrough(TeacherProfile, ...)

SchoolClass
  ├── belongsTo(School)
  ├── belongsTo(AcademicYear)
  ├── belongsToMany(Child, 'child_class_assignments')
  ├── belongsToMany(TeacherProfile, 'class_teacher_assignments')
  └── belongsToMany(Activity, 'activity_class_assignments')

Child
  ├── belongsTo(School)                         → nullable
  ├── belongsTo(AcademicYear)                   → nullable
  ├── belongsTo(FamilyProfile)
  ├── belongsToMany(SchoolClass, 'child_class_assignments')
  ├── belongsToMany(Allergen, 'child_allergens')
  ├── belongsToMany(Medication, 'child_medications')
  ├── belongsToMany(MedicalCondition, 'child_conditions')
  └── hasMany(AuthorizedPickup)

FamilyProfile
  ├── hasMany(Child)
  ├── belongsTo(User, 'owner_user_id')          → super_parent
  ├── belongsToMany(User, 'family_members')     → co_parent'lar
  └── hasMany(FamilyEmergencyContact)

TeacherProfile
  ├── belongsTo(User)
  ├── belongsTo(Tenant)
  ├── belongsToMany(School, 'school_teacher_assignments')
  │     └── withPivot(employment_type, teacher_role_type_id)
  ├── belongsToMany(SchoolClass, 'class_teacher_assignments')
  └── hasMany(TeacherBlog)

Meal
  ├── belongsTo(School)
  ├── belongsTo(AcademicYear)                   → nullable
  └── belongsToMany(FoodIngredient, 'meal_ingredient_pivot')

FoodIngredient
  ├── belongsTo(Tenant)                         → nullable = global
  └── belongsToMany(Allergen, 'food_ingredient_allergens')
      └── withoutGlobalScopes()                 ← ZORUNLU

Allergen
  ├── belongsTo(Tenant)                         → nullable = global
  └── belongsToMany(FoodIngredient)

Activity
  ├── belongsTo(School)
  ├── belongsTo(AcademicYear)                   → nullable
  ├── belongsToMany(SchoolClass, 'activity_class_assignments')
  └── hasMany(ActivityGallery)

ActivityClass
  ├── belongsTo(Tenant)
  ├── belongsTo(School)                         → nullable = tenant-wide
  ├── hasMany(ActivityClassEnrollment)
  ├── belongsToMany(TeacherProfile, 'activity_class_teachers')
  ├── hasMany(ActivityClassMaterial)
  └── hasMany(ActivityClassGallery)

ActivityClassEnrollment   ← plain Model (NOT BaseModel)
  ├── belongsTo(ActivityClass)
  ├── belongsTo(Child)
  └── hasOne(ActivityClassInvoice)

SocialPost
  ├── belongsTo(School)
  ├── belongsTo(Tenant)
  ├── belongsTo(User, 'author_id')
  ├── hasMany(SocialPostMedia)
  ├── hasMany(SocialPostReaction)
  ├── hasMany(SocialPostComment)
  └── belongsToMany(SchoolClass, 'social_post_class_tags')

TenantSubscription
  ├── belongsTo(Tenant)
  └── belongsTo(Package)

Package
  ├── hasMany(TenantSubscription)
  └── belongsToMany(PackageFeature, 'package_feature_pivot')
      └── withPivot('value')
```

### Kritik İlişki Kuralları

```php
// 1. BaseModel türeyen tüm modellerde tenant scope otomatik
//    Exception: ActivityClassEnrollment → plain Model

// 2. Global veri (allerjen, besin, tıbbi) tenant_id=NULL
//    Sorgu: ->withoutGlobalScope('tenant') veya
//           ->where(fn($q) => $q->whereNull('tenant_id')->orWhere('tenant_id', $user->tenant_id))

// 3. Veli (FamilyProfile) her zaman withoutGlobalScope:
$child->load(['familyProfile' => fn($q) => $q->withoutGlobalScope('tenant')]);

// 4. belongsToMany pivot'a erişim için withPivot() şart:
$class->teachers()->withPivot('employment_type')->get();
// Constraint callback ile eager load'da ->pivot çalışmaz → DB::table() kullan
```

---

## §32. 📊 HTTP STATUS KODU REHBERI

Bu tablo, hangi durumda hangi HTTP kodunun dönmesi gerektiğini netleştirir.

### Backend → Frontend Durum Kodu Sözleşmesi

| Kod | Anlamı | iStudy'de Ne Zaman Kullanılır |
|-----|--------|-------------------------------|
| `200` | Başarılı | GET, PUT, PATCH, DELETE başarılı |
| `201` | Oluşturuldu | POST ile yeni kayıt store() |
| `400` | Geçersiz İstek | Genel iş mantığı hataları (`errorResponse()` default) |
| `401` | Auth Yok | Sanctum token eksik veya geçersiz → `bootstrap/app.php` global handler |
| `403` | Yetki Yok | Policy reddi, tenant izolasyon ihlali, okul erişim reddi |
| `404` | Bulunamadı | `findOrFail()` başarısız → `ModelNotFoundException` |
| `409` | Çakışma | Zaten kayıtlı (enrollment duplicate), is_current çakışması |
| `422` | Doğrulama Hatası | FormRequest validation başarısız, iş kuralı ihlali (limit aşımı, silme koruması) |
| `429` | Çok Fazla İstek | `throttle` middleware devreye girdi |
| `500` | Sunucu Hatası | Beklenmeyen exception → `Throwable` catch → generic mesaj |
| `503` | Servis Dışı | Maintenance mode |

### Örnek Kullanım

```php
// 201 — Yeni kayıt:
return $this->successResponse(XxxResource::make($item), 'Kayıt oluşturuldu.', 201);

// 403 — Tenant izolasyon:
return $this->errorResponse('Bu kaynağa erişim yetkiniz yok.', 403);

// 404 — Model bulunamadı:
} catch (ModelNotFoundException) {
    DB::rollBack();
    return $this->errorResponse('Kayıt bulunamadı.', 404);
}

// 409 — Çakışma:
return $this->errorResponse('Bu çocuk zaten bu etkinliğe kayıtlı.', 409);

// 422 — İş kuralı:
return $this->errorResponse('Aktif eğitim yılı silinemez.', 422);
```

### Frontend Hata Yakalama Kalıbı

```typescript
} catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string }; status?: number } };
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
        // Token geçersiz — logout
        localStorage.removeItem('tenant_token');
        router.push('/login');
    } else if (status === 403) {
        toast.error('Bu işlem için yetkiniz yok.');
    } else if (status === 422) {
        toast.error(message ?? 'Doğrulama hatası.');
    } else {
        toast.error(message ?? 'İşlem sırasında bir hata oluştu.');
    }
}
```

---

## §33. 🚢 PRODUCTION KONTROL LİSTESİ

> Yayına çıkmadan önce bu listedeki her madde işaretlenmiş olmalıdır.

### 🔴 Blokçu — Bunlar Olmadan Yayına Çıkılmaz

- [ ] **C-1** ödeme webhook HMAC doğrulaması aktif (`InvoiceController.php`)
- [ ] `APP_ENV=production` (`.env`)
- [ ] `APP_DEBUG=false` (`.env`)
- [ ] `APP_KEY` üretildi ve güvenli saklandı (`php artisan key:generate`)
- [ ] Tüm migration'lar çalıştırıldı (`php artisan migrate --force`)
- [ ] SSL sertifikası geçerli (Let's Encrypt veya commercial)
- [ ] CORS `allowed_origins` production domain'lerini içeriyor
- [ ] Ödeme entegrasyonu test edildi (sandbox → production geçişi)
- [ ] Super Admin hesabı oluşturuldu ve şifresi güvenli
- [ ] Tüm testler geçiyor (`php artisan test`)

### 🟠 Önemli — En Kısa Sürede Tamamlanmalı

- [ ] `AUDIT_DB_DATABASE=istudy_audit` (ayrı DB) production'da
- [ ] Redis produksiyon yapılandırması (`REDIS_HOST`, `REDIS_PASSWORD`)
- [ ] Queue worker çalışıyor (`php artisan queue:work` veya Supervisor)
- [ ] Cron job aktif (`* * * * * cd /app && php artisan schedule:run`)
- [ ] Database backup stratejisi belirlendi (günlük otomatik yedek)
- [ ] Log rotation yapılandırıldı (`LOG_CHANNEL=daily`)
- [ ] `php artisan config:cache && route:cache && view:cache` çalıştırıldı
- [ ] Nginx gzip compression aktif
- [ ] `composer audit` — bilinen güvenlik açığı yok
- [ ] `npm audit` — frontend bağımlılıklarında açık yok

### 🟡 Kalite — En İyi Pratikler

- [ ] `SecurityHeaders` middleware aktif
- [ ] Rate limiting Redis tabanlı (`CACHE_DRIVER=redis`)
- [ ] PII log maskeleme (`Log::info` içinde e-posta/telefon maskelendi)
- [ ] Telescope/Horizon auth ile korunuyor (kullanılıyorsa)
- [ ] DB kullanıcısı minimal yetki (sadece SELECT/INSERT/UPDATE/DELETE)
- [ ] `APP_ENV` deploy pipeline'da kontrol ediliyor
- [ ] Frontend `.env.production` değerleri doğru (`NEXT_PUBLIC_API_URL=https://api.istudy.com`)
- [ ] Mobil app API base URL production'a işaret ediyor

### Queue / Cron Gereksinimleri

```bash
# Queue worker (Supervisor ile yönetilmeli):
php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600

# Zamanlanmış görevler (crontab):
* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1

# Schedule edilen görevler:
# - currency:update-rates (her gün 09:00)
# - audit:maintain (her gün 03:00 — arşivleme + özet + temizleme)
```

### Seeder ile Test Verisi

```bash
# Temel seed (paketler, global allerjenler, ülkeler):
php artisan db:seed

# Belirli bir seeder:
php artisan db:seed --class=GlobalAcademicYearSeeder
php artisan db:seed --class=PackageSeeder

# Taze kurulum (dikkat: tüm veri silinir!):
php artisan migrate:fresh --seed
```

---

## §34. 🌿 GİT VE GELİŞTİRME AKIŞI

### Branch Stratejisi

```
main          ← Production (her zaman çalışır, doğrudan push YASAK)
develop       ← Aktif geliştirme (feature'lar buraya merge edilir)
feature/xxx   ← Yeni özellik (develop'tan açılır, develop'a merge edilir)
bugfix/xxx    ← Hata düzeltme
hotfix/xxx    ← Production acil düzeltme (main'den açılır, hem main hem develop'a merge)
release/x.y.z ← Release hazırlık
```

```
[feature/xxx] → PR → [develop]
[develop]     → PR → [release/x.y.z]
[release/x.y.z] → PR → [main] (tag: v1.2.3)
```

### Commit Mesaj Formatı

```
<tip>(<kapsam>): <kısa açıklama>

<gövde — opsiyonel>

<footer — opsiyonel, örn. Closes #123>
```

**Tipler:**

| Tip | Ne Zaman |
|-----|----------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltme |
| `refactor` | Yeniden yapılandırma (davranış değişmez) |
| `test` | Test ekleme/güncelleme |
| `docs` | Dokümantasyon |
| `style` | Format, boşluk (pint çıktısı) |
| `chore` | Bağımlılık güncelleme, CI config |
| `security` | Güvenlik düzeltmesi |

**Örnekler:**
```
feat(meals): add meal_type free-string support, remove academic_year required
fix(teachers): resolve nested route positional arg TypeError in ClassController
security(teachers): add class assignment check in TeacherMedicationController
refactor(base): replace Schema::hasColumn N+1 with static cache in BaseModel
test(api): add feature tests for ActivityClass enrollment endpoints
```

### PR Checklist (Merge Öncesi)

```
□ Değiştirilen PHP dosyaları Pint ile formatlandı (vendor/bin/pint --dirty)
□ Yeni endpoint için test yazıldı
□ Tüm testler geçiyor (php artisan test)
□ Migration varsa PHP içinde açıklamalı (kolon tipi, FK stratejisi)
□ Tenant izolasyonu kırılmıyor (withoutGlobalScope ve ardından tenant kontrolü)
□ paginatedResponse .resource anti-pattern yok
□ validate() try-catch dışında
□ Write işlemleri DB::beginTransaction() ile sarılı
□ Catch blokları gerçek mesajı client'a sızdırmıyor
□ Docker restart gerektirip gerektirmediği PR açıklamasında belirtildi
```

### Sık Kullanılan Geliştirici Komutları

```bash
# Backend
vendor/bin/pint --dirty                    # Kod formatla
php artisan test                           # Tüm testler
php artisan test --filter=SchoolTest       # Belirli test
php artisan test --coverage-html coverage  # Kapsam raporu
php artisan route:list --path=api/schools  # Route listesi filtreli
php artisan make:model Xxx -mfsc           # Model+Migration+Factory+Seeder+Controller
php artisan make:request StoreXxxRequest   # FormRequest
php artisan make:resource XxxResource      # API Resource
php artisan make:policy XxxPolicy --model=Xxx

# Frontend
npm run dev           # Geliştirme sunucusu
npm run build         # Production build (hata var mı kontrol)
npm run lint          # ESLint

# Docker
docker compose logs app -f                 # Laravel logları canlı
docker compose exec app bash               # Container'a gir
docker compose exec app php artisan tinker # REPL
docker compose exec db mysql -u istudy -p  # MySQL CLI
```

---

## §35. 🗂️ EKSİK/TAMAMLANMAMIŞ MODÜLLER

Bu bölüm, kaynak kodda bulunan ancak hafıza dosyalarında tam olarak belgelenmeyen bileşenleri listeler. Üzerinde çalışmadan önce bu modüllerin kaynak kodunu doğrudan incelemek gerekir.

### Eksik Controller Dokümantasyonu

| Controller | Yol | Tahmini Görev | Durum |
|------------|-----|---------------|-------|
| `HomeworkController` | `Controllers/Schools/` | Ödev CRUD (classes bağlantılı) | 📄 Kodlanmış, UI belirsiz |
| `ReportTemplateController` | `Controllers/Schools/` | Günlük rapor şablonları | 📄 Kodlanmış, UI belirsiz |
| `AnnouncementController` | `Controllers/Schools/` | Okul duyuruları | 📄 Kodlanmış, UI belirsiz |
| `PendingApprovalsController` | `Controllers/Schools/` | Bekleyen onay listesi (genel) | 📄 Kodlanmış |
| `SchoolRoleController` | `Controllers/Schools/` | Okul bazlı rol atamaları | 📄 Kodlanmış |
| `SchoolParentController` | `Controllers/Schools/` | Okul veli listesi yönetimi | 📄 Kodlanmış |
| `FamilyProfileController` | `Controllers/Schools/` | Aile profil yönetimi (tenant tarafı) | 📄 Kodlanmış |
| `TeacherApprovalController` | `Controllers/Schools/` | Öğretmen onay süreci | 📄 Kodlanmış |
| `TeacherProfileController` | `Controllers/Teachers/` | Öğretmen CV + profil (detaylı) | 📄 Kodlanmış, ~19KB |
| `ChildFieldChangeRequestController` | `Controllers/Schools/` | Çocuk bilgi değişiklik talebi | 📄 Kodlanmış |
| `ChildRemovalRequestController` | `Controllers/Schools/` | Çocuk kayıt silme talebi | 📄 Kodlanmış |
| `TeacherDailyReportController` | `Controllers/Teachers/` | Öğretmen günlük rapor CRUD | 📄 Kodlanmış |

### Eksik Frontend Sayfa Dokümantasyonu

| URL | Dosya | Tahmini İçerik |
|-----|-------|----------------|
| `localhost:3002/approvals` | `app/(tenant)/approvals/page.tsx` | Bekleyen onay listesi (veli/öğrenci/öğretmen talepleri) |
| `localhost:3002/social` | `app/(tenant)/social/page.tsx` | Sosyal gönderi yönetim paneli |
| `localhost:3001/contact-requests` | `app/(dashboard)/contact-requests/page.tsx` | İletişim formu başvuruları |
| `localhost:3001/health/*` | `app/(dashboard)/health/*` | Eski global sağlık verileri sayfası (global/ ile çakışıyor olabilir) |
| `localhost:3001/apps/invoice/*` | `app/(dashboard)/apps/invoice/*` | Fatura önizleme/print |

### Tamamlanmamış Özellikler

| Özellik | Durum | Notlar |
|---------|-------|--------|
| **iyzico/Stripe ödeme** | 🔶 Simülasyon | `InvoiceController.php` — `paymentSuccess/Fail/Callback` metodları hazır ama HMAC doğrulaması devre dışı |
| **2FA (İki Faktörlü Auth)** | ⭕ Yok | tenant_owner ve school_admin için planlandı |
| **Push Notification** | ⭕ Yok | FCM/APNs entegrasyonu yok; in-app notification sistemi var |
| **Ödev (Homework)** | 🔶 Backend hazır | Frontend UI bilinmiyor |
| **Günlük Rapor (DailyChildReport)** | 🔶 Backend hazır | Öğretmen mobilde kısmi |
| **Duyurular (Announcement)** | 🔶 Backend hazır | Frontend UI bilinmiyor |
| **CV Modülü (TeacherProfile)** | 🔶 Backend hazır | Çok detaylı (~19KB controller), frontend tam implemente mi bilinmiyor |

---

> **📝 Not:** Bu master dosya OKUNMAK için oluşturulmuştur, değiştirilmemesi önerilir. Proje hafıza güncellemeleri için `PROJECT_MEMORY.md`, `PROJECT_MEMORY_FRONTEND.md`, `PROJECT_MEMORY_FRONTEND_ADMIN.md`, `PROJECT_MEMORY_MOBILE.md` dosyalarını güncelleyin. CLAUDE.md yönetim kurallarına uymak kritiktir.

---

*AI_MASTER_CONTEXT.md — Son güncelleme: 2026-04-09 | §1–§35 | ~2700 satır*
