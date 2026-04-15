# TASKS_FOR_FIX.md — API Hata Görev Listesi

> Oluşturulma: 2026-02-25 | Son Güncelleme: 2026-02-26
> Kapsam: iStudy Backend API — Tüm tenant API endpoint'leri analiz edildi.
> Test dosyaları: `tests/Feature/API/` klasöründe ilgili `@group bug` testleri mevcut.
> Mevcut durum: `php artisan test` → **105 passing / 31 failing** (tümü @group bug)

---

## Öncelik Sırası

| # | Bug ID | Etki | Öncelik |
|---|--------|------|---------|
| 1 | BUG-010 | KRİTİK — Tüm okul/sınıf/aktivite/eğitim-yılı API'leri çöküyor | 🔴 P0 |
| 2 | BUG-003 | KRİTİK — Cross-tenant güvenlik açığı (meal güncelleme/silme) | 🔴 P0 |
| 3 | BUG-001 | YÜKSEK — Global allerjenler hiç dönmüyor | 🟠 P1 |
| 4 | BUG-002 | YÜKSEK — Global besin öğeleri hiç dönmüyor | 🟠 P1 |
| 5 | BUG-006 | ORTA — Eksik school_id 500 döndürüyor (422 olmalı) | 🟡 P2 |
| 6 | BUG-007 | ORTA — Validation hataları 500 döndürüyor (422 olmalı) | 🟡 P2 |
| 7 | BUG-004 | ORTA — Yanlış allerjen işlemi 500 (404 olmalı) — destroy ✅, update ⏳ | 🟡 P2 |
| 8 | BUG-005 | ORTA — Yanlış ingredient işlemi 500 (404 olmalı) — destroy ✅, update ⏳ | 🟡 P2 |
| 9 | BUG-011 | DÜŞÜK — İç hata mesajı sızıyor | 🟢 P3 |
| 10 | BUG-008 | DÜŞÜK — $request->all() güvenli olmayan kullanım | 🟢 P3 |
| 11 | BUG-009 | DÜŞÜK — paginatedResponse anti-pattern | 🟢 P3 |

---

## BUG-010 — User::schools() İlişkisi Eksik [KRİTİK]

### Tanım
`BaseSchoolController::validateSchoolAccess()` metodu `$user->schools()` çağırıyor.
`User` modelinde `schools()` ilişkisi **tanımlanmamış**. Bu nedenle `school_id` parametresi
içeren **tüm** istek türleri `BadMethodCallException` fırlatarak 500 döndürüyor.

### Etkilenen Endpoint'ler
Tüm `BaseSchoolController` türevleri:
- `GET/POST/PUT/DELETE /api/schools/{school_id}/classes/*`
- `GET/POST/PUT/DELETE /api/schools/{school_id}/activities/*`
- `GET/POST /api/schools/{school_id}/attendances`
- `GET/POST/PUT/DELETE /api/schools/{school_id}/children/*`
- `GET /api/academic-years?school_id=X`
- `POST /api/academic-years` (body'de school_id)
- `POST /api/academic-years/transition` (body'de school_id)

### Kök Neden
`BaseSchoolController.php:32` → `$user->schools()->where(...)`
`User.php` → `schools()` metodu yok.

### Düzeltme Adımları

**Adım 1:** `app/Models/User.php` dosyasına `schools()` ilişkisi ekle.

Öncelikle `schools` tablosu ile `users` arasındaki ilişkiyi belirle:
- Eğer `school_users` gibi bir pivot tablo varsa: `BelongsToMany`
- Eğer `schools.owner_user_id` gibi FK varsa: `HasMany`
- Eğer kullanıcı tenant üzerinden okullara sahipse: `hasManyThrough`

```php
// app/Models/User.php
public function schools(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
{
    return $this->hasManyThrough(
        \App\Models\School\School::class,
        \App\Models\Tenant\Tenant::class,
        'owner_user_id', // Tenant'ın FK'i (user_id)
        'tenant_id',     // School'un FK'i (tenant_id)
        'id',            // User'ın PK
        'id'             // Tenant'ın PK
    );
}
```

Ya da daha basit seçenek — mevcut tenant logic'e göre:
```php
public function schools(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
{
    // Tenant owner ise tüm tenant okulları
    return $this->hasManyThrough(
        \App\Models\School\School::class,
        \App\Models\Tenant\Tenant::class,
        'owner_user_id',
        'tenant_id',
    );
}
```

**Adım 2:** `BaseSchoolController::validateSchoolAccess()` metodunu da gözden geçir.
Mevcut user'ın sadece tenant owner olabileceği göz önünde bulundurulursa,
ilişki doğru çalışmalı. Ancak teacher/staff kullanıcıları için pivot tablo gerekebilir.

**Adım 3:** Test çalıştır:
```bash
php artisan test tests/Feature/API/Schools/ClassApiTest.php
php artisan test tests/Feature/API/Schools/ActivityApiTest.php
php artisan test tests/Feature/API/Schools/AcademicYearApiTest.php
```

### Test Dosyası
`tests/Feature/API/Schools/ClassApiTest.php` — `@group bug` testleri
`tests/Feature/API/Schools/ActivityApiTest.php` — `@group bug` testleri
`tests/Feature/API/Schools/AcademicYearApiTest.php` — `@group bug` testleri

---

## BUG-003 — Meal Güncelleme/Silmede Tenant İzolasyonu Eksik [KRİTİK]

### Tanım
`TenantMealController::mealUpdate()` ve `mealDestroy()` metodlarında:
```php
$meal = Meal::findOrFail($id); // tenant filtresi YOK
```
`Meal` modelinde `tenant_id` kolonu olmadığından BaseModel global scope uygulanmıyor.
Herhangi bir authenticated kullanıcı başka tenant'ın yemeğini güncelleyip silebilir.

### Kök Neden
`TenantMealController.php:251` ve `284` → `Meal::findOrFail($id)` (tenant filtresi yok)
`Meal.php` → `tenant_id` fillable'da değil, global scope yok

### Düzeltme Seçeneği A — School bazlı tenant kontrolü:
```php
// mealUpdate ve mealDestroy içinde:
$meal = Meal::whereHas('school', function ($q) {
    $q->where('tenant_id', $this->user()->tenant_id);
})->findOrFail($id);
```

### Düzeltme Seçeneği B — School ID ile kontrol:
```php
// Kullanıcının erişebildiği school_id'leri al
$schoolIds = \App\Models\School\School::pluck('id'); // tenant scope ile

$meal = Meal::whereIn('school_id', $schoolIds)->findOrFail($id);
```

**Önerilen yaklaşım: Seçenek B** (BaseModel tenant scope'u aktif olan School modelini kullanır)

### Test Dosyası
`tests/Feature/API/Meals/TenantMealApiTest.php`
- `meal_update_baska_tenant_yemegini_guncelleyemez`
- `meal_destroy_baska_tenant_yemegini_silemez`

---

## BUG-001 — Global Allerjenler Index'te Görünmüyor

### Tanım
`TenantAllergenController::index()`:
```php
$allergens = Allergen::where(function ($q) use ($tenantId) {
    $q->whereNull('tenant_id')->orWhere('tenant_id', $tenantId);
})
```
`Allergen` modelinde `tenant_id` fillable'da olduğundan BaseModel global scope
`WHERE allergens.tenant_id = $tenantId` filtresi ekliyor. Bu filtre ile birlikte
oluşan SQL:
```sql
WHERE allergens.tenant_id = 1 AND (allergens.tenant_id IS NULL OR allergens.tenant_id = 1)
```
`tenant_id = NULL` olan kayıtlar `WHERE tenant_id = 1` ile eleniyor → Global allerjenler dönmüyor.

### Düzeltme
```php
// TenantAllergenController::index()
$allergens = Allergen::withoutGlobalScope('tenant') // veya withoutGlobalScopes()
    ->where(function ($q) use ($tenantId) {
        $q->whereNull('tenant_id')->orWhere('tenant_id', $tenantId);
    })
    ->orderBy('name')
    ->get();
```

### Test Dosyası
`tests/Feature/API/Meals/TenantAllergenApiTest.php`
- `index_global_allerjenler_listede_gorulmeli` (@group bug)

---

## BUG-002 — Global Besin Öğeleri Index'te Görünmüyor

### Tanım
BUG-001 ile aynı sorun. `TenantMealController::ingredientIndex()` içinde:
```php
$ingredients = FoodIngredient::with('allergens')
    ->where(function ($q) use ($tenantId) {
        $q->whereNull('tenant_id')->orWhere('tenant_id', $tenantId);
    })
```
`FoodIngredient` modelinde `tenant_id` fillable'da → BaseModel global scope → global kayıtlar (tenant_id=null) elenıyor.

### Düzeltme
```php
$ingredients = FoodIngredient::withoutGlobalScope('tenant')
    ->with('allergens')
    ->where(function ($q) use ($tenantId) {
        $q->whereNull('tenant_id')->orWhere('tenant_id', $tenantId);
    })
    // ...
```

### Test Dosyası
`tests/Feature/API/Meals/TenantMealApiTest.php`
- `ingredient_index_global_besin_ogeleri_gorulmeli` (@group bug)

---

## BUG-006 — mealIndex validate() try-catch İçinde

### Tanım
`TenantMealController::mealIndex()`:
```php
public function mealIndex(Request $request): JsonResponse
{
    try {
        $request->validate(['school_id' => ['required', 'exists:schools,id']]);
        // ...
    } catch (\Throwable $e) {
        return $this->errorResponse('Yemekler yüklenemedi.', 500);
    }
}
```
`school_id` eksik/geçersiz gelince `ValidationException` fırlatılır.
`ValidationException` is-a `\Throwable`, bu yüzden catch bloğuna düşer → 500 döner.
Laravel normalde `ValidationException`'ı 422'ye dönüştürür, ancak try-catch onu ele geçiriyor.

### Düzeltme
`validate()` çağrısını `try-catch` bloğunun **dışına** taşı:
```php
public function mealIndex(Request $request): JsonResponse
{
    $request->validate(['school_id' => ['required', 'exists:schools,id']]);

    try {
        $meals = Meal::with('ingredients')
            ->where('school_id', $request->school_id)
            // ...
    } catch (\Throwable $e) {
        // ...
    }
}
```

### Test Dosyası
`tests/Feature/API/Meals/TenantMealApiTest.php`
- `meal_index_school_id_olmadan_422_beklenir` (@group bug)

---

## BUG-007 — AcademicYearController validate() try-catch İçinde

### Tanım
BUG-006 ile aynı sorun. `AcademicYearController::store()`, `update()`, `transition()`, `addClass()` metodlarında `validate()` try-catch içinde çağrılıyor. Validation hatası 500 döner, 422 olması gerekirken.

### Etkilenen Metodlar
- `store()` — `app/Http/Controllers/Schools/AcademicYearController.php:109`
- `update()` — `:146`
- `transition()` — `:228`
- `addClass()` — `:268`

### Düzeltme
Her metodda `$request->validate()` satırını `DB::beginTransaction()` ve `try {` ÜSTÜNE taşı:
```php
public function store(Request $request): JsonResponse
{
    $request->validate([
        'school_id' => 'required|exists:schools,id',
        // ...
    ]);

    DB::beginTransaction();
    try {
        // ...
    } catch (\Throwable $e) {
        DB::rollBack();
        // ...
    }
}
```

### Test Dosyası
`tests/Feature/API/Schools/AcademicYearApiTest.php`
- `store_eksik_alan_ile_422_beklenir` (@group bug)
- `store_gecersiz_tarih_ile_422_beklenir` (@group bug)
- `transition_eksik_alan_ile_422_beklenir` (@group bug)

---

## BUG-004 — TenantAllergenController firstOrFail() catch İçinde ⚠️ KISMİ DÜZELTİLDİ

> **Durum (2026-02-26):** `destroy()` metodu düzeltildi. `update()` hâlâ bekliyor.

### Tanım
`TenantAllergenController::update()` ve ~~`destroy()`~~:
```php
try {
    $allergen = Allergen::where('id', $allergen_id)
        ->where('tenant_id', $this->user()->tenant_id)
        ->firstOrFail(); // ModelNotFoundException fırlatır
    // ...
} catch (\Throwable $e) {
    return $this->errorResponse('Güncelleme başarısız.', 500); // 500 dönüyor!
}
```
`firstOrFail()` `ModelNotFoundException` fırlatır. Bu da `\Throwable` türünde olduğundan
catch bloğuna düşer ve 500 döner. Normalde Laravel bu exception'ı 404'e dönüştürür.

### Uygulanan Düzeltme (destroy — 2026-02-26)
`destroy()` içinde `ModelNotFoundException` catch bloğu eklendi:
```php
} catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
    return $this->errorResponse('Allerjen bulunamadı.', 404);
} catch (\Throwable $e) { ...
```

### Kalan Düzeltme (update)
`firstOrFail()` yerine `first()` kullan ve null kontrolü yap:
```php
$allergen = Allergen::where('id', $allergen_id)
    ->where('tenant_id', $this->user()->tenant_id)
    ->first();

if (! $allergen) {
    return $this->errorResponse('Allerjen bulunamadı.', 404);
}
```

### Test Dosyası
`tests/Feature/API/Meals/TenantAllergenApiTest.php`
- `update_global_allerjen_guncellenemez_404_beklenir` (@group bug) — ⏳ bekliyor
- `update_baska_tenant_allerjenini_guncelleyemez_404_beklenir` (@group bug) — ⏳ bekliyor
- ~~`destroy_global_allerjen_silinemez_404_beklenir`~~ — ✅ geçiyor
- ~~`destroy_baska_tenant_allerjenini_silemez_404_beklenir`~~ — ✅ geçiyor

---

## BUG-005 — TenantMealController firstOrFail() catch İçinde ⚠️ KISMİ DÜZELTİLDİ

> **Durum (2026-02-26):** `ingredientDestroy()` ve `mealDestroy()` düzeltildi. `ingredientUpdate()` hâlâ bekliyor.

### Tanım
BUG-004 ile aynı sorun. `TenantMealController::ingredientUpdate()` ve ~~`ingredientDestroy()`~~:
```php
$ingredient = FoodIngredient::where('id', $id)
    ->where('tenant_id', $this->user()->tenant_id)
    ->firstOrFail(); // catch içinde → 500
```

### Uygulanan Düzeltme (ingredientDestroy + mealDestroy — 2026-02-26)
Her iki `destroy` metodunda `ModelNotFoundException` catch bloğu eklendi.

### Kalan Düzeltme (ingredientUpdate)
BUG-004 ile aynı: `firstOrFail()` → `first()` + null kontrolü.

### Test Dosyası
`tests/Feature/API/Meals/TenantMealApiTest.php`
- `ingredient_update_global_besin_ogesi_guncellenemez_404_beklenir` (@group bug) — ⏳ bekliyor
- `ingredient_update_baska_tenant_besini_guncelleyemez` (@group bug) — ⏳ bekliyor
- ~~`ingredient_destroy_global_besin_ogesi_silinemez_404_beklenir`~~ — ✅ geçiyor

---

## BUG-011 — assignTeacher Hata Mesajında İç Detay Sızıyor

### Tanım
`ClassManagementController::assignTeacher()`:
```php
} catch (\Throwable $e) {
    return $this->errorResponse('Atama başarısız: '.$e->getMessage(), 500);
}
```
`$e->getMessage()` exception'ın iç mesajını içerir (örn. "No query results for model [App\Models\School\TeacherProfile]").
Bu bilgi client'a iletilmemeli.

### Düzeltme
```php
return $this->errorResponse('Öğretmen ataması sırasında bir hata oluştu.', 500);
```

### Test Dosyası
`tests/Feature/API/Schools/ClassManagementApiTest.php`
- `assign_teacher_hata_mesajinda_ic_hata_detayi_sizdirmiyor` (@group bug)

---

## BUG-008 — AcademicYearController $request->all() Kullanımı

### Tanım
`AcademicYearController::store()` ve `update()`:
```php
$data = $request->all(); // validated() olmalı
```
`$request->all()` tüm input alanlarını döndürür (validated olmayan dahil).
`$request->validated()` yalnızca validation kurallarında tanımlı alanları döndürür.

### Risk
Düşük. Masa injection vektörü oluşturmaz çünkü model fillable korumalı.
Ancak gereksiz alanların servis katmanına geçmesine neden olur.

### Düzeltme
```php
// store() içinde:
$data = $request->validated();
$data['is_active'] = true;
$data['created_by'] = $this->user()->id;

// update() içinde:
$data = $request->validated();
$data['updated_by'] = $this->user()->id;
```

---

## BUG-009 — AcademicYearController paginatedResponse Anti-Pattern

### Tanım
`AcademicYearController::index()`:
```php
return $this->paginatedResponse(
    AcademicYearResource::collection($years)->resource // anti-pattern
);
```
`paginatedResponse()` iki yol:
1. `ResourceCollection` alırsa → items'ı resource üzerinden dönüştürür ✓
2. Düz `LengthAwarePaginator` alırsa → items'ı ham model verisi olarak döndürür ✗

`.resource` yazılarak ResourceCollection'dan LengthAwarePaginator çıkarılıp
doğrudan `paginatedResponse`'a veriliyor. Bu yüzden 2. yola düşer ve
`AcademicYearResource` dönüşümleri uygulanmaz.

### Düzeltme
```php
// Seçenek A: ResourceCollection olarak geç
return $this->paginatedResponse(
    AcademicYearResource::collection($years)
);

// Seçenek B: .resource'u kaldır
return $this->paginatedResponse($years);
// (paginatedResponse else branch'ına düşer, ham model verir —
//  bu da kabul edilebilir eğer resource dönüşümü gerekmiyorsa)
```

---

## Testleri Çalıştırma

```bash
# Tüm API testleri
php artisan test tests/Feature/API/

# Sadece bug testleri
php artisan test --group=bug

# Belirli bir dosya
php artisan test tests/Feature/API/Meals/TenantAllergenApiTest.php

# Detaylı çıktı
php artisan test tests/Feature/API/ --verbose
```

---

## Düzeltme Öncelik Sırası

```
1. BUG-010: User::schools() ekle (1 dosya, düşük risk)
2. BUG-003: Meal tenant izolasyonu (1 metod, 2 satır)
3. BUG-001: Allergen withoutGlobalScope (1 satır)
4. BUG-002: FoodIngredient withoutGlobalScope (1 satır)
5. BUG-006: validate() dışarıya taşı (1 metod)
6. BUG-007: validate() dışarıya taşı (4 metod)
7. BUG-004: firstOrFail → first + null check (2 metod)
8. BUG-005: firstOrFail → first + null check (2 metod)
9. BUG-011: Hata mesajı generic yap (1 satır)
10. BUG-008: $request->all() → validated() (2 satır)
11. BUG-009: paginatedResponse .resource kaldır (1 satır)
```

Her düzeltme sonrası ilgili test çalıştırılarak regresyon kontrolü yapılmalıdır.
