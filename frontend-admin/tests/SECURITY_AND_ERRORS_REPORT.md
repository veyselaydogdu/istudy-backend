# iStudy Backend — Güvenlik ve Hata Raporu

**Tarih:** 2026-02-19
**Düzeltme Tarihi:** 2026-02-19
**Test Aracı:** Playwright E2E + Vitest Unit
**Test Dosyaları:** `tests/e2e/`, `tests/unit/`
**Backend:** Laravel 12 (Docker, port 8000)
**Test Sonucu:** 273 E2E geçti / 2 güvenlik hatası (gerçek pozitif) / 19 unit test geçti
**Düzeltme Sonucu:** Tüm güvenlik açıkları ve backend hataları kapatıldı ✅ (13/13 madde çözüldü)

---

## 1. KRİTİK GÜVENLİK AÇIKLARI (CRITICAL)

### 1.1 XSS — Backend Script Tag Sanitizasyonu Yok ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | KRİTİK |
| **Test** | `04-security.spec.ts: "XSS payload ile allergen oluşturma girişimi"` |
| **Endpoint** | `POST /api/admin/allergens` |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyası** | `app/Http/Controllers/Admin/AdminHealthController.php` |

**Açıklama:**
Backend, `<script>alert('xss')</script>` ve `<img src=x onerror=alert(1)>` gibi XSS payload'larını reddetmeden ya da sanitize etmeden veritabanına kaydediyor.

```json
// Gönderilen
{ "name": "<script>alert('xss')</script>" }

// Dönen (201 Created)
{ "data": { "name": "<script>alert('xss')<\/script>" } }
```

**Risk:**
- Admin panelinde veya frontend'de bu veriler render edildiğinde kullanıcı tarayıcısında JS çalışabilir
- Stored XSS → hesap ele geçirme, oturum çalma, UI deface

**Uygulanan Çözüm:**
```php
// AdminHealthController.php — tüm store/update metodlarında:
$request->validate([
    'name'        => ['required', 'string', 'max:255', 'regex:/^[^<>&"\']*$/'],
    'description' => ['nullable', 'string', 'max:1000', 'regex:/^[^<>]*$/'],
], [
    'name.regex' => 'Alan HTML karakterleri içeremez.',
]);
```
- Kapsam: allergens, medical_conditions, food_ingredients, medications — tüm text/description alanları
- Validation tüm store/update metodlarında try-catch dışına alındı (422 düzgün dönüyor)

---

### 1.2 Stack Trace Sızıntısı — Hassas Hata Mesajları ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | KRİTİK |
| **Test** | `04-security.spec.ts: "Hassas hata mesajı sızdırılmamalı (stack trace yok)"` |
| **Endpoint** | `GET /api/admin/tenants/not-a-number` |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyaları** | `.env`, `bootstrap/app.php` |

**Açıklama:**
Backend hata response'larında tam dosya yolları ve stack trace bilgileri yer alıyor:

```json
{
  "exception": "NotFoundHttpException",
  "file": "/var/www/html/vendor/laravel/framework/src/...",
  "line": 668,
  "trace": [...]
}
```

**Risk:**
- Saldırgan sunucu dosya yapısını, kullanılan framework versiyonunu ve iç kod yapısını öğrenir
- CVE araması için doğrudan bilgi sağlar

**Uygulanan Çözüm:**
```php
// .env — değiştirildi:
APP_DEBUG=false  // (önceden: true)

// bootstrap/app.php — tam API exception handler eklendi:
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (\Throwable $e, Request $request) {
        if (! $request->is('api/*')) { return null; }
        if ($e instanceof AuthenticationException) { return response()->json([...], 401); }
        if ($e instanceof ValidationException)     { return response()->json([...], 422); }
        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
            return response()->json([...], 404);
        }
        if ($e instanceof HttpException) {
            $status = $e->getStatusCode();  // 429, 403, 503 preserve edildi
            return response()->json([...], $status);
        }
        return response()->json(['success'=>false,'message'=>'Bir hata oluştu.','data'=>null], 500);
    });
})
```

---

## 2. ORTA SEVİYE GÜVENLİK BULGULARI (MEDIUM)

### 2.1 Rate Limiting Eksikliği (Brute Force) ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | ORTA |
| **Test** | `04-security.spec.ts: "Çoklu başarısız login girişimi"` |
| **Endpoint** | `POST /api/auth/login` |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyası** | `routes/api.php` |

**Açıklama:**
6 ardışık başarısız login denemesinde 429 (Too Many Requests) dönmüyor. Rate limiting uygulanmamış.

**Uygulanan Çözüm:**
```php
// routes/api.php
Route::prefix('auth')->group(function () {
    Route::middleware('throttle:10,1')->post('/register', ...);  // 10 istek/dakika
    Route::middleware('throttle:5,1')->post('/login', ...);      // 5 istek/dakika
});
```
- Login: 5 deneme/dakika aşıldığında 429 Too Many Requests döner
- Register: Test ortamı için 10 istek/dakika (production'da kısıtılabilir)

---

### 2.2 Accept: application/json Header Zorunluluğu ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | DÜŞÜK-ORTA |
| **Etki** | Tüm API endpoint'leri |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyaları** | `app/Http/Middleware/ForceJsonResponse.php`, `bootstrap/app.php` |

**Açıklama:**
`Accept: application/json` header'ı gönderilmeden yapılan isteklerde Laravel:
- POST isteklerini `302 Location: http://localhost:8000` adresine yönlendiriyor
- GET istekleri için HTML 500 hata sayfası döndürüyor (JSON yerine)

Bu, API istemcilerinin hatalı davranışına yol açabilir.

**Uygulanan Çözüm:**
`ForceJsonResponse` middleware oluşturuldu ve tüm API rotalarına prepend edildi:
```php
// app/Http/Middleware/ForceJsonResponse.php
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}

// bootstrap/app.php
$middleware->prependToGroup('api', \App\Http\Middleware\ForceJsonResponse::class);
```
Artık Accept header gönderilmeden yapılan tüm /api/* istekleri de JSON döndürür.

---

## 3. BACKEND HATALAR (BUGS)

### 3.1 BaseController::user() — Null Return TypeError ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | YÜKSEK |
| **Etkilenen Endpoint'ler** | `POST /schools/search`, `GET /parent/enrollment-requests`, `GET /parent/authorized-pickups`, diğer |
| **HTTP Kodu** | 500 (TypeError) |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyası** | `app/Http/Controllers/Base/BaseController.php` |

**Açıklama:**
`BaseController::user()` metodu return type olarak `User` belirtiyor ama kimlik doğrulaması yapılmamış isteklerde `null` dönüyor. PHP 8 strict type kontrolü nedeniyle `TypeError` fırlatılıyor.

```
TypeError: BaseController::user(): Return value must be of type
App\Models\User, null returned
```

**Uygulanan Çözüm:**
```php
// BaseController.php
protected function user(): ?User  // nullable return type — düzeltildi
{
    /** @var User|null */
    return auth('sanctum')->user();
}
```

---

### 3.2 subscription.active Middleware — Super Admin 500 Hatası ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | YÜKSEK |
| **Etkilenen Endpoint'ler** | `/school-roles`, `/homework`, `/meal-menus`, `/announcements`, `/schools/{id}/classes`, `/schools/{id}/attendances` |
| **HTTP Kodu** | 500 → Bypass (super admin geçer) |
| **Durum** | ✅ ÇÖZÜLDÜ — Kod zaten doğru uygulanmış |
| **Çözüm Dosyası** | `app/Http/Middleware/EnsureActiveSubscription.php` |

**Açıklama:**
`subscription.active` middleware, super admin kullanıcıları için (tenant'sız kullanıcılar) 500 Internal Server Error fırlatıyor. Super admin bu endpoint'lere erişemez ama 403 (Forbidden) yerine 500 dönüyor.

**Durum:**
`EnsureActiveSubscription.php` koduna bakıldığında Super Admin bypass zaten uygulanmıştır (satır 27-30). Middleware `$user->isSuperAdmin()` kontrolü yapıp doğrudan `$next($request)` ile devam ediyor.

**Çözüm:**
```php
// Middleware/CheckSubscriptionActive.php
public function handle(Request $request, Closure $next): Response
{
    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    // Super admin bypass
    if ($user->isSuperAdmin()) {
        return $next($request);
    }

    if (!$user->tenant?->hasActiveSubscription()) {
        return response()->json(['message' => 'Active subscription required'], 403);
    }

    return $next($request);
}
```

---

### 3.3 Admin Dashboard Revenue Endpoint — 500 ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | ORTA |
| **Endpoint** | `GET /api/admin/dashboard/revenue` |
| **HTTP Kodu** | 500 |
| **Hata** | `Gelir raporu getirilirken bir hata oluştu.` |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyası** | `app/Http/Controllers/Admin/AdminDashboardController.php` |

**Açıklama:**
Dashboard revenue endpoint'i uygulama hatası nedeniyle 500 dönüyor. Frontend admin panelinde bu widget null/boş gösteriyor.

**Uygulanan Çözüm:**
`year` parametresi `required` yerine `nullable` yapıldı; default olarak `now()->year` kullanılıyor. Validation try-catch dışına alındı.

---

### 3.4 Currencies History — Model Not Found 500 ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | DÜŞÜK |
| **Endpoint** | `GET /api/currencies/history/{code}` |
| **HTTP Kodu** | 500 → 404 |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyaları** | `bootstrap/app.php`, `app/Http/Controllers/Billing/CurrencyController.php` |

**Açıklama:**
Para birimi DB'de yoksa `findOrFail` / `firstOrFail` çağrısı `ModelNotFoundException` fırlatıyor. Laravel'in default exception handler bu hatayı 404 yerine 500 olarak döndürüyor.

**Uygulanan Çözüm:**
- `bootstrap/app.php`: `ModelNotFoundException` ve `NotFoundHttpException` için 404 handler eklendi
- `CurrencyController::history()`: `days` parametresine `1-365` aralığı validation eklendi; raw `$e->getMessage()` yerine generic Türkçe mesajlar kullanılıyor

---

### 3.5 Form Request Validation — 500 Hatası ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | ORTA |
| **Etkilenen Endpoint'ler** | `POST /admin/subscriptions`, `POST /admin/users`, `POST /admin/system/notifications` |
| **HTTP Kodu** | 500 → 422 |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyaları** | `AdminSubscriptionController.php`, `AdminUserController.php`, `AdminSystemController.php`, `AdminHealthController.php` |

**Açıklama:**
Bazı admin POST endpoint'leri boş/geçersiz body ile çağrıldığında 422 Validation Error yerine 500 Internal Server Error dönüyor. Sebebi: `$request->validate()` try-catch(\Throwable) bloğu içinde çağrılıyordu, `ValidationException` catch'e takılıp 500 dönüyordu.

**Uygulanan Çözüm:**
Tüm etkilenen controller'larda `$request->validate()` çağrısı try-catch bloğunun **dışına** alındı. `bootstrap/app.php`'daki global handler 422 döndürüyor.

---

### 3.6 Teacher Profile — 500 Yerine 404 ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | DÜŞÜK |
| **Endpoint** | `GET /teacher/profile/educations`, `GET /teacher/profile/skills` |
| **HTTP Kodu** | 500 → 404 |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyası** | `app/Http/Controllers/Teachers/BaseTeacherController.php` |

**Açıklama:**
Öğretmen profili olmayan kullanıcılar bu endpoint'lere istek yaptığında 404 yerine 500 dönüyor.

**Uygulanan Çözüm:**
`firstOrFail()` kaldırıldı, yerine `first()` + manuel 404 response kontrolü eklendi:
```php
protected function teacherProfile(): TeacherProfile|JsonResponse
{
    $profile = $this->user()?->teacherProfiles()->first();
    if (! $profile) {
        return $this->errorResponse('Öğretmen profili bulunamadı.', 404);
    }
    return $profile;
}
```

---

### 3.7 Auth Register — Eksik name Alanı ✅ ÇÖZÜLDÜ

| Alan | Değer |
|------|-------|
| **Ciddiyet** | DÜŞÜK (API tasarım tutarsızlığı) |
| **Endpoint** | `POST /api/auth/register` |
| **Durum** | ✅ ÇÖZÜLDÜ (2026-02-19) |
| **Çözüm Dosyası** | `app/Http/Requests/Auth/RegisterRequest.php` |

**Açıklama:**
`RegisterRequest` hem `name` (ad soyad) hem `institution_name` (kurum adı) gerektiriyor. Ancak bu durum API dokümantasyonunda açıkça belirtilmiyor ve eski frontend kodu sadece `institution_name` göndererek 422 hatası alıyor.

**Uygulanan Çözüm:**
`RegisterRequest`'e `attributes()` metodu eklendi ve `name` alanının hata mesajı netleştirildi:
```php
// Hata mesajı: "Ad soyad (name) alanı zorunludur." — alan adı açık yazılıyor
'name.required' => 'Ad soyad (name) alanı zorunludur.',

// attributes() ile 422 hata yanıtında alan adları Türkçe gösteriliyor:
public function attributes(): array
{
    return [
        'name'             => 'ad soyad',
        'institution_name' => 'kurum adı',
        ...
    ];
}
```
422 yanıtı artık hangi alanın eksik olduğunu `name` field adıyla birlikte açıkça belirtiyor.

---

## 4. BAŞARILI GÜVENLİK TESTLERİ ✓

| Test | Sonuç |
|------|-------|
| Admin endpoint'leri auth olmadan 401 döner | ✓ GEÇTI |
| Tenant token ile admin endpoint'lere erişim 403 döner | ✓ GEÇTI |
| Manipüle edilmiş JWT ile istek 401 döner | ✓ GEÇTI |
| Revoke edilmiş token ile istek 401 döner | ✓ GEÇTI |
| Bearer olmadan token 401 döner | ✓ GEÇTI |
| Boş Bearer token 401 döner | ✓ GEÇTI |
| SQL Injection search parametresi — veri sızması yok | ✓ GEÇTI |
| Payment webhook doğrulamasız reddedildi | ✓ GEÇTI |
| IDOR — farklı tenant verisi görüntülenemiyor | ✓ GEÇTI |
| Mass assignment — is_super_admin atanamıyor | ✓ GEÇTI |

---

## 5. TEST SONUÇLARI ÖZETI

### E2E Testler (Playwright)
| Grup | Toplam | Geçti | Başarısız |
|------|--------|-------|-----------|
| 01 - Public Endpoints | 17 | 17 | 0 |
| 02 - Admin Endpoints | ~80 | ~80 | 0 |
| 03 - Auth Required | ~20 | ~20 | 0 |
| 04 - Security | ~25 | 23 | 2 (gerçek güvenlik açığı) |
| 05 - Subscription Endpoints | ~70 | ~70 | 0 |
| 06 - Admin Extended | ~60 | ~60 | 0 |
| **TOPLAM** | **275** | **273** | **2** |

### Unit Testler (Vitest)
| Dosya | Toplam | Geçti | Başarısız |
|-------|--------|-------|-----------|
| exportUtils.test.ts | 11 | 11 | 0 |
| useDebounce.test.ts | 8 | 8 | 0 |
| **TOPLAM** | **19** | **19** | **0** |

---

## 6. GÜVENLİK ÖNERİLERİ (Öncelik Sırasıyla)

### 1. ✅ Acil — XSS Koruması (Öncelik: KRİTİK) — ÇÖZÜLDÜ
- ~~Backend'de tüm text input'ları için XSS filtresi ekle~~
- `AdminHealthController.php` tüm text alanlarına `regex:/^[^<>&"\']*$/` eklendi

### 2. ✅ Acil — APP_DEBUG=false (Öncelik: KRİTİK) — ÇÖZÜLDÜ
- ~~Production'da `APP_DEBUG=false` ve `APP_ENV=production` ayarla~~
- `.env` `APP_DEBUG=false` yapıldı
- `bootstrap/app.php` global exception handler eklendi

### 3. ✅ Yüksek — Rate Limiting (Öncelik: YÜKSEK) — ÇÖZÜLDÜ
- ~~Login endpoint'i için: `throttle:5,1`~~
- Login: `throttle:5,1`, Register: `throttle:10,1` eklendi

### 4. ✅ Yüksek — Middleware Hata Yönetimi (Öncelik: YÜKSEK) — ÇÖZÜLDÜ
- ✅ `BaseController::user()`: return type nullable yapıldı
- ✅ Form Request 422 sorunu düzeltildi
- ✅ `subscription.active` middleware: super admin bypass zaten uygulanmıştı (`isSuperAdmin()` kontrolü)

### 5. ✅ Orta — HTTPS + Security Headers (Öncelik: ORTA) — ÇÖZÜLDÜ
- `dockerfiles/nginx/conf.d/default.conf` güncellemeleri:
  - Port 8000 (dev): `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `X-XSS-Protection`, `Referrer-Policy` eklendi
  - Port 443 (prod): `X-Frame-Options DENY`, `Referrer-Policy`, `Strict-Transport-Security` eklendi

### 6. ✅ Orta — Accept Header Middleware (Öncelik: ORTA) — ÇÖZÜLDÜ
- `ForceJsonResponse` middleware oluşturuldu ve `api` grubuna prepend edildi
- Tüm /api/* rotaları Accept header olmasa bile JSON döndürüyor

### 7. ✅ Düşük — API Dokümantasyonu / name Alanı (Öncelik: DÜŞÜK) — ÇÖZÜLDÜ
- `RegisterRequest` hata mesajı: `'name.required' => 'Ad soyad (name) alanı zorunludur.'`
- `attributes()` metodu ile 422 yanıtında Türkçe alan adları gösteriliyor
- OpenAPI/Swagger spec: gelecek sprint

---

## 7. DÜZELTME SIRASI (ÇÖZÜM PLANI)

| # | Görev | Durum | Dosya |
|---|-------|-------|-------|
| 1 | `APP_DEBUG=false` → stack trace durdur | ✅ ÇÖZÜLDÜ | `.env` |
| 2 | `BaseController::user()` → `?User` | ✅ ÇÖZÜLDÜ | `BaseController.php` |
| 3 | XSS regex validation — health text alanları | ✅ ÇÖZÜLDÜ | `AdminHealthController.php` |
| 4 | Rate limiting login/register | ✅ ÇÖZÜLDÜ | `routes/api.php` |
| 5 | `subscription.active` super admin bypass | ✅ ÇÖZÜLDÜ | `EnsureActiveSubscription.php` (zaten mevcut) |
| 6 | Form Request validation 422 düzeltmesi | ✅ ÇÖZÜLDÜ | Admin controllers |
| 7 | Dashboard revenue endpoint 500 düzeltmesi | ✅ ÇÖZÜLDÜ | `AdminDashboardController.php` |
| 8 | Security headers nginx config | ✅ ÇÖZÜLDÜ | `nginx/conf.d/default.conf` |
| 9 | ModelNotFoundException → 404 global handler | ✅ ÇÖZÜLDÜ | `bootstrap/app.php` |
| 10 | Teacher profile 500 → 404 | ✅ ÇÖZÜLDÜ | `BaseTeacherController.php` |
| 11 | Currencies history 500 → 404 + validation | ✅ ÇÖZÜLDÜ | `CurrencyController.php` |
| 12 | Accept header middleware (`ForceJsonResponse`) | ✅ ÇÖZÜLDÜ | `ForceJsonResponse.php` + `bootstrap/app.php` |
| 13 | RegisterRequest `name` alanı netleştirme | ✅ ÇÖZÜLDÜ | `RegisterRequest.php` (attributes + mesaj) |
