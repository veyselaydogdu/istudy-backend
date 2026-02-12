# 🧠 iStudy Backend — AI Hafıza Dosyası (Project Memory)

> **Son Güncelleme:** 2026-02-12
> **Amaç:** Bu dosya, projede çalışan yapay zeka araçlarının (Claude, Gemini, GPT, Copilot vb.) projeyi hızlıca anlayıp doğru kararlar vermesini sağlamak için hazırlanmıştır.

---

## 📌 1. Proje Kimliği

| Alan | Değer |
|------|-------|
| **Proje Adı** | iStudy Backend |
| **Tip** | SaaS Multi-Tenant Anaokulu/Kreş Yönetim Sistemi (Kindergarten/Preschool Management System) |
| **Framework** | Laravel 12 (PHP 8.4) |
| **API Tipi** | RESTful JSON API (Headless Backend) |
| **Auth Mekanizması** | Laravel Sanctum (Token-based) |
| **Veritabanı** | SQLite (Geliştirme), MySQL/PostgreSQL (Production) |
| **Dil** | Türkçe mesajlar ve yorumlar kullanılır |
| **Proje Yolu** | `/Users/veysel.aydogdu/Desktop/WebProjects/iStudy/istudy-backend` |

---

## 📐 2. Mimari Genel Bakış

### 2.1 Multi-Tenant (Çoklu Kiracı) Mimari

```
┌─────────────────────────────────────────────┐
│                SUPER ADMIN                   │
│         (Tüm sistemi yönetir)               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐     ┌─────────────┐       │
│  │  Tenant A    │     │  Tenant B    │      │
│  │ (Kurum A)    │     │ (Kurum B)    │      │
│  ├─────────────┤     ├─────────────┤       │
│  │ School A-1   │     │ School B-1   │      │
│  │ School A-2   │     │ School B-2   │      │
│  └─────────────┘     └─────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

- Tenant = Kurum (Müşteri). Birden fazla okul (School) barındırabilir.
- Her okul altında sınıflar (Classes), çocuklar (Children), öğretmenler (Teachers), aileler (Families) bulunur.
- `BaseModel` üzerindeki `Global Scope` ile tenant izolasyonu sağlanır.
- Super Admin hariç **tüm kullanıcılar** yalnızca kendi tenant verisini görür.

### 2.2 Katmanlı Mimari

```
Request → Route → Middleware → Controller → Service → Model → Database
                                    ↓
                              FormRequest (Validation)
                                    ↓
                              JsonResponse (API Resource)
```

### 2.3 Rol Hiyerarşisi

| Rol | Açıklama | Erişim Kapsamı |
|-----|----------|----------------|
| `super_admin` | Platform sahibi | Tüm veriler, tüm tenant'lar |
| `tenant_owner` | Kurum sahibi | Kendi tenant'ındaki tüm okullar |
| `school_admin` | Okul yöneticisi | Yalnızca atandığı okul |
| `teacher` | Öğretmen | Kendi sınıflarındaki veriler |
| `parent` | Veli | Kendi çocuklarının verileri |

---

## 📁 3. Proje Dizin Yapısı

```
istudy-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Base/
│   │   │   │   └── BaseController.php          ← Tüm controller'ların atası
│   │   │   ├── Schools/
│   │   │   │   ├── BaseSchoolController.php     ← Okul controller'larının atası
│   │   │   │   ├── SchoolController.php
│   │   │   │   ├── ClassController.php
│   │   │   │   ├── ChildController.php
│   │   │   │   ├── ActivityController.php
│   │   │   │   └── FamilyProfileController.php
│   │   │   ├── Tenant/
│   │   │   │   ├── BaseTenantController.php     ← Tenant controller'larının atası
│   │   │   │   ├── TenantController.php
│   │   │   │   └── SubscriptionController.php
│   │   │   ├── Parents/
│   │   │   │   └── BaseParentController.php     ← Veli controller'larının atası
│   │   │   └── Teachers/
│   │   │       └── BaseTeacherController.php    ← Öğretmen controller'larının atası
│   │   ├── Requests/
│   │   │   ├── Activity/
│   │   │   │   ├── StoreActivityRequest.php
│   │   │   │   └── UpdateActivityRequest.php
│   │   │   ├── Child/
│   │   │   │   ├── StoreChildRequest.php
│   │   │   │   └── UpdateChildRequest.php
│   │   │   ├── FamilyProfile/
│   │   │   │   ├── StoreFamilyProfileRequest.php
│   │   │   │   └── UpdateFamilyProfileRequest.php
│   │   │   ├── School/
│   │   │   │   ├── StoreSchoolRequest.php
│   │   │   │   └── UpdateSchoolRequest.php
│   │   │   ├── SchoolClass/
│   │   │   │   ├── StoreSchoolClassRequest.php
│   │   │   │   └── UpdateSchoolClassRequest.php
│   │   │   ├── Subscription/
│   │   │   │   ├── StoreSubscriptionRequest.php
│   │   │   │   └── UpdateSubscriptionRequest.php
│   │   │   └── Tenant/
│   │   │       ├── StoreTenantRequest.php
│   │   │       └── UpdateTenantRequest.php
│   │   └── Resources/
│   │       ├── AcademicYearResource.php
│   │       ├── ActivityResource.php
│   │       ├── ChildResource.php
│   │       ├── FamilyProfileResource.php
│   │       ├── SchoolClassResource.php
│   │       ├── SchoolResource.php
│   │       ├── SubscriptionResource.php
│   │       ├── TeacherProfileResource.php
│   │       └── TenantResource.php
│   ├── Models/
│   │   ├── Base/
│   │   │   ├── BaseModel.php                    ← Tüm model'lerin atası
│   │   │   ├── Role.php
│   │   │   └── Permission.php
│   │   ├── Tenant/
│   │   │   └── Tenant.php
│   │   ├── School/
│   │   │   ├── School.php
│   │   │   └── TeacherProfile.php
│   │   ├── Academic/
│   │   │   ├── AcademicYear.php
│   │   │   └── SchoolClass.php
│   │   ├── Child/
│   │   │   ├── Child.php
│   │   │   ├── FamilyProfile.php
│   │   │   └── FamilyMember.php
│   │   ├── Activity/
│   │   │   ├── Activity.php
│   │   │   ├── Attendance.php
│   │   │   ├── DailyChildReport.php
│   │   │   └── Event.php
│   │   ├── Health/
│   │   │   ├── Allergen.php
│   │   │   ├── FoodIngredient.php
│   │   │   ├── Meal.php
│   │   │   ├── MedicalCondition.php
│   │   │   └── Medication.php
│   │   ├── Billing/
│   │   │   ├── FamilySubscription.php
│   │   │   ├── Payment.php
│   │   │   ├── RevenueShare.php
│   │   │   └── SubscriptionPlan.php
│   │   └── User.php
│   ├── Observers/
│   │   └── HistoryObserver.php                  ← Tüm modellerde geçmiş kaydı tutar
│   ├── Policies/
│   │   ├── BasePolicy.php                       ← Super Admin bypass
│   │   ├── SchoolPolicy.php
│   │   ├── SchoolClassPolicy.php
│   │   ├── ChildPolicy.php
│   │   ├── ActivityPolicy.php
│   │   ├── FamilyProfilePolicy.php
│   │   ├── TenantPolicy.php
│   │   └── FamilySubscriptionPolicy.php
│   ├── Providers/
│   │   └── AppServiceProvider.php               ← Policy kayıtları burada
│   ├── Services/
│   │   ├── BaseService.php                      ← Ortak CRUD mantığı
│   │   ├── SchoolService.php
│   │   ├── ClassService.php
│   │   ├── ChildService.php
│   │   ├── ActivityService.php
│   │   ├── FamilyProfileService.php
│   │   ├── TenantService.php
│   │   └── SubscriptionService.php
│   └── Traits/                                  ← (Genişlemeye açık)
├── database/
│   └── migrations/
│       ├── 000001_create_auth_tables.php         ← Users, Roles, Permissions
│       ├── 000002_create_institutions_tables.php ← Tenants, Schools, AcademicYears
│       ├── 000003_create_people_tables.php       ← TeacherProfiles, FamilyProfiles, Children
│       ├── 000004_create_academic_structures.php ← Classes, ChildClassAssignments
│       ├── 000005_create_health_and_meals.php    ← Allergens, Meals, Medications, Pivots
│       ├── 000006_create_tracking_activities.php ← DailyReports, Attendances, Activities, Events, Materials
│       ├── 000007_create_finance_tables.php      ← SubscriptionPlans, Payments, RevenueShares
│       └── 000008_create_missing_tables.php      ← users.tenant_id + class_teacher_assignments
├── routes/
│   ├── api.php                                  ← Tüm API endpoint'leri (auth:sanctum)
│   ├── web.php                                  ← Sadece welcome sayfası
│   └── console.php                              ← Artisan komutları
├── config/
│   ├── app.php
│   ├── auth.php                                 ← Sanctum + Eloquent provider
│   └── ... (standart Laravel config)
├── bootstrap/
│   ├── app.php                                  ← Middleware, routing (web + api + commands)
│   └── providers.php                            ← Service Provider registrations
└── CLAUDE.md                                    ← Laravel Boost AI kuralları
```

---

## 🗄️ 4. Veritabanı Şeması (Entity-Relationship)

### 4.1 Tablolar ve Modüller

#### 🔐 Auth Modülü
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `users` | `App\Models\User` | Tüm sistem kullanıcıları |
| `roles` | `App\Models\Base\Role` | Roller (super_admin, tenant_owner, vb.) |
| `permissions` | `App\Models\Base\Permission` | İzinler |
| `role_user` | — (Pivot) | Kullanıcı-Rol ilişkisi (M2M) |
| `permission_role` | — (Pivot) | Rol-İzin ilişkisi (M2M) |

#### 🏢 Kurum Modülü (Institutions)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `tenants` | `App\Models\Tenant\Tenant` | Kiracı kurumlar |
| `schools` | `App\Models\School\School` | Okullar/Şubeler |
| `academic_years` | `App\Models\Academic\AcademicYear` | Eğitim dönemleri (2025-2026) |

#### 👥 Kişiler Modülü (People)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `teacher_profiles` | `App\Models\School\TeacherProfile` | Öğretmen profilleri |
| `family_profiles` | `App\Models\Child\FamilyProfile` | Aile profilleri |
| `family_members` | `App\Models\Child\FamilyMember` | Aile üyeleri (anne, baba vb.) |
| `children` | `App\Models\Child\Child` | Çocuklar (Öğrenciler) |

#### 🎓 Akademik Yapılar
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `classes` | `App\Models\Academic\SchoolClass` | Sınıflar (Not: PHP'de `Class` reserved keyword olduğu için `SchoolClass` adlandırılır) |
| `child_class_assignments` | — (Pivot) | Çocuk-Sınıf atamaları (M2M) |
| `class_teacher_assignments` | — (Pivot) | Öğretmen-Sınıf atamaları (M2M) |

#### 🏥 Sağlık & Beslenme Modülü
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `allergens` | `App\Models\Health\Allergen` | Alerjenler |
| `medical_conditions` | `App\Models\Health\MedicalCondition` | Tıbbi durumlar |
| `medications` | `App\Models\Health\Medication` | İlaçlar |
| `food_ingredients` | `App\Models\Health\FoodIngredient` | Yemek malzemeleri |
| `meals` | `App\Models\Health\Meal` | Yemek menüleri |
| `child_allergens` | — (Pivot) | Çocuk-Alerjen (M2M) |
| `child_medications` | — (Pivot) | Çocuk-İlaç (M2M) |
| `child_conditions` | — (Pivot) | Çocuk-Tıbbi Durum (M2M) |
| `meal_ingredient_pivot` | — (Pivot) | Yemek-Malzeme (M2M) |

#### 📊 Takip & Aktiviteler Modülü
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `daily_child_reports` | `App\Models\Activity\DailyChildReport` | Günlük çocuk raporları (mood, appetite, notlar) |
| `attendances` | `App\Models\Activity\Attendance` | Yoklama (present, absent, late, excused) |
| `activities` | `App\Models\Activity\Activity` | Etkinlikler (ücretli/ücretsiz) |
| `events` | `App\Models\Activity\Event` | Takvim olayları |
| `materials` | — | Materyaller |
| `child_activity_enrollments` | — (Pivot) | Çocuk-Aktivite kayıtları (M2M) |
| `child_event_participations` | — (Pivot) | Çocuk-Etkinlik katılımları (M2M) |
| `child_material_trackings` | — (Pivot) | Çocuk-Materyal takibi (M2M) |

#### 💰 Finans Modülü (Billing)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `subscription_plans` | `App\Models\Billing\SubscriptionPlan` | Abonelik planları |
| `plan_tier_pricing` | — | Çocuk sayısına göre kademeli fiyatlandırma |
| `family_subscriptions` | `App\Models\Billing\FamilySubscription` | Aile abonelikleri (active, cancelled, expired) |
| `payments` | `App\Models\Billing\Payment` | Ödemeler (Stripe, iyzico) |
| `revenue_shares` | `App\Models\Billing\RevenueShare` | Gelir paylaşım/komisyon |

#### 📜 History Tabloları (Geçmiş Kayıtları)
Her ana tablo için `{tablo_adı}_histories` tablosu mevcuttur:
- `users_histories`, `roles_histories`, `permissions_histories`
- `tenants_histories`, `schools_histories`, `academic_years_histories`
- `teacher_profiles_histories`, `family_profiles_histories`, `family_members_histories`, `children_histories`
- `classes_histories`
- `allergens_histories`, `medical_conditions_histories`, `medications_histories`, `food_ingredients_histories`, `meals_histories`
- `daily_child_reports_histories`, `attendances_histories`, `activities_histories`, `events_histories`, `materials_histories`
- `subscription_plans_histories`, `plan_tier_pricing_histories`, `family_subscriptions_histories`, `payments_histories`, `revenue_shares_histories`

**History Yapısı (her tabloda aynı):**
```
id, original_id (index), operation_type (create/update/delete), snapshot (JSON), operated_by (FK→users), timestamps
```

### 4.2 İlişki Haritası (ER Diagram - Metin)

```
User ──────┬── belongsToMany ──── Role ──── belongsToMany ──── Permission
           │
           ├── hasMany ──── Tenant (owner_user_id)
           ├── hasMany ──── TeacherProfile (user_id)
           └── hasMany ──── FamilyProfile (owner_user_id)

Tenant ────┬── hasMany ──── School (tenant_id)
           └── hasMany ──── User (tenant_id)

School ────┬── belongsTo ──── Tenant
           ├── hasMany ──── AcademicYear (school_id)
           ├── hasMany ──── SchoolClass (school_id)  [hasMany through AcademicYear]
           ├── hasMany ──── TeacherProfile (school_id)
           ├── hasMany ──── Child (school_id)
           ├── hasMany ──── Activity (school_id)
           ├── hasMany ──── Event (school_id)
           └── hasMany ──── Meal (school_id)

AcademicYear ┬── belongsTo ──── School
             ├── hasMany ──── SchoolClass
             ├── hasMany ──── Activity
             └── hasMany ──── Event

SchoolClass ┬── belongsTo ──── School
            ├── belongsTo ──── AcademicYear
            ├── belongsToMany ──── Child (via child_class_assignments)
            └── belongsToMany ──── TeacherProfile (via class_teacher_assignments)

Child ──────┬── belongsTo ──── FamilyProfile
            ├── belongsTo ──── School
            ├── belongsTo ──── AcademicYear
            ├── belongsToMany ──── SchoolClass (via child_class_assignments)
            ├── belongsToMany ──── Allergen (via child_allergens)
            ├── belongsToMany ──── Medication (via child_medications)
            ├── belongsToMany ──── MedicalCondition (via child_conditions)
            ├── belongsToMany ──── Activity (via child_activity_enrollments)
            ├── belongsToMany ──── Event (via child_event_participations)
            ├── hasMany ──── DailyChildReport
            └── hasMany ──── Attendance

FamilyProfile ┬── belongsTo ──── User (owner_user_id)
              ├── belongsTo ──── Tenant
              ├── hasMany ──── FamilyMember
              ├── hasMany ──── Child
              └── hasMany ──── FamilySubscription

FamilySubscription ┬── belongsTo ──── FamilyProfile
                   └── belongsTo ──── SubscriptionPlan

Payment ──── belongsTo ──── FamilySubscription
RevenueShare ┬── belongsTo ──── Payment
             └── belongsTo ──── School
```

---

## ⚙️ 5. Temel Mimari Bileşenler

### 5.1 BaseModel (`app/Models/Base/BaseModel.php`)

**Tüm model'lerin atası.** Aşağıdaki ortak davranışları sağlar:

| Özellik | Açıklama |
|---------|----------|
| **SoftDeletes** | `deleted_at` ile geri dönüşlü silme |
| **HasFactory** | Factory desteği |
| **Auto created_by** | `creating` event'inde `auth()->id()` ile doldurulur |
| **Auto updated_by** | `updating` event'inde `auth()->id()` ile doldurulur |
| **Tenant Global Scope** | Login olan kullanıcının `tenant_id`'sine göre otomatik filtreleme. Super Admin hariç. |
| **History Observer** | Her create/update/delete'te `{tablo}_histories` tablosuna snapshot kaydeder |
| **createdBy() / updatedBy()** | User ilişkileri (belongsTo) |

**⚠️ ÖNEMLİ:** `User` modeli `BaseModel`'den **türemez** (Authenticatable'dan türer). Dolayısıyla User için tenant scope ve history özelliği `BaseModel` üzerinden gelmez; ayrı implement edilmelidir gerektiğinde.

### 5.2 BaseService (`app/Services/BaseService.php`)

**Tüm service'lerin atası.** Ortak CRUD mantığını sağlar:

```php
abstract class BaseService
{
    abstract protected function model(): string;  // Alt sınıf hangi Model'i kullandığını döndürür

    public function getAll(array $filters = []): LengthAwarePaginator  // Sayfalı listeleme
    public function create(array $data): Model                         // Yeni kayıt
    public function update(Model $model, array $data): Model           // Güncelleme
    public function delete(Model $model): bool                         // Soft delete
    protected function applyFilters($query, array $filters): void      // Alt sınıf override edebilir
}
```

Alt sınıflar sadece `model()` ve isteğe bağlı `applyFilters()` override eder.

### 5.3 BaseController (`app/Http/Controllers/Base/BaseController.php`)

**Tüm controller'ların atası.** Standart response helper'ları sağlar:

```php
// Authenticated user helper
protected function user(): User

// Başarılı response: { success: true, message: "...", data: {...} }
protected function successResponse(mixed $data, ?string $message, int $code = 200): JsonResponse

// Hatalı response: { success: false, message: "...", data: null }
protected function errorResponse(string $message, int $code = 400): JsonResponse

// Sayfalı response: { success: true, message: "...", data: [...], meta: {current_page, last_page, per_page, total} }
protected function paginatedResponse(mixed $collection): JsonResponse
```

### 5.4 Role-Specific Base Controller'lar

| Controller | Namespace | Kullanım |
|-----------|-----------|----------|
| `BaseSchoolController` | `Controllers\Schools` | Okul erişim kontrolü yapar. `school_id` parameter'ını doğrular. `$this->school` property sağlar. |
| `BaseTenantController` | `Controllers\Tenant` | `$this->tenant()` helper'ı ile mevcut tenant'ı döndürür. |
| `BaseParentController` | `Controllers\Parents` | `$this->familyProfile()` helper'ı ile velinin aile profilini döndürür. |
| `BaseTeacherController` | `Controllers\Teachers` | `$this->teacherProfile()` helper'ı ile öğretmen profilini döndürür. |

### 5.5 BasePolicy (`app/Policies/BasePolicy.php`)

Tüm policy'lerin atası. `before()` hook'u ile **Super Admin** tüm işlemlere otomatik izinlidir.

### 5.6 HistoryObserver (`app/Observers/HistoryObserver.php`)

Her `BaseModel` türevi model'de otomatik çalışır:
- **created** → `{tablo}_histories` tablosuna `operation_type: 'create'` kaydeder
- **updated** → `{tablo}_histories` tablosuna `operation_type: 'update'` kaydeder
- **deleted** → `{tablo}_histories` tablosuna `operation_type: 'delete'` kaydeder
- `snapshot` alanı: Model'in o anki JSON hali
- `operated_by`: İşlemi yapan kullanıcı ID'si
- History tablosu yoksa hata loglanır ama işlem engellenmez

---

## 🔧 6. Controller Kodlama Standartları

### 6.1 Standart Controller Şablonu

```php
class XxxController extends BaseSchoolController // veya BaseTenantController
{
    // Constructor ile Service injection
    public function __construct(XxxService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    // READ İşlemleri (index, show): Transaction KULLANILMAZ
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Model::class);
            $data = $this->service->getAll(request()->all());
            return $this->paginatedResponse($data);
        } catch (\Throwable $e) {
            Log::error('XxxController::index Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // WRITE İşlemleri (store, update, destroy): Transaction KULLANILIR
    public function store(StoreXxxRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', Model::class);

            $data = $request->validated();
            $data['created_by'] = $this->user()->id;
            // school_id eklemesi (okul controller'larında)
            if (!isset($data['school_id']) && request()->has('school_id')) {
                $data['school_id'] = request('school_id');
            }
            $item = $this->service->create($data);

            DB::commit();
            return $this->successResponse(XxxResource::make($item), 'Kayıt oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('XxxController::store Error', [...]);
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // update → $data['updated_by'] = $this->user()->id;
    // destroy → Sadece service->delete() çağırır
}
```

### 6.2 Temel Kurallar

1. **Try-Catch zorunlu:** Her method'da `try-catch (Throwable)` kullanılır
2. **Transaction yönetimi:** Write işlemleri (`store`, `update`, `destroy`) → `DB::beginTransaction()` + `DB::commit()` / `DB::rollBack()`
3. **Read işlemleri** (`index`, `show`) → Transaction **kullanılmaz**
4. **Log::error zorunlu:** Catch bloğunda detaylı hata loglanır
5. **Response standartları:** Sadece `successResponse()`, `errorResponse()`, `paginatedResponse()` kullanılır
6. **Form Request:** Validation controller dışında, ayrı `StoreXxxRequest` / `UpdateXxxRequest` sınıflarında yapılır
7. **Authorization:** Controller method'larında `$this->authorize()` ile Policy kullanılır
8. **Türkçe yorumlar:** Her method'a Türkçe açıklama
9. **created_by / updated_by:** Manuel olarak `$data` array'ine eklenir

### 6.3 API Response Formatı

```json
// Başarılı (Tekil)
{
  "success": true,
  "message": "İşlem başarılı.",
  "data": { ... }
}

// Başarılı (Sayfalı)
{
  "success": true,
  "message": "Veriler başarıyla listelendi.",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73
  }
}

// Hatalı
{
  "success": false,
  "message": "Hata mesajı...",
  "data": null
}
```

---

## 🏗️ 7. Standart Alanlar (Her Tabloda Bulunan)

Her ana tabloda aşağıdaki standart alanlar bulunur:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | bigint (PK) | Auto-increment birincil anahtar |
| `created_by` | foreignId → users | Kaydı oluşturan kullanıcı |
| `updated_by` | foreignId → users (nullable) | Kaydı güncelleyen kullanıcı |
| `created_at` | timestamp | Oluşturulma tarihi |
| `updated_at` | timestamp | Güncellenme tarihi |
| `deleted_at` | timestamp (nullable) | Soft delete tarihi |

---

## 📌 8. Önemli Notlar ve Dikkat Edilecekler

### 8.1 Bilinen Mimari Kararlar

1. **`SchoolClass` isimlendirmesi:** PHP'de `Class` reserved keyword olduğu için model `SchoolClass` olarak adlandırılmıştır. Veritabanı tablosu `classes`'tır.

2. **`User` modeli `BaseModel`'den türemez:** Authenticatable sınıfından türediği için BaseModel'deki tenant scope, history observer gibi özellikler User'a otomatik uygulanmaz.

3. **Tenant ilişkisi `User` üzerinde:** `User->tenants()` ilişkisi `hasMany(Tenant::class, 'owner_user_id')` olarak tanımlı. Bu yalnızca tenant **sahipliği** demektir, kullanıcının hangi tenant altında olduğu `tenant_id` ile belirlenir.

4. **İlk User seed problemi:** `created_by` alanı `users` tablosunda nullable çünkü ilk kullanıcı oluşturulurken henüz auth yoktur.

5. **Policy yapısı:** `BasePolicy` → `before()` hook ile Super Admin tüm işlemlere izinlidir. Alt policy'ler basit tutulmuştur; tenant/school scope izolasyonu zaten BaseModel ve BaseSchoolController'da sağlanmaktadır.

6. **Service yapısı:** `BaseService` ortak CRUD sağlar. Her service sadece `model()` ve opsiyonel `applyFilters()` override eder. Karmaşık iş mantığı gerektiğinde ilgili service'e eklenir.

### 8.2 Tamamlanan ve Kalan Eksiklikler

| Durum | Açıklama |
|-------|----------|
| ✅ **API Routes** | `routes/api.php` oluşturuldu, `bootstrap/app.php`'ye kaydedildi. |
| ✅ **Service katmanı** | `BaseService` + 7 somut service oluşturuldu. |
| ✅ **API Resources** | 9 Resource sınıfı oluşturuldu. |
| ✅ **Policies** | `BasePolicy` + 7 policy oluşturuldu, `AppServiceProvider`'a kaydedildi. |
| ✅ **FormRequests** | Tüm controller'ların ihtiyaç duyduğu 12 FormRequest oluşturuldu. |
| ✅ **Migration eksikleri** | `class_teacher_assignments` pivot + `users.tenant_id` sütunu eklendi. |
| ⚠️ **Tests** | Test dosyaları henüz yazılmamış. |
| ⚠️ **Auth/Login controller** | Login/Register endpoint'leri henüz yok. |
| ⚠️ **Seeders** | Varsayılan roller ve test verileri için seeder'lar yazılmalı. |

### 8.3 Naming Conventions

| Konu | Kural | Örnek |
|------|-------|-------|
| **Model** | PascalCase, tekil | `SchoolClass`, `FamilyProfile` |
| **Tablo** | snake_case, çoğul | `school_classes`, `family_profiles` |
| **Controller** | PascalCase + Controller | `ClassController`, `SchoolController` |
| **FormRequest** | Store/Update + Model + Request | `StoreSchoolClassRequest` |
| **Service** | Model + Service | `SchoolService`, `ClassService` |
| **Policy** | Model + Policy | `SchoolPolicy`, `ChildPolicy` |
| **Resource** | Model + Resource | `SchoolResource`, `ChildResource` |
| **Pivot tablo** | Anlamlı isim | `child_class_assignments`, `role_user` |
| **History tablo** | {tablo_adı}_histories | `users_histories`, `schools_histories` |
| **FK sütunlar** | model_id (snake_case) | `school_id`, `tenant_id`, `owner_user_id` |
| **Namespace** | Modüler gruplandırma | `App\Models\School\`, `App\Http\Controllers\Schools\` |

---

## 🔗 9. Teknoloji ve Paket Listesi

### Production Dependencies
| Paket | Versiyon | Kullanım |
|-------|---------|----------|
| `php` | ^8.2 | Çalışma ortamı |
| `laravel/framework` | ^12.0 | Ana framework |
| `laravel/tinker` | ^2.10.1 | REPL debugging |

### Dev Dependencies
| Paket | Versiyon | Kullanım |
|-------|---------|----------|
| `laravel/boost` | ^1.0 | AI asistan MCP server |
| `laravel/pail` | ^1.2.2 | Log görüntüleme |
| `laravel/pint` | ^1.24 | Kod formatlama |
| `laravel/sail` | ^1.41 | Docker geliştirme ortamı |
| `fakerphp/faker` | ^1.23 | Test verisi |
| `phpunit/phpunit` | ^11.5.3 | Unit/Feature testler |

---

## 🚀 10. Geliştirme Komutları

```bash
# Projeyi kurma
composer setup

# Geliştirme ortamını başlatma (server + queue + logs + vite)
composer dev

# Testleri çalıştırma
composer test

# Kod formatlama
vendor/bin/pint --dirty

# Migration
php artisan migrate

# Yeni model oluşturma
php artisan make:model ModelName --no-interaction

# Pint ile format kontrolü
vendor/bin/pint
```

---

## 📊 11. Hızlı Referans — Model → Tablo → İlişkiler

| Model | Tablo | belongsTo | hasMany | belongsToMany |
|-------|-------|-----------|---------|---------------|
| `User` | users | — | Tenant(owner), TeacherProfile, FamilyProfile | Role |
| `Tenant` | tenants | User(owner) | School, User(tenant_id) | — |
| `School` | schools | Tenant | AcademicYear, SchoolClass, TeacherProfile, Child | — |
| `AcademicYear` | academic_years | School | SchoolClass, Activity, Event | — |
| `SchoolClass` | classes | School, AcademicYear | — | Child, TeacherProfile |
| `TeacherProfile` | teacher_profiles | User, School | — | SchoolClass |
| `FamilyProfile` | family_profiles | User(owner), Tenant | FamilyMember, Child, FamilySubscription | — |
| `FamilyMember` | family_members | FamilyProfile, User | — | — |
| `Child` | children | FamilyProfile, School, AcademicYear | DailyChildReport, Attendance | SchoolClass, Allergen, Medication, MedicalCondition, Activity, Event |
| `Activity` | activities | School, AcademicYear | — | Child |
| `Event` | events | School, AcademicYear | — | Child |
| `Attendance` | attendances | Child | — | — |
| `DailyChildReport` | daily_child_reports | Child | — | — |
| `Allergen` | allergens | — | — | Child |
| `Medication` | medications | — | — | Child |
| `MedicalCondition` | medical_conditions | — | — | Child |
| `Meal` | meals | School, AcademicYear | — | FoodIngredient |
| `SubscriptionPlan` | subscription_plans | — | — | — |
| `FamilySubscription` | family_subscriptions | FamilyProfile, SubscriptionPlan | — | — |
| `Payment` | payments | FamilySubscription | RevenueShare | — |
| `RevenueShare` | revenue_shares | Payment, School | — | — |
| `Role` | roles | — | — | User, Permission |
| `Permission` | permissions | — | — | Role |

---

## 🔑 12. Yeni Özellik Eklerken Kontrol Listesi

1. ✅ Migration oluştur (+ `{tablo}_histories` tablosu unutma!)
2. ✅ Model oluştur (`BaseModel`'den türet, `$fillable`, `$casts`, ilişkiler)
3. ✅ FormRequest oluştur (`StoreXxxRequest`, `UpdateXxxRequest`)
4. ✅ API Resource oluştur (`XxxResource`)
5. ✅ Service oluştur (`XxxService`)
6. ✅ Policy oluştur (yetkilendirme kuralları)
7. ✅ Controller oluştur (uygun Base Controller'dan türet)
8. ✅ Route tanımla (`routes/api.php`)
9. ✅ Test yaz (Feature + Unit)
10. ✅ `vendor/bin/pint --dirty` çalıştır

---

> 📝 **Not:** Bu dosya proje geliştikçe güncellenmelidir. Her yeni modül, migration veya mimari değişiklikte bu dosyanın güncellenmesi önerilir.
