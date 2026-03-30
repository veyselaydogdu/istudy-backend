# 📱 iStudy — Veli Mobil Uygulaması (PROJECT_MEMORY_MOBILE)

> **Son Güncelleme:** 2026-04-30 (Kontenjan+adres: activities/index.tsx → Activity+ActivityClass tiplerine capacity/address eklendi, kart görünümüne yansıtıldı; activities/[id].tsx → ActivityClassDetail tipine address eklendi, detay sayfasında gösterildi)
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
│   │       ├── _layout.tsx          ← Bottom tab navigation (6 tab; invoices gizli)
│   │       ├── index.tsx            ← Ana akış (Global feed + okul feed)
│   │       ├── children/
│   │       │   ├── index.tsx        ← Çocuk listesi
│   │       │   ├── add.tsx          ← Çocuk ekle
│   │       │   └── [id]/
│   │       │       ├── index.tsx    ← Çocuk detay
│   │       │       ├── edit.tsx     ← Çocuk düzenle
│   │       │       └── health.tsx   ← Sağlık bilgileri (alerjen/hastalık/ilaç)
│   │       ├── schools/
│   │       │   ├── _layout.tsx      ← Stack navigator (index + [id] ayrı tab olmasın diye)
│   │       │   ├── index.tsx        ← Okullarım listesi
│   │       │   ├── join.tsx         ← Okula katıl (davet kodu)
│   │       │   └── [id]/
│   │       │       └── index.tsx    ← Okul detay + sosyal feed + "Etkinlik Sınıfları" quick link
│   │       ├── meal-menu/           ← YENİ — "Yemek Listesi" tab (restaurant ikonu)
│   │       │   ├── _layout.tsx      ← Stack navigator
│   │       │   └── index.tsx        ← Çocuk seçici + ay navigasyonu + accordion yemek takvimi
│   │       ├── activities/          ← YENİ — "Etkinlikler" tab (flame ikonu), 2 sekme içerir
│   │       │   ├── _layout.tsx      ← Stack navigator (index + [id])
│   │       │   ├── index.tsx        ← 2 sekme: "Etkinlikler" | "Etkinlik Sınıfları"
│   │       │   └── [id].tsx         ← Etkinlik sınıfı detay (activity-classes/[id].tsx kopyası)
│   │       ├── activity-classes/    ← KORUNDU ama Tab bar'da GİZLİ (href: null)
│   │       │   ├── _layout.tsx
│   │       │   ├── index.tsx
│   │       │   └── [id].tsx
│   │       ├── invoices/            ← Tab bar'da GİZLİ (href: null), Profil'den açılır
│   │       │   ├── _layout.tsx      ← Stack navigator (index + [id]) — KRİTİK
│   │       │   ├── index.tsx        ← Fatura listesi (stats kartları + modül badge + durum renkleri)
│   │       │   └── [id].tsx         ← Fatura detayı (kalemler + işlemler + iade linkleri)
│   │       ├── family/
│   │       │   ├── index.tsx        ← Aile üyeleri + ortak erişim yönetimi
│   │       │   └── emergency.tsx    ← Acil durum kişileri CRUD
│   │       └── profile.tsx          ← Kullanıcı profili + "Bilgilerim" bölümü (Çocuklarım + Okullarım) + "Faturalarım" navrow + bekleyen fatura uyarısı + çıkış
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
POST   /api/parent/children/{id}/allergens      ← {allergen_ids[], custom_name?}
POST   /api/parent/children/{id}/medications    ← [{medication_id?, custom_name?, dose, usage_time[], usage_days[]}]
POST   /api/parent/children/{id}/conditions     ← {condition_ids[]}
POST   /api/parent/children/{id}/profile-photo  ← multipart/form-data {photo: image} — auth:sanctum gerekli
GET    /api/parent/children/{id}/photo          ← imzalı URL ile erişim (auth header GEREKMİYOR — signed middleware)
GET    /api/parent/children/{id}/stats          ← çocuk istatistikleri (attendance, classes, school)
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

### Etkinlik Sınıfları
```
GET  /api/parent/activity-classes                             ← Liste (paginated, enrolled_child_ids dahil)
GET  /api/parent/activity-classes/{id}                        ← Detay (teachers, materials dahil)
GET  /api/parent/activity-classes/my-enrollments              ← Tüm kayıtlar (invoice dahil)
POST /api/parent/activity-classes/{id}/enroll                 ← Kayıt {child_id}
DELETE /api/parent/activity-classes/{id}/children/{child_id}/unenroll ← Kayıt iptal
GET  /api/parent/activity-classes/{id}/gallery                ← Galeri (signed URL'ler)
```

### Etkinlikler (YENİ — 2026-04-10, güncellendi 2026-04-11)
```
GET    /api/parent/activities                ← Liste (paginated, is_enrolled dahil)
GET    /api/parent/activities/{id}           ← Detay — her zaman temel bilgiler döner; materials+gallery yalnızca kayıtlıysa/gerek yoksa
POST   /api/parent/activities/{id}/enroll   ← Etkinliğe katıl (is_enrollment_required=true olan etkinlikler için)
DELETE /api/parent/activities/{id}/unenroll ← Etkinlikten ayrıl
GET    /api/parent/activities/{id}/gallery  ← Galeri (is_enrollment_required=true ise kayıt kontrolü)
```
- `ParentActivityController::index()` — `is_enrolled` bool her etkinliğe eklenir (`ActivityEnrollment` sorgusu)
- `ParentActivityController::show()` — **403 DÖNDÜRMEZ** — temel bilgiler hep döner; `canSeeExtras = !is_enrollment_required || is_enrolled` → materials + gallery yalnızca bu koşulda döner
- Response: `ActivityResource` + `gallery[]` (signed URL) + `materials[]` (string dizi)
- Galeri dosyaları: `storage/app/private/activities/{id}/gallery/` — 2 saatlik signed URL (`parent.activity-gallery.serve`)
- `activities.materials`: JSON dizi → `string[]` — tenant etkinlik oluştururken tek tek girilen materyal listesi

### Yemek Takvimi (YENİ — 2026-04-10)
```
GET /api/parent/meal-menus/children                           ← Ailenin okula kayıtlı çocukları + sınıf bilgisi
GET /api/parent/meal-menus?child_id=X&year=Y&month=M         ← Seçilen çocuğun sınıfına göre aylık yemek takvimi
```
- `ParentMealMenuController::children()` — seçici için çocuk listesi döner (school_name + class_name)
- `ParentMealMenuController::index()` — `class_id = çocuğun sınıfı OR class_id IS NULL` filtresi (sınıfa özel + okul geneli)
- Response: tarihe göre gruplu array `[{ date, meals: [{ id, schedule_type, meal: { name, meal_type, ingredients[{ name, allergens[{ name, risk_level }] }] } }] }]`

### Faturalar (2026-04-07)
```
GET /api/parent/invoices              ← Tüm faturalar (paginated, status/invoice_type filtre)
GET /api/parent/invoices/stats        ← İstatistik (total, pending, paid, overdue sayıları + bekleyen tutar)
GET /api/parent/invoices/{id}         ← Detay (items, transactions, activity_class, child, refund linkleri)
```

**Sorgu stratejisi (`ParentInvoiceController`):**
- Canonical `invoices` tablosu sorgulanır (ActivityClassInvoice değil)
- `user_id = auth()->id()` (veli kayıt yaptırdığında) **VEYA**
- `payable_type = ActivityClassEnrollment` + `payable_id IN (ailenin çocuklarının enrollment_id'leri)` (tenant kayıt yaptırdığında)
- → Tüm senaryolar kapsanır: hem veli hem tenant kayıt akışı
- `invoice.module` alanı ile her türlü fatura görünür: `activity_class`, `subscription`, `manual`, `event`

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

### Çocuk Profil Fotoğrafı (2026-03-16)
- Fotoğraflar `storage/app/private/children/photos/` klasöründe saklanır (`Storage::disk('local')`)
- **Laravel 12'de `local` disk = private**: root `storage_path('app/private')` — web'den doğrudan erişilemez
- `ParentChildResource::profile_photo` → `URL::signedRoute('parent.child.photo', ['child' => id], now()->addHours(1))` ile 1 saatlik imzalı URL döner
- Mobil: `<Image source={{ uri: child.profile_photo }}>` — standart URL, auth header gerekmez
- Her `fetchChild()` çağrısında yeni signed URL üretilir (token cache süresi önemli değil)
- Yükleme: `POST /api/parent/children/{id}/profile-photo` (auth:sanctum) — multipart/form-data
- Eski fotoğraf: yeni yüklemede `Storage::disk('local')->delete(oldPath)` ile silinir
- **DİKKAT:** `Storage::disk('private')` hata verir — Laravel 12 bu adda disk tanımlamaz; `local` kullan

### Tab Navigasyonu (2026-04-10 — güncel)
- **5 görünür tab**: Akış, **Yemek Listesi**, **Etkinlikler**, İstatistikler, Profil
- **Çocuklarım + Okullarım**: Tab'dan kaldırıldı → `profile.tsx`'e "Bilgilerim" bölümü olarak taşındı
- **Yemek Listesi** (`meal-menu/`): restaurant ikonu
- **Etkinlikler** (`activities/`): flame ikonu — 2 sekme içerir (Etkinlikler + Etkinlik Sınıfları)
- **Gizli screen'ler** (`href: null`): `children`, `schools`, `activity-classes`, `family`, `invoices`, `explore`
- Tab label stillemesi: `fontSize: 8, fontWeight: '600', flexWrap: 'wrap', textAlign: 'center'` — uzun label için
- Tab bar height: Android 72, iOS 96

### Expo Router — Stack Layout Zorunluluğu (KRİTİK)
Bir klasördeki her `.tsx` dosyası Expo Router'da ayrı tab olarak görünür. Alt ekranların (detail page gibi) ayrı tab olmasını önlemek için klasörde `_layout.tsx` ile Stack navigator tanımlanmalı:

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
```

Aynı pattern `schools/_layout.tsx`'te de uygulanmış. Yeni klasör eklendiğinde bu pattern takip edilmeli.

### Etkinlikler Ekranı (activities/index.tsx — 2026-04-10, güncellendi 2026-04-11)
- **2 sekme**: "Etkinlikler" (okul etkinlikleri) | "Etkinlik Sınıfları" (activity classes)
- Tab geçişi: `Animated.Value` ile kayar gösterge (`tabIndicator`, position absolute, bottom:0)
- **Etkinlikler sekmesi**: `ActivityCard` — okul adı, tarih aralığı, sınıflar, ücret badge; **HER ZAMAN tıklanabilir** → `/(app)/activities/event/{id}`
  - `is_enrollment_required=true` + `is_enrolled=false`: kilitli görsel (gri arka plan, kilit ikonu, "Detayları görmek için katılın" mesajı) — ama yine de tıklanabilir
  - `isLocked` değişkeni kullanılır (`canOpen` kaldırıldı — non-tappable bug'ı önlendi)
- **Etkinlik Sınıfları sekmesi**: `ActivityClassCard` — `router.push('/(app)/activities/${id}')` ile detaya gider
- **Lazy yükleme**: Etkinlikler ilk açılışta, Etkinlik Sınıfları sadece sekme tıklanınca fetch edilir (`acFetched` flag)
- **Sayfalama**: her iki sekme için ayrı pagination state (`actPage/actLastPage`, `acPage/acLastPage`)
- `(app)/activities/[id].tsx` → `activity-classes/[id].tsx`'in kopyası (aynı detay ekranı)

### Etkinlik Detay Ekranı (activities/event/[id].tsx — YENİ 2026-04-11)
- `load()`: `GET /parent/activities/{id}` → `is_enrolled`, `is_enrollment_required`, `gallery[]`, `materials[]`, `participants[]` alanları
- **Katıl/Ayrıl CTA**: yalnızca `is_enrollment_required=true` ise görünür; katılımcı sayısı (`enrollments_count`) da yalnızca kayıtlıysa görünür
- **Her zaman görünür**: ad, açıklama, okul, sınıflar, tarihler, fiyat, kayıt durumu badge, katıl butonu
- **Sadece kayıtlıya görünür** (`showGallery = !is_enrollment_required || is_enrolled`):
  - Materyaller listesi (`materials[]` — `checkmark-circle-outline` ikonlu liste)
  - Galeri grid (3 sütun, `TILE_SIZE = (SCREEN_W-32-12)/3`)
  - Katılımcılar listesi (`participants[]` — avatar + isim satırları)
- **Kilit notice**: `is_enrollment_required=true` + `is_enrolled=false` → "Materyaller Kilitli" notice
- **Lightbox modal** (`GalleryModal`): image → fullscreen, video/doc → `Linking.openURL`
- **Önemli**: Expo app'i reload etmek gerekir (Metro bundler `r` tuşu) — opcache değil JS bundle cache sorunu
- `cancellation_allowed` / `cancellation_deadline` alanları eklendi — "Etkinlikten Ayrıl" butonu yalnızca `cancellation_allowed=true` ise görünür; `cancellation_deadline` varsa altında son iptal tarihi notu gösterilir
- `start_time` / `end_time` `fmtDate(date, time)` helper ile birleştirilmiş olarak gösterilir
- Ücretli etkinliğe katılınca backend otomatik fatura oluşturur; iptal edilince iade/iptal faturası kesilir (mobil bu süreci yönetmez, backend halleder)

### Yemek Listesi Ekranı (meal-menu/index.tsx — 2026-04-10)
- **Tek çocuk**: otomatik seçilir, seçici gösterilmez
- **Birden fazla çocuk**: `ChildSelector` dropdown — açık/kapalı toggle, `position: absolute, zIndex: 10`
- **Ay navigasyonu**: `MonthNav` — sol/sağ ok, gelecek aya geçiş engellenir
- **Accordion**: `DayCard` — `Animated.Value(0→1)` ile chevron döner, gövde expand
  - Kapalı: tarih + gün kısaltması (örn. "ÇAR") + öğün sayısı
  - Açık: her öğün → yemek adı + besin öğeleri → alerjen chip'leri + risk badge (Düşük/Orta/Yüksek)
- `RiskBadge`: `low=#DCFCE7/#16A34A`, `medium=#FEF3C7/#D97706`, `high=#FEE2E2/#DC2626`
- Boş durumlar: okul kaydı yok / o ay menü yok / gün için menü girilmemiş

### Tab Navigasyonu (2026-03-16 — eski)
- **5 tab**: Anasayfa, Çocuklar, Okullar, İstatistikler, Profil
- **İstatistikler** sekmesi eklendi (`stats.tsx`) — çocuk seçici + devamsızlık kartları + okul/sınıf bilgisi
- **Aile** sekmesi kaldırıldı — Profil ekranına "Aile Yönetimi" butonu eklendi → `/(app)/family`
- `(app)/_layout.tsx`: `family` için `href: null` (gizli, doğrudan URL ile erişilebilir)

### Okul Detay Ekranı (2026-03-16)
- Çocuk o okula kayıtlıysa "Çocuğumu Bu Okula Ekle" butonu GÖSTERİLMEZ
- Kayıtlı çocuklar yeşil "Bu Okula Kayıtlı Çocuklar" bölümünde listelenir (tıklanabilir → child detay)
- `enrolledHere = allFamilyChildren.filter(c => c.school_id === schoolId)` mantığı

### Çocuk Detay Ekranı (2026-03-16)
- Kayıtlı okul varsa mavi "🏫 OkulAdı" badge gösterilir (tıklanabilir → okul detay)
- Avatar tıklanabilir → kamera/galeri seçim alert → `expo-image-picker` ile fotoğraf seçilir
- Fotoğraf yükleme spinner overlay (uploadingPhoto state)

### Acil Durum Kişileri (2026-03-16)
- Telefon: ülke kodu seçici + numara alanı (register.tsx ile aynı pattern) — inline dropdown, Modal içinde açılmaz
- Uyruk: opsiyonel ülke seçici (inline dropdown) — seçilirse TC Kimlik / Pasaport alanları görünür
- Kimlik/pasaport tamamen isteğe bağlı, her ikisi de boş geçilebilir
- `emergency_contacts` tablosu yeni kolonlar: `phone_country_code (varchar10)`, `nationality_country_id (FK countries)`, `passport_number (varchar50)`
- **React Native nested Modal kısıtı**: Modal içinde başka Modal açılmaz (iOS) → inline dropdown pattern zorunlu
- Max sayı: `app_settings` tablosundan `max_emergency_contacts` key'i (default 5)

---

## 7. Backend — Mobil İçin Oluşturulan Dosyalar

### Controllers (`app/Http/Controllers/Parents/`)
- `BaseParentController.php` ← **Tüm parent controller'ların atası**
  - `getFamilyProfile()`: owner_user_id → family_members (co_parent) sırasıyla arar
  - `findOwnedChild(int $childId)`: getFamilyProfile + family_profile_id kontrolü
- `ParentAuthController.php` — register/login/logout/me/forgotPassword/resetPassword/verifyEmail/resendVerification
- `ParentChildController.php` — CRUD + syncAllergens/syncMedications/syncConditions + suggestAllergen/suggestCondition/suggestMedication + `saveMedications()` private + `uploadProfilePhoto()` + `servePhoto()` + `stats()`
- `ParentFamilyController.php` — members/addMember/removeMember + emergency contacts CRUD
- `ParentSchoolController.php` — mySchools/schoolDetail/joinSchool/socialFeed/globalFeed
- `ParentReferenceController.php` — allergens/conditions/medications/countries/bloodTypes
- `ParentActivityClassController.php` — etkinlik listesi + kayıt (okul-specific + tenant-wide) + galeri
- `ParentInvoiceController.php` — **YENİ (2026-04-07)**: index/stats/show; canonical `invoices` tablosunu sorgular; dual-strategy (user_id + enrollment payable)

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
- `2026_03_16_115737_add_passport_and_nationality_to_emergency_contacts.php` — emergency_contacts.phone_country_code + passport_number + nationality_country_id ✅

---

## 8. Kritik Düzeltmeler (2026-04-11)

- **Etkinliğe katıl butonu görünmüyordu (chicken-and-egg bug)** — `ActivityCard` `canOpen = !is_enrollment_required || is_enrolled` koşulunu kullanıyordu → kayıtsız kullanıcı kartı tıklayamıyordu, dolayısıyla kayıt olamaıyordu. Backend `show()` da 403 dönüyordu. İki taraflı fix:
  1. Backend: `ParentActivityController::show()` 403 bloğu kaldırıldı → kayıtsız kullanıcı da etkinlik bilgilerini görebilir; galeri yalnızca `!is_enrollment_required || is_enrolled` koşuluyla eklenir.
  2. Mobil: `ActivityCard` her zaman tıklanabilir (`activeOpacity=0.75`, `onPress` her zaman route push eder). `canOpen` → `isLocked` olarak yeniden adlandırıldı (sadece görsel stil için kullanılır).

### Kritik Düzeltmeler (2026-04-07)

- **`schools/[id]/index.tsx` Ionicons import eksikti** — `import { Ionicons } from '@expo/vector-icons'` satırı yoktu. "Etkinlik Sınıfları" quick-link butonu `<Ionicons>` kullandığı için `Ionicons doesn't exist` crash'i veriyordu. Düzeltildi.
- **Fatura listesi boş görünüyordu** — İlk implementasyon `ActivityClassInvoice` tablosunu `family_profile_id` ile sorguluyordu. Tenant tarafından kayıt yapıldığında faturanın `user_id` veli değil tenant admin olduğundan bazı senaryolarda kayıplar oluşuyordu. **Canonical `invoices` tablosuna geçildi** + dual-strategy sorgu (`user_id = parent` OR `payable_id IN enrollmentIds`).
- **"Sadece etkinlik sınıfları faturaları" kısıtı kaldırıldı** — Artık `invoices.module` ne olursa olsun (activity_class, subscription, manual, event) tüm faturalar görünür. Profil ekranındaki açıklama "Tüm ödemeleriniz" olarak güncellendi.

### Faturalarım Ekranı Davranışları (2026-04-07)
- **`invoices/index.tsx`**: FlatList + stats row (bekleyen/gecikmiş/ödendi kartları). Her fatura: fatura no, modül badge (Etkinlik Sınıfı / Abonelik vb.), çocuk adı, tutar, durum badge. Overdue → kırmızı sol border + kırmızı tutar. Refund → mor sol border + eksi tutar.
- **`invoices/[id].tsx`**: Hero card (tutar + durum + modül). Fatura bilgileri (tarihler, çocuk). Kalemler tablosu. Ödeme işlemleri geçmişi (bank, kart, hata mesajı). İade/orijinal fatura çift-yönlü linkleme.
- **`profile.tsx`**: `useFocusEffect` ile her odaklanmada `/parent/invoices/stats` fetch eder. Bekleyen fatura varsa amber banner gösterir. "Faturalarım" nav row → `/(app)/invoices`. Bekleyen count badge (turuncu).

## 8. Kritik Düzeltmeler (2026-04-02)

- **Mobil activity-classes endpoint prefix eksikti** — Tüm çağrılar `/activity-classes` olarak yazılmıştı. Doğrusu `/parent/activity-classes`. Veli token'ıyla tenant endpoint'ine gidindiğinde `subscription.active` middleware yetki hatası veriyordu.
- **`paginatedResponse` plain Collection hatası** — `ParentActivityClassController::index()` `collect($result)` geçiyordu → `Collection::items does not exist`. Fix: `$data->getCollection()->map()` + `$data->setCollection($result)` + `$data->items()`.
- **Route cache 404** — Yeni route eklendikten sonra `php artisan route:clear` + container restart gerekiyordu.
- **Expo Router ayrı tab sorunu** — `activity-classes/[id].tsx` ayrı tab olarak görünüyordu. `activity-classes/_layout.tsx` Stack navigator eklenerek çözüldü (aynı `schools/_layout.tsx` pattern'i).
- **Tab label alt satıra geçmiyordu** — `fontSize: 8, flexWrap: 'wrap', textAlign: 'center'` + tab bar height 72/96 ile çözüldü.

### Etkinlik Sınıfları Ekranı Davranışları
- **index.tsx**: FlatList + paginate + RefreshControl. `enrolled_child_ids[]` ile hangi çocukların kayıtlı olduğu gösterilir (mavi "Kayıtlı" badge).
- **[id].tsx**: Paralel yükleme (detay + my-enrollments + children). Kayıt: çocuk seçimi → `POST .../enroll`. İptal: `DELETE .../children/{id}/unenroll`. Galeri lazy load (butona tıklanınca). Fotoğraflar full-screen Modal'da gösterilir.
- **Okul detay (schools/[id]/index.tsx)**: "Etkinlik Sınıfları" quick-access butonu eklendi → `/(app)/activity-classes`.

## 8. Kritik Düzeltmeler (2026-03-16)

- **Çocuk profil fotoğrafı private storage** — `Storage::disk('local')` (Laravel 12: local disk root = storage/app/private). Signed URL (`URL::signedRoute`, 1 saat) döner. Mobil `<Image>` header gerektirmez.
- **`Storage::disk('private')` HATA VERIR** — Laravel 12 default config'de `private` adında disk YOK, `local` kullan.
- **React Native nested Modal kısıtı** — iOS'ta açık Modal içinde yeni Modal açılamaz. emergency.tsx'teki ülke/uyruk seçicileri inline dropdown olarak yazıldı.
- **Tab navigasyonu yenilendi** — "Aile" sekmesi → Profil altına taşındı. "İstatistikler" sekmesi eklendi.
- **Okul ekranı `school_id` kontrolü** — `ParentChildResource` artık `school_id` + `school{id,name}` döndürür. Mobil bunula enrolled check yapar.
- **Tenant çocuk okuldan çıkar** — `PATCH /api/schools/{school_id}/children/{child}/unenroll` → `school_id=null, academic_year_id=null, status=inactive`

## Eski Kritik Düzeltmeler (2026-03-13)

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
