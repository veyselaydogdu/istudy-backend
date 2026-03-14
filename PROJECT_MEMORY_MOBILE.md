# 📱 iStudy — Veli Mobil Uygulaması (PROJECT_MEMORY_MOBILE)

> **Son Güncelleme:** 2026-03-13
> **Uygulama:** React Native (Expo ~55) — `istudy-backend/parent-mobile-app/`

---

## 1. Uygulama Kimliği

| Alan | Değer |
|------|-------|
| **Framework** | React Native 0.83.2 + Expo ~55 |
| **Routing** | Expo Router v3 (file-based) |
| **State** | React Context (AuthContext) |
| **HTTP Client** | Axios + AsyncStorage interceptor |
| **Token Key** | `parent_token` (AsyncStorage) |
| **API Base** | Android emulator: `http://10.0.2.2:8000/api` / iOS: `http://localhost:8000/api` |
| **Dil** | TypeScript, Türkçe UI metinleri |

---

## 2. Kurulu Paketler

```json
"dependencies": {
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

Kurulum: `cd parent-mobile-app && npm install`
Çalıştırma: `npx expo start`

---

## 3. Dizin Yapısı

> **Önemli**: Tüm kaynak dosyalar `src/` altındadır. `app.json` main alanı `expo-router/entry`'dir.

```
parent-mobile-app/
├── src/
│   ├── app/
│   │   ├── _layout.tsx              ← Root layout (AuthContext Provider + authEvent.register)
│   │   ├── index.tsx                ← Expo default (kullanılmıyor)
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   └── verify-email.tsx
│   │   └── (app)/
│   │       ├── _layout.tsx          ← Bottom tab navigation (5 tab)
│   │       ├── index.tsx            ← Ana akış (Global feed + okul feed)
│   │       ├── children/
│   │       │   ├── index.tsx        ← Çocuk listesi
│   │       │   ├── add.tsx          ← Çocuk ekle
│   │       │   └── [id]/
│   │       │       ├── index.tsx    ← Çocuk detay
│   │       │       ├── edit.tsx     ← Çocuk düzenle
│   │       │       └── health.tsx   ← Sağlık bilgileri (alerjen/hastalık/ilaç)
│   │       ├── schools/
│   │       │   ├── index.tsx        ← Okullarım listesi
│   │       │   ├── join.tsx         ← Okula katıl (davet kodu)
│   │       │   └── [id]/
│   │       │       └── index.tsx    ← Okul detay + sosyal feed
│   │       ├── family/
│   │       │   ├── index.tsx        ← Aile üyeleri + ortak erişim yönetimi
│   │       │   └── emergency.tsx    ← Acil durum kişileri CRUD
│   │       └── profile.tsx          ← Kullanıcı profili + çıkış
│   ├── lib/
│   │   ├── api.ts                   ← Axios instance (token interceptor + authEvent)
│   │   ├── auth.ts                  ← Auth helpers (loginRequest, registerRequest, TOKEN_KEY vb.)
│   │   └── authEvent.ts             ← 401 global callback pattern
│   ├── components/                  ← UI bileşenleri
│   ├── constants/
│   │   └── theme.ts                 ← Renk teması (Colors.ts değil, theme.ts)
│   └── hooks/                       ← Custom hooks
├── app.json                         ← extra.apiUrl: "http://10.0.2.2:8000/api"
└── package.json
```

---

## 4. Auth Flow

1. App başlar → `src/app/_layout.tsx` AsyncStorage'dan `parent_token` + `parent_user` okur
2. Token var → `(app)/` tab grubuna yönlendir
3. Token yok → `(auth)/login`'e yönlendir
4. Login başarılı → `saveAuth(token, user)` → token + user state güncellenir → `(app)/`'a yönlendir
5. 401 response → `api.ts` interceptor `AsyncStorage.multiRemove(['parent_token','parent_user'])` + `authEvent.trigger()` → `_layout.tsx`'teki `signOut` state'i sıfırlanır → `(auth)/login`'e yönlendir

**authEvent Paterni** (`src/lib/authEvent.ts`):
- `authEvent.register(callback)` → `_layout.tsx`'te `signOut` tetikler
- `authEvent.trigger()` → `api.ts` interceptor'ından çağrılır
- `authEvent.unregister()` → component unmount'ta temizlenir

---

## 5. API Endpoint Referansı (Mobil İçin)

### Auth (Public)
```
POST /api/parent/auth/register
POST /api/parent/auth/login
POST /api/parent/auth/forgot-password
POST /api/parent/auth/reset-password
GET  /api/parent/auth/verify-email/{id}/{hash}
```

### Auth (Token Gerekli)
```
POST /api/parent/auth/logout
GET  /api/parent/auth/me
POST /api/parent/auth/resend-verification
```

### Çocuklar
```
GET    /api/parent/children
POST   /api/parent/children
GET    /api/parent/children/{id}
PUT    /api/parent/children/{id}
DELETE /api/parent/children/{id}
POST   /api/parent/children/{id}/allergens    ← {allergen_ids[], custom_name?}
POST   /api/parent/children/{id}/medications  ← [{medication_id?, custom_name?, dose, usage_time[], usage_days[]}]
POST   /api/parent/children/{id}/conditions   ← {condition_ids[]}
```

### Aile
```
GET    /api/parent/family/members
POST   /api/parent/family/members             ← {email}
DELETE /api/parent/family/members/{userId}
GET    /api/parent/family/emergency-contacts
POST   /api/parent/family/emergency-contacts
PUT    /api/parent/family/emergency-contacts/{id}
DELETE /api/parent/family/emergency-contacts/{id}
```

### Okullar
```
GET  /api/parent/schools
GET  /api/parent/schools/{id}
POST /api/parent/schools/join                 ← {registration_code? | invite_token?}
GET  /api/parent/schools/{id}/feed            ← Okul sosyal feed (paginated)
GET  /api/parent/feed/global                  ← Global feed (paginated)
```

### Referans Verileri
```
GET /api/parent/allergens    ← Global + tenant alerjenler (status=approved)
GET /api/parent/conditions   ← Global + tenant hastalıklar (status=approved)
GET /api/parent/medications  ← Tüm ilaçlar (status=approved)
GET /api/parent/countries    ← Ülkeler (auth gerekli)
GET /api/parent/blood-types  ← Kan grupları (auth gerekli)
```

### Public Referans (Auth Gerekmez)
```
GET /api/parent/auth/countries    ← Register ekranında ülke kodu seçimi
GET /api/parent/auth/blood-types  ← Register/add-child ekranında kan grubu seçimi
```

### Veli Sağlık Önerileri (Özel Ekleme)
```
POST /api/parent/children/{id}/suggest-allergen   ← {name, description?}
POST /api/parent/children/{id}/suggest-condition  ← {name, description?}
POST /api/parent/children/{id}/suggest-medication ← {name, dose?, usage_time[], usage_days[]}
```
→ Öneriler `status=pending` olarak oluşur, çocuğa hemen bağlanır
→ Mobilde "Onay Bekleniyor" badgesi ile gösterilir

---

## 6. Kritik Tasarım Kararları

### Renk Teması
```js
primary: '#208AEF'
background: '#F5F8FF'
card: '#FFFFFF'
text: '#1A1A2E'
textSecondary: '#6B7280'
border: '#E5E7EB'
danger: '#EF4444'
success: '#10B981'
```

### Stil
- React Native `StyleSheet.create()` — Tailwind yok
- SafeAreaView her ekranda zorunlu
- KeyboardAvoidingView form ekranlarında

### Çocuk Sağlık Bilgileri
- Alerjenler: server'dan liste gelir (global + tenant, status=approved) + "Özel Ekle" → pending suggestion
- Hastalıklar: aynı pattern
- İlaçlar: "Listeden Ekle" (approved) + "Özel Ekle" → pending suggestion
- İlaç pivot alanları: `dose (string)`, `usage_time (JSON array)`, `usage_days (JSON array)`
- **Pending items**: `status === 'pending'` olanlar "Onay Bekleniyor" amber badge ile gösterilir, kaldırılamaz
- **Approved items**: chip grid'de seçilebilir + kaydet butonu

### Kan Grubu
- `children.blood_type` VARCHAR(255) — string olarak saklanır (değer BloodType.name'den gelir)
- Mobilde: `GET /api/parent/blood-types` ile seçenekler alınır, modal picker ile seçilir
- DB: `blood_types` tablosu — 8 standart kan grubu seed edildi (A+, A-, B+, B-, AB+, AB-, O+, O-)

### Doğum Tarihi
- Custom modal date picker (Yıl/Ay/Gün ScrollView) — `@react-native-community/datetimepicker` kurulu değil
- Backend'e `YYYY-MM-DD` string gönderilir, UI'da `DD.MM.YYYY` gösterilir

### TC Kimlik / Pasaport
- `children.identity_number` — TC Kimlik No (TR uyrukluysanız)
- `children.passport_number` — Pasaport No (yeni kolon, nullable)
- Uyruk TR seçilirse: TC Kimlik No alanı
- Uyruk başka ise: kullanıcı toggle ile TC Kimlik No VEYA Pasaport No seçer
- İkisi de isteğe bağlı

### Aile Üyesi Ekleme
- **Sadece `super_parent` yeni üye ekleyebilir** — co_parent ekleyemez
- E-posta ile eklenir; hedef kullanıcı sisteme kayıtlı olmalıdır
- Kullanıcı kayıtlıysa → direkt `co_parent` rolüyle FamilyMember oluşur, `accepted_at = now()`
- Kayıtlı değilse → 404 hatası (sisteme kayıt sonrası tekrar eklenmeli, otomatik bağlanma YOK)
- `super_parent` hiçbir co_parent tarafından kaldırılamaz
- co_parent yalnızca kendini kaldırabilir; super_parent herkesi kaldırabilir

### Acil Durum Kişileri
- Max sayı: `app_settings` tablosundan `max_emergency_contacts` key'i (default 5)
- Alanlar: ad, soyad, telefon, yakınlık derecesi, fotoğraf, kimlik no, sıra

---

## 7. Backend — Mobil İçin Oluşturulan Dosyalar

### Controllers (`app/Http/Controllers/Parents/`)
- `BaseParentController.php` ← **Tüm parent controller'ların atası**
  - `getFamilyProfile()`: owner_user_id → family_members (co_parent) sırasıyla arar
  - `findOwnedChild(int $childId)`: getFamilyProfile + family_profile_id kontrolü
- `ParentAuthController.php` — register/login/logout/me/forgotPassword/resetPassword/verifyEmail/resendVerification
- `ParentChildController.php` — CRUD + syncAllergens/syncMedications/syncConditions + suggestAllergen/suggestCondition/suggestMedication + `saveMedications()` private
- `ParentFamilyController.php` — members/addMember/removeMember + emergency contacts CRUD
- `ParentSchoolController.php` — mySchools/schoolDetail/joinSchool/socialFeed/globalFeed
- `ParentReferenceController.php` — allergens/conditions/medications/countries/bloodTypes

### Form Requests (`app/Http/Requests/Parent/`)
- `RegisterParentRequest.php`
- `StoreParentChildRequest.php`
- `UpdateParentChildRequest.php`
- `StoreEmergencyContactRequest.php`

### Resources (`app/Http/Resources/Parent/`)
- `ParentChildResource.php`
- `ParentSocialPostResource.php`

### Models (Güncellenmiş / Yeni)
- `Child.php` → `identity_number, nationality_country_id, languages (JSON), parent_notes` eklendi
- `FamilyMember.php` → `role (super_parent|co_parent), is_active, invited_by_user_id, accepted_at` eklendi
- `EmergencyContact.php` → YENİ — `app/Models/Child/`
- `FamilyProfile.php` → `emergencyContacts()` ilişkisi eklendi
- `AppSetting.php` → YENİ — `app/Models/Base/` (tenant scope YOK, plain Model)
- `SocialPost.php` → `is_global` fillable + `school_id/tenant_id` nullable

### Migrations (Çalıştırıldı ✅)
- `2026_03_11_100000_extend_parent_module_tables.php`
- `2026_03_11_100001_create_emergency_contacts_table.php`
- `2026_03_11_100002_create_app_settings_table.php`
- `2026_03_12_083758_make_family_profiles_tenant_id_nullable.php` — FamilyProfile.tenant_id nullable
- `2026_03_12_091002_create_password_reset_tokens_table.php` — Şifre sıfırlama tablosu
- `2026_03_12_092813_make_children_school_id_nullable.php` — children.school_id + academic_year_id nullable
- `2026_03_12_100334_add_soft_deletes_to_social_post_media_table.php` — deleted_at eklendi
- `2026_03_12_100911_add_soft_deletes_to_social_post_reactions_table.php` — deleted_at eklendi
- `2026_03_13_100000_create_blood_types_table.php` — blood_types tablosu + 8 standart kan grubu seed
- `2026_03_13_100001_add_suggestion_fields_to_health_tables.php` — allergens/medical_conditions/medications'a status + suggested_by_user_id
- `2026_03_13_100002_add_passport_number_to_children_table.php` — children.passport_number nullable

---

## 8. Kritik Düzeltmeler (2026-03-13)

- **`blood_types` tablosu eklendi** — Super admin CRUD (`/api/admin/blood-types`), mobil referans: `/api/parent/blood-types` + public `/api/parent/auth/blood-types`
- **Sağlık öneri sistemi** — allergens/conditions/medications tablolarına `status` + `suggested_by_user_id` eklendi. Pending öneriler çocuğa hemen bağlanır, "Onay Bekleniyor" badge ile gösterilir
- **Veli öneri onay — Super Admin**: `GET/POST /api/admin/health-suggestions` → global yapar (tenant_id=null)
- **Veli öneri onay — Tenant Admin**: `GET/POST /api/health-suggestions` → tenant-scoped yapar
- **`children.passport_number`** — nullable, tüm uyruklar için pasaport no alanı eklendi
- **`countries` endpoint opcache sorunu** — `docker compose restart app` gerekiyor, route 404 dönebiliyor
- **`phone_code` + prefix** — DB'de `+90` formatında, mobilde `+{phone_code}` yapılırken `++90` olmaması için `.replace(/^\+/, '')` ile normalize edilmeli

## Eski Kritik Düzeltmeler (2026-03-12)

- **`src/app/index.tsx` silindi** — Expo karşılama ekranını gösteriyordu, root routing bozuluyordu
- **`family_profiles.tenant_id` nullable** — Veli kaydında NULL geçilemiyordu (migration)
- **`password_reset_tokens` tablosu oluşturuldu** — Şifre sıfırlama çalışmıyordu
- **`User::sendPasswordResetNotification()` override** — Deep link: `parentmobileapp://reset-password?token=...&email=...`
- **`children.school_id` + `academic_year_id` nullable** — Veli çocuk eklerken okul/yıl zorunlu değil
- **`syncAllergens/syncConditions/syncMedications` validation** — `required` → `present` (boş dizi geçilebilir)
- **`ParentChildResource` medications** — BelongsToMany yerine `DB::table('child_medications')` ile direkt sorgu (custom ilaç desteği)
- **`countries` endpoint** — `name_tr` kolonu yok, `name` kullanıldı; `orderBy('name_tr')` → `orderBy('name')`
- **`social_post_media.deleted_at`** — BaseModel SoftDeletes kullanıyor ama kolon eksikti (migration)
- **`social_post_reactions.deleted_at`** — Aynı sorun (migration)
- **`Child::medications()` ilişkisi** — `withPivot(['custom_name','dose','usage_time','usage_days'])` eklendi

## 9. Önemli Davranış Notları

- **`withoutGlobalScope('tenant')` zorunlu**: Parent kullanıcıların `tenant_id = null` olduğu için BaseModel'deki tenant scope `if (auth()->user()->tenant_id)` koşulunda zaten atlanır. Yine de `withoutGlobalScope` yazmak güvenli ve okunabilir.
- **AppSetting modeli `BaseModel`'den değil `Model`'den türer**: Tenant scope uygulanmaz, doğru davranış. `getByKey()` + `setByKey()` → `Cache::remember("app_setting_{key}", 3600)` ile 1 saat cache.
- **SocialPost global**: `school_id` + `tenant_id` nullable yapıldı. Eski `SocialPostController::store()` kodu `school_id NOT NULL` varsayıyorsa güncellenmeli.
- **Email verification**: Laravel `MustVerifyEmail` + queue. Geliştirmede `MAIL_MAILER=log` — storage/logs/laravel.log'dan verification URL okunabilir.
- **Password reset**: `Password::sendResetLink()` + `Password::reset()` — Laravel default `passwords` tablosunu kullanır.
- **iOS geliştirme**: `app.json extra.apiUrl` varsayılanı Android emulator içindir (`10.0.2.2:8000`). iOS simülatörde `localhost:8000`, fiziksel cihazda bilgisayarın LAN IP'si kullanılmalı.
- **co_parent yetkileri**: Aile verilerini görebilir + çocuk ekleyip düzenleyebilir, ancak başka co_parent ekleyemez/çıkaramaz (yalnızca super_parent yapabilir).
