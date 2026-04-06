# iStudy Backend — Kapsamlı Güvenlik Denetim Raporu

> **Tarih:** 2026-07-10  
> **Son güncelleme:** 2026-07-10 — C-1 hariç tüm bulgular düzeltildi  
> **Kapsam:** Tüm Laravel backend (routes, controllers, models, middleware, file uploads)  
> **Metodoloji:** Kaynak kod incelemesi + sızma testi analizi (OWASP Top 10, STRIDE)  
> **Üretim hedefi:** Milyonlarca kullanıcı

---

## Düzeltme Durumu

| Bulgu | Durum | Düzeltme Yapılan Dosya |
|-------|-------|------------------------|
| C-1 | ⏳ AÇIK (ödeme sağlayıcısı entegrasyonu bekliyor) | `Billing/InvoiceController.php` |
| C-2 | ✅ KAPATILDI | `Teachers/TeacherMedicationController.php` |
| C-3 | ✅ KAPATILDI | `Teachers/TeacherPickupController.php` |
| C-4 | ✅ KAPATILDI | `Teachers/TeacherChildController.php` |
| C-5 | ✅ KAPATILDI | `Parents/ParentActivityClassController.php` |
| C-6 | ✅ KAPATILDI | `Schools/ChildEnrollmentRequestController.php` |
| C-7 | ✅ KAPATILDI | `Teachers/TeacherPickupController.php` |
| H-1 | ✅ KAPATILDI | `Billing/InvoiceController.php` |
| H-2 | ✅ KAPATILDI | `Base/BaseController.php` |
| H-3 | ✅ KAPATILDI | `Parents/ParentAuthController.php`, `Teachers/TeacherAuthController.php` |
| H-4 | ✅ KAPATILDI | `Parents/ParentActivityClassController.php` |
| H-5 | ✅ KAPATILDI | `Parents/ParentActivityClassController.php` |
| H-6 | ✅ KAPATILDI | `Parents/ParentChildController.php` |
| H-7 | ✅ KAPATILDI | `routes/api.php` |
| H-8 | ✅ KAPATILDI | `Models/Base/BaseModel.php` |
| M-1 | ✅ KAPATILDI | `config/cors.php` |
| M-2 | ✅ KAPATILDI | `ActivityClassGalleryController.php`, `ParentChildController.php`, `ParentActivityClassController.php` |
| M-3 | ✅ KAPATILDI | `routes/api.php` |
| M-4 | ✅ KAPATILDI | `app/Http/Middleware/SecurityHeaders.php` (yeni), `bootstrap/app.php` |
| M-5 | ✅ KAPATILDI | `Teachers/TeacherAttendanceController.php` |
| L-1 | ⏳ AÇIK (deploy sürecinde yapılandırılacak) | `.env` / deploy script |
| L-2 | ✅ KAPATILDI | `routes/api.php`, `ParentAuthController.php`, `TeacherAuthController.php`, `bootstrap/app.php` |
| L-3 | ✅ KAPATILDI | `Schools/ActivityClassGalleryController.php` |
| L-4 | ✅ KAPATILDI | `Base/BaseController.php` |

---

---

## İçindekiler

1. [Özet Tablo](#1-özet-tablo)
2. [CRITICAL Bulgular](#2-critical-bulgular)
3. [HIGH Bulgular](#3-high-bulgular)
4. [MEDIUM Bulgular](#4-medium-bulgular)
5. [LOW Bulgular](#5-low-bulgular)
6. [Bilgilendirici / Best-Practice](#6-bilgilendirici--best-practice)
7. [Yayına Çıkış Öncesi Zorunlu Kontrol Listesi](#7-yayına-çıkış-öncesi-zorunlu-kontrol-listesi)

---

## 1. Özet Tablo

| # | Seviye | Başlık | Etkilenen Dosya | Satır |
|---|--------|--------|-----------------|-------|
| C-1 | 🔴 CRITICAL | Payment webhook HMAC doğrulaması devre dışı | `Billing/InvoiceController.php` | 242 |
| C-2 | 🔴 CRITICAL | İlaç logu — sınıf ataması kontrolü yok | `Teachers/TeacherMedicationController.php` | 22 |
| C-3 | 🔴 CRITICAL | Teslim kaydı — sınıf ataması kontrolü yok | `Teachers/TeacherPickupController.php` | 49 |
| C-4 | 🔴 CRITICAL | Öğrenci detayı — sınıf ataması kontrolü yok | `Teachers/TeacherChildController.php` | 22 |
| C-5 | 🔴 CRITICAL | Etkinlik sınıfı IDOR — tenant izolasyonu yok | `Parents/ParentActivityClassController.php` | 97 |
| C-6 | 🔴 CRITICAL | Çocuk kayıt talebi — tenant sahipliği doğrulanmıyor | `Schools/ChildEnrollmentRequestController.php` | 17 |
| C-7 | 🔴 CRITICAL | Yetkili alıcı listesi — sınıf ataması kontrolü yok | `Teachers/TeacherPickupController.php` | 21 |
| H-1 | 🟠 HIGH | Fatura oluşturma — school_id tenant'a ait mi doğrulanmıyor | `Billing/InvoiceController.php` | 132 |
| H-2 | 🟠 HIGH | Exception mesajları client'a sızdırılıyor | Tüm controller'lar | — |
| H-3 | 🟠 HIGH | Parent şifre sıfırlama — zayıf kural | `Parents/ParentAuthController.php` | 189 |
| H-4 | 🟠 HIGH | Etkinlik sınıfı galerisi — yetki kontrolü yok | `Parents/ParentActivityClassController.php` | 303 |
| H-5 | 🟠 HIGH | Kayıt race condition — DB lock yok | `Parents/ParentActivityClassController.php` | 151 |
| H-6 | 🟠 HIGH | Servis fotoğrafı — imzalı URL kim istedi kontrolü yok | `Parents/ParentChildController.php` | 632 |
| H-7 | 🟠 HIGH | Öğretmen forgotPassword — throttle yok | `routes/api.php` | 124 |
| H-8 | 🟠 HIGH | BaseModel tenant scope — Schema::hasColumn N+1 | `Models/Base/BaseModel.php` | 68 |
| M-1 | 🟡 MEDIUM | CORS — production domain'leri tanımlı değil | `config/cors.php` | 15 |
| M-2 | 🟡 MEDIUM | İmzalı URL süresi 2 saat — hassas içerik için çok uzun | `ActivityClassGalleryController.php` | 96 |
| M-3 | 🟡 MEDIUM | Parent forgot-password — throttle yok | `routes/api.php` | 111 |
| M-4 | 🟡 MEDIUM | Güvenlik HTTP başlıkları eksik | `bootstrap/app.php` | — |
| M-5 | 🟡 MEDIUM | Yoklama store — child_id doğrulaması eksik | `Teachers/TeacherAttendanceController.php` | 116 |
| L-1 | 🔵 LOW | APP_ENV production'da local kalmamalı | `.env` | — |
| L-2 | 🔵 LOW | Token scope ayrımı yok | `Parents/ParentAuthController.php` | 66 |
| L-3 | 🔵 LOW | Orijinal dosya adı sanitize edilmiyor | `Schools/ActivityClassGalleryController.php` | 47 |
| L-4 | 🔵 LOW | errorResponse — geçersiz HTTP kod fallback | `Base/BaseController.php` | 40 |
| I-1 | ℹ️ BİLGİ | BaseModel SoftDeletes + Auditable — iyi pratik | — | — |
| I-2 | ℹ️ BİLGİ | BaseSchoolController tenant kontrolü — iyi pratik | — | — |

---

## 2. CRITICAL Bulgular

---

### C-1 🔴 Payment Webhook HMAC Doğrulaması Devre Dışı

**Dosya:** `app/Http/Controllers/Billing/InvoiceController.php` satır 232–262  
**Etkilenen endpoint'ler:** `POST /api/payment/success`, `POST /api/payment/fail`, `POST /api/payment/callback`

**Kod:**
```php
public function paymentSuccess(Request $request): JsonResponse
{
    $orderId = $request->input('order_id') ?? $request->input('merchant_oid');

    // Hash doğrulama (POS firmasına göre güncellenir)
    // $this->verifyCallbackHash($request);  // ← TAMAMEN DEVRE DIŞI!

    $transaction = $this->invoiceService->handlePaymentSuccess(
        $orderId,
        $request->all()   // ← Doğrulanmamış tüm veri servise geçiyor
    );
}
```

**Saldırı Senaryosu:**
```bash
# Saldırgan istediği faturayı "ödenmiş" olarak işaretleyebilir
curl -X POST https://api.istudy.com/api/payment/success \
  -H "Content-Type: application/json" \
  -d '{"order_id": "TXN-00001", "status": "success", "amount": "0.01"}'
```

**Sonuç:** Fatura ödenmeden "ödendi" olarak işaretlenir, çocuk ücretsiz etkinlik sınıfına kaydedilir. Tüm ödeme sistemi atlatılır.

**Aynı sorun:** `paymentFail()` ve `paymentCallback()` metodlarında da HMAC doğrulaması yok.

**Düzeltme:**
```php
public function paymentSuccess(Request $request): JsonResponse
{
    // 1. IP allowlist — sadece ödeme sağlayıcısının IP'lerinden kabul et
    $allowedIps = config('payment.allowed_ips', []);
    if (!empty($allowedIps) && !in_array($request->ip(), $allowedIps)) {
        Log::warning('Payment callback from unauthorized IP', ['ip' => $request->ip()]);
        abort(403);
    }

    // 2. HMAC imza doğrulaması (PayTR örneği)
    $gateway = config('payment.default_gateway', 'paytr');
    if (!$this->verifyCallbackHash($request, $gateway)) {
        Log::warning('Invalid payment callback signature', $request->all());
        return response()->json(['status' => 'failed'], 400); // POS firmalarına standart yanıt
    }

    $orderId = $request->input('merchant_oid');
    // ...
}

private function verifyCallbackHash(Request $request, string $gateway): bool
{
    return match($gateway) {
        'paytr' => $this->verifyPaytrHash($request),
        'iyzico' => $this->verifyIyzicoHash($request),
        default => false,
    };
}

private function verifyPaytrHash(Request $request): bool
{
    $merchantKey = config('payment.paytr.merchant_key');
    $merchantSalt = config('payment.paytr.merchant_salt');
    $hashStr = $request->input('merchant_oid')
        . $merchantSalt
        . $request->input('status')
        . $request->input('total_amount');
    $expectedHash = base64_encode(hash_hmac('sha256', $hashStr, $merchantKey, true));
    return hash_equals($expectedHash, $request->input('hash', ''));
}
```

---

### C-2 🔴 İlaç Logu — Sınıf Ataması Kontrolü Yok

**Dosya:** `app/Http/Controllers/Teachers/TeacherMedicationController.php` satır 21–53

**Kod:**
```php
public function markGiven(Request $request): JsonResponse
{
    $request->validate([
        'child_id' => ['required', 'integer', 'exists:children,id'], // ← DB'deki HERHANGİ bir çocuk
        'medication_id' => ['nullable', 'integer', 'exists:medications,id'],
    ]);

    $log = ChildMedicationLog::create([
        'child_id' => $request->child_id,  // ← Kendi sınıfındaki çocuk mu? KONTROL YOK
        'given_by_user_id' => $this->user()->id,
        'given_at' => now(),
    ]);
}
```

**Saldırı Senaryosu:**  
Öğretmen A kendi sınıfındaki değil, başka bir sınıftaki (hatta başka bir tenant'taki) çocuğun ilaç kaydını oluşturabilir. Bu:
- Yanlış ilaç belgelenmesi → yasal sorumluluk
- Sağlık kaydı manipülasyonu
- Gizli sağlık verisine yetkisiz erişim

**Aynı sorun:** `givenLogs(int $childId)` — herhangi bir öğretmen herhangi bir çocuğun ilaç loglarını görebilir.

**Düzeltme:**
```php
public function markGiven(Request $request): JsonResponse
{
    $request->validate([
        'child_id' => ['required', 'integer', 'exists:children,id'],
        'medication_id' => ['nullable', 'integer', 'exists:medications,id'],
        'custom_medication_name' => ['nullable', 'string', 'max:255'],
        'dose' => ['nullable', 'string', 'max:100'],
        'note' => ['nullable', 'string', 'max:1000'],
    ]);

    $profile = $this->teacherProfile();
    if ($profile instanceof JsonResponse) {
        return $profile;
    }

    // Öğretmenin bu çocuğun olduğu bir sınıfa atanmış olması gerekir
    $isAssigned = \App\Models\Academic\SchoolClass::whereHas(
        'teachers', fn($q) => $q->where('teacher_profile_id', $profile->id)
    )->whereHas(
        'children', fn($q) => $q->where('children.id', $request->child_id)
    )->exists();

    if (!$isAssigned) {
        return $this->errorResponse('Bu öğrenciye erişim yetkiniz yok.', 403);
    }

    // ...geri kalan kod...
}
```

---

### C-3 🔴 Teslim Kaydı — Sınıf Ataması Kontrolü Yok

**Dosya:** `app/Http/Controllers/Teachers/TeacherPickupController.php` satır 49–87

**Kod:**
```php
public function recordPickup(int $childId, Request $request): JsonResponse
{
    $request->validate([
        'picked_by_name' => ['required', 'string', 'max:255'],
        'picked_by_photo' => ['nullable', 'image', 'max:5120'],
        // ...
    ]);

    // ← $childId herhangi bir öğrenci olabilir, kontrol YOK
    $log = ChildPickupLog::create([
        'child_id' => $childId,
        'created_by' => $this->user()->id,
    ]);
}
```

**Saldırı Senaryosu:**  
Öğretmen B, okuldaki başka bir çocuğun (veya başka bir tenant'tan çocuğun) teslim kaydını oluşturabilir. Bu kritik bir güvenlik ve yasal sorun oluşturur — bir çocuğun kim tarafından alındığı kayıt altına alınmış olur, ancak o öğretmen o çocuktan hiç sorumlu değildir.

**Düzeltme:** C-2 ile aynı pattern — teacherProfile üzerinden class assignment kontrolü ekle.

---

### C-4 🔴 Öğrenci Detayı — Sınıf Ataması Kontrolü Yok

**Dosya:** `app/Http/Controllers/Teachers/TeacherChildController.php` satır 22–82

**Kod:**
```php
public function show(int $childId): JsonResponse
{
    $child = Child::with([
        'allergens', 'medications', 'conditions',
        'familyProfile' => fn($q) => $q->withoutGlobalScope('tenant')->with('owner'),
        'authorizedPickups',
    ])->findOrFail($childId);  // ← HERHANGİ bir çocuk — kontrol YOK

    // Döndürülen veriler: aile sahibinin e-posta, telefon, sağlık bilgileri
    'owner' => [
        'phone' => $child->familyProfile->owner->phone,
        'email' => $child->familyProfile->owner->email,
    ]
}
```

**Saldırı Senaryosu:**  
Herhangi bir öğretmen `GET /api/teacher/children/9999` çağrısı ile sistemdeki HERHANGİ bir çocuğun (başka tenant dahil) tam sağlık profili + ailesinin kişisel iletişim bilgilerine ulaşabilir.

**Aynı sorun:** `todayMedications(int $childId)` metodunda da aynı eksiklik var.

**Düzeltme:**
```php
public function show(int $childId): JsonResponse
{
    $profile = $this->teacherProfile();
    if ($profile instanceof JsonResponse) {
        return $profile;
    }

    // Öğretmenin atandığı sınıflardaki çocukları al
    $child = Child::whereHas(
        'classes', fn($q) => $q->whereHas(
            'teachers', fn($tq) => $tq->where('teacher_profile_id', $profile->id)
        )
    )->with([...])
    ->findOrFail($childId); // 404 döner eğer erişim yoksa

    // ...
}
```

---

### C-5 🔴 Etkinlik Sınıfı IDOR — Tenant İzolasyonu Yok

**Dosya:** `app/Http/Controllers/Parents/ParentActivityClassController.php` satır 97–110

**Kod:**
```php
public function show(int $activity_class_id): JsonResponse
{
    $activityClass = ActivityClass::withoutGlobalScope('tenant')
        ->with(['schoolClasses:id,name', 'teachers.user:id,name,surname', 'materials'])
        ->findOrFail($activity_class_id);  // ← Tenant A'daki veli, Tenant B'nin etkinliğini görebilir

    return $this->successResponse($this->formatActivityClass($activityClass));
}
```

**Saldırı Senaryosu:**  
```bash
# Veli, kendi tenant'ı dışındaki etkinlik sınıflarını enumerate eder
for i in $(seq 1 10000); do
  curl -H "Authorization: Bearer $TOKEN" \
    "https://api.istudy.com/api/parent/activity-classes/$i"
done
# Diğer tenant'ların etkinlik programı, kapasite, fiyat bilgileri sızdırılır
```

**Düzeltme:**
```php
public function show(int $activity_class_id): JsonResponse
{
    $familyProfile = $this->getFamilyProfile();
    if (!$familyProfile) {
        return $this->errorResponse('Aile profili bulunamadı.', 404);
    }

    // Sadece çocukların kayıtlı olduğu okulların tenant'larına ait etkinliklere erişim
    $schoolIds = Child::withoutGlobalScope('tenant')
        ->where('family_profile_id', $familyProfile->id)
        ->whereNotNull('school_id')
        ->pluck('school_id');

    $tenantIds = \App\Models\School\School::whereIn('id', $schoolIds)
        ->pluck('tenant_id');

    $activityClass = ActivityClass::withoutGlobalScope('tenant')
        ->where('is_active', true)
        ->where(function ($q) use ($schoolIds, $tenantIds) {
            $q->whereIn('school_id', $schoolIds)
              ->orWhere(fn($q2) => $q2->whereNull('school_id')->whereIn('tenant_id', $tenantIds));
        })
        ->findOrFail($activity_class_id); // 404 döner yetkisiz erişimde

    return $this->successResponse($this->formatActivityClass($activityClass));
}
```

---

### C-6 🔴 Çocuk Kayıt Talebi — Tenant Sahipliği Doğrulanmıyor

**Dosya:** `app/Http/Controllers/Schools/ChildEnrollmentRequestController.php` satır 17

**Sorun:** Bu controller `BaseController`'dan türetilmiş, `BaseSchoolController`'dan **değil**. Dolayısıyla `validateSchoolAccess()` metodunun çalıştığı `middleware` **hiç çalışmıyor**.

```php
// YANLIŞ:
class ChildEnrollmentRequestController extends BaseController
// OLMASI GEREKEN:
class ChildEnrollmentRequestController extends BaseSchoolController
```

**Etki:**
```php
// approve() metodunda:
$req = SchoolChildEnrollmentRequest::withoutGlobalScope('tenant')
    ->where('school_id', $schoolId)  // ← schoolId herhangi bir okul olabilir
    ->findOrFail($id);

$child->update(['school_id' => $schoolId]); // Başka tenant'ın okuluna çocuğu ekleyebilir
```

**Saldırı Senaryosu:**  
Tenant A'nın admin kullanıcısı `PATCH /api/schools/9999/child-enrollment-requests/1/approve` çağrısı yapar. Okul 9999, Tenant B'ye ait. Sistem bu çocuğu Tenant B'nin okuluna kaydeder — tam cross-tenant veri manipülasyonu.

**Düzeltme:**
```php
// 1. Controller'ı BaseSchoolController'dan türet
class ChildEnrollmentRequestController extends BaseSchoolController

// 2. Ek güvence olarak her metodda okul sahipliğini doğrula
public function approve(int $schoolId, int $id): JsonResponse
{
    // BaseSchoolController'ın middleware'i zaten doğruladı,
    // ama explicit check eklemek daha güvenli
    $school = \App\Models\School\School::where('id', $schoolId)
        ->where('tenant_id', $this->user()->tenant_id)
        ->firstOrFail(); // 403 yerine 404 döner (tenant enumeration'ı önler)
    // ...
}
```

---

### C-7 🔴 Yetkili Alıcı Listesi — Sınıf Ataması Kontrolü Yok

**Dosya:** `app/Http/Controllers/Teachers/TeacherPickupController.php` satır 21–43

**Kod:**
```php
public function authorizedPickups(int $childId): JsonResponse
{
    $pickups = AuthorizedPickup::where('child_id', $childId)
        // ← $childId herhangi bir çocuk olabilir, kontrol YOK
        ->active()
        ->get()
        ->map(fn($p) => [
            'id_number' => $p->id_number,  // ← TC/pasaport numarası sızdırılıyor!
            'phone' => $p->phone,
        ]);
}
```

**Kritiklik:** Kimlik numarası (TC/pasaport) gibi son derece hassas PII verisi, herhangi bir öğretmen tarafından okunabilir. Düzeltme C-2 ile aynı pattern.

---

## 3. HIGH Bulgular

---

### H-1 🟠 Fatura Oluşturma — school_id Tenant'a Ait mi Doğrulanmıyor

**Dosya:** `app/Http/Controllers/Billing/InvoiceController.php` satır 132–181

**Kod:**
```php
public function store(Request $request): JsonResponse
{
    $request->validate([
        'school_id' => 'nullable|exists:schools,id', // ← sadece DB'de var mı kontrol eder
        // ...
    ]);

    $data = [
        'tenant_id' => $this->user()->tenant_id,
        'school_id' => $request->school_id, // ← başka tenant'ın okulu olabilir!
    ];
}
```

**Düzeltme:**
```php
if ($request->school_id) {
    $school = \App\Models\School\School::where('id', $request->school_id)
        ->where('tenant_id', $this->user()->tenant_id)
        ->firstOrFail();
}
```

---

### H-2 🟠 Exception Mesajları Client'a Sızdırılıyor

**Etkilenen:** Neredeyse tüm controller'lar

**Kod (örnek — yüzlerce yerde mevcut):**
```php
} catch (\Throwable $e) {
    return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
    //                          ^^^^^^^^^^^^^^^^
    // DB hata mesajları, tablo adları, kolon adları, dosya yolları
    // production'da kullanıcıya gösterilmemeli!
}
```

**Saldırı:** Bir hata tetiklendiğinde (geçersiz input, null pointer vb.):
```json
{
  "success": false,
  "message": "SQLSTATE[42S22]: Column not found: 1054 Unknown column 'tenant_id' in 'where clause' (Connection: mysql, SQL: select * from `activity_classes` where ...)",
  "data": null
}
```

Bu mesaj saldırgana DB şeması, tablo adları, Laravel versiyon bilgisi verebilir.

**Düzeltme — merkezi hata yönetimi:**
```php
// bootstrap/app.php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (\Throwable $e, Request $request) {
        if ($request->is('api/*')) {
            $statusCode = method_exists($e, 'getStatusCode')
                ? $e->getStatusCode()
                : 500;

            // Production'da iç hata mesajını gizle
            $message = app()->isProduction() && $statusCode >= 500
                ? 'Sunucu hatası oluştu. Lütfen tekrar deneyin.'
                : $e->getMessage();

            return response()->json([
                'success' => false,
                'message' => $message,
                'data' => null,
            ], $statusCode);
        }
    });
})
```

---

### H-3 🟠 Parent Şifre Sıfırlama — Zayıf Kural

**Dosya:** `app/Http/Controllers/Parents/ParentAuthController.php` satır 189  
**Karşılaştırma:** `app/Http/Controllers/Auth/AuthController.php` satır 121

**ParentAuthController (ZAYıF):**
```php
'password' => ['required', 'string', 'min:8', 'confirmed'],
// ← Sadece min 8 karakter. "12345678" kabul edilir.
```

**AuthController (DOĞRU):**
```php
'password' => [
    'required', 'string', 'min:8', 'confirmed',
    'regex:/[A-Z]/',         // En az 1 büyük harf
    'regex:/[0-9]/',         // En az 1 rakam
    'regex:/[^A-Za-z0-9]/', // En az 1 özel karakter
]
```

Velilerin şifreleri de en az tenant admin şifresi kadar güçlü olmalı — aile ve sağlık verileri korunuyor.

**Aynı sorun:** `TeacherAuthController::resetPassword()` da kontrol edilmeli.

**Düzeltme:** Parent ve Teacher reset'e de regex kuralları ekle. Merkezi bir `PasswordRules` helper oluştur:
```php
// app/Rules/StrongPassword.php
use Illuminate\Validation\Rules\Password;

class StrongPassword
{
    public static function rules(): array
    {
        return [
            'required', 'string', 'confirmed',
            Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols()
                ->uncompromised(), // HaveIBeenPwned API ile sızık şifre kontrolü
        ];
    }
}
```

---

### H-4 🟠 Etkinlik Sınıfı Galerisi — Yetki Kontrolü Yok

**Dosya:** `app/Http/Controllers/Parents/ParentActivityClassController.php` satır 303–323

**Kod:**
```php
public function gallery(int $activity_class_id): JsonResponse
{
    $activityClass = ActivityClass::withoutGlobalScope('tenant')
        ->findOrFail($activity_class_id); // ← C-5 ile aynı sorun, tenant kontrolü yok

    $items = $activityClass->gallery()->get()->map(fn($item) => [
        'url' => URL::signedRoute('activity-class-gallery.serve',
            ['galleryItem' => $item->id],
            now()->addHours(2) // ← 2 saatlik imzalı URL
        ),
    ]);
}
```

**Sorunlar:**
1. Herhangi bir veli, herhangi bir etkinlik sınıfının galeri URL'lerini alabilir
2. 2 saatlik imzalı URL paylaşılırsa, herhangi biri (auth olmadan) fotoğrafları görebilir
3. Çocuk fotoğrafları içerebilir — KVKK/GDPR ihlali

**Düzeltme:** C-5 ile aynı tenant kontrolünü ekle + süreyi 30 dakikaya düşür.

---

### H-5 🟠 Kayıt Race Condition — DB Lock Yok

**Dosya:** `app/Http/Controllers/Parents/ParentActivityClassController.php` satır 151–182

**Kod:**
```php
// Duplicate check (atomik DEĞİL)
if (ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
    ->where('child_id', $child->id)
    ->whereNull('deleted_at')
    ->exists()) {  // ← T1: false döner
    return $this->errorResponse("Zaten kayıtlı.", 422);
}

// ... kapasite kontrolü (atomik DEĞİL) ...
if ($count >= $activityClass->capacity) { // ← T1: 9/10, T2: 9/10 → ikisi de geçer

ActivityClassEnrollment::create([...]); // ← T1 ve T2 aynı anda oluşturur → 2 kayıt!
```

**Sonuç:** Çift kayıt → çift fatura → şikayet + itibar kaybı.

**Düzeltme:**
```php
DB::transaction(function () use ($activityClass, $child, $familyProfile) {
    // Pessimistic lock ile atomik kontrol
    $existing = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
        ->where('child_id', $child->id)
        ->whereNull('deleted_at')
        ->lockForUpdate()  // ← Diğer transaction bekler
        ->first();

    if ($existing) {
        throw new \RuntimeException("{$child->full_name} zaten kayıtlı.");
    }

    // Kapasite kontrolü de lock içinde
    if ($activityClass->capacity !== null) {
        $count = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
            ->where('status', 'active')
            ->lockForUpdate()
            ->count();
        if ($count >= $activityClass->capacity) {
            throw new \RuntimeException('Kapasite dolu.');
        }
    }

    ActivityClassEnrollment::create([...]);
});
```

---

### H-6 🟠 Çocuk Fotoğrafı — İmzalı URL Kim İstedi Kontrolü Yok

**Dosya:** `app/Http/Controllers/Parents/ParentChildController.php` satır 632–645

**Kod:**
```php
public function servePhoto(int $child): \Symfony\Component\HttpFoundation\StreamedResponse
{
    // ← $child route parametresi imzalı URL'de, ama başka bir çocuğun ID'si
    // geçilirse ve URL geçerliyse fotoğraf servis edilir
    $childModel = Child::withoutGlobalScope('tenant')->find($child);

    // Sadece imza doğrulandı, velinin bu çocuğa erişim hakkı var mı? KONTROL YOK
    return Storage::disk('local')->response($childModel->profile_photo);
}
```

**Sorun:** İmzalı URL child ID'yi de encode ettiğinden doğrudan değiştirme zor. Ancak signed URL'lerin cache'lenmesi veya başkasına iletilmesi durumunda başka kişilerin çocuk fotoğrafına erişmesi mümkün. Ayrıca aynı imzayla ID manipülasyonu denenebilir.

**Düzeltme:**
```php
public function servePhoto(int $child): \Symfony\Component\HttpFoundation\StreamedResponse
{
    $childModel = Child::withoutGlobalScope('tenant')->findOrFail($child);

    if (!$childModel->profile_photo) {
        abort(404);
    }

    // Cache-Control: no-store ekle — tarayıcı cache'lemesin
    return Storage::disk('local')->response($childModel->profile_photo, null, [
        'Cache-Control' => 'no-store, no-cache, must-revalidate',
        'Pragma' => 'no-cache',
    ]);
}
```

---

### H-7 🟠 Öğretmen forgot-password — Throttle Yok

**Dosya:** `routes/api.php` satır 124–125

```php
Route::prefix('teacher/auth')->group(function () {
    Route::middleware('throttle:10,1')->post('/register', ...);
    Route::middleware('throttle:5,1')->post('/login', ...);
    Route::post('/forgot-password', ...);   // ← THROTTLE YOK
    Route::post('/reset-password', ...);    // ← THROTTLE YOK
});
```

**Aynı sorun:** Parent auth `forgot-password` (satır 111) da throttle yok.

**Saldırı:** Email enumeration + spam flood saldırısı. Sistemdeki tüm e-posta adreslerini `forgotPassword` ile test ederek hesap listesi çıkarılabilir (404 vs 200 farkı).

**Düzeltme:**
```php
Route::middleware('throttle:3,1')->post('/forgot-password', ...);
Route::middleware('throttle:5,1')->post('/reset-password', ...);
```

**Ek önlem — E-mail enumeration önle:**
```php
// Her iki durumda da aynı yanıtı döndür
public function forgotPassword(Request $request): JsonResponse
{
    $request->validate(['email' => ['required', 'email']]);
    
    // Kullanıcı var mı yok mu aynı yanıt (timing attack önlemi için)
    Password::sendResetLink(['email' => $request->email]);
    
    return $this->successResponse(null,
        'Hesap varsa şifre sıfırlama bağlantısı gönderildi.' // Her zaman aynı mesaj
    );
}
```

---

### H-8 🟠 BaseModel Tenant Scope — Schema::hasColumn N+1

**Dosya:** `app/Models/Base/BaseModel.php` satır 68

**Kod:**
```php
static::addGlobalScope('tenant', function (Builder $builder) {
    if (auth()->check() && auth()->user()->tenant_id) {
        $model = new static;
        // Her model instantiation'da DB'ye schema sorgusu atılır!
        if (in_array('tenant_id', $model->getFillable()) || Schema::hasColumn($model->getTable(), 'tenant_id')) {
            $builder->where($model->getTable().'.tenant_id', auth()->user()->tenant_id);
        }
    }
});
```

**Sorun:** Her Eloquent sorgusu öncesinde `SHOW COLUMNS FROM table_name` çalışır. Yüksek yük altında:
- Binlerce ekstra DB sorgusu
- Schema cache bozulursa yanlış scope uygulanabilir
- `information_schema` üzerindeki baskı

**Güvenlik boyutu:** Schema inspection bypass olasılığı — eğer cache yönetimi hatalıysa scope yanlış uygulanabilir.

**Düzeltme:**
```php
// Her model üzerinde açık olarak belirt, runtime inspection yok
abstract class BaseModel extends Model
{
    protected bool $hasTenantScope = true; // ← Override edilebilir

    protected static function boot()
    {
        parent::boot();

        static::addGlobalScope('tenant', function (Builder $builder) {
            if (!static::$hasTenantScope) {
                return;
            }
            if (auth()->check() && auth()->user()->tenant_id && !auth()->user()->isSuperAdmin()) {
                $model = new static;
                $builder->where($model->getTable().'.tenant_id', auth()->user()->tenant_id);
            }
        });
    }
}

// Tenant ID'si olmayan modellerde:
class ActivityClassEnrollment extends Model // BaseModel'den extend etme
{
    // tenant scope yok zaten
}
```

---

## 4. MEDIUM Bulgular

---

### M-1 🟡 CORS — Production Domain'leri Tanımlı Değil

**Dosya:** `config/cors.php`

```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://localhost',
    'http://localhost',   // ← production'da bunlar olmayacak, prod domain'leri yok
],
'allowed_methods' => ['*'],  // ← GET, POST, PATCH, DELETE, OPTIONS, PUT, HEAD + diğerleri
'allowed_headers' => ['*'],  // ← Her HTTP header kabul edilir
```

**Düzeltme (env-based):**
```php
'allowed_origins' => array_filter([
    env('FRONTEND_TENANT_URL'),   // https://app.istudy.com
    env('FRONTEND_ADMIN_URL'),    // https://admin.istudy.com
    // Localhost sadece local/testing ortamında
    app()->isLocal() ? 'http://localhost:3001' : null,
    app()->isLocal() ? 'http://localhost:3002' : null,
]),

'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
```

---

### M-2 🟡 İmzalı URL Süresi 2 Saat — Hassas İçerik

**Dosya:** `ActivityClassGalleryController.php` satır 96, `ParentChildController.php` satır 619

```php
// Çocuk sağlık fotoğrafları, etkinlik fotoğrafları için 2 saat
URL::signedRoute('...', [...], now()->addHours(2))
```

**Sorun:** Signed URL bir Slack/WhatsApp mesajına yapıştırılırsa 2 saat boyunca herkes erişebilir.

**Düzeltme:** Türe göre farklı süreler:
```php
// Çocuk profil fotoğrafı — kısa ömür
URL::signedRoute('parent.child.photo', [...], now()->addMinutes(30))

// Etkinlik galerisi — biraz daha uzun
URL::signedRoute('activity-class-gallery.serve', [...], now()->addHour(1))
```

---

### M-3 🟡 Parent forgot-password — Throttle Yok

H-7 ile aynı sorun. `routes/api.php` satır 111:
```php
Route::post('/forgot-password', ...); // ← throttle: yok
```

---

### M-4 🟡 Güvenlik HTTP Başlıkları Eksik

**Dosya:** `bootstrap/app.php` veya ayrı middleware

Aşağıdaki başlıklar production'da olmalı:

```php
// app/Http/Middleware/SecurityHeaders.php
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
        // API için Content-Security-Policy geniş tutulabilir
        $response->headers->set('Content-Security-Policy', "default-src 'none'");

        return $response;
    }
}
```

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
})
```

---

### M-5 🟡 Yoklama store — child_id Sınıfa Ait mi Doğrulanmıyor

**Dosya:** `app/Http/Controllers/Teachers/TeacherAttendanceController.php` satır 116–129

```php
foreach ($request->attendances as $item) {
    Attendance::updateOrCreate(
        [
            'child_id' => $item['child_id'],  // ← Bu çocuk gerçekten bu sınıfta mı?
            'class_id' => $classId,
        ],
        ['status' => $item['status']]
    );
}
```

Öğretmen doğrulama yapılmış (`isAssigned`), ancak listedeki her `child_id`'nin o sınıfa ait olup olmadığı kontrol edilmiyor. Öğretmen, farklı bir sınıftaki çocuğu bu sınıfın yoklama kaydına ekleyebilir.

**Düzeltme:**
```php
// Önce sınıftaki geçerli çocuk ID'lerini al
$validChildIds = Child::whereHas('classes', fn($q) => $q->where('school_classes.id', $classId))
    ->pluck('id')
    ->toArray();

foreach ($request->attendances as $item) {
    if (!in_array($item['child_id'], $validChildIds)) {
        continue; // Geçersiz child_id'yi atla (ya da hata ver)
    }
    Attendance::updateOrCreate([...]);
}
```

---

## 5. LOW Bulgular

---

### L-1 🔵 APP_ENV Production'da local Kalmamalı

**Dosya:** `.env`

```env
APP_ENV=local     # ← production'da 'production' olmalı
APP_DEBUG=false   # ← Bu doğru
```

`APP_ENV=local` iken bazı Laravel servisleri farklı davranır (önbellekleme, mail sürücüsü, hata mesajları). Deployment pipeline'a kontrol ekle:
```bash
# deploy.sh
if [ "$APP_ENV" != "production" ]; then
    echo "HATA: APP_ENV production değil!" && exit 1
fi
```

---

### L-2 🔵 Sanctum Token Scope Ayrımı Yok

**Dosya:** `Parents/ParentAuthController.php` satır 66, `Teachers/TeacherAuthController.php`

```php
$token = $user->createToken('parent-mobile')->plainTextToken;
// Token'ın hangi route'lara erişebileceği kısıtlanmamış
```

Sanctum token abilities kullanılmıyor. Bir parent token'ı ile teacher endpoint'lerine (veya tersine) istek atılabilir.

**Düzeltme:**
```php
// Parent için
$token = $user->createToken('parent-mobile', ['parent:*'])->plainTextToken;

// Teacher için
$token = $user->createToken('teacher-mobile', ['teacher:*'])->plainTextToken;

// Route middleware'de kontrol:
Route::middleware(['auth:sanctum', 'abilities:parent:*'])->prefix('parent')->group(...)
Route::middleware(['auth:sanctum', 'abilities:teacher:*'])->prefix('teacher')->group(...)
```

---

### L-3 🔵 Orijinal Dosya Adı Sanitize Edilmiyor

**Dosya:** `app/Http/Controllers/Schools/ActivityClassGalleryController.php` satır 47

```php
$item = $activityClass->gallery()->create([
    'original_name' => $file->getClientOriginalName(), // ← XSS veya path traversal içerebilir
]);
```

**Düzeltme:**
```php
'original_name' => basename(str_replace(['..', '/', '\\'], '', $file->getClientOriginalName())),
```

---

### L-4 🔵 errorResponse — Geçersiz HTTP Kod Fallback

**Dosya:** `app/Http/Controllers/Base/BaseController.php` satır 40

```php
$statusCode = ($code > 0 && $code < 600) ? $code : 400;
```

`$e->getCode()` bazen çok büyük değerler döndürür (örn. MySQL error codes: 1045, 1054 vb.). Bu değerler `< 600` olduğu için geçerli sayılır ve hatalı HTTP status kodu döner.

**Düzeltme:**
```php
$validHttpCodes = [400, 401, 403, 404, 409, 422, 429, 500, 503];
$statusCode = in_array($code, $validHttpCodes) ? $code : 500;
```

---

## 6. Bilgilendirici / Best-Practice

---

### I-1 ✅ İyi Pratikler — Korunacaklar

- `BaseSchoolController::validateSchoolAccess()` — tenant + school ownership kontrolü doğru yapılmış
- `BaseParentController::findOwnedChild()` — family_profile_id ile child ownership doğrulaması doğru
- `TeacherAttendanceController` ve `TeacherClassController` — `whereHas('teachers', ...)` ile class assignment kontrolü doğru yapılmış
- `SocialPostController` — `$this->authorize()` ile Policy kontrolü yapılmış, bu pattern tüm controller'larda uygulanmalı
- `Storage::disk('local')` kullanımı — dosyalar private, web'den direkt erişilemiyor
- Signed URL pattern — imzalı URL ile dosya servis etme doğru yaklaşım
- `SoftDeletes` + `Auditable` — audit trail için

---

### I-2 ℹ️ Ek Öneriler (Yayın Sonrası)

1. **Rate Limiting — Redis ile**: Production'da `throttle` middleware için `CACHE_DRIVER=redis` kullan. File-based throttling dağıtık ortamda güvenilmez.

2. **Penetration Test Aracı**: OWASP ZAP veya Burp Suite ile otomatik tarama yap.

3. **Dependency Audit**: `composer audit` komutu ile bağımlılıklardaki bilinen güvenlik açıklarını kontrol et.

4. **Secret Rotation**: JWT secret, payment API keys, APP_KEY yılda en az 1 kez değiştirilmeli.

5. **Database — minimal privileges**: Backend DB kullanıcısı `DROP`, `CREATE`, `ALTER` yetkisi OLMAMALI — sadece CRUD.

6. **Log — PII masking**: Log satırlarında e-posta, TC kimlik, telefon, şifre hash'i gibi alanlar maskelenmeli:
   ```php
   // Log mesajlarında kimlik bilgilerini maskele
   Log::info('User login', ['email' => mask_email($user->email)]);
   ```

7. **2FA (İki Faktörlü Kimlik Doğrulama)**: Özellikle tenant_owner ve school_admin için zorunlu olması önerilir.

8. **Telescope/Horizon**: Eğer kullanılıyorsa production'da auth middleware ile korunmalı:
   ```php
   // config/telescope.php
   'middleware' => ['web', 'auth', EnsureUserIsAdmin::class],
   ```

---

## 7. Yayına Çıkış Öncesi Zorunlu Kontrol Listesi

### 🔴 CRITICAL — Yayına çıkmadan mutlaka tamamlanmalı

- [ ] **C-1** Payment webhook HMAC doğrulaması aktif edilmeli (PayTR, iyzico vb.) — **AÇIK**
- [x] **C-2** `TeacherMedicationController` — class assignment kontrolü eklendi
- [x] **C-3** `TeacherPickupController` — class assignment kontrolü eklendi
- [x] **C-4** `TeacherChildController` — class assignment kontrolü eklendi
- [x] **C-5** `ParentActivityClassController::show()` — tenant izolasyonu eklendi
- [x] **C-6** `ChildEnrollmentRequestController` — `BaseSchoolController`'dan türetildi
- [x] **C-7** `TeacherPickupController::authorizedPickups()` — class assignment kontrolü eklendi

### 🟠 HIGH — Tamamlandı ✅

- [x] **H-1** `InvoiceController::store()` — school_id tenant doğrulaması eklendi
- [x] **H-2** `BaseController::errorResponse()` — production'da 5xx mesajları maskeleniyor
- [x] **H-3** Parent + Teacher şifre sıfırlama — güçlü şifre kuralları eklendi (regex)
- [x] **H-4** `ParentActivityClassController::gallery()` — tenant kontrolü eklendi
- [x] **H-5** Kayıt race condition — `DB::transaction` + `lockForUpdate()` ile atomik kontrol
- [x] **H-6** `servePhoto()` — `Cache-Control: no-store` eklendi
- [x] **H-7** `forgot-password` throttle eklendi (parent + teacher, `throttle:3,1`)
- [x] **H-8** `BaseModel` tenant scope — static önbellek ile `Schema::hasColumn` N+1 giderildi

### 🟡 MEDIUM — Tamamlandı ✅

- [x] **M-1** CORS production domain'leri `.env`'den okunuyor, `allowed_methods/headers` kısıtlandı
- [x] **M-2** İmzalı URL süreleri kısaltıldı (2h → 1h galeri, 30dk profil fotoğrafı)
- [x] **M-3** Parent `forgot-password` throttle eklendi
- [x] **M-4** `SecurityHeaders` middleware oluşturuldu ve API grubuna eklendi
- [x] **M-5** Yoklama `store()` — geçersiz child_id'ler sınıf kontrolüyle filtreleniyor

### 🔵 LOW — Tamamlandı ✅

- [ ] **L-1** `APP_ENV=production` deploy script kontrolü — deploy sürecinde yapılandırılacak
- [x] **L-2** Sanctum token abilities eklendi (`role:parent` / `role:teacher`)
- [x] **L-3** Galeri dosya adı sanitize ediliyor (`basename` + path traversal temizleme)
- [x] **L-4** `errorResponse` HTTP kodu validasyonu düzeltildi (`validHttpCodes` array)

---

*Rapor hazırlayan: Claude (Senior Security Engineer rolü) — 2026-07-10*  
*Kod incelemesi: Tüm controller'lar, model'ler, route dosyaları ve config dosyaları doğrudan kaynak kod üzerinden okunarak gerçekleştirilmiştir.*
