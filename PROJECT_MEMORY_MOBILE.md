# iStudy — Veli & Öğretmen Mobil Uygulaması

> Son Güncelleme: 2026-07-10 | React Native 0.83.2 + Expo ~55, Expo Router v3
> Yol: `parent-mobile-app/` | Kaynak: `src/`

---

## 1. Uygulama Kimliği

| Alan | Değer |
|------|-------|
| Framework | React Native 0.83.2 + Expo ~55 |
| Routing | Expo Router v3 (file-based, `src/app/`) |
| State | React Context (AuthContext) |
| HTTP | Axios + AsyncStorage interceptor |
| Token | `parent_token` (veli) / `teacher_token` (öğretmen) — AsyncStorage |
| API Base | Android: `http://10.0.2.2:8000/api` / iOS: `http://localhost:8000/api` |
| Renk teması | `src/constants/theme.ts` (Colors.ts değil!) |

---

## 2. Dizin Yapısı

```
src/app/
  _layout.tsx              ← Root (AuthContext + authEvent.register)
  (auth)/
    login.tsx              ← Veli girişi + "Öğretmen Girişi →" linki
    teacher-login.tsx      ← Öğretmen girişi → teacher_token
    teacher-register.tsx   ← Öğretmen kaydı → teacher_token
    register.tsx, forgot-password.tsx, verify-email.tsx
  (teacher-app)/           ← Tamamen bağımsız öğretmen alanı
    _layout.tsx            ← teacherToken guard + 5 tab
    index.tsx              ← Öğretmen anasayfası
    profile.tsx            ← Davet kabul/reddet, kurumlarım, blog yönetimi
    classes/_layout.tsx + index.tsx + [classId]/index|attendance|reports
    children/_layout.tsx + [childId]/index|health|pickup
    daily/_layout.tsx + index.tsx
    meal-menu/_layout.tsx + index.tsx
  (app)/                   ← Veli alanı
    _layout.tsx            ← 5 görünür tab + gizli screen'ler
    index.tsx              ← Global feed + okul feed
    children/index|add|[id]/index|edit|health
    schools/_layout.tsx + index|join|[id]/index
    meal-menu/_layout.tsx + index.tsx
    activities/_layout.tsx + index.tsx + [id].tsx
    teachers/_layout.tsx + [id]/index|blog/[blogId]
    activity-classes/_layout.tsx + index|[id]  (Tab'da gizli)
    invoices/_layout.tsx + index|[id]          (Tab'da gizli)
    family/index|emergency
    profile.tsx
src/lib/
  api.ts         ← Axios instance (token interceptor + authEvent)
  auth.ts        ← loginRequest, registerRequest, TOKEN_KEY
  authEvent.ts   ← 401 global callback
src/constants/theme.ts
```

---

## 3. Auth Flow

### Veli Auth
1. App başlar → `_layout.tsx` → AsyncStorage `parent_token` okur
2. Token var → `(app)/` grubuna yönlendir
3. Token yok → `(auth)/login`
4. 401 → `api.ts` interceptor → `AsyncStorage.multiRemove(['parent_token','parent_user'])` + `authEvent.trigger()` → login'e

### Öğretmen Auth (Dual-token)
- `_layout.tsx`: hem `parent_token` hem `teacher_token` kontrol → doğru gruba yönlendir
- `teacher_token` var → `(teacher-app)/`
- `parent_token` var → `(app)/`
- İkisi yoksa → `(auth)/login`

**authEvent Paterni:** `authEvent.register(callback)` → `_layout.tsx`'te signOut tetikler; `authEvent.trigger()` → `api.ts`'ten çağrılır.

---

## 4. Tab Navigasyonu

### Veli (app/_layout.tsx)
**5 görünür tab:** Akış, Yemek Listesi (restaurant), Etkinlikler (flame), İstatistikler, Profil

**Gizli (`href: null`):** children, schools, activity-classes, family, invoices, teachers, explore

Tab label stil: `fontSize: 8, fontWeight: '600', flexWrap: 'wrap', textAlign: 'center'`
Tab bar height: Android 72, iOS 96

### Öğretmen (teacher-app/_layout.tsx)
**5 tab:** Anasayfa, Sınıflarım, Günlük, Yemek, Profil

---

## 5. API Endpoint Referansı

### Veli Auth (Public)
```
POST /api/parent/auth/register
POST /api/parent/auth/login
POST /api/parent/auth/forgot-password
POST /api/parent/auth/reset-password
GET  /api/parent/auth/verify-email/{id}/{hash}
GET  /api/parent/auth/countries     ← register ekranında ülke kodu
GET  /api/parent/auth/blood-types   ← register/add-child'de kan grubu
```

### Veli Auth (Token Gerekli)
```
POST /api/parent/auth/logout
GET  /api/parent/auth/me
POST /api/parent/auth/resend-verification
```

### Çocuklar
```
GET/POST/PUT/DELETE /api/parent/children
POST /api/parent/children/{id}/allergens     ← {allergen_ids[], custom_name?}
POST /api/parent/children/{id}/medications   ← [{medication_id?, custom_name?, dose, usage_time[], usage_days[]}]
POST /api/parent/children/{id}/conditions    ← {condition_ids[]}
POST /api/parent/children/{id}/profile-photo ← multipart/form-data {photo}
GET  /api/parent/children/{id}/photo         ← signed URL (auth header gerekmez)
GET  /api/parent/children/{id}/stats
POST /api/parent/children/{id}/suggest-allergen    ← {name, description?}
POST /api/parent/children/{id}/suggest-condition   ← {name, description?}
POST /api/parent/children/{id}/suggest-medication  ← {name, dose?, usage_time[], usage_days[]}
```

### Aile
```
GET/POST/DELETE /api/parent/family/members          ← POST: {email}
GET/POST/PUT/DELETE /api/parent/family/emergency-contacts
```

### Okullar
```
GET  /api/parent/schools
GET  /api/parent/schools/{id}
POST /api/parent/schools/join                 ← {registration_code? | invite_token?}
GET  /api/parent/schools/{id}/feed            ← paginated sosyal feed
GET  /api/parent/feed/global                  ← global feed
POST /api/parent/schools/{school}/enroll-child ← çocuk okul kayıt talebi
```

### Etkinlik Sınıfları
```
GET    /api/parent/activity-classes                    ← enrolled_child_ids dahil
GET    /api/parent/activity-classes/{id}               ← teachers, materials dahil
GET    /api/parent/activity-classes/my-enrollments     ← tüm kayıtlar + invoice
POST   /api/parent/activity-classes/{id}/enroll        ← {child_id}
DELETE /api/parent/activity-classes/{id}/children/{child_id}/unenroll
GET    /api/parent/activity-classes/{id}/gallery       ← signed URL'ler
```

### Etkinlikler
```
GET    /api/parent/activities                 ← is_enrolled dahil
GET    /api/parent/activities/{id}            ← 403 DÖNDÜRMEZ (kayıtsız da temel bilgi görür)
POST   /api/parent/activities/{id}/enroll
DELETE /api/parent/activities/{id}/unenroll
GET    /api/parent/activities/{id}/gallery
```
- `show()`: `canSeeExtras = !is_enrollment_required || is_enrolled` → materials + gallery koşullu
- Galeri: `storage/app/private/activities/{id}/gallery/` — 2 saatlik signed URL

### Yemek Takvimi
```
GET /api/parent/meal-menus/children          ← çocuk listesi (school_name + class_name)
GET /api/parent/meal-menus?child_id=X&year=Y&month=M
```
Response: `[{ date, meals: [{ schedule_type, meal: { name, meal_type, ingredients[{ name, allergens[{ name, risk_level }] }] } }] }]`

### Faturalar
```
GET /api/parent/invoices              ← paginated, status/invoice_type filtre
GET /api/parent/invoices/stats        ← total, pending, paid, overdue sayıları
GET /api/parent/invoices/{id}         ← items, transactions, activity_class, child, refund linkleri
```
Sorgu: `user_id = auth` OR `payable_id IN (ailenin enrollmentId'leri)` → dual-strategy

### Öğretmen Profili & Blog (Veli)
```
GET    /api/parent/teachers/{id}            ← is_followed, blog_posts_count, followers_count
POST   /api/parent/teachers/{id}/follow
DELETE /api/parent/teachers/{id}/follow
GET    /api/parent/teachers/{id}/posts      ← paginated
GET    /api/parent/teacher-feed             ← takip edilen öğretmenlerin akışı
POST   /api/parent/teacher-blogs/{postId}/like
DELETE /api/parent/teacher-blogs/{postId}/like
GET    /api/parent/teacher-blogs/{postId}/comments
POST   /api/parent/teacher-blogs/{postId}/comments  ← {content, parent_comment_id?, quoted_content?}
DELETE /api/parent/teacher-blogs/comments/{id}
```

### Referans Verileri
```
GET /api/parent/allergens    ← global + tenant (status=approved)
GET /api/parent/conditions
GET /api/parent/medications
GET /api/parent/countries    ← auth gerekli
GET /api/parent/blood-types
```

### Öğretmen Auth (Public)
```
POST /api/teacher/auth/register    ← {name, surname, email, password, phone?, title?, specialization?, experience_years?}
POST /api/teacher/auth/login       ← {email, password} → {token, user}
POST /api/teacher/auth/forgot-password
POST /api/teacher/auth/reset-password
```

### Öğretmen (teacher_token gerekli)
```
GET  /api/teacher/auth/me
POST /api/teacher/auth/logout
GET  /api/teacher/classes               ← atandığı sınıflar
GET  /api/teacher/classes/{id}          ← sınıf detayı
GET  /api/teacher/classes/{id}/students ← alerjen/ilaç badge bilgisi
GET  /api/teacher/children/{id}         ← öğrenci detayı
GET  /api/teacher/children/{id}/health  ← read-only sağlık
GET  /api/teacher/children/{id}/pickup
GET  /api/teacher/children/{id}/medications/today
GET  /api/teacher/children/{id}/medications/logs
POST /api/teacher/medications/{childId}/mark-given
GET  /api/teacher/pickup/{childId}/authorized
POST /api/teacher/pickup/{childId}/record
POST /api/teacher/attendance
GET  /api/teacher/meal-menu             ← menü + alerjen uyarıları
GET  /api/teacher/memberships           ← aktif + bekleyen
GET  /api/teacher/memberships/invitations
POST /api/teacher/memberships/join      ← {invite_code}
PATCH /api/teacher/memberships/{id}/accept|reject
DELETE /api/teacher/memberships/{id}
GET/POST/PUT/DELETE /api/teacher/blogs
GET  /api/teacher/blogs/{id}/image      ← signed route
```

---

## 6. Kritik Tasarım Kararları

### Expo Router Stack Layout (KRİTİK)
Klasördeki her `.tsx` Expo Router'da ayrı tab olur. Alt ekranların tab olmasını önlemek için `_layout.tsx` + Stack:
```typescript
export default function XxxLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
```

### iOS Nested Modal Kısıtı
Modal içinde Modal açılamaz (iOS). Ülke/uyruk seçiciler gibi iç seçimler → **inline dropdown pattern** (position absolute, zIndex).

### Private Dosya + Signed URL (KRİTİK)
- `Storage::disk('private')` → **HATA** (Laravel 12 bu adda disk yok)
- `Storage::disk('local')` kullan — `HandlesMediaStorage` trait wrapper metotları kullan
- Tüm private serve rotaları `middleware: ['auth:sanctum', 'signed']` — ikisi birden zorunlu
- **UYARI**: `signed` ALONE artık kullanılmıyor — auth:sanctum olmadan 401 döner
- Signed URL backend'de `URL::signedRoute(routeName, params, now()->addMinutes(X))` ile üretilir (default: 5dk)

### Mobil Private Görsel — PrivateImage Bileşeni (KRİTİK)
- React Native `<Image>` Authorization header gönderemez → her zaman **başarısız olur**
- Tüm private API görsel URL'leri için `PrivateImage` bileşeni kullan:
  ```tsx
  import { PrivateImage } from '@/components/ui/PrivateImage';
  <PrivateImage uri={signedUrl} style={styles.photo} />
  ```
- `PrivateImage` → `expo-image` + `useAuth()` context → `Authorization: Bearer {token}` header otomatik
- `useAuth()` hem `token` (veli) hem `teacherToken` (öğretmen) döner — aktif olanı alır
- `Avatar` bileşeni zaten `PrivateImage` kullanıyor
- Etkilenen ekranlar: `children/[id]/index`, `feed/index`, `teachers/[id]/blog/[blogId]`, `pickup` (log fotoğrafı)
- Pickup log: `PickupLog.picked_by_photo_url` alanı artık signed URL döner (daha önce raw path dönerdi)

### Çocuk Profil Fotoğrafı
- `POST /api/parent/children/{id}/profile-photo` (auth:sanctum) — multipart/form-data
- `GET /api/parent/children/{id}/photo` — signed URL, auth header gerektirmez
- Fotoğraflar: `storage/app/private/children/photos/`

### FamilyProfile Erişimi
- `auth()->user()->familyProfile` **KULLANMA** co_parent için
- `$this->getFamilyProfile()` (BaseParentController) kullan

### Telefon Kodu Normalize
DB'de `+90` formatında. Kullanırken: `.replace(/^\+/, '')` → `90`

### Etkinlikler Ekranı (activities/index.tsx)
- 2 sekme: "Etkinlikler" | "Etkinlik Sınıfları" — `Animated.Value` tab indicator
- `ActivityCard`: HER ZAMAN tıklanabilir. `isLocked` sadece görsel (kilit ikonu). `canOpen` kaldırıldı.
- Lazy yükleme: Etkinlik Sınıfları sekmesi sadece tıklanınca fetch (`acFetched` flag)

### Etkinlik Detay (activities/event/[id].tsx)
- `show()` 403 DÖNDÜRMEZ — kayıtsız kullanıcı temel bilgileri görür
- `showGallery = !is_enrollment_required || is_enrolled` → materials + gallery koşullu
- `cancellation_allowed` + `cancellation_deadline` alanları kontrol edilmeli

### Faturalar Profil Entegrasyonu
- `profile.tsx`: `useFocusEffect` ile `/parent/invoices/stats` fetch → bekleyen fatura amber banner
- Fatura listesi: ActivityClassInvoice değil, canonical `invoices` tablosu (dual-strategy sorgu)

### Yemek Listesi (meal-menu/index.tsx)
- Tek çocuk: otomatik seçilir
- Birden fazla: ChildSelector dropdown (position absolute, zIndex:10)
- Accordion DayCard: `Animated.Value(0→1)` chevron + expand

### co_parent Yetkileri
- Aile verileri görebilir, çocuk ekle/düzenle
- Başka co_parent ekleyemez/çıkaramaz (yalnızca super_parent yapabilir)

### AppSetting
- `AppSetting` extends `Model` (BaseModel değil, tenant scope yok)
- `getByKey()` + `setByKey()` → `Cache::remember("app_setting_{key}", 3600)`

### iOS Geliştirme
- `app.json extra.apiUrl` varsayılanı Android emulator (`10.0.2.2:8000`)
- iOS simülatör: `localhost:8000`
- Fiziksel cihaz: bilgisayarın LAN IP'si

### Email Verification
- `MAIL_MAILER=log` geliştirmede → `storage/logs/laravel.log`'dan URL oku

---

## 7. Backend — Mobil İçin Özel Notlar

### Sağlık Verileri (Veli Tenant Scope)
Child health yüklenirken her zaman `withoutGlobalScope('tenant')` (parent tenant_id=NULL):
```php
$child->load([
    'allergens' => fn($q) => $q->withoutGlobalScope('tenant'),
    'medications' => fn($q) => $q->withoutGlobalScope('tenant'),
    'conditions' => fn($q) => $q->withoutGlobalScope('tenant'),
]);
```

### ParentChildResource::medications()
`BelongsToMany` yerine `DB::table('child_medications')` → custom ilaç desteği için.

### Sağlık Öneri Sistemi
- `suggest-*` endpoint'leri → `status=pending` + çocuğa hemen bağlanır
- Mobilde "Onay Bekleniyor" amber badge (`status === 'pending'` olanlar kaldırılamaz)

### Öğretmen Sınıf Erişim Kontrolü
```php
->whereHas('teachers', fn($q) => $q->where('teacher_profile_id', $profile->id))
```

### social_post_media + social_post_reactions
SoftDeletes aktif → `deleted_at` kolonu zorunlu (migration mevcut).

### Pickup Log Fotoğrafı
- `TeacherPickupController::recordPickup()` → `picked_by_photo_url` (signed URL) döner, artık raw path yok
- `TeacherPickupController::pickupLogs()` → `picked_by_photo_url` alanı signed URL (null ise null)
- Mobil `PickupLog` interface: `picked_by_photo_url: string | null` alanı mevcut
- Fotoğraf serve route: `GET /api/teacher/pickup-logs/{log}/photo` (`teacher.pickup.photo`) — `auth:sanctum + signed`

### HandlesMediaStorage Trait
Tüm backend private medya işlemleri `App\Traits\HandlesMediaStorage` üzerinden yapılır.
Etkilenen controller'lar: `ParentChildController`, `ParentAuthController`, `TeacherBlogController`,
`TeacherPickupController`, `TeacherProfileController`, `ActivityClassGalleryController`,
`ClassLogoController`, `MealPhotoController`, `SocialMediaController`.
