# iStudy — Veli Mobil Uygulaması UX/UI Workflow

> **Hedef Kitle:** Bu doküman, veli mobil uygulamasının tasarımını yapacak AI ajanlarına ve tasarımcılara kapsamlı bir referans sağlar.
> **Platform:** React Native 0.83.2 + Expo ~55 | Expo Router v3 | iOS & Android
> **Son Güncelleme:** 2026-04-20

---

## 1. ÜRÜN AMACI & KULLANICI PROFİLİ

### Kim Kullanıyor?
- **Birincil Kullanıcı:** Çocuğunu anaokuluna/kreşe gönderen veli (anne/baba)
- **İkincil Kullanıcı:** Co-parent (aile üyesi — eş, büyükanne vb.)
- **Yaş Aralığı:** 25–45
- **Dijital Yetkinlik:** Orta–yüksek (WhatsApp, Instagram kullanıcısı)
- **Kullanım Bağlamı:** Sabah rutini, iş arası anlık kontrol, akşam recap

### Temel Kullanıcı İhtiyaçları
1. "Çocuğum okula ulaştı mı?" → Takip & günlük rapor
2. "Bugün ne yiyecekler?" → Yemek menüsü
3. "Bu hafta ne var?" → Etkinlik takvimi
4. "Hesabım ne durumda?" → Fatura takibi
5. "Sağlık bilgilerini güncellemem lazım" → Çocuk profili
6. "Öğretmenin paylaşımını görmek istiyorum" → Sosyal feed

---

## 2. UYGULAMA MİMARİSİ ÖZET

### Navigasyon Yapısı

```
Root (_layout.tsx)
├── (auth)/                     ← Giriş yapmamış kullanıcı
│   ├── login.tsx               ← Ana giriş ekranı
│   ├── register.tsx            ← Kayıt
│   ├── forgot-password.tsx     ← Şifre sıfırlama isteği
│   ├── verify-email.tsx        ← Email doğrulama
│   └── (öğretmen girişi linki → teacher-login.tsx)
│
└── (app)/                      ← Giriş yapmış veli
    ├── TAB 1: index.tsx        ← Akış (Feed)
    ├── TAB 2: meal-menu/       ← Yemek Listesi
    ├── TAB 3: activities/      ← Etkinlikler
    ├── TAB 4: [stats ekranı]   ← İstatistikler
    ├── TAB 5: profile.tsx      ← Profil
    │
    └── GİZLİ EKRANLAR (Tab'da görünmez, stack olarak açılır)
        ├── children/           ← Çocuk yönetimi
        ├── schools/            ← Okul yönetimi
        ├── family/             ← Aile yönetimi
        ├── invoices/           ← Faturalar
        ├── teachers/           ← Öğretmen profilleri
        └── activity-classes/   ← Etkinlik sınıfları
```

### Tab Bar Spesifikasyonları
- **Tab sayısı:** 5 görünür
- **İkonlar:** Ana ikonlar (Akış=home, Yemek=restaurant/fork-knife, Etkinlikler=flame/calendar, İstatistikler=chart-bar, Profil=person)
- **Label font:** `fontSize: 8, fontWeight: '600', flexWrap: 'wrap', textAlign: 'center'`
- **Tab bar yüksekliği:** Android=72px, iOS=96px (safe area)
- **Aktif renk:** Tema primary rengi

---

## 3. AUTH AKIŞLARI

### 3.1 İlk Açılış Mantığı

```
Uygulama Başlar
     │
     ▼
AsyncStorage'dan parent_token oku
     │
     ├── TOKEN YOK ──────────────► (auth)/login
     │
     └── TOKEN VAR
              │
              ▼
         /parent/auth/me çağır
              │
              ├── 401 ──────────► Token sil ──► (auth)/login
              │
              └── 200 ──────────► (app)/ → index (Feed)
```

### 3.2 Kayıt Akışı

**Ekran:** `(auth)/register.tsx`

**Adımlar:**
1. Ad, Soyad, Email, Şifre, Şifre Tekrar
2. Telefon (opsiyonel) → Ülke kodu seçici (inline dropdown, iOS modal açılamaz kısıtı!)
3. Kayıt ol → `POST /api/parent/auth/register`
4. Başarı → "Email doğrulama linki gönderildi" ekranı
5. Email doğrulama → deep link → uygulama açılır → `(auth)/verify-email`

**Validasyon:**
- Şifre: min 8 karakter, 1 büyük harf, 1 rakam, 1 özel karakter
- Telefon girilirse ülke kodu zorunlu

**Referans API:**
```
POST /api/parent/auth/register
GET  /api/parent/auth/countries  (ülke kodu dropdown için, auth gerekmez)
```

### 3.3 Giriş Akışı

**Ekran:** `(auth)/login.tsx`

**Adımlar:**
1. Email + Şifre
2. "Giriş Yap" → `POST /api/parent/auth/login`
3. Başarı → token'ı AsyncStorage'a kaydet → (app)/

**Hata durumları:**
- Yanlış şifre → inline hata mesajı
- Email doğrulanmamış → "Email doğrulama linki gönder" seçeneği sun
- Hesap yok → Kayıt ekranına yönlendirme linki

**Alt bağlantılar:**
- "Şifremi Unuttum" → forgot-password
- "Öğretmen Girişi →" → teacher-login (ayrı akış)

### 3.4 Şifre Sıfırlama

```
forgot-password.tsx
     │ Email gir → POST /api/parent/auth/forgot-password
     │
     ▼
"Link gönderildi" bildirimi
     │
     ▼ (Email → deep link → parentmobileapp://reset-password?token=...&email=...)
     │
reset-password modal/ekranı
     │ Yeni şifre → POST /api/parent/auth/reset-password
     ▼
Başarı → login'e yönlendir
```

---

## 4. ANA EKRANLAR — DETAYLI AKIŞLAR

### 4.1 AKIŞ (Feed) — TAB 1

**Ekran:** `(app)/index.tsx`

**Konsept:** Tüm okulların ve takip edilen öğretmenlerin sosyal medya tarzı akışı

**Veri Kaynakları:**
```
GET /api/parent/feed/global          ← genel sosyal feed
GET /api/parent/schools/{id}/feed    ← okul bazlı feed (seçilen okul)
GET /api/parent/teacher-feed         ← takip edilen öğretmenlerin paylaşımları
```

**UX Tasarımı:**
```
┌─────────────────────────────────────┐
│  🏠 iStudy                    🔔    │  ← Header (bildirim ikonu)
├─────────────────────────────────────┤
│  [Tümü] [Okul Adı] [Öğretmenler]   │  ← Feed filtre sekmeleri
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ 📸 Okul Logosu              │    │  ← Post kartı
│  │ **Güneş Anaokulu**          │    │
│  │ 2 saat önce                 │    │
│  │                             │    │
│  │ [Fotoğraf/metin içerik]     │    │
│  │                             │    │
│  │ ❤️ 12  💬 3                 │    │
│  └─────────────────────────────┘    │
│                                     │
│  (devamı...)                        │
└─────────────────────────────────────┘
```

**Etkileşimler:**
- Like → `POST /api/parent/teacher-blogs/{postId}/like`
- Yorum yap → yorum modal/sayfası
- Öğretmen ismine tıkla → `teachers/{id}` sayfasına git
- Pull-to-refresh
- Infinite scroll (paginated)

---

### 4.2 YEMEK LİSTESİ — TAB 2

**Ekran:** `(app)/meal-menu/index.tsx`

**Konsept:** Aylık takvim görünümü, çocuk başına filtrelenebilir

**Veri Akışı:**
```
1. GET /api/parent/meal-menus/children  → çocuk listesi (okul + sınıf bilgisiyle)
2. Çocuk seç (tek çocuk → otomatik seçilir)
3. GET /api/parent/meal-menus?child_id=X&year=Y&month=M → günlük menü listesi
```

**Response Yapısı:**
```json
[{
  "date": "2026-04-15",
  "meals": [{
    "schedule_type": "breakfast|lunch|snack",
    "meal": {
      "name": "Makarna",
      "meal_type": "...",
      "ingredients": [{
        "name": "Domates",
        "allergens": [{ "name": "...", "risk_level": "low|medium|high" }]
      }]
    }
  }]
}]
```

**UX Tasarımı:**
```
┌─────────────────────────────────────┐
│  🍽️ Yemek Listesi                   │
├─────────────────────────────────────┤
│  Çocuk: [Ali ▾]          Nisan 2026 │  ← Çocuk seçici + ay navigasyonu
│          [Ayşe]                     │  ← Position absolute dropdown (iOS kısıtı!)
├─────────────────────────────────────┤
│  [◀ Mart]                [Mayıs ▶]  │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │ 📅 15 Nisan, Salı      [▼]  │   │  ← Accordion DayCard (kapalı)
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ 📅 14 Nisan, Pazartesi  [▲]  │   │  ← Accordion DayCard (açık)
│  │                              │   │
│  │  🌅 Kahvaltı                 │   │
│  │    Beyaz peynir, Domates...   │   │
│  │    ⚠️ Fıstık içerir          │   │  ← Alerjen uyarısı
│  │                              │   │
│  │  🍽️ Öğle Yemeği              │   │
│  │    Makarna, Ayran            │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Kritik UX:**
- Çocuğun alerjeni varsa → ilgili içeriklerde kırmızı/sarı uyarı banner
- Boş gün (tatil/hafta sonu) → "Menü yok" göster, boş bırakma
- Accordion animasyonu: `Animated.Value(0→1)` chevron + expand

---

### 4.3 ETKİNLİKLER — TAB 3

**Ekran:** `(app)/activities/index.tsx`

**Konsept:** 2 sekmeli yapı — Etkinlikler + Etkinlik Sınıfları

**UX Tasarımı:**
```
┌─────────────────────────────────────┐
│  🔥 Etkinlikler                     │
├─────────────────────────────────────┤
│  [  Etkinlikler  ] [Etkinlik Sınıfı]│  ← Tab indicator (Animated.Value)
│   ────────────                      │  ← Aktif tab altı çizgi
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │  ← EventCard
│  │ 🎨 Resim Atölyesi           │    │
│  │ 20 Nisan · Okul Bahçesi     │    │
│  │ 15/30 katılımcı             │    │
│  │                    [Katıl ▶]│    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │  ← Kilitli EventCard
│  │ 🔒 Yıl Sonu Gösterisi       │    │
│  │ Sadece kayıtlı veliler      │    │
│  │              [Kayıt Gerekli]│    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Veri:**
```
GET /api/parent/activities      ← is_enrolled dahil
GET /api/parent/activity-classes ← enrolled_child_ids dahil
```

**ActivityCard Kuralları:**
- Her kart HER ZAMAN tıklanabilir
- `is_enrollment_required && !is_enrolled` → kilit ikonu (görsel only, tıklama çalışır)
- Detay sayfasında 403 DÖNMEZ — kayıtsız kullanıcı temel bilgi görür
- Lazy loading: "Etkinlik Sınıfları" sekmesi sadece ilk tıklamada fetch edilir (`acFetched` flag)

**Etkinlik Detay (`activities/event/[id].tsx`):**
```
GET /api/parent/activities/{id}

Gösterilecekler (HERKESe):
  - Ad, tarih, saat, konum
  - Kapasite / mevcut yer
  - Açıklama
  - Kayıt butonu (kayıtsızsa)

Gösterilecekler (SADECE kayıtlıya):
  - Materyaller listesi
  - Galeri (signed URL'ler, 2 saatlik)
  - İptal butonu (cancellation_allowed + deadline kontrolü)
```

---

### 4.4 PROFİL — TAB 5

**Ekran:** `(app)/profile.tsx`

**Konsept:** Hesap merkezi + çocuklarım kısayolu + bekleyen fatura uyarısı

**UX Tasarımı:**
```
┌─────────────────────────────────────┐
│  👤 Profil                          │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │  [📷]  Ali Veysel           │    │  ← Profil fotoğrafı + isim
│  │        ali@email.com        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ⚠️ 2 bekleyen faturanız var        │  ← Amber banner (useFocusEffect ile fetch)
│     Görüntüle →                     │
│                                     │
│  ──────── Çocuklarım ────────────   │
│  [Ali (6 yaş)]  [Ayşe (4 yaş)]  +  │
│                                     │
│  ──────── Hesap ─────────────────   │
│  👨‍👩‍👧 Ailem                         │  → family/index
│  🏫 Okullarım                       │  → schools/index
│  📄 Faturalarım                     │  → invoices/index
│  🔔 Bildirimler                     │
│  ⚙️  Hesap Ayarları                  │
│                                     │
│  🚪 Çıkış Yap                       │
└─────────────────────────────────────┘
```

**Bekleyen Fatura Banner:**
- `useFocusEffect` ile her profil açıldığında çek
- `GET /api/parent/invoices/stats` → `pending > 0` → amber banner göster
- Tıklanınca → `invoices/index` sayfasına git

**Profil Fotoğrafı:**
- Upload: `POST /api/parent/profile/photo` (multipart/form-data)
- Görüntüle: `GET /api/parent/profile/photo/{user}` (signed URL)
- Fallback: İsmin baş harfleri

---

## 5. GİZLİ EKRANLAR — DETAYLI AKIŞLAR

### 5.1 ÇOCUK YÖNETİMİ

#### 5.1.1 Çocuk Listesi (`children/index.tsx`)

**Erişim:** Profil ekranından "Çocuklarım" bölümü veya derin link

```
GET /api/parent/children

┌─────────────────────────────────────┐
│  ← Çocuklarım                    + │  ← Yeni çocuk ekle
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ [📷] Ali Demir              │    │
│  │      6 yaş · Güneş Okulu   │    │
│  │      Sınıf: A Sınıfı       │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ [📷] Ayşe Demir             │    │
│  │      4 yaş · Henüz kayıtsız│    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### 5.1.2 Çocuk Ekle (`children/add.tsx`)

**Akış:**
```
Ad, Soyad
Doğum Tarihi (DatePicker)
Cinsiyet (Radio)
Kan Grubu (Dropdown ← GET /api/parent/blood-types)
Uyruk (Ülke seçici ← GET /api/parent/countries)
Pasaport No (opsiyonel)
Profil Fotoğrafı (opsiyonel)

POST /api/parent/children → Oluştur
→ Çocuk listesine dön
```

#### 5.1.3 Çocuk Detay (`children/[id]/index.tsx`)

```
┌─────────────────────────────────────┐
│  ← Ali Demir                   ✏️  │  ← Düzenle
├─────────────────────────────────────┤
│         [📷 Fotoğraf]               │
│         Ali Demir · 6 yaş           │
│         A+ · TC                     │
├─────────────────────────────────────┤
│  [Bilgiler] [Sağlık] [İstatistik]   │  ← Sekmeler
├─────────────────────────────────────┤
│                                     │
│  BİLGİLER SEKMESİ:                  │
│  🏫 Güneş Anaokulu - A Sınıfı      │
│  📅 Kayıt: 15 Eylül 2025           │
│  🎂 12 Mart 2020                    │
│                                     │
│  ──── Okul Kaydı ────               │
│  [Okula Kaydet] butonu              │  ← schools/join → enroll-child
│                                     │
└─────────────────────────────────────┘
```

#### 5.1.4 Çocuk Sağlık (`children/[id]/health.tsx`)

**Konsept:** Alerjen, ilaç, hastalık yönetimi

```
GET referans:
  /api/parent/allergens
  /api/parent/medications
  /api/parent/conditions

Çocuk verisi:
  GET /api/parent/children/{id}  (allergens/medications/conditions dahil)

┌─────────────────────────────────────┐
│  ← Ali'nin Sağlık Bilgileri         │
├─────────────────────────────────────┤
│  🌾 ALERJENLERİ                  +  │
│  ┌─────────────────────────────┐    │
│  │ Fıstık          [Onaylı ✓] │    │  ← Onaylanmış
│  │ Deniz Mahsulleri [Bekliyor ⏳]│   │  ← Pending (silinemez, sarı badge)
│  └─────────────────────────────┘    │
│                                     │
│  💊 İLAÇLARI                     +  │
│  ┌─────────────────────────────┐    │
│  │ Ventolin · 2x günlük       │    │
│  │ Sabah, Akşam                │    │
│  └─────────────────────────────┘    │
│                                     │
│  🏥 HASTALIK/DURUMLAR            +  │
│  ┌─────────────────────────────┐    │
│  │ Astım               [✓]    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Öneri Gönder] ←                   │  → suggest-allergen/condition/medication
└─────────────────────────────────────┘
```

**Kritik Kural — Pending Kayıtlar:**
- `status === 'pending'` → Amber badge "Onay Bekleniyor"
- Pending kayıtlar silinemez (backend reject eder)
- Öneri gönder → `POST /api/parent/children/{id}/suggest-allergen` vb.

**Senkronizasyon:**
```
POST /api/parent/children/{id}/allergens  → { allergen_ids: [1,2,3], custom_name?: "..." }
POST /api/parent/children/{id}/medications → [{medication_id?, custom_name?, dose, usage_time[], usage_days[]}]
POST /api/parent/children/{id}/conditions  → { condition_ids: [1,2] }
```

---

### 5.2 OKUL YÖNETİMİ

#### 5.2.1 Okul Listesi (`schools/index.tsx`)

```
GET /api/parent/schools

┌─────────────────────────────────────┐
│  ← Okullarım                        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ [Logo] Güneş Anaokulu       │    │
│  │        İstanbul, Kadıköy    │    │
│  │        2 çocuk kayıtlı      │    │
│  └─────────────────────────────┘    │
│                                     │
│  [+ Okula Katıl / Kayıt Ol]         │
└─────────────────────────────────────┘
```

#### 5.2.2 Okula Katıl (`schools/join.tsx`)

```
POST /api/parent/schools/join
Body: { registration_code? } veya { invite_token? }

┌─────────────────────────────────────┐
│  ← Okula Katıl                      │
├─────────────────────────────────────┤
│  Kayıt Kodu veya Davet Linki        │
│  [________________________]         │
│                                     │
│  [Okula Katıl]                      │
└─────────────────────────────────────┘
```

#### 5.2.3 Okul Detay (`schools/[id]/index.tsx`)

```
GET /api/parent/schools/{id}
GET /api/parent/schools/{id}/feed

┌─────────────────────────────────────┐
│  ← Güneş Anaokulu               ⋮  │
├─────────────────────────────────────┤
│  [Bilgi]  [Feed]  [Öğretmenler]    │
├─────────────────────────────────────┤
│                                     │
│  BİLGİ:                             │
│  📍 Kadıköy, İstanbul               │
│  📞 0216 xxx xx xx                  │
│  🎒 Ali → A Sınıfı                 │
│  🎒 Ayşe → B Sınıfı               │
│                                     │
│  [Çocuğu Kaydet] butonu             │
│    → Çocuk seçici modal             │
│    → POST /api/parent/schools/{school}/enroll-child  │
└─────────────────────────────────────┘
```

**Çocuk Kayıt Akışı:**
```
Okul Detay → [Çocuğu Kaydet]
  → Modal: Hangi çocuğu kayıt ettirmek istiyorsunuz?
    [Ali] [Ayşe]
  → Seç → POST /api/parent/schools/{school}/enroll-child
  → Başarı: "Kayıt talebiniz iletildi, okul onayını bekleyin"
```

---

### 5.3 AİLE YÖNETİMİ

#### 5.3.1 Aile Listesi (`family/index.tsx`)

```
GET /api/parent/families           ← velinin aileleri
GET /api/parent/family/invitations ← gelen davetler

┌─────────────────────────────────────┐
│  ← Ailem                            │
├─────────────────────────────────────┤
│  ┌─── DAVETLERİM ──────────────┐    │
│  │ ⚡ Ahmet Demir sizi         │    │  ← Bekleyen davet
│  │    "Demir Ailesi"ne davet etti│   │
│  │  [Kabul Et]  [Reddet]       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ──── AİLELERİM ──────────────────  │
│  ┌─────────────────────────────┐    │
│  │ 🏠 Demir Ailesi             │    │  → family/[ulid]
│  │    3 üye · Kurucu           │    │
│  └─────────────────────────────┘    │
│                                     │
│  [+ Yeni Aile Oluştur]              │
└─────────────────────────────────────┘
```

**Davet Akışları:**
```
Kabul: POST /api/parent/family/invitations/{id}/accept
Ret:   DELETE /api/parent/family/invitations/{id}/reject
```

#### 5.3.2 Aile Detay (`family/[ulid].tsx`)

```
GET /api/parent/families/{ulid}

┌─────────────────────────────────────┐
│  ← Demir Ailesi                 ⋮  │
├─────────────────────────────────────┤
│  [Üyeler]  [Acil Durum]            │
├─────────────────────────────────────┤
│                                     │
│  ÜYELER:                            │
│  👑 Ali Demir (Siz) · Kurucu       │  ← super_parent
│  👤 Fatma Demir · Co-parent        │
│     [İzinler: ...]                  │  ← super_parent → izin yönetimi
│                                     │
│  [+ Üye Ekle] (sadece super_parent) │
│    → Email gir → POST /api/parent/families/{ulid}/members
│    → Status: pending (Davet gönderildi)
└─────────────────────────────────────┘
```

#### 5.3.3 Acil Durum (`family/emergency.tsx`)

```
GET /api/parent/family/emergency-contacts?familyUlid=X
POST/PUT/DELETE /api/parent/family/emergency-contacts

┌─────────────────────────────────────┐
│  ← Acil Durum Kişileri          +  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ 👤 Mehmet Amca              │    │
│  │    +90 555 xxx xx xx        │    │
│  │    [Düzenle]  [Sil]         │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**İzin Kısıtlaması:**
- Co-parent acil durum kişisi **ekleyemez/düzenleyemez/silemez** (hard block)
- Yalnızca `super_parent` bu işlemleri yapabilir

---

### 5.4 FATURALAR

#### 5.4.1 Fatura Listesi (`invoices/index.tsx`)

```
GET /api/parent/invoices?status=pending&invoice_type=...
GET /api/parent/invoices/stats

┌─────────────────────────────────────┐
│  ← Faturalarım                      │
├─────────────────────────────────────┤
│  📊 Özet                            │
│  Toplam: ₺2.400  Bekleyen: ₺800    │
│  Ödenen: ₺1.600  Gecikmiş: ₺0      │
│                                     │
│  [Tümü] [Bekleyen] [Ödenen] [Gecikmiş]│
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ Etkinlik Sınıfı Faturası    │    │
│  │ Ali Demir · ₺400            │    │
│  │ Son Ödeme: 30 Nisan 2026    │    │
│  │ [BEKLEYEN]                  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### 5.4.2 Fatura Detay (`invoices/[id].tsx`)

```
GET /api/parent/invoices/{id}

Gösterilecekler:
  - Fatura kalemleri
  - İşlem geçmişi (transactions)
  - Bağlı etkinlik sınıfı / çocuk bilgisi
  - İade linki (varsa)
```

---

### 5.5 ÖĞRETMEN PROFİLİ

#### 5.5.1 Öğretmen Profil (`teachers/[id]/index.tsx`)

```
GET /api/parent/teachers/{id}  ← is_followed, blog_posts_count, followers_count

┌─────────────────────────────────────┐
│  ← Öğretmen Profili                 │
├─────────────────────────────────────┤
│  [📷]  Ayşe Öğretmen               │
│         Matematik · 8 yıl deneyim   │
│  📝 45 yazı  👥 128 takipçi         │
│                                     │
│  [Takip Et / Takibi Bırak]          │
├─────────────────────────────────────┤
│  [Blog Yazıları]                    │
│  ┌─────────────────────────────┐    │
│  │ "Matematik Öğrenmenin Sırrı"│    │  → teachers/[id]/blog/[blogId]
│  │ 3 gün önce · ❤️ 24  💬 7   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Takip/Bırak:**
```
POST   /api/parent/teachers/{id}/follow
DELETE /api/parent/teachers/{id}/follow
```

#### 5.5.2 Blog Detay (`teachers/[id]/blog/[blogId].tsx`)

```
GET /api/parent/teacher-blogs/{postId}/comments

┌─────────────────────────────────────┐
│  ← Blog Yazısı                      │
├─────────────────────────────────────┤
│  Başlık                             │
│  Ayşe Öğretmen · 3 gün önce        │
│                                     │
│  [İçerik...]                        │
│                                     │
│  ❤️ 24 beğeni    [Beğen]           │
│                                     │
│  ── Yorumlar ───                    │
│  Ali Veli: "Çok güzel yazı"         │
│  └ Ayşe Öğretmen: "Teşekkürler"    │  ← Reply
│                                     │
│  [Yorum yaz...]  [Gönder]           │
└─────────────────────────────────────┘
```

**Yorumlar:**
```
POST   /api/parent/teacher-blogs/{postId}/comments
Body:  { content, parent_comment_id?, quoted_content? }

DELETE /api/parent/teacher-blogs/comments/{id}
POST   /api/parent/teacher-blogs/{postId}/like
DELETE /api/parent/teacher-blogs/{postId}/like
```

---

## 6. TASARIM SİSTEMİ REHBERİ

### 6.1 Renk Paleti (theme.ts'den)

```
Primary:    #4A90E2  (Mavi — CTA butonlar)
Secondary:  #7B68EE  (Mor — vurgu)
Success:    #52C41A  (Yeşil — onaylı, başarı)
Warning:    #FAAD14  (Amber — bekleyen, uyarı)
Danger:     #FF4D4F  (Kırmızı — hata, sil)
Background: #F5F5F5  (Açık gri — ekran arka planı)
Card:       #FFFFFF  (Beyaz — kart arka planı)
Text:       #333333  (Koyu — ana metin)
TextLight:  #999999  (Açık gri — ikincil metin)
Border:     #E8E8E8  (Çok açık — ayırıcı)
```

### 6.2 Tipografi

```
Büyük Başlık:   24px Bold   (ekran başlıkları)
Başlık:         18px SemiBold (kart başlıkları)
Alt Başlık:     16px Medium
Body:           14px Regular
Caption:        12px Regular (tarih, etiket)
Tab Label:      8px SemiBold
```

### 6.3 Spacing & Borderlar

```
Ekran Padding:  16px
Kart Padding:   16px
Kart Margin:    12px (alt boşluk)
Border Radius:  12px (kartlar), 8px (butonlar), 24px (chip/badge)
Kart Shadow:    0 2px 8px rgba(0,0,0,0.08)
```

### 6.4 Ortak Komponent Listesi

| Komponent | Kullanım Yeri |
|-----------|---------------|
| `Card` | Tüm liste öğeleri |
| `Avatar` | Profil fotoğrafı + baş harf fallback |
| `Badge` | Durum gösterimi (Onaylı/Bekliyor/Reddedildi) |
| `Dropdown` | Çocuk seçici, ülke kodu (position: absolute, zIndex: 10) |
| `AccordionCard` | Yemek listesi günleri |
| `TabIndicator` | Etkinlikler sekmesi (Animated.Value) |
| `EmptyState` | Veri yok durumları (ikon + açıklama + CTA) |
| `LoadingSkeleton` | Veri yüklenirken skeleton |
| `PullRefresh` | Tüm listelerde |
| `InfiniteScroll` | Feed, fatura listesi, blog yorumları |
| `AmberBanner` | Bekleyen fatura, pending sağlık önerileri |

### 6.5 Form Elemanları

```
TextInput:
  - Floating label pattern
  - Error state: kırmızı border + hata mesajı altında
  - Prefix/Suffix: telefon ülke kodu
  
DatePicker:
  - Native picker (iOS: wheel, Android: dialog)
  
Selector (Dropdown):
  - iOS'ta inline position:absolute dropdown (Modal içinde Modal açılmaz!)
  - Arama destekli (ülke listesi gibi uzun listeler için)

ImagePicker:
  - "Galeriden Seç" + "Kamera" seçenekleri
  - Yükleme progress göstergesi
```

---

## 7. KRİTİK UX KURALLARI (Tasarımcılar İçin)

### 7.1 iOS Modal Kısıtı — EN ÖNEMLİ
> Modal içinde Modal AÇILAMAZ iOS'ta.

**Etkilenen Durumlar:**
- Ülke kodu seçici → inline dropdown (position: absolute, zIndex: 999)
- Çocuk seçici → inline dropdown (Modal yerine)
- Tarih seçici → inline picker

### 7.2 Tab Fetch Flag Kuralı
Gizli sekme verileri `data.length === 0` kontrolüyle değil, `fetched` flag ile yönetilir:
```
const [activityClassesFetched, setActivityClassesFetched] = useState(false)
// Sekme ilk kez tıklanınca: fetch et + flag'i true yap
// Sonraki tıklamalarda: sadece pull-to-refresh'te yeniden fetch
```

### 7.3 Fotoğraf Gösterimi (Signed URL)
`<Image>` komponenti auth header gönderemez. Profil ve çocuk fotoğrafları signed URL kullanır:
- URL süresi: 2 saat
- `useFocusEffect` ile yenile (sayfa her odaklandığında)
- Fallback: Yükleme hatası → baş harf avatar

### 7.4 Telefon Numarası Formatı
DB'de `+90` formatında saklanır. Gösterimde veya gönderimde:
- Prefix kaldır: `.replace(/^\+/, '')` → `90` → `"90" + "5xx"` şeklinde birleştir

### 7.5 Yetki Bazlı UI (Co-parent vs Super Parent)

| Özellik | Super Parent | Co-parent |
|---------|:---:|:---:|
| Çocuk profili düzenle | ✅ | Değişkene göre |
| Çocuk ekle | ✅ | İzin varsa |
| Acil durum kişisi ekle/sil | ✅ | ❌ (hard block) |
| Co-parent ekle/çıkar | ✅ | ❌ (hard block) |
| Co-parent izin yönetimi | ✅ | ❌ (hard block) |

---

## 8. KULLANICI YOLCULUKLARi (User Journeys)

### Journey 1: Yeni Veli Onboarding
```
İndir → Kayıt → Email Doğrula → Giriş Yap
  → Feed (boş) → "Okula Katıl" CTA (banner/ekran)
  → Kayıt kodu gir → Okula katıl
  → "Çocuğu Ekle" CTA
  → Çocuk bilgileri + sağlık bilgileri
  → Çocuğu okula kayıt ettir → Onay bekle
  → Onay geldi (bildirim) → Feed aktif
```

### Journey 2: Sabah Rutini
```
Açıl → Feed'e bak (dün geceden paylaşımlar var mı?)
  → Yemek listesi → "Bugün ne var?" → Kontrol
  → Profil → Bekleyen fatura var mı?
  → Kapat (2 dakika)
```

### Journey 3: Sağlık Güncelleme
```
Profil → Çocuğumu Seç → Sağlık
  → İlaç ekle → "Ventolinle benzeri"  
  → Listede yok → Öneri gönder → Pending badge
  → (Birkaç gün sonra) Onaylandı → Sarı badge kayboldu
```

### Journey 4: Etkinliğe Kayıt
```
Tab 3 (Etkinlikler) → "Resim Atölyesi" kartı
  → Detay sayfası → Tarih/saat/konum
  → [Kayıt Ol] → Hangi çocuk? Seç → Onayla
  → Başarı → Geri → Kart "Kayıtlısınız ✓"
```

### Journey 5: Aile Daveti Kabul
```
Bildirim: "Ahmet sizi ailesine davet etti"
  → Aile ekranına git → Davetler bölümü
  → Davet kartı → [Kabul Et]
  → Başarı → Yeni aile listede görünür
```

---

## 9. API & DURUM YÖNETİMİ

### 9.1 Global Auth State (AuthContext)
```typescript
interface AuthContextType {
  user: User | null;          // /parent/auth/me verisi
  token: string | null;       // parent_token
  isLoading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### 9.2 Axios Interceptor
```
Request → Bearer token ekle (parent_token)
Response 401 → AsyncStorage.multiRemove(['parent_token','parent_user'])
             → authEvent.trigger() → login ekranına
```

### 9.3 Sayfa Bazlı Veri Stratejisi

| Ekran | Strateji | Açıklama |
|-------|---------|----------|
| Feed | Infinite scroll + pull-to-refresh | Paginated |
| Yemek Listesi | Ay değişince fetch | Cache 15 dk |
| Etkinlikler | useFocusEffect + lazy tab | 2 tab ayrı fetch |
| Profil | useFocusEffect | Fatura badge için |
| Çocuk Sağlık | useFocusEffect | Fresh data |

---

## 10. HATA & EDGE CASE YÖNETİMİ

### 10.1 Ağ Hataları
```
Timeout/Network Error → Toast: "İnternet bağlantısını kontrol edin"
500 Server Error     → Toast: "Bir hata oluştu, tekrar deneyin"
401 Unauthorized     → Otomatik logout (interceptor)
422 Validation       → Form alanlarında inline hata
403 Forbidden        → "Bu işlem için yetkiniz yok" dialog
404 Not Found        → "Bulunamadı" ekranı
```

### 10.2 Boş Durumlar (Empty States)
Her boş liste için:
- İllüstrasyon (konuya uygun)
- Açıklama metni ("Henüz çocuk eklenmedi")
- CTA butonu ("Çocuk Ekle →")

### 10.3 Yükleme Durumları
- İlk yükleme → Skeleton UI (gerçek layout skeleton)
- Pull-to-refresh → Native RefreshControl
- Buton yükleme → Spinner içinde buton (disabled)
- Sayfa geçişi → Stack animasyonu (default)

---

## 11. BİLDİRİM SİSTEMİ

### Push Notification Senaryoları

| Tetikleyici | Bildirim Metni | Aksiyon |
|-------------|----------------|---------|
| Okul kayıt onayı | "Ali Güneş Anaokulu'na kaydedildi" | Okul detayına git |
| Bekleyen fatura | "₺400 tutarında fatura oluşturuldu" | Fatura detayına git |
| Aile daveti | "Ahmet Demir sizi ailesine davet etti" | Aile ekranına git |
| Sağlık önerisi onayı | "İlaç öneriniz onaylandı" | Çocuk sağlık ekranına |
| Öğretmen paylaşımı | "Ayşe Öğretmen yeni bir yazı paylaştı" | Blog yazısına git |
| Yeni okul gönderisi | "Güneş Okulu yeni bir şey paylaştı" | Feed'e git |

---

## 12. ÖĞRETMEN UYGULAMASI (Bağımsız Kısım)

> Bu kısım Veli uygulamasıyla aynı pakette ama tamamen bağımsız akış.

### 12.1 Tab Yapısı (teacher-app)
1. **Anasayfa** — sınıf özeti, bugünkü devamsızlık
2. **Sınıflarım** — atandığı sınıflar listesi
3. **Günlük** — günlük raporlar
4. **Yemek** — menü + alerjen uyarıları
5. **Profil** — hesap, kurumlar, blog yönetimi

### 12.2 Öğretmen-Özel Özellikler

**Devamsızlık Takibi:**
```
GET /api/teacher/classes/{id}/students
POST /api/teacher/attendance → { class_id, date, records: [{child_id, status}] }
```

**İlaç Yönetimi:**
```
GET  /api/teacher/children/{id}/medications/today
POST /api/teacher/medications/{childId}/mark-given
GET  /api/teacher/children/{id}/medications/logs
```

**Teslim Takibi:**
```
GET  /api/teacher/pickup/{childId}/authorized    ← yetkili teslim kişileri
POST /api/teacher/pickup/{childId}/record        ← teslim kaydı
```

**Blog Yönetimi:**
```
GET/POST/PUT/DELETE /api/teacher/blogs
GET /api/teacher/blogs/{id}/image  ← signed URL
```

**Kurum Davetleri:**
```
GET   /api/teacher/memberships/invitations
PATCH /api/teacher/memberships/{id}/accept
PATCH /api/teacher/memberships/{id}/reject
```

---

## 13. TASARIM ÇIKTISI REHBERİ

### AI Ajan için Tasarım Promptu Şablonu

Bir AI ajanı kullanarak tasarım yaptıracaksanız, şu bilgileri mutlaka sağlayın:

```
Platform: iOS ve Android (React Native)
Stil: Modern, sıcak, güven verici (anaokulu teması)
Renk: Mavi primary (#4A90E2), pastel vurgular
Tipografi: Yuvarlak köşeli, okunabilir
Kart Stili: Beyaz kart, hafif gölge, 12px radius

Ekran: [Ekran adı]
Amaç: [Kullanıcı ne yapmak istiyor?]
Veriler: [Gösterilecek veriler]
Aksiyonlar: [Butonlar, tıklamalar]
Edge Case: [Boş durum, hata durumu]
```

### Figma Ekran Organizasyonu Önerisi
```
📁 iStudy Veli App
  ├── 🎨 Design System (renkler, tipografi, komponentler)
  ├── 📱 Auth Flow (login, register, forgot)
  ├── 📱 Tab 1 — Feed
  ├── 📱 Tab 2 — Yemek Listesi
  ├── 📱 Tab 3 — Etkinlikler
  ├── 📱 Tab 5 — Profil
  ├── 📁 Çocuk Yönetimi
  ├── 📁 Okul Yönetimi
  ├── 📁 Aile Yönetimi
  ├── 📁 Faturalar
  └── 📁 Öğretmen Uygulaması
```

---

## ÖZET: Hangi Ekranı Hangi Ajanın Tasarlaması?

| Öncelik | Ekran Grubu | Karmaşıklık | Kritik Kural |
|---------|-------------|-------------|--------------|
| P0 | Auth (login, register) | Orta | iOS inline dropdown |
| P0 | Tab Bar + Ana Layout | Düşük | Yükseklik: Android=72, iOS=96 |
| P1 | Feed ekranı | Yüksek | Infinite scroll, like/yorum |
| P1 | Çocuk Ekle/Profil/Sağlık | Yüksek | Pending badge, signed URL foto |
| P1 | Yemek Listesi | Orta | Accordion, alerjen uyarısı |
| P2 | Etkinlikler (2 sekme) | Yüksek | Lazy load, kilit görsel |
| P2 | Profil + Fatura Banner | Orta | useFocusEffect |
| P2 | Okul Detay + Kayıt | Orta | Enrollment akışı |
| P3 | Aile Yönetimi | Yüksek | Yetki tablosu, davet akışı |
| P3 | Fatura Detay | Orta | Dual-strategy |
| P3 | Öğretmen Profil + Blog | Orta | Takip, yorum, like |
```

---

---

