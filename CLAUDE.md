<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to enhance the user's satisfaction building Laravel applications.

## Foundational Context
This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4.10
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/pint (PINT) - v1


## Conventions
- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts
- Do not create verification scripts or tinker when tests cover that functionality and prove it works. Unit and feature tests are more important.

## Application Structure & Architecture
- Stick to existing directory structure - don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling
- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Replies
- Be concise in your explanations - focus on what's important rather than explaining obvious details.

## Documentation Files
- You must only create documentation files if explicitly requested by the user.


=== boost rules ===

## Laravel Boost
- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan
- Use the `list-artisan-commands` tool when you need to call an Artisan command to double check the available parameters.

## URLs
- Whenever you share a project URL with the user you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain / IP, and port.

## Tinker / Debugging
- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool
- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)
- Boost comes with a powerful `search-docs` tool you should use before any other approaches. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation specific for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- The 'search-docs' tool is perfect for all Laravel related packages, including Laravel, Inertia, Livewire, Filament, Tailwind, Pest, Nova, Nightwatch, etc.
- You must use this tool to search for Laravel-ecosystem documentation before falling back to other approaches.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic based queries to start. For example: `['rate limiting', 'routing rate limiting', 'routing']`.
- Do not add package names to queries - package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax
- You can and should pass multiple queries at once. The most relevant results will be returned first.

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit"
3. Quoted Phrases (Exact Position) - query="infinite scroll" - Words must be adjacent and in that order
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit"
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms


=== php rules ===

## PHP

- Always use curly braces for control structures, even if it has one line.

### Constructors
- Use PHP 8 constructor property promotion in `__construct()`.
    - <code-snippet>public function __construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters.

### Type Declarations
- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Comments
- Prefer PHPDoc blocks over comments. Never use comments within the code itself unless there is something _very_ complex going on.

## PHPDoc Blocks
- Add useful array shape type definitions for arrays when appropriate.

## Enums
- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.


=== laravel/core rules ===

## Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Database
- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation
- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources
- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

### Controllers & Validation
- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

### Queues
- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

### Authentication & Authorization
- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

### URL Generation
- When generating links to other pages, prefer named routes and the `route()` function.

### Configuration
- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

### Testing
- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] <name>` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

### Vite Error
- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.


=== laravel/v12 rules ===

## Laravel 12

- Use the `search-docs` tool to get version specific documentation.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

### Laravel 12 Structure
- No middleware files in `app/Http/Middleware/`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- **No app\Console\Kernel.php** - use `bootstrap/app.php` or `routes/console.php` for console configuration.
- **Commands auto-register** - files in `app/Console/Commands/` are automatically available and do not require manual registration.

### Database
- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 11 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models
- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.


=== pint/core rules ===

## Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test`, simply run `vendor/bin/pint` to fix any formatting issues.
</laravel-boost-guidelines>

---

# iStudy — Tam Proje Bilgi Tabanı

> Son güncelleme: 2026-04-02 | Multi-tenant SaaS anaokulu/kreş yönetim sistemi

---

## 1. Proje Kimliği & Stack

| Katman | Teknoloji | Port | Token |
|--------|-----------|------|-------|
| **Backend** | Laravel 12 / PHP 8.4, MySQL 8, Sanctum, Docker | 8000 (dev) / 443 (Docker HTTPS) | Bearer (Sanctum) |
| **Frontend Admin** | Next.js 16 App Router, TypeScript 5, Tailwind v3, Redux, Vristo | 3001 | `admin_token` (localStorage) |
| **Frontend Tenant** | Next.js 16 App Router, TypeScript 5, Tailwind v3, Redux, Vristo | 3002 | `tenant_token` (localStorage) |
| **Mobil (Veli)** | React Native 0.83.2 + Expo ~55, Expo Router v3 | Android: `10.0.2.2:8000` / iOS: `localhost:8000` | `parent_token` (AsyncStorage) |

**Proje yolları:**
- Backend: `istudy-backend/`
- Frontend Tenant: `istudy-backend/frontend-tenant-and-website/`
- Frontend Admin: `istudy-backend/frontend-admin/`
- Mobil: `istudy-backend/parent-mobile-app/`

---

## 2. Multi-Tenant Mimari

```
SUPER ADMIN → tüm tenant'lar
Tenant (kurum) → 1..N Schools → Classes → Children / Teachers / Families
```

**Rol hiyerarşisi:** `super_admin` > `tenant_owner` > `school_admin` > `teacher` > `parent`

**BaseModel global scope:** Her `BaseModel` türevi modelde `WHERE {table}.tenant_id = auth()->user()->tenant_id` otomatik uygulanır. `User` modeli `Authenticatable`'dan türer — scope yok.

**Veli kullanıcılar `tenant_id = NULL`** — `FamilyProfile`, allerjenler, ilaçlar, rahatsızlıklar hepsinin `tenant_id = NULL`. Tenant admin bu verileri yüklerken `withoutGlobalScope('tenant')` ZORUNLU:

```php
// ChildController — aile/sağlık verileri:
->with(['familyProfile' => fn($q) => $q->withoutGlobalScope('tenant')->with('owner')])
'allergens'   => fn($q) => $q->withoutGlobalScope('tenant'),
'medications' => fn($q) => $q->withoutGlobalScope('tenant'),
'conditions'  => fn($q) => $q->withoutGlobalScope('tenant'),

// EnrollmentRequestService::parentsForSchool():
FamilyProfile::withoutGlobalScope('tenant')
    ->whereHas('schools', fn($q) => $q->where('schools.id', $schoolId))
    ->with(['children' => fn($q) => $q->withoutGlobalScope('tenant')->where('school_id', $schoolId)])
```

---

## 3. Docker & Geliştirme Ortamı

```bash
# Tüm servisleri başlat
cd dockerfiles && docker compose up -d

# Migration
docker compose -f dockerfiles/docker-compose.yml exec app php artisan migrate

# PHP opcache reset (PHP dosyası değişince ZORUNLU)
docker compose -f dockerfiles/docker-compose.yml restart app

# Route cache temizle (yeni route 404 dönüyorsa)
docker compose -f dockerfiles/docker-compose.yml exec app php artisan route:clear

# Pint formatlama (her PHP değişikliği sonrası)
vendor/bin/pint --dirty
```

**Docker servisleri:**

| Servis | Host Port | Notlar |
|--------|-----------|--------|
| Laravel API (HTTPS) | 443 | nginx SSL |
| Laravel API (HTTP dev) | 8000 | |
| Frontend Admin | 3001 | Next.js |
| Frontend Tenant | 3002 | Next.js |
| PHPMyAdmin | 8080 | |
| MySQL | 3306 (internal) | |
| Redis | 6379 (internal) | |

**Önemli env değişkenleri:**
```env
AUDIT_DB_CONNECTION=mysql      # Docker: audit loglar ana DB'ye
REDIS_CLIENT=phpredis
TENANT_FRONTEND_URL=http://localhost:3002
```

---

## 4. Kritik Backend Kuralları

### 4.1 Nested Route Positional Arg (KRİTİK)

`schools/{school_id}/children/{child}` gibi nested route'larda Laravel parametreleri sıralı geçirir. İlk parametre MUTLAKA `int $school_id`:

```php
// YANLIŞ:
public function show(Child $child): JsonResponse
// DOĞRU:
public function show(int $school_id, Child $child): JsonResponse
public function update(UpdateChildRequest $request, int $school_id, Child $child): JsonResponse
public function destroy(int $school_id, Child $child): JsonResponse
```

`ClassController`, `ChildController`, `ActivityController` gibi tüm nested apiResource metodları için geçerli.

### 4.2 paginatedResponse — ResourceCollection Pattern

```php
// DOĞRU — ResourceCollection direkt geçilir:
return $this->paginatedResponse(ChildResource::collection($paginator));

// YANLIŞ — ->resource raw paginator döndürür, resource transform kaybolur:
return $this->paginatedResponse(ChildResource::collection($paginator)->resource);

// ResourceCollection içinde ->resolve() kullan, ->toArray() değil:
$this->paginatedResponse($collection->resolve());
```

### 4.3 paginatedResponse — Custom Alan Ekleme

Paginator öğelerine custom alan eklemek gerekince `getCollection()->map()->setCollection()` kullan:

```php
// DOĞRU:
$result = $data->getCollection()->map(fn($item) => array_merge(
    $this->formatItem($item), ['extra_field' => $value]
));
$data->setCollection($result);
return response()->json(['success' => true, 'data' => $data->items(), 'meta' => [...]]);

// YANLIŞ — $data->map() plain Collection döndürür, items() metodu yok:
$result = $data->map(fn($item) => ...);  // KULLANMA
return $this->paginatedResponse(collect($result), $data);  // KULLANMA
```

### 4.4 Controller Şablonu

```php
class XxxController extends BaseSchoolController
{
    public function __construct(public XxxService $service) { parent::__construct(); }

    // READ: transaction yok
    public function index(): JsonResponse {
        try {
            $this->authorize('viewAny', Model::class);
            return $this->paginatedResponse(XxxResource::collection($this->service->getAll(request()->all())));
        } catch (\Throwable $e) {
            Log::error('XxxController::index', ['message' => $e->getMessage()]);
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // WRITE: transaction zorunlu, validate() try-catch DIŞINDA
    public function store(StoreXxxRequest $request): JsonResponse {
        try {
            DB::beginTransaction();
            $this->authorize('create', Model::class);
            $data = $request->validated();
            $data['created_by'] = $this->user()->id;
            $item = $this->service->create($data);
            DB::commit();
            return $this->successResponse(XxxResource::make($item), 'Kayıt oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
```

### 4.5 BelongsToMany Pivot Accessor Bug

Constraint callback'li eager load'da `->pivot` accessor çalışmaz. `DB::table()` kullan:

```php
$pivotMap = DB::table('school_teacher_assignments')
    ->where('school_id', $schoolId)
    ->whereIn('teacher_profile_id', $teacherIds)
    ->get()->keyBy('teacher_profile_id');
// $pivot = $pivotMap->get($teacher->id); // stdClass
```

### 4.6 Laravel 12 Filesystem — Private Disk (KRİTİK)

```php
// local disk = storage/app/private/ — web'den erişilemez
Storage::disk('local')->put($path, $content);  // DOĞRU
Storage::disk('private')  // HATA — Laravel 12'de bu disk yok

// Private dosya sunmak için signed route:
$signedUrl = URL::signedRoute('parent.child.photo', ['child' => $id], now()->addHours(1));
Route::get('/parent/children/{child}/photo', [..., 'servePhoto'])->name('parent.child.photo')->middleware('signed');
return Storage::disk('local')->response($child->profile_photo);
```

### 4.7 MySQL 64-Karakter FK Adı Limiti

Uzun tablo adlarında explicit kısa FK ismi zorunlu:

```php
// activity_class_school_class_assignments (uzun tablo):
$table->foreign('activity_class_id', 'acsc_activity_class_fk')->references('id')->on('activity_classes');
$table->unique(['activity_class_id', 'school_class_id'], 'acsc_unique');
```

### 4.8 FK Stratejisi

- Soft-delete tablolar: `->restrictOnDelete()` (hard delete engellenir)
- Pivot/junction tablolar: `->cascadeOnDelete()` (doğal cascade)
- Opsiyonel FK: `->nullOnDelete()`

### 4.9 Soft-Delete Test

```php
// YANLIŞ — kayıt hâlâ var (deleted_at set):
assertDatabaseMissing('table', ['id' => $id]);
// DOĞRU:
assertDatabaseMissing('table', ['id' => $id, 'deleted_at' => null]);
```

### 4.10 validate() Pozisyonu

`$request->validate()` veya FormRequest her zaman try-catch DIŞINDA — 422 garantisi için.

---

## 5. Mimari Bileşenler

### BaseModel (`app/Models/Base/BaseModel.php`)
SoftDeletes, HasFactory, Auditable trait, auto `created_by`/`updated_by`, tenant global scope, HistoryObserver (activity_logs + `{table}_histories`).

**Standart tablo kolonları:** `id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`

### BaseController (`app/Http/Controllers/Base/BaseController.php`)
```php
protected function user(): ?User
protected function successResponse(mixed $data, ?string $message, int $code = 200): JsonResponse
protected function errorResponse(string $message, int $code = 400): JsonResponse
protected function paginatedResponse(mixed $collection): JsonResponse
// Dönen format: { success, message, data[], meta{current_page, last_page, per_page, total} }
```

### Rol-Bazlı Base Controller'lar
| Controller | Kullanım |
|-----------|----------|
| `BaseSchoolController` | Okul erişim kontrolü, `$this->school` |
| `BaseTenantController` | `$this->tenant()` helper |
| `BaseParentController` | `getFamilyProfile()` (owner→co_parent), `findOwnedChild(int $id)` |
| `BaseTeacherController` | `$this->teacherProfile()` helper |

### API Response Formatı
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": true, "message": "...", "data": [...], "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 73 } }
{ "success": false, "message": "...", "data": null }
```

---

## 6. API Rotaları (4 Katmanlı)

### Katman 1 — Public
```
GET  /api/health
POST /api/auth/register          (throttle:10,1)
POST /api/auth/login             (throttle:5,1)
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/packages
GET  /api/countries/phone-codes
POST /api/parent/auth/register
POST /api/parent/auth/login
POST /api/parent/auth/forgot-password
POST /api/parent/auth/reset-password
GET  /api/parent/auth/verify-email/{id}/{hash}
GET  /api/parent/auth/countries  (auth gerekmez)
GET  /api/parent/auth/blood-types
```

### Katman 2 — Auth Gerekli (abonelik gerekmez)
```
POST /api/auth/logout
GET  /api/auth/me
POST /api/tenant/subscribe
GET  /api/tenant/subscription
GET  /api/tenant/subscription/history
GET  /api/tenant/subscription/usage
POST /api/tenant/subscription/cancel
apiResource: tenants (store hariç)
```

### Katman 3 — Abonelik Gerekli (`subscription.active` middleware)
```
apiResource: schools
apiResource: schools/{id}/classes
GET/POST/DELETE schools/{id}/classes/{classId}/teachers
GET/POST/DELETE schools/{id}/classes/{classId}/children    ← assignChild/removeChild
GET/POST/DELETE schools/{id}/classes/{classId}/supply-list
GET schools/{id}/teachers (?detailed=1)
GET/POST/PUT/DELETE teachers (tenant-level CRUD)
GET/POST/PUT/DELETE teacher-role-types
GET teachers/{id}/schools; POST/DELETE teachers/{id}/schools/{schoolId}
apiResource: schools/{id}/children (?class_id filtre)
GET/PATCH schools/{id}/child-enrollment-requests
PATCH schools/{id}/child-enrollment-requests/{id}/approve
PATCH schools/{id}/child-enrollment-requests/{id}/reject
apiResource: schools/{id}/activities
apiResource: schools/{id}/families
GET/POST/PUT/DELETE academic-years; PATCH .../set-current; PATCH .../close
GET/POST/PUT/DELETE meals; food-ingredients; allergens
GET/POST/PUT/DELETE activity-classes (tenant-wide, school_id opsiyonel)
GET/POST/DELETE activity-classes/{id}/enrollments
POST/DELETE activity-classes/{id}/teachers
POST/PUT/DELETE activity-classes/{id}/materials
GET/POST/DELETE activity-classes/{id}/gallery
GET/PATCH/POST activity-classes/{id}/invoices (PATCH mark-paid, PATCH cancel, POST {invoice}/refund)
GET invoices/tenant
GET/POST notifications; PATCH notifications/{id}/read; PATCH notifications/read-all
GET/POST/PUT/DELETE health-suggestions (tenant onay)
```

### Katman 4 — Super Admin
```
apiResource: admin/packages; admin/package-features
GET/PATCH/DELETE admin/tenants; admin/schools; admin/users
GET/POST/PUT/DELETE admin/allergens; admin/medical-conditions; admin/food-ingredients; admin/medications
GET/PATCH admin/subscriptions; admin/activity-logs; admin/currencies; admin/countries
GET admin/dashboard/stats; admin/dashboard/recent-activities
POST admin/countries/sync; admin/currencies/fetch-rates
GET/POST admin/health-suggestions; admin/blood-types
```

### Veli Mobil API (tümü `/api/parent/` altında)
```
POST auth/logout; GET auth/me; POST auth/resend-verification
GET/POST/PUT/DELETE children; children/{id}/allergens; children/{id}/medications; children/{id}/conditions
POST children/{id}/profile-photo; GET children/{id}/photo (signed)
GET children/{id}/stats
POST children/{id}/suggest-allergen; suggest-condition; suggest-medication
GET/POST family/members; DELETE family/members/{userId}
GET/POST/PUT/DELETE family/emergency-contacts/{id}
GET/POST schools; GET schools/{id}; POST schools/join
GET schools/{id}/feed; GET feed/global
GET/POST activity-classes; GET activity-classes/{id}
GET activity-classes/my-enrollments
POST activity-classes/{id}/enroll; DELETE activity-classes/{id}/children/{child_id}/unenroll
GET activity-classes/{id}/gallery
GET allergens; conditions; medications; countries; blood-types
GET/POST schools/{school}/enroll-child (çocuk okul kayıt talebi)
GET invoices; GET invoices/stats; GET invoices/{id}
```

---

## 7. Modül Detayları

### 7.1 B2B Paket Sistemi
- Paketler: Başlangıç (1 okul/3 sınıf/30 öğrenci, ₺299/ay), Pro (3/10/200, ₺799/ay), Kurumsal (∞, ₺1999/ay)
- `ChecksPackageLimits` trait → `checkSchoolLimit($tenant)` SchoolController::store()'da
- `EnsureActiveSubscription` middleware → super admin bypass

### 7.2 Öğretmen Mimarisi
- `teacher_profiles.tenant_id` → öğretmen tenant'a aittir (okula değil)
- `school_teacher_assignments` pivot → öğretmen birden fazla okula atanabilir
- `teacher_role_types` → tenant-level görev tanımları (Sınıf Öğretmeni vb.)
- `ClassManagementController::schoolTeachers()` → `?detailed=1` ile role_type dahil döner

**Yeni öğretmen profil alanları (2026-03-17):** `phone_country_code`, `whatsapp_number`, `whatsapp_country_code`, `identity_number`, `passport_number`, `nationality_country_id`

### 7.3 Çocuk Okul Kayıt Talebi (2026-03-16)
- Tablo: `school_child_enrollment_requests` — unique `(school_id, child_id)`
- Status: `pending / approved / rejected`
- `ChildEnrollmentRequestController` extends `BaseController` (BaseSchoolController DEĞİL)
- `index()` → `withoutGlobalScope('tenant')` ZORUNLU
- Onay: `children.school_id = schoolId` set edilir

### 7.4 Tek Sınıf Kuralı (assignChild)
Bir çocuk yalnızca TEK sınıfa kayıt olabilir:
1. Sınıf aktif mi? (422)
2. Çocuk okula kayıtlı mı? (422)
3. Yaş aralığı kontrolü: `Carbon::parse($child->birth_date)->age` vs `age_min`/`age_max`
4. Tek sınıf: `$child->classes()->first()` → zaten atanmışsa → 422: "X adlı öğrenci zaten Y sınıfına kayıtlı. Önce mevcut sınıftan çıkarın."

### 7.5 Etkinlik Sınıfları Modülü (2026-04-02)
- `ActivityClass.school_id` nullable → null = tenant-wide, set = okul-spesifik
- `ActivityClassEnrollment` plain `Model`'den türer (BaseModel DEĞİL — parent tenant_id=NULL scope kırar)
- `TenantActivityClassController` extends `BaseController` (URL'de school_id parametresi yok)
- Galeri: `storage/app/private/activity-classes/{id}/gallery/`, 2 saatlik signed URL

**ParentActivityClassController index sorgu mantığı:**
```php
$schoolIds = Child::withoutGlobalScope('tenant')->where('family_profile_id', $fp->id)->whereNotNull('school_id')->pluck('school_id')->unique();
$tenantIds = School::whereIn('id', $schoolIds)->pluck('tenant_id')->unique();
ActivityClass::withoutGlobalScope('tenant')->where('is_active', true)->where(fn($q) =>
    $q->whereIn('school_id', $schoolIds)->orWhere(fn($q2) =>
        $q2->whereNull('school_id')->whereIn('tenant_id', $tenantIds)
    )
);
```

### 7.6 Sağlık Öneri Sistemi
- `allergens`, `medical_conditions`, `medications` tablolarında `status` (approved/pending) + `suggested_by_user_id`
- `allergen.tenant_id = NULL` → global; `tenant_id = X` → tenant-spesifik
- Pending öğeler: çocuğa hemen bağlanır, "Onay Bekleniyor" badge ile gösterilir
- Super admin onaylar: `GET/POST /api/admin/health-suggestions` → `tenant_id = null` set eder

### 7.7 Ülkeler Sistemi
- `phone_code` DB'de `+90` formatında (+prefix ile)
- Frontend normalize: `.replace(/^\+/, '')` → `"90"`
- `sort_order` öncelikleri: TR(100), US(95), GB(90), DE(85), FR(80)
- Public endpoint: `GET /api/parent/auth/countries` (auth gerekmez)
- Cache: `Cache::remember('countries:phone_codes', 3600)`

### 7.8 Sosyal Ağ
- `social_posts.school_id` + `tenant_id` nullable → `is_global = true` global feed için
- `social_post_media` + `social_post_reactions`: SoftDeletes aktif, `deleted_at` kolonu ZORUNLU
- Global feed: `GET /api/parent/feed/global`

### 7.9 Şifre Sıfırlama
- `User::sendPasswordResetNotification()`:
  - `tenant_id = NULL` → mobil deep link: `parentmobileapp://reset-password?token=...&email=...`
  - `tenant_id NOT NULL` → web: `{TENANT_FRONTEND_URL}/reset-password?token=...`

### 7.10 Aile Profili
- `family_profiles.tenant_id` nullable (migration uygulandı)
- `BaseParentController::getFamilyProfile()`: owner_user_id → family_members (co_parent) sırasıyla
- `auth()->user()->familyProfile` KULLANMA co_parent için — `$this->getFamilyProfile()` kullan
- Sadece `super_parent` yeni üye ekleyebilir — co_parent ekleyemez/kaldıramaz

---

## 8. Veritabanı Şeması — Anahtar Tablolar

| Tablo | Model | Notlar |
|-------|-------|--------|
| `users` | `User` | Authenticatable, BaseModel DEĞİL |
| `tenants` | `Tenant` | `activeSubscription()`, `canCreateSchool()`, `canEnrollStudent()` |
| `schools` | `School` | `invite_token` (UUID, veli join için) |
| `classes` | `SchoolClass` | `age_min`/`age_max` (tinyInt nullable), `is_active` |
| `teacher_profiles` | `TeacherProfile` | `tenant_id` + `school_teacher_assignments` pivot |
| `teacher_role_types` | `TeacherRoleType` | Tenant-level görev tanımları |
| `family_profiles` | `FamilyProfile` | `tenant_id` nullable |
| `family_members` | `FamilyMember` | `role (super_parent\|co_parent)`, `is_active`, `accepted_at` |
| `children` | `Child` | `school_id` nullable, `blood_type` (string), `passport_number` |
| `emergency_contacts` | `EmergencyContact` | `phone_country_code`, `nationality_country_id`, `passport_number` |
| `blood_types` | `BloodType` | 8 standart (A+, A-, B+, B-, AB+, AB-, O+, O-) |
| `app_settings` | `AppSetting` | Plain Model (tenant scope yok). `getByKey()`/`setByKey()` 1 saatlik cache |
| `activity_classes` | `ActivityClass` | `school_id` nullable = tenant-wide |
| `activity_class_enrollments` | `ActivityClassEnrollment` | Plain Model (BaseModel DEĞİL) |
| `school_child_enrollment_requests` | `SchoolChildEnrollmentRequest` | unique `(school_id, child_id)` |
| `password_reset_tokens` | — | Standart Laravel tablosu |
| `countries` | `Country` | `phone_code` = `+90` formatında |

---

## 9. Frontend Tenant (`frontend-tenant-and-website`)

### 9.1 Kritik Kurallar
- Token: **`tenant_token`** — `admin_token` YAZMA
- Tailwind: **v3** — `@tailwind base/components/utilities` kullan, `@import "tailwindcss"` (v4) YAZMA
- `app/page.tsx` OLUŞTURMA — `(website)/page.tsx` zaten `/` yolunu alır (route conflict)
- `(auth)/layout.tsx` — SADECE `return <>{children}</>` — wrapper div ekleme (login bg bozulur)
- `App.tsx` root div — `relative` class EKLEME (login sayfası `absolute inset-0` bg küçük kalır)
- `components/layouts` — çoğul "layouts", tekil "layout" DEĞİL
- `withCredentials` — apiClient'dan KALDIRILDI (token-based, SPA cookie değil)

### 9.2 Dizin Yapısı
```
frontend-tenant-and-website/
├── app/
│   ├── layout.tsx                      ← Root Layout (Nunito font, ProviderComponent, Toaster)
│   ├── globals.css                     ← Tailwind v3 (@tailwind base/components/utilities)
│   ├── (website)/                      ← Kamuya açık, PublicNavbar+PublicFooter
│   │   ├── layout.tsx                  ← Server component
│   │   ├── page.tsx                    ← Ana sayfa (tenant_token→/dashboard redirect)
│   │   ├── pricing/page.tsx
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   ├── (auth)/                         ← SADECE passthrough layout!
│   │   ├── layout.tsx                  ← return <>{children}</> — başka hiçbir şey
│   │   ├── login/page.tsx
│   │   └── register/
│   │       ├── page.tsx
│   │       └── plans/page.tsx
│   └── (tenant)/                       ← tenant_token guard, Sidebar+Header
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── schools/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── classes/[classId]/page.tsx
│       ├── meals/page.tsx
│       ├── activities/page.tsx
│       ├── academic-years/page.tsx
│       ├── teachers/page.tsx
│       ├── activity-classes/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── subscription/page.tsx
│       ├── invoices/page.tsx
│       ├── notifications/page.tsx
│       └── profile/page.tsx
├── components/
│   ├── PublicNavbar.tsx
│   ├── PublicFooter.tsx
│   ├── layouts/                        ← ⚠️ "layouts" (çoğul)
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── provider-component.tsx
│   └── icon/
├── lib/
│   ├── apiClient.ts                    ← Axios, tenant_token, 401→/login
│   └── utils.ts
├── types/
│   └── index.ts                        ← Tüm TypeScript tipleri
├── store/
│   └── themeConfigSlice.tsx
├── .env.local                          ← NEXT_PUBLIC_API_URL=http://localhost:8000/api
└── tailwind.config.js                  ← Vristo renk paleti (v3)
```

### 9.3 Auth Akışı
```
Login: POST /auth/login → response.data.data.token → localStorage.setItem('tenant_token', token)
Logout: localStorage.removeItem('tenant_token') → window.location.href = '/login'
apiClient: 401 → removeItem('tenant_token') + redirect /login
(tenant)/layout.tsx: tenant_token yoksa → /login redirect
```

### 9.4 TypeScript Tipleri (`types/index.ts`)
```typescript
PaginatedResponse<T>    // success, message, data[], meta{current_page, last_page, per_page, total}
ApiResponse<T>          // success, message, data

User                    // id, name, surname?, email, phone?, tenant_id?, tenant?{id, name}
Package                 // id, name, monthly_price, yearly_price, max_schools, max_students, package_features?
PackageFeature          // id, key, label, value_type('bool'|'text'), value?
TenantSubscription      // id, status, billing_cycle, package_id, package?
SubscriptionUsage       // schools{used,limit}, students{used,limit}, classes{used,limit}
Country                 // id, name, iso2, phone_code?

School                  // id, name, country_id?, country?{id,name,iso2}, description?, code?, address?,
                        //   city?, phone?, fax?, gsm?, whatsapp?, email?, website?, is_active?,
                        //   classes_count?, children_count?, created_at, updated_at

SchoolClass             // id, school_id, academic_year_id?, name, description?,
                        //   age_min?: number, age_max?: number,
                        //   capacity?, color?, children_count?, teachers_count?

TeacherProfile          // id, user_id, name, email?, phone?, title?, specialization?,
                        //   employment_type?: 'full_time'|'part_time'|'contract'|'intern'|'volunteer',
                        //   employment_label?, experience_years?, profile_photo?, bio?,
                        //   hire_date?, linkedin_url?, website_url?,
                        //   phone_country_code?: string|null,
                        //   whatsapp_number?: string|null, whatsapp_country_code?: string|null,
                        //   nationality_country_id?: number|null,
                        //   nationality?: {id,name,iso2,flag_emoji}|null,
                        //   identity_number?: string|null, passport_number?: string|null,
                        //   school_count?, schools?{id,name,is_active,role_type_name?}[],
                        //   classes?{id,name,school_id}[]

SchoolTeacher           // id, user_id, name, title?, employment_type?, is_active: boolean,
                        //   role_type?: {id,name}|null

TeacherRoleType         // id, tenant_id, name, sort_order?, is_active?

Allergen                // id, name, description?, risk_level?('low'|'medium'|'high'), tenant_id?: number|null
FoodIngredient          // id, name, is_custom?, allergens?: Allergen[]
Meal                    // id, school_id, name, meal_type?, ingredients?{id,name,allergens?{id,name}[]}[]
SupplyItem              // id, name, description?, quantity?, due_date?, class_id?, school_id?
Attendance              // id, child_id, class_id, attendance_date, status, notes?
Activity                // id, school_id, academic_year_id?, name, description?, is_paid?, price?,
                        //   start_date?: string, end_date?: string, classes?: SchoolClass[]
AcademicYear            // id, school_id, name, start_date, end_date, is_active?
Child                   // id, name, surname?, birth_date?, gender?, status?,
                        //   classes?: Array<{id, name, school_id}>,
                        //   family_profile?: {owner: {name, surname, phone}}
Invoice                 // id, invoice_number?, status, total_amount, currency, created_at
TenantNotification      // id, title, body, type, is_read, created_at

ActivityClass           // id, school_id: number|null, name, description?, language?,
                        //   age_min?, age_max?, capacity?, is_active?, is_paid?, price?,
                        //   currency?, invoice_required?, start_date?, end_date?, schedule?,
                        //   location?, notes?, school_classes?, teachers?, materials?
ActivityClassMaterial   // id, activity_class_id, name, description?, url?, type?
ActivityClassEnrollment // id, activity_class_id, child_id, family_profile_id, status, enrolled_at, invoice?
ActivityClassInvoice    // id, enrollment_id, invoice_number, invoice_type('invoice'|'refund'), original_invoice_id?,
                        //   refund_reason?, amount, currency, status('pending'|'paid'|'overdue'|'cancelled'|'refunded'),
                        //   due_date, payment_required, refundInvoice? (hasOne self)
ActivityClassGalleryItem // id, caption?, url, sort_order, created_at
```

### 9.5 Kodlama Standartları

**Sayfa Şablonu:**
```tsx
'use client';
export default function XxxPage() {
    const [items, setItems] = useState<Type[]>([]);
    const [loading, setLoading] = useState(true);
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/endpoint');
            if (res.data?.data) setItems(res.data.data);
        } catch { toast.error('Yüklenirken hata oluştu.'); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);
}
```

**Hata Yakalama:**
```tsx
} catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    toast.error(error.response?.data?.message ?? 'İşlem sırasında hata oluştu.');
}
```

**Pagination Standardı:**
```tsx
const [page, setPage] = useState(1);
const [lastPage, setLastPage] = useState(1);
apiClient.get('/endpoint', { params: { page, search: search || undefined } })
// Search değişince: setPage(1)
// res.data.meta.last_page → setLastPage
```

**Paralel Veri Çekme:**
```tsx
const [subRes, usageRes] = await Promise.all([
    apiClient.get('/tenant/subscription').catch(() => ({ data: { data: null } })),
    apiClient.get('/tenant/subscription/usage').catch(() => ({ data: { data: null } })),
]);
```

**SweetAlert2 Silme Onayı:**
```tsx
const result = await Swal.fire({
    title: 'Silmek istediğinize emin misiniz?',
    text: 'Bu işlem geri alınamaz.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Evet, Sil',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#e7515a',
});
if (!result.isConfirmed) return;
```

**Zod v4 + RHF:**
```tsx
import * as z from 'zod';  // import * as z kullan
// Dinamik schema tip uyumsuzluğu için:
(useForm as any)({ resolver: zodResolver(schema as any) })
```

**ApexCharts:**
```tsx
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
```

**Tarih Formatlama:**
```tsx
{date ? new Date(date).toLocaleDateString('tr-TR') : '—'}
```

### 9.6 Tab Fetch Flag Pattern (KRİTİK)
```tsx
// YANLIŞ — boş liste de olsa tekrar fetch atar:
if (tab === 'teachers' && teachers.length === 0) fetchTeachers();

// DOĞRU — ayrı boolean flag:
const [teachersFetched, setTeachersFetched] = useState(false);
if (tab === 'teachers' && !teachersFetched && !loading) fetchTeachers();
// Fetch sonrası: setTeachersFetched(true);
```

### 9.7 Vristo CSS Sınıfları
```html
<div class="panel">
<button class="btn btn-primary"> <button class="btn btn-outline-danger btn-sm">
<button class="btn btn-gradient">
<input class="form-input">
<div class="table-responsive"><table class="table-hover">
<span class="badge badge-outline-success|danger|warning|info|secondary">
<div class="has-error"><p class="mt-1 text-xs text-danger">

Renk tokenları: text-primary, text-success, text-danger, text-warning, text-info, text-secondary
bg-primary/10 → %10 opasite primary arka plan
```

### 9.8 Sidebar Navigasyon
```typescript
// components/layouts/sidebar.tsx
[
  { label: 'ANA MENÜ', items: [{ title: 'Dashboard', href: '/dashboard' }] },
  { label: 'YÖNETİM', items: [
    { title: 'Okullarım', href: '/schools' },
    { title: 'Öğretmenler', href: '/teachers' },
    { title: 'Etkinlik Sınıfları', href: '/activity-classes' },
    { title: 'Yemekler', href: '/meals' },
    { title: 'Etkinlikler', href: '/activities' },
    { title: 'Eğitim Yılları', href: '/academic-years' },
  ]},
  { label: 'HESAP', items: [
    { title: 'Aboneliğim', href: '/subscription' },
    { title: 'Faturalar', href: '/invoices' },
  ]},
  { label: 'SİSTEM', items: [
    { title: 'Bildirimler', href: '/notifications' },
    { title: 'Profil', href: '/profile' },
  ]},
]
```

### 9.9 Okul Detayı — Tab Mimarisi (`/schools/[id]`)

| Tab key | İçerik | Fetch Zamanı |
|---------|--------|--------------|
| `classes` | Sınıf CRUD + Öğrenci Ata butonu | `loadData()` (ilk yükleme) |
| `children` | Öğrenciler + veli + sınıf + göz ikonu | `loadData()` (ilk yükleme) |
| `teachers` | Öğretmenler | `loadData()` (ilk yükleme) — lazy DEĞİL |
| `requests` | Veli kayıt talepleri | Lazy (tab tıklama + `requestsFetched` flag) |
| `parents` | Onaylı veliler | `loadData()` (ilk yükleme) — lazy DEĞİL |
| `child-requests` | Onay Bekleyen Öğrenciler | `loadData()` parallel (badge sayısı) + tab değişiminde refresh |

**Öğrenciler sekmesi:**
- Veli kolonu: `child.family_profile?.owner` — ad/soyad/telefon
- Sınıf kolonu: `child.classes[]` → `badge-outline-info` badge'ler
- Göz ikonu butonu → detay modal (satır tıklama kaldırıldı)
- Detay modal: kişisel + sağlık + aile + **Sınıf Atamaları bölümü** (çıkar + "Sınıfa Ata")

**Sınıflar sekmesi:**
- Her satırda "Öğrenci Ata" butonu (Baby ikonu, yeşil) → öğrenci seçim modali
- Modal: sadece **sınıfsız öğrenciler** (`classes.length === 0`) listelenir

**Sınıfa öğrenci atama — iki akış:**
| Akış | Başlangıç |
|------|-----------|
| Sınıf listesinden | Sınıf satırındaki Baby butonu |
| Öğrenci detay modalinden | "Sınıfa Ata" butonu |

### 9.10 Etkinlik Sınıfları Frontend (2026-04-02)
```typescript
// Çift state — filtre vs form:
const [filterSchoolId, setFilterSchoolId] = useState('');  // '' = tüm okullar
const [formSchoolId, setFormSchoolId] = useState('');      // '' = okul yok (tenant-wide)
const [formSchoolClasses, setFormSchoolClasses] = useState<SchoolClass[]>([]);

// formSchoolId = '' → school_id: null payload → tenant-wide etkinlik
// Sınıf seçimi sadece formSchoolId dolu iken görünür

// openEdit pattern:
const schoolId = ac.school_id ? String(ac.school_id) : '';
setFormSchoolId(schoolId);
if (schoolId) fetchFormSchoolClasses(schoolId); else setFormSchoolClasses([]);

// Payload:
school_id: formSchoolId ? parseInt(formSchoolId) : null,
school_class_ids: formSchoolId ? form.school_class_ids : [],
```

**Detay sayfası ([id]/page.tsx):**
- `bootstrap()` → direkt `GET /activity-classes/{id}` (school iterasyonu yok)
- `ac.school_id` set ise → o okulun children + teachers yüklenir
- `ac.school_id` null ise → tüm tenant okullarından dedup yapılır

### 9.11 Sayfa Detay Notları

**Dashboard (`/dashboard`):**
- `Promise.all` ile 4 paralel istek: `/auth/me`, `/tenant/subscription`, `/tenant/subscription/usage`, `/schools`
- Usage progress bar: 0–70% `bg-success`, 70–90% `bg-warning`, 90%+ `bg-danger`, limit=0 "Sınırsız"

**Schools CRUD (`/schools`):**
- `GET /schools?page=1&search=xxx` + `GET /countries`
- Modal: `editingSchool` state → POST veya PUT
- Form: name, code, country_id, city, address, phone, fax, gsm, whatsapp, email, website, description

**Schools Detail (`/schools/[id]`):**
- Sınıf CRUD modal: `age_min`/`age_max` yan yana number input + `academic_year_id` required
- Tablo gösterimi: `"3–5 yaş"` (her ikisi doluysa), `"3+ yaş"` (sadece min), `"—"`

**Class Detail (`/schools/[id]/classes/[classId]`):**
- 4 tab: Öğrenciler, Devamsızlık (tarih+durum), İhtiyaç Listesi (CRUD+deadline), Yemek Takvimi (aylık grid)

**Meals (`/meals`):**
- 3 tab: Yemekler + Besin Öğeleri (allerjen 2 grup: global+özel) + Allerjenler (tenant CRUD)
- `RISK_LABELS`: `{ low: 'Düşük', medium: 'Orta', high: 'Yüksek' }`

**Activities (`/activities`):**
- Modal: name, description, academic_year_id, is_paid, price (is_paid=true ise), start_date, end_date, sınıf checkbox

**Academic Years (`/academic-years`):**
- İşlemler: Aktif Yap (`PATCH .../set-current`), Kapat (`PATCH .../close`), Düzenle, Sil
- Sadece aktif değilse "Aktif Yap", sadece aktifse "Kapat" görünür

**Notifications (`/notifications`):**
- Gönder formu: okul (required), sınıf (opsiyonel), tür, öncelik, başlık, mesaj

**Teachers (`/teachers`):**
- Ülke listesi: `GET /api/parent/auth/countries` (public endpoint, auth gerekmez)
- Telefon input: `.replace(/\D/g, '').slice(0, 10)` — sadece rakam, max 10 karakter
- `country_id` payload: `Number(val) || null`

### 9.12 Yeni Özellik Checklist
1. Token: `tenant_token` (hiçbir yerde `admin_token` yazma)
2. Route: `(tenant)`, `(website)` veya `(auth)` grubunda mı?
3. Sidebar: `components/layouts/sidebar.tsx` + `components/layouts/header.tsx` güncelle
4. API: `apiClient.get/post/put/patch/delete('/...')` → `res.data.data`
5. Loading state: `useState(true)` + spinner
6. Hata: `catch` + `toast.error(...)`
7. Silme: SweetAlert2 onay dialogu
8. Tailwind v3 kullan — v4 sözdizimi YAZMA
9. `app/page.tsx` OLUŞTURMA
10. `(auth)/layout.tsx`'e wrapper EKLEME

---

## 10. Frontend Admin (`frontend-admin`)

### 10.1 Admin vs Tenant Farkları

| Konu | Frontend Admin | Frontend Tenant |
|------|---------------|-----------------|
| Token | `admin_token` | `tenant_token` |
| Login redirect | `/` → `/tenants` | `/dashboard` |
| Sidebar | 6 grup, ~20 item | 4 grup |
| Route group | `(dashboard)` | `(tenant)` |
| Public sayfalar | Yok | Var `(website)` |
| `withCredentials` | `true` | Kaldırıldı |
| Docker port | 3001 | 3002 |

### 10.2 Admin Dizin Yapısı
```
frontend-admin/
├── app/
│   ├── page.tsx                   ← Root: admin_token → /tenants, yoksa /login
│   ├── (auth)/layout.tsx          ← SADECE passthrough: return <>{children}</>
│   └── (dashboard)/
│       ├── layout.tsx             ← admin_token check, Sidebar + Header
│       ├── page.tsx               ← Finance dashboard
│       ├── tenants/               health/   subscriptions/
│       ├── schools/               users/    packages/
│       ├── finance/               activity-logs/  notifications/  settings/
│       └── apps/invoice/list + preview
├── components/layouts/            ← sidebar.tsx, header.tsx, provider-component.tsx
└── lib/apiClient.ts               ← Bearer token, withCredentials: true
```

### 10.3 Admin API Endpoint Eşleşmeleri

| Sayfa | Endpoint'ler |
|-------|-------------|
| Dashboard | `GET /admin/dashboard/stats`, `/admin/dashboard/recent-activities`, `/admin/activity-logs/daily-summary` |
| Tenants | `GET /admin/tenants`, `POST /auth/register`, `DELETE /admin/tenants/:id` |
| Tenant Detay | `GET /admin/tenants/:id` → `{ tenant, stats }` nested — `tenantRes.data.data.tenant` |
| Schools | `GET /admin/schools`, `PATCH .../toggle-status`, `DELETE` |
| Users | `GET /admin/users` (?role, ?search, ?page) |
| Packages | `GET /packages`, `POST/PUT /admin/packages`, `GET/POST/PUT/DELETE /admin/package-features` |
| Health | `GET/POST/PUT/DELETE /admin/allergens`, `/admin/medical-conditions`, `/admin/food-ingredients`, `/admin/medications` |
| Subscriptions | `GET /admin/subscriptions`, `PATCH .../status`, `PATCH .../extend` |
| Activity Logs | `GET /admin/activity-logs`, `GET /admin/activity-logs/stats` |
| Settings/Countries | `GET /admin/countries`, `POST /admin/countries/sync`, `PATCH .../toggle-active` |
| Settings/Currencies | `GET/POST/PUT/DELETE /admin/currencies`, `POST .../fetch-rates`, `PATCH .../set-base` |

### 10.4 ActivityLogResource — Nested Yapı (ÖNEMLİ)
`ActivityLogResource` flat değil **nested** döndürür:
```typescript
log.user.name / log.user.email           // flat user_name DEĞİL
log.model.label / log.model.type / log.model.id
log.context.ip_address / log.context.url / log.context.method
log.changes.old_values / log.changes.new_values / log.changes.changed_fields
log.action_label / log.description / log.time_ago
```

### 10.5 Dashboard Stats Mapping
`/admin/dashboard/stats` nested döner:
```typescript
d.tenants.total → total_tenants
d.tenants.with_active_subscription → active_tenants
d.subscriptions.total_revenue → monthly_revenue ve total_revenue
```

### 10.6 Package Features
- `package_features` tablosu: `key`, `label`, `value_type` ('bool'|'text'), `display_order`
- `package_feature_pivot`: `package_id`, `package_feature_id`, `value`
- bool → checkbox, text → text input (ör: "500 GB")

---

## 11. Mobil Uygulama (`parent-mobile-app`)

### 11.1 Stack & Bağımlılıklar
```json
{
  "expo": "~55.0.5",
  "expo-router": "~55.0.4",
  "react": "19.2.0",
  "react-native": "0.83.2",
  "react-native-safe-area-context": "~5.6.2",
  "react-native-screens": "~4.23.0",
  "react-native-gesture-handler": "~2.30.0",
  "react-native-reanimated": "4.2.1",
  "@react-native-async-storage/async-storage": "^2.1.2",
  "axios": "^1.7.9"
}
```
Token: `parent_token` (AsyncStorage) | API base: `extra.apiUrl` in `app.json` (default: `http://10.0.2.2:8000/api`)

### 11.2 Expo Router — Stack Layout Zorunluluğu (KRİTİK)
Bir klasördeki her `.tsx` dosyası Expo Router'da ayrı tab olarak görünür. Alt ekranların ayrı tab olmaması için `_layout.tsx` ile Stack navigator ekle:

```typescript
// activity-classes/_layout.tsx — ZORUNLU
export default function ActivityClassesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
// Aynı pattern: schools/_layout.tsx
```

### 11.3 Dizin Yapısı
```
parent-mobile-app/
├── src/
│   ├── app/
│   │   ├── _layout.tsx              ← Root (AuthContext Provider + authEvent.register)
│   │   ├── (auth)/
│   │   │   ├── login.tsx, register.tsx, forgot-password.tsx, verify-email.tsx
│   │   └── (app)/
│   │       ├── _layout.tsx          ← 6 tab navigasyon
│   │       ├── index.tsx            ← Global feed + okul feed
│   │       ├── children/
│   │       │   ├── index.tsx, add.tsx
│   │       │   └── [id]/index.tsx, edit.tsx, health.tsx
│   │       ├── schools/
│   │       │   ├── _layout.tsx      ← Stack navigator
│   │       │   ├── index.tsx, join.tsx
│   │       │   └── [id]/index.tsx
│   │       ├── activity-classes/
│   │       │   ├── _layout.tsx      ← Stack navigator (KRİTİK)
│   │       │   ├── index.tsx        ← FlatList, pagination, enrolled badge
│   │       │   └── [id].tsx         ← Detay (kayıt/çıkış, galeri modal)
│   │       ├── invoices/            ← YENİ — tab bar'da GİZLİ (href: null)
│   │       │   ├── _layout.tsx      ← Stack navigator (KRİTİK)
│   │       │   ├── index.tsx        ← Fatura listesi (stats + modül badge + durum renkleri)
│   │       │   └── [id].tsx         ← Fatura detayı (kalemler + işlemler + iade linkleri)
│   │       ├── family/
│   │       │   ├── index.tsx, emergency.tsx
│   │       └── profile.tsx          ← useFocusEffect: bekleyen fatura uyarısı + "Faturalarım" navrow
│   ├── lib/
│   │   ├── api.ts                   ← Axios + token interceptor + authEvent
│   │   ├── auth.ts                  ← loginRequest, registerRequest, TOKEN_KEY
│   │   └── authEvent.ts             ← 401 global callback
│   ├── components/
│   └── constants/theme.ts           ← Renk teması
├── app.json                         ← extra.apiUrl
└── package.json
```

### 11.4 Auth Akışı
```
App başlar → AsyncStorage: parent_token + parent_user
→ token var: (app)/ tab grubuna
→ token yok: (auth)/login
401 response → api.ts interceptor → AsyncStorage.multiRemove + authEvent.trigger() → (auth)/login
```

### 11.5 Tab Navigasyonu (6 tab — 2026-04-02)
- Anasayfa, Çocuklar, Okullarım, **Etkinlik Sınıfları**, İstatistikler, Profil
- "Aile" sekmesi kaldırıldı → Profil ekranına "Aile Yönetimi" butonu
- `(app)/_layout.tsx`: `family`, `activity-classes/[id]`, `invoices` → `href: null` (gizli stack screen)
- Tab bar height: Android 72, iOS 96 (uzun label için)
- Tab label style: `fontSize: 8, fontWeight: '600', flexWrap: 'wrap', textAlign: 'center'`

### 11.6 Renk Teması (`constants/theme.ts`)
```javascript
primary: '#208AEF'
background: '#F5F8FF'
card: '#FFFFFF'
text: '#1A1A2E'
textSecondary: '#6B7280'
border: '#E5E7EB'
danger: '#EF4444'
success: '#10B981'
```

### 11.7 React Native Kısıtlamaları
- Tailwind yok — `StyleSheet.create()` kullan
- `SafeAreaView` her ekranda zorunlu
- `KeyboardAvoidingView` form ekranlarında
- **iOS Nested Modal kısıtı:** Modal içinde Modal açılamaz → inline dropdown pattern zorunlu
- Date picker: custom modal (Yıl/Ay/Gün ScrollView) — `@react-native-community/datetimepicker` yüklü DEĞİL

### 11.8 Çocuk Sağlık Verileri
- Alerjenler/rahatsızlıklar: server listesi (global+tenant, status=approved) + "Özel Ekle" → pending suggestion
- İlaçlar: pivot alanları `dose (string)`, `usage_time (JSON array)`, `usage_days (JSON array)`
- `ParentChildResource::medications` `DB::table('child_medications')` kullanır (BelongsToMany pivot bug)
- Pending öğeler: `status === 'pending'` → "Onay Bekleniyor" amber badge, kaldırılamaz
- Kan grubu: `GET /api/parent/blood-types`, `children.blood_type` string olarak saklanır

### 11.9 Çocuk Profil Fotoğrafı
```php
// Kaydet: $path = $request->file('photo')->store('children/photos', 'local');
// Signed URL (1 saat): URL::signedRoute('parent.child.photo', ['child' => $id], now()->addHours(1))
// Route middleware: 'signed' (NOT auth:sanctum — mobil <Image> auth header gönderemez)
return Storage::disk('local')->response($child->profile_photo);
// Eski fotoğraf: Storage::disk('local')->delete($oldPath)
```

### 11.10 TC Kimlik / Pasaport Kuralları
- Uyruk TR seçilirse: TC Kimlik No alanı
- Uyruk başka ise: kullanıcı toggle ile TC Kimlik No VEYA Pasaport No seçer
- Her ikisi de isteğe bağlı

### 11.11 Aile Üyesi Ekleme Kuralları
- Sadece `super_parent` yeni üye ekleyebilir — co_parent ekleyemez
- Hedef kullanıcı sisteme kayıtlıysa → direkt `co_parent` rolüyle, `accepted_at = now()`
- Kayıtlı değilse → 404 (otomatik bağlanma yok)
- `super_parent` hiçbir co_parent tarafından kaldırılamaz
- co_parent yalnızca kendini kaldırabilir

### 11.12 Acil Durum Kişileri
- Telefon: ülke kodu seçici + numara (inline dropdown — Modal içinde açılmaz)
- Uyruk: opsiyonel, seçilirse kimlik/pasaport alanları görünür
- Max sayı: `app_settings` tablosu `max_emergency_contacts` key'i (default 5)
- Tablo: `phone_country_code`, `nationality_country_id`, `passport_number` kolonları

### 11.13 Backend — Mobil İçin Oluşturulan Dosyalar

**Controllers (`app/Http/Controllers/Parents/`):**
- `BaseParentController.php` — `getFamilyProfile()`, `findOwnedChild(int $id)`
- `ParentAuthController.php` — register/login/logout/me/forgotPassword/resetPassword/verifyEmail/resendVerification
- `ParentChildController.php` — CRUD + syncAllergens/Medications/Conditions + suggest* + uploadProfilePhoto/servePhoto/stats
- `ParentFamilyController.php` — members/addMember/removeMember + emergency contacts CRUD
- `ParentSchoolController.php` — mySchools/schoolDetail/joinSchool/socialFeed/globalFeed
- `ParentReferenceController.php` — allergens/conditions/medications/countries/bloodTypes
- `ParentActivityClassController.php` — index/show/enroll/unenroll/myEnrollments/gallery
- `ParentInvoiceController.php` — index/stats/show; canonical `invoices` tablosunu sorgular (dual-strategy)

**Form Requests (`app/Http/Requests/Parent/`):**
- `RegisterParentRequest.php`, `StoreParentChildRequest.php`, `UpdateParentChildRequest.php`, `StoreEmergencyContactRequest.php`

**Resources (`app/Http/Resources/Parent/`):**
- `ParentChildResource.php`, `ParentSocialPostResource.php`

**Yeni/Güncellenen Modeller:**
- `Child.php` → `identity_number, nationality_country_id, languages (JSON), parent_notes` eklendi
- `FamilyMember.php` → `role (super_parent|co_parent), is_active, invited_by_user_id, accepted_at`
- `EmergencyContact.php` → YENİ, `app/Models/Child/`
- `AppSetting.php` → YENİ, `app/Models/Base/` (plain Model, tenant scope yok)

**Uygulanmış Migration'lar:**
- `2026_03_11_100000_extend_parent_module_tables.php`
- `2026_03_11_100001_create_emergency_contacts_table.php`
- `2026_03_11_100002_create_app_settings_table.php`
- `2026_03_12_083758_make_family_profiles_tenant_id_nullable.php`
- `2026_03_12_091002_create_password_reset_tokens_table.php`
- `2026_03_12_092813_make_children_school_id_nullable.php`
- `2026_03_12_100334_add_soft_deletes_to_social_post_media_table.php`
- `2026_03_12_100911_add_soft_deletes_to_social_post_reactions_table.php`
- `2026_03_13_100000_create_blood_types_table.php`
- `2026_03_13_100001_add_suggestion_fields_to_health_tables.php`
- `2026_03_13_100002_add_passport_number_to_children_table.php`
- `2026_03_16_115737_add_passport_and_nationality_to_emergency_contacts.php`

### 11.14 Veli Faturalarım Modülü

**Backend — `ParentInvoiceController`:**
- Canonical `invoices` tablosunu sorgular (tüm modüller: activity_class, subscription, manual, event, activity)
- **Dual-strategy sorgu** — veli kendi faturalarını iki şekilde görebilir:
  1. `invoices.user_id = parent_user_id` (veli kendi kayıt olduğunda)
  2. `payable_type = ActivityClassEnrollment AND payable_id IN enrollment_ids` (tenant admin kayıt yaptırdığında)
- `getFamilyEnrollmentIds()`: `ActivityClassEnrollment::withTrashed()` — soft-deleted enrollment'lar da dahil
- `withoutGlobalScope('tenant')` — cross-tenant invoice sorgusu için zorunlu
- 3 endpoint: `GET /parent/invoices`, `GET /parent/invoices/stats`, `GET /parent/invoices/{invoice}`

**Mobil Ekranlar:**
- `invoices/_layout.tsx` — Stack navigator (Expo Router tab pollution önleme)
- `invoices/index.tsx` — pagination, stats row (pending/overdue/paid), modül badge, renk kodlu kartlar
- `invoices/[id].tsx` — hero card, kalemler tablosu, ödeme geçmişi, etkinlik detayı, iade bilgileri
- `(app)/_layout.tsx`'te `invoices` → `href: null` (tab bar'da gizli)

**`profile.tsx` stats pattern:**
```tsx
useFocusEffect(useCallback(() => {
  void (async () => {
    const res = await api.get('/parent/invoices/stats');
    setInvoiceStats(res.data.data);
  })();
}, []));
// pendingCount = pending_count + overdue_count → badge + uyarı banner
```

### 11.15 Önemli Davranış Notları
- `withoutGlobalScope('tenant')` parent kullanıcıda zaten tenant_id=NULL olduğu için scope atlanır; yine de yazmak güvenli
- `AppSetting` plain `Model`'den türer — tenant scope uygulanmaz, `getByKey()`/`setByKey()` 1 saatlik cache
- iOS geliştirme: `app.json extra.apiUrl` varsayılanı Android için (`10.0.2.2:8000`). iOS simülatörde `localhost:8000`
- co_parent yetkileri: çocuk ekleyip düzenleyebilir, başka co_parent ekleyemez/çıkaramaz

---

## 12. Kritik Hata & Düzeltme Kaydı

| Hata | Düzeltme |
|------|----------|
| Nested route positional arg (`school_id`) | `int $school_id` ilk param olarak ekle |
| ChildController FamilyProfile tenant scope | `withoutGlobalScope('tenant')` tüm aile/sağlık ilişkilerinde |
| `paginatedResponse` plain Collection (`items()` yok) | `getCollection()->map()->setCollection()` pattern |
| `->resource` anti-pattern | `->resource` kaldır, ResourceCollection direkt geç |
| `Storage::disk('private')` hatası | `Storage::disk('local')` kullan — Laravel 12'de 'private' disk yok |
| Mobil activity-classes `/parent/` prefix eksik | Tüm çağrıları `/parent/activity-classes` olarak düzelt |
| BelongsToMany constraint callback `->pivot` fail | `DB::table()` ile direkt pivot sorgu |
| Route cache stale 404 | `php artisan route:clear` + container restart |
| FoodIngredient allergens global scope null filtreler | `->withoutGlobalScopes()` allergens() ilişkisine ekle |
| `family_profiles.tenant_id` nullable değil | Migration uygulandı |
| `social_post_media/reactions` `deleted_at` eksik | Migration uygulandı (SoftDeletes) |
| `EnrollmentRequestService::parentsForSchool()` 0 döner | `withoutGlobalScope('tenant')` eklendi |
| PHP 8.4 SQLite RefreshDatabase transaction bug | Custom `TestSQLiteConnection` + `TestCase` resolver |
| MySQL FK 64-karakter limiti | Migration'larda explicit kısa constraint isimleri |
| `countries.name_tr` kolonu yok | `name` kolonu kullan |
| `phone_code` double `+` prefix (`++90`) | `.replace(/^\+/, '')` önce concat et |
| Expo Router `activity-classes/[id]` ayrı tab görünür | `activity-classes/_layout.tsx` Stack navigator ekle |
| `blood_types` tablosu yoktu | Migration + 8 standart seed uygulandı |
| Sağlık öneri `syncAllergens` `required` hatası | `required` → `present` (boş dizi geçilebilir) |
| `children.school_id` nullable değil | Migration uygulandı |
| `src/app/index.tsx` Expo karşılama ekranı | Silindi — root routing bozuyordu |
| Tab label alt satıra geçmiyordu | `fontSize:8, flexWrap:'wrap', textAlign:'center'` + tab bar height artırıldı |
| `schools/[id]/index.tsx` Ionicons crash | `import { Ionicons } from '@expo/vector-icons'` eksikti, eklendi |
| Mobil veli faturası gözükmüyordu | `ActivityClassInvoice` tablosu yerine canonical `invoices` tablosuna geçildi; dual-strategy: `user_id=parent` OR `payable_id IN enrollment_ids` |
| Expo Router `invoices/[id]` ayrı tab görünür | `invoices/_layout.tsx` Stack navigator + `invoices` `href: null` eklendi |

---

## 13. Birleşik Faturalandırma Modülü

### ActivityClassInvoice Mimarisi
- **Tablo**: `activity_class_invoices` — her kayıt (enrollment) için 1 fatura
- **invoice_type**: `'invoice'` (normal) | `'refund'` (iade/credit note)
- **status değerleri**: `pending | paid | overdue | cancelled | refunded`
  - `refunded` = orijinal fatura iade edildiğinde set edilir, refund kaydı ayrıca `status: paid` olarak oluşturulur
- **original_invoice_id**: iade faturasının hangi faturaya ait olduğunu gösterir (self FK)
- **refund_reason**: iade nedeni (nullable text)
- **Model ilişkileri**: `originalInvoice()` (belongsTo self) + `refundInvoice()` (hasOne self)

### ActivityClassInvoiceService
- **Dosya**: `app/Services/ActivityClassInvoiceService.php`
- `createRefund(ActivityClassInvoice $original, ?string $reason): ActivityClassInvoice`
  - Orijinal fatura status → `refunded`; yeni iade faturası `invoice_type=refund, status=paid` oluşturulur
  - Fatura numarası: `REF-AC-XXXXXXXX`
- `handleEnrollmentCancellation(int $enrollmentId, ?string $reason): array{refunded, refund}`
  - Aktif fatura (`invoice_type=invoice, status ∈ [pending, paid, overdue]`) bulunur
  - Ödenmişse → `createRefund()` çağrılır
  - Ödenmemişse → `status = cancelled` yapılır

### Kayıt İptalinde Otomatik İade
Hem `TenantActivityClassController::enrollmentDestroy()` hem `ParentActivityClassController::unenroll()`:
1. `ActivityClassInvoiceService->handleEnrollmentCancellation($enrollment->id)` çağrılır
2. Ödenmişse: iade faturası otomatik oluşturulur + response'da `refunded: true` döner
3. Ödenmemişse: fatura sadece iptal edilir, `refunded: false` döner

### Manuel İade Endpoint
`POST /api/schools/{id}/activity-classes/{aid}/invoices/{inv}/refund`
- Body: `{ refund_reason?: string }`
- Sadece `status=paid` ve `invoice_type=invoice` faturalara uygulanabilir
- Zaten iade faturası varsa 422 döner
- Controller: `ActivityClassInvoiceController::refund()`

### Frontend (activity-classes/[id]/page.tsx — Faturalar tab)
- İade faturası satırları kırmızı arka plan ile ayrışır
- Tür kolonu: `Fatura` / `İade` badge
- Ödenmiş + iade edilmemiş faturalarda `İade` butonu görünür → `handleRefundInvoice()` → Swal nedenini sorar → `POST .../refund`

### Birleşik Fatura Sistemi (Ana `invoices` Tablosu)
- **Tek kaynak**: `invoices` tablosu TÜM ödemelerin kaydını tutar (abonelik + etkinlik sınıfı + manuel)
- **module** alanı: `subscription | activity_class | manual | event | activity` — hangi sistemden geldiğini gösterir
- **invoice_type**: `invoice | refund` — iade faturası desteği
- **original_invoice_id**: self FK — iade faturasının orijinal faturaya bağlantısı
- **ActivityClassInvoice.main_invoice_id**: `activity_class_invoices` → `invoices` FK bağlantısı
- `ActivityClassInvoiceService::createForEnrollment()` her enrollment'ta HEM ActivityClassInvoice HEM Invoice oluşturur
- `ActivityClassInvoiceService::createRefund()` refund'ta her iki tabloda da kayıt oluşturur/günceller

### API Endpointleri
```
GET  /api/invoices/tenant      — tüm modüller, gelişmiş filtreler (module, status, school_id, date_from, date_to, search)
GET  /api/invoices/stats       — dashboard stats (total_revenue, pending, overdue, this_month, by_module)
GET  /api/invoices/{id}        — detay (items, transactions, school, user, activityClassInvoice.child)
GET  /api/invoices/{id}/transactions — ödeme geçmişi
```

### Frontend Fatura Sayfaları
- **`/invoices/page.tsx`**: Stats kartları + modül tabları + gelişmiş filtreler (status/tarih/arama) + gelişmiş tablo + pagination
- **`/invoices/[id]/page.tsx`**: Header (no/status/modül/iade badge) + fatura kalemleri + totals + transaction geçmişi + müşteri/okul sidebar + iade nedeni + etkinlik detayı

### TypeScript Tipleri (types/index.ts)
- `Invoice` — tam güncellendi: `invoice_no, module, invoice_type, original_invoice_id, refund_reason, is_overdue, user, school, activity_class_invoice`
- `Transaction` — yeni tip: order_id, status(0|1|2), payment_gateway, bank_name, card_last_four, error_message
- `InvoiceStats` — yeni tip: tüm stats alanları

---

## 14. Yeni Modül Ekleme Checklist

1. Migration (+ opsiyonel `{table}_histories` geriye dönük uyumluluk için)
2. Model → `BaseModel`'den türet → activity log otomatik
3. FormRequest (`StoreXxx`, `UpdateXxx`)
4. API Resource (`XxxResource`)
5. Service (`XxxService extends BaseService`)
6. Policy (`extends BasePolicy`)
7. Controller (uygun base controller'dan türet)
8. Route `routes/api.php`'ye ekle (doğru katmana)
9. Tests (Feature + Unit)
10. `vendor/bin/pint --dirty`
11. `docker compose exec app php artisan route:clear` (yeni route eklenince)
12. `docker compose restart app` (PHP dosyası değişince)
