# iStudy Backend — Güvenlik ve Hata Raporu

**Tarih:** 2026-02-19
**Test Aracı:** Playwright E2E + Vitest Unit
**Test Dosyaları:** `tests/e2e/`, `tests/unit/`
**Backend:** Laravel 12 (Docker, port 8000)
**Test Sonucu:** 273 E2E geçti / 2 güvenlik hatası (gerçek pozitif) / 19 unit test geçti

---

## 1. KRİTİK GÜVENLİK AÇIKLARI (CRITICAL)

### 1.1 XSS — Backend Script Tag Sanitizasyonu Yok

| Alan | Değer |
|------|-------|
| **Ciddiyet** | KRİTİK |
| **Test** | `04-security.spec.ts: "XSS payload ile allergen oluşturma girişimi"` |
| **Endpoint** | `POST /api/admin/allergens` |
| **Durum** | Test BAŞARISIZ — Güvenlik açığı **MEVCUT** |

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

**Çözüm:**
```php
// Model veya FormRequest'te:
'name' => 'required|string|max:255|regex:/^[^<>&"\']*$/'

// Veya Laravel Purifier (HTMLPurifier) paketi:
Purifier::clean($input)
```

---

### 1.2 Stack Trace Sızıntısı — Hassas Hata Mesajları

| Alan | Değer |
|------|-------|
| **Ciddiyet** | KRİTİK |
| **Test** | `04-security.spec.ts: "Hassas hata mesajı sızdırılmamalı (stack trace yok)"` |
| **Endpoint** | `GET /api/admin/tenants/not-a-number` |
| **Durum** | Test BAŞARISIZ — Güvenlik açığı **MEVCUT** |

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

**Çözüm:**
```php
// .env
APP_DEBUG=false
APP_ENV=production

// bootstrap/app.php veya Handler.php
$exceptions->render(function (\Throwable $e, $request) {
    if ($request->is('api/*')) {
        return response()->json([
            'success' => false,
            'message' => 'Bir hata oluştu.',
        ], 500);
    }
});
```

---

## 2. ORTA SEVİYE GÜVENLİK BULGULARI (MEDIUM)

### 2.1 Rate Limiting Eksikliği (Brute Force)

| Alan | Değer |
|------|-------|
| **Ciddiyet** | ORTA |
| **Test** | `04-security.spec.ts: "Çoklu başarısız login girişimi"` |
| **Endpoint** | `POST /api/auth/login` |
| **Durum** | Test GEÇTI ama uyarı loglandı |

**Açıklama:**
6 ardışık başarısız login denemesinde 429 (Too Many Requests) dönmüyor. Rate limiting uygulanmamış.

**Çözüm:**
```php
// routes/api.php
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/auth/login', ...);
});
```

---

### 2.2 Accept: application/json Header Zorunluluğu

| Alan | Değer |
|------|-------|
| **Ciddiyet** | DÜŞÜK-ORTA |
| **Etki** | Tüm API endpoint'leri |

**Açıklama:**
`Accept: application/json` header'ı gönderilmeden yapılan isteklerde Laravel:
- POST isteklerini `302 Location: http://localhost:8000` adresine yönlendiriyor
- GET istekleri için HTML 500 hata sayfası döndürüyor (JSON yerine)

Bu, API istemcilerinin hatalı davranışına yol açabilir.

**Çözüm:**
```php
// bootstrap/app.php
$middleware->api(PrependJsonAcceptHeader::class);

// veya global middleware
// Tüm /api/* rotalarında Accept: application/json varsayılan yapıldığında
// Laravel otomatik JSON döndürür.
```

---

## 3. BACKEND HATALAR (BUGS)

### 3.1 BaseController::user() — Null Return TypeError

| Alan | Değer |
|------|-------|
| **Ciddiyet** | YÜKSEK |
| **Etkilenen Endpoint'ler** | `POST /schools/search`, `GET /parent/enrollment-requests`, `GET /parent/authorized-pickups`, diğer |
| **HTTP Kodu** | 500 (TypeError) |

**Açıklama:**
`BaseController::user()` metodu return type olarak `User` belirtiyor ama kimlik doğrulaması yapılmamış isteklerde `null` dönüyor. PHP 8 strict type kontrolü nedeniyle `TypeError` fırlatılıyor.

```
TypeError: BaseController::user(): Return value must be of type
App\Models\User, null returned
```

**Çözüm:**
```php
// BaseController.php
protected function user(): ?User  // nullable return type
{
    return auth()->user();
}
```

---

### 3.2 subscription.active Middleware — Super Admin 500 Hatası

| Alan | Değer |
|------|-------|
| **Ciddiyet** | YÜKSEK |
| **Etkilenen Endpoint'ler** | `/school-roles`, `/homework`, `/meal-menus`, `/announcements`, `/schools/{id}/classes`, `/schools/{id}/attendances` |
| **HTTP Kodu** | 500 |

**Açıklama:**
`subscription.active` middleware, super admin kullanıcıları için (tenant'sız kullanıcılar) 500 Internal Server Error fırlatıyor. Super admin bu endpoint'lere erişemez ama 403 (Forbidden) yerine 500 dönüyor.

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

### 3.3 Admin Dashboard Revenue Endpoint — 500

| Alan | Değer |
|------|-------|
| **Ciddiyet** | ORTA |
| **Endpoint** | `GET /api/admin/dashboard/revenue` |
| **HTTP Kodu** | 500 |
| **Hata** | `Gelir raporu getirilirken bir hata oluştu.` |

**Açıklama:**
Dashboard revenue endpoint'i uygulama hatası nedeniyle 500 dönüyor. Frontend admin panelinde bu widget null/boş gösteriyor.

---

### 3.4 Currencies History — Model Not Found 500

| Alan | Değer |
|------|-------|
| **Ciddiyet** | DÜŞÜK |
| **Endpoint** | `GET /api/currencies/history/{code}` |
| **HTTP Kodu** | 500 (ModelNotFoundException) |

**Açıklama:**
Para birimi DB'de yoksa `findOrFail` / `firstOrFail` çağrısı `ModelNotFoundException` fırlatıyor. Laravel'in default exception handler bu hatayı 404 yerine 500 olarak döndürüyor.

**Çözüm:**
```php
// CurrencyController.php
$currency = Currency::where('code', $code)->firstOrFail();
// firstOrFail() Laravel'de 404 dönmeli — global exception handler'ı kontrol et
```

---

### 3.5 Form Request Validation — 500 Hatası

| Alan | Değer |
|------|-------|
| **Ciddiyet** | ORTA |
| **Etkilenen Endpoint'ler** | `POST /admin/subscriptions`, `POST /admin/users`, `POST /admin/system/notifications` |
| **HTTP Kodu** | 500 (beklenen: 422) |

**Açıklama:**
Bazı admin POST endpoint'leri boş/geçersiz body ile çağrıldığında 422 Validation Error yerine 500 Internal Server Error dönüyor.

**Çözüm:**
Form Request validation'ın API isteklerinde doğru çalıştığını kontrol et. Özellikle `authorize()` metodu `false` dönüyorsa 403 değil 500 fırlatıyor olabilir.

---

### 3.6 Teacher Profile — 500 Yerine 404

| Alan | Değer |
|------|-------|
| **Ciddiyet** | DÜŞÜK |
| **Endpoint** | `GET /teacher/profile/educations`, `GET /teacher/profile/skills` |
| **HTTP Kodu** | 500 (beklenen: 404) |

**Açıklama:**
Öğretmen profili olmayan kullanıcılar bu endpoint'lere istek yaptığında 404 yerine 500 dönüyor.

---

### 3.7 Auth Register — Eksik name Alanı

| Alan | Değer |
|------|-------|
| **Ciddiyet** | DÜŞÜK (API tasarım tutarsızlığı) |
| **Endpoint** | `POST /api/auth/register` |

**Açıklama:**
`RegisterRequest` hem `name` (ad soyad) hem `institution_name` (kurum adı) gerektiriyor. Ancak bu durum API dokümantasyonunda açıkça belirtilmiyor ve eski frontend kodu sadece `institution_name` göndererek 422 hatası alıyor.

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

### 1. Acil — XSS Koruması (Öncelik: KRİTİK)
- Backend'de tüm text input'ları için XSS filtresi ekle
- `HTMLPurifier` veya `mews/purifier` paketi kullan
- Ya da regex ile `<`, `>`, `&`, `"`, `'` karakterlerini reddet

### 2. Acil — APP_DEBUG=false (Öncelik: KRİTİK)
- Production'da `APP_DEBUG=false` ve `APP_ENV=production` ayarla
- Global exception handler'ı API için temiz JSON hatalar döndürecek şekilde yapılandır

### 3. Yüksek — Rate Limiting (Öncelik: YÜKSEK)
- Login endpoint'i için: `throttle:5,1` (1 dakikada 5 deneme)
- Register endpoint'i için: `throttle:3,60` (1 saatte 3 deneme)
- API geneli için: `throttle:60,1`

### 4. Yüksek — Middleware Hata Yönetimi (Öncelik: YÜKSEK)
- `subscription.active` middleware: super admin için bypass ekle
- `BaseController::user()`: return type nullable yap
- Form Request `authorize()` → 403 döndürmeli, 500 değil

### 5. Orta — HTTPS Zorlaması (Öncelik: ORTA)
- Nginx'te `add_header Strict-Transport-Security "max-age=31536000"` ekle
- HTTP → HTTPS redirect konfigüre et
- API endpoint'lerinde `Content-Security-Policy` header ekle

### 6. Orta — Security Headers (Öncelik: ORTA)
Nginx config'e ekle:
```nginx
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

### 7. Düşük — API Dokümantasyonu (Öncelik: DÜŞÜK)
- Register endpoint için `name` alanının zorunlu olduğunu belgele
- Tüm endpoint'ler için OpenAPI/Swagger spec oluştur

---

## 7. DÜZELTME SIRASI (ÇÖZÜM PLANI)

1. **Şimdi:** `APP_DEBUG=false` ayarla → stack trace sızıntısını durdur
2. **Şimdi:** `BaseController::user()` return type'ını `?User` yap → 500 hatalarını düzelt
3. **Bu hafta:** XSS sanitizasyonu ekle (allergens, medical-conditions, food-ingredients tüm text alanları)
4. **Bu hafta:** Rate limiting ekle (`throttle:5,1` login için)
5. **Bu hafta:** `subscription.active` middleware'i super admin için düzelt
6. **Bu ay:** Form Request validation 422 döndürme sorunlarını araştır ve düzelt
7. **Bu ay:** Dashboard revenue endpoint'ini düzelt
8. **Bu ay:** Security headers nginx config'e ekle
9. **Gelecek sprint:** ModelNotFoundException → 404 global handler
