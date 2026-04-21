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

# BÖLÜM 14 — ÇOCUKLARIM: TAM MEKANİZMA DOKÜMANI

> Kaynak dosyalar: `children/index.tsx`, `children/add.tsx`, `children/[id]/index.tsx`, `children/[id]/health.tsx`, `children/[id]/edit.tsx`

---

## 14.1 Çocuk Listesi (`children/index.tsx`)

### Veri & State

```typescript
interface Child {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;           // 'male' | 'female' | 'other' | null
  blood_type: string | null;       // 'A+' | 'B-' vb.
  profile_photo: string | null;    // signed URL
  status: string;                  // 'active' | 'inactive'
  family_profile_id: number | null;
  family_name: string | null;
}
```

**API:** `GET /api/parent/children`
**Fetch stratejisi:** `useFocusEffect` — her sayfa odaklandığında yenile (çocuk düzenleme/ekleme sonrası güncel liste)

### Gruplama Mantığı
Çocuklar `family_profile_id`'ye göre gruplandırılır:
```typescript
function groupByFamily(children: Child[]): FamilyGroup[] {
  // family_profile_id → FamilyGroup map
  // Aynı family_profile_id → aynı grupta
  // family_name yoksa → 'Ailem' fallback
}
```

### Ekran Yapısı

```
┌─────────────────────────────────────┐
│  Takip Et                           │
│  Çocuklarım                  [+ Ekle│
├─────────────────────────────────────┤
│                                     │
│  🏠 Demir Ailesi              [2]   │  ← Aile grup başlığı (primaryContainer arka plan)
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [İnisyal Avatar]  Ali Demir │    │  ← ChildCard
│  │                  6 yaş      │    │
│  │    ♂  [A+]                  │    │  ← Cinsiyet ikonu + Kan grubu sarı badge
│  │                           › │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [İnisyal Avatar]  Ayşe Demir│    │
│  │                  4 yaş  ♀   │    │
│  └─────────────────────────────┘    │
│                                     │
│  🏠 Yılmaz Ailesi             [1]   │  ← İkinci aile grubu
│  ┌─────────────────────────────┐    │
│  │ ...                         │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Avatar Renk Sistemi
İsmin baş harfine göre deterministik renk:
```typescript
const AVATAR_COLORS = [primary, '#8B5CF6', '#EC4899', warning, success, error]
avatarColor(name) = AVATAR_COLORS[name.charCodeAt(0) % 6]
```

### Boş Durum
İllüstrasyon (people-outline, 40px) + "Henüz çocuk eklenmedi" + "İlk Çocuğu Ekle" primary butonu

### Navigasyon
- Kart tıkla → `/(app)/children/${child.id}` (ChildDetail)
- "+ Ekle" butonu → `/(app)/children/add`

---

## 14.2 Çocuk Ekle (`children/add.tsx`)

### Ön Koşul: Aile Zorunluluğu
```
GET /api/parent/families → Aile listesi yükle

Aile yoksa → "Önce Aile Oluşturun" blocker ekranı göster
  [Aile Oluştur] → /(app)/family yönlendir

Aile varsa → Forma geç
```
**ÖNEMLİ:** Çocuk eklemek için en az 1 aile profili zorunlu. Yoksa form gösterilmez.

### Form Bölümleri

#### Bölüm 1: Aile Seçimi
```
GET /api/parent/families → families listesi

Tek aile varsa → otomatik seçilir
Birden fazla → inline dropdown seçici (position: relative, iOS safe)
  [Demir Ailesi ▼]
  └── Dropdown:
      [Demir Ailesi]   ← selected
      [Yılmaz Ailesi]
```

#### Bölüm 2: Temel Bilgiler
| Alan | Tip | Kural |
|------|-----|-------|
| Ad | TextInput | Zorunlu, autoCapitalize: words |
| Soyad | TextInput | Zorunlu, autoCapitalize: words |
| Doğum Tarihi | Custom Picker | Zorunlu — 3 sütunlu scroll picker (Yıl/Ay/Gün) |
| Cinsiyet | Radio Butonlar | Opsiyonel — [Erkek] [Kız] [Diğer], toggle seçim |
| Kan Grubu | Modal Picker | Opsiyonel — grid layout (A+, A-, B+...) |

**Doğum Tarihi Picker Detayı:**
```
Custom bottom sheet modal:
  [YIL]        [AY]        [GÜN]
  2024         Ocak        01
  2023 ←seçili Şubat ←seç 02 ←seç
  2022         Mart        03
  ...          ...         ...

ScrollView (height: 180) × 3 sütun
Seçili item: primaryContainer arka plan
Alt: "Seçilen: 15.03.2018" preview bar
Butonlar: [İptal] [Tamam]
```

**Kan Grubu Picker Detayı:**
```
Bottom sheet modal — Grid (2 sütun):
  [A+]  [A-]
  [B+]  [B-]
  [AB+] [AB-]
  [0+]  [0-]
Seçilince modal kapanır, seçim gösterilir
```

#### Bölüm 3: Uyruk & Diller
| Alan | Tip | Kural |
|------|-----|-------|
| Uyruk | Inline Dropdown | Opsiyonel — 250 ülke, arama destekli, bayrak emoji |
| TC Kimlik | TextInput | Uyruk seçilince gösterilir, max 11 rakam |
| Pasaport No | TextInput | Uyruk seçilince gösterilir, uppercase |
| Bildiği Diller | Chip Toggle | Opsiyonel — [Türkçe] [İngilizce] [Almanca] [Fransızca] [Arapça] |

**Kimlik Zorunluluk Kuralı:** Uyruk seçilmişse TC kimlik VEYA pasaport zorunlu (ikisinden biri).

**Ülke Dropdown:**
```
[🇹🇷 Türkiye ▼]  ← Tıklayınca aşağıda açılır (position: relative)
┌──────────────────────────────┐
│ [🔍 Ülke ara...]             │  ← Arama input (top)
│ Seçimi temizle               │  ← Varsa göster
│ 🇹🇷 Türkiye          ✓       │
│ 🇺🇸 United States            │
│ 🇩🇪 Almanya                  │
│ ...                          │
└──────────────────────────────┘  maxHeight: 220
```

#### Bölüm 4: Sağlık Bilgileri (İsteğe Bağlı)

*Paralel API fetch:*
```typescript
Promise.all([
  GET /api/parent/allergens,
  GET /api/parent/conditions,
  GET /api/parent/medications,
])
```

**Alerjen Seçimi:**
```
[🚨 Alerjenler]      [2 alerjen seçildi ▶]
  ↓ Tıklanınca MultiSelectPickerModal açılır

MultiSelectPickerModal:
  ┌────────────────────────────────────┐
  │  Alerjen Seç             [2 seçili]│
  │  [🔍 Ara...]                       │
  │  ☐ Fıstık                         │
  │  ☑ Deniz Mahsulleri               │ ← Seçili (kırmızı checkbox)
  │  ☑ Süt                            │
  │  ...                              │
  │  ──────────────────────────────── │
  │  🟡 Karides (onay bekleniyor) [✕] │ ← Custom (özel) eklenen
  │  [+ Listede yok, özel ekle]       │ ← Amber buton
  │  [İptal]        [Onayla (2)]      │
  └────────────────────────────────────┘

"Özel ekle" akışı:
  [Adı girin...] [Ekle] [✕] → onCustomAdd(name) → customAllergenNames array
  Custom öğeler: amber arka plan + "(onay bekleniyor)" etiket
  Silme: X butonu → onCustomRemove(idx)
```

**Tıbbi Durum Seçimi:** Alerjen ile aynı pattern, accent renk: #D97706 (orange)

**İlaç Ekleme:**
```
[💊 İlaçlar]                    [+ Ekle]
  ↓ "+ Ekle" tıklanınca İlaç Modal açılır

İlaç Ekleme Modal:
  ┌────────────────────────────────────┐
  │  İlaç Ekle                         │
  │                                    │
  │  Listeden Seç:                     │
  │  ┌────────────────────────────┐   │
  │  │ Ventolin         ←seçildi │   │  ScrollView, max 120px
  │  │ Augmentin                  │   │
  │  │ ...                        │   │
  │  └────────────────────────────┘   │
  │                                    │
  │  veya Özel İlaç Adı:               │
  │  [___________________________]     │  ← Seçim varsa temizlenir
  │                                    │
  │  Doz (örn: 5ml, 1 tablet):         │
  │  [5ml_____]                        │
  │                                    │
  │  Kullanım Günleri:                  │
  │  [Pzt] [Sal] [Çar] [Per] [Cum]    │  ← Toggle chips
  │  [Cmt] [Paz]                       │
  │                                    │
  │  [İptal]              [Ekle]       │
  └────────────────────────────────────┘

Eklenen ilaçlar → satır liste (ad + doz + [✕] sil)
```

#### Bölüm 5: Notlar
| Alan | Açıklama |
|------|----------|
| Veli Notu | Serbest metin, 3 satır textarea |
| Özel Notlar | Okul için özel notlar, 3 satır textarea |

### Kaydet Akışı
```
[Çocuğu Kaydet] tıkla
  ↓
Validasyon kontrolleri:
  - Aile seçili mi? → Alert
  - Ad/Soyad dolu mu? → Alert
  - Doğum tarihi var mı? → Alert
  - Uyruk seçildiyse kimlik/pasaport var mı? → Alert
  ↓
POST /api/parent/children {
  family_profile_ulid,
  first_name, last_name, birth_date,
  gender?, blood_type?,
  identity_number?, passport_number?,
  nationality_country_id?,
  languages?: string[],
  parent_notes?, special_notes?,
  allergen_ids?: number[],
  condition_ids?: number[],
  medications?: [{medication_id?, custom_name?, dose, usage_time[], usage_days[]}]
}
  ↓
Custom alerjenler için (Promise.allSettled):
  POST /api/parent/children/${childId}/suggest-allergen { name }
Custom tıbbi durumlar için:
  POST /api/parent/children/${childId}/suggest-condition { name }
  ↓
router.back() → Çocuk Listesi
```

---

## 14.3 Çocuk Detay (`children/[id]/index.tsx`)

### Veri & API
```typescript
GET /api/parent/children/${id}

Response içeren alanlar:
  id, first_name, last_name, full_name
  birth_date, gender, blood_type
  identity_number, parent_notes, special_notes
  languages: string[]
  profile_photo: string | null   // signed URL
  status: 'active' | 'inactive'
  school_id: number | null
  school: { id, name } | null
  nationality: { id, name, name_tr, flag_emoji } | null
  allergens: [{ id, name, status? }]
  conditions: [{ id, name, status? }]
  medications: [{ id, name, dose, usage_time[], usage_days[] }]
  class_info: ClassInfo | null
  pending_enrollment: PendingEnrollment | null
```

**Fetch:** `useFocusEffect` — edit ekranından döndüğünde otomatik yenile

### Ekran Layout

```
TopBar: [← Geri]  "Çocuk Detayı"  [Düzenle]

ScrollView:
  1. Profil Bölümü (merkezi)
  2. Bekleyen Kayıt Talebi Kartı (varsa)
  3. Sınıf Bilgisi Kartı (varsa)
  4. Kişisel Bilgiler Kartı
  5. Sağlık Bilgileri Kartı (en az 1 sağlık verisi varsa)
  6. Notlar Kartı (not varsa)
  7. Aksiyon Butonları
```

#### Profil Bölümü (Merkezi, Ortalanmış)
```
       [📷 80px Avatar]  ← Tıklanabilir, kamera badge alt-sağ
       Ali Demir
       [Aktif]          ← successContainer badge
       [🏫 Güneş Anaokulu]  ← tıklanabilir, okul detayına gider
```

**Profil Fotoğrafı Yükleme:**
```
Tıklayınca Alert:
  "Galeriden Seç" → ImagePicker.launchImageLibraryAsync
  "Kameradan Çek" → ImagePicker.launchCameraAsync
  "İptal"

Yükleme sırasında: spinner overlay (rgba(0,0,0,0.4))

Upload: POST /api/parent/children/${id}/profile-photo
  FormData: { photo: { uri, name, type } }
  Response: { data: { profile_photo: signedUrl } }
  → State güncellenir, re-render
```

#### Bekleyen Kayıt Kartı (amber/warning renk)
```
⏳ Kayıt Talebi Beklemede
   Güneş Anaokulu
   15.04.2026 tarihinde gönderildi
```
Gösterim: `child.pending_enrollment` dolu ise

#### Sınıf Bilgisi Kartı
```
● A Sınıfı  ← renk noktası + isim (class_info.color)

[Toplam: 18] [Erkek: 8] [Kız: 10] [Kapasite: 25]
  → Yatay istatistik satırı (surfaceContainerLow bg)

Yaş Aralığı: 3-5 yaş
Öğretmenler: [👩‍🏫 Ayşe Öğretmen] [👩‍🏫 Fatma Öğretmen]
  → chip listesi (primaryContainer bg, mavi metin)
```

#### Kişisel Bilgiler Kartı
```
InfoRow liste (label: sol, value: sağ, alt border):
  Doğum Tarihi  |  12.03.2020
  Cinsiyet      |  Erkek
  Kan Grubu     |  A+
  TC Kimlik No  |  1234567890x
  Uyruk         |  🇹🇷 Türkiye
  Bildiği Diller|  Türkçe, İngilizce
```
Değeri null olan satırlar gösterilmez.

#### Sağlık Bilgileri Kartı
```
ALERJENLER:
  [Fıstık] [Süt (onay bekleniyor)]
   kırmızı chip   italic amber text

TIBBİ DURUMLAR:
  [Astım] [Diyabet (onay bekleniyor)]
   orange chip

İLAÇLAR:
  Ventolin
  Doz: 2 puf
  Saatler: 08:00, 20:00
```
Pending badge formatı: `(onay bekleniyor)` — italic, #92400E renk

#### Aksiyon Butonları
```
[🏥 Sağlık Bilgilerini Düzenle]  ← primaryContainer buton → children/${id}/health
[Çocuğu Sil]                     ← error renk buton

Silme Mantığı:
  child.school_id DOLU → Silme talebi akışı:
    Alert: "Okul Kaydı Mevcut — Talep gönderilecektir"
    [Talep Gönder] → POST /api/parent/children/${id}/removal-request
    → "Talep Gönderildi" mesajı

  child.school_id BOŞ → Direkt silme:
    Alert: "Silmek istediğinize emin misiniz?"
    [Sil] → DELETE /api/parent/children/${id}
    → router.back()
```

---

## 14.4 Çocuk Sağlık (`children/[id]/health.tsx`)

### Veri Akışı
```typescript
// Paralel fetch:
Promise.all([
  GET /api/parent/allergens,      // Tüm sistem alerjenleri
  GET /api/parent/conditions,     // Tüm sistem tıbbi durumları
  GET /api/parent/medications,    // Tüm sistem ilaçları (listeden ekle için)
  GET /api/parent/children/${id}, // Çocuğun mevcut verileri
])

// Çocuk verilerinden ayır:
childAllergenIds = allergens.filter(status ≠ 'pending').map(id)
childPendingAllergens = allergens.filter(status === 'pending')
childConditionIds = conditions.filter(status ≠ 'pending').map(id)
childPendingConditions = conditions.filter(status === 'pending')
childMedications = medications (tümü)
approvedMedications = medications.filter(status ≠ 'pending')
pendingMedications = medications.filter(status === 'pending')
```

### Ekran Layout

```
TopBar: [← Geri]  "Sağlık Bilgileri"

ScrollView:
  [Alerjenler Kartı]
  [Tıbbi Durumlar Kartı]
  [İlaçlar Kartı]
```

#### Alerjenler Kartı

```
┌─────────────────────────────────────┐
│ Alerjenler          [+ Özel Ekle]   │  ← amber buton
│                                     │
│  Chip Grid (tıklanabilir toggle):   │
│  [Fıstık]  [Süt ✓] [Gluten]        │  ← seçili: kırmızı bg #FEE2E2
│  [Deniz Mahsulleri ✓]               │
│  [Yumurta]                          │
│                                     │
│  ── Onay Bekleyenler ────────────── │  ← amber section (varsa)
│  Karides            [Onay Bekleniyor│
│  Balık              [Onay Bekleniyor│
│                                     │
│           [Alerjenları Kaydet]      │  ← primary buton
└─────────────────────────────────────┘
```

**Kaydet:**
```typescript
POST /api/parent/children/${id}/allergens
Body: { allergen_ids: childAllergenIds }
// Sadece onaylı ID'ler gönderilir, pending dokunulmaz
```

**"+ Özel Ekle" → Öneri Modal:**
```
┌────────────────────────────────────┐
│  Özel Alerjen Ekle                 │
│  "Öneriniz onaylandıktan sonra...  │
│                                    │
│  Ad: [________________]            │
│                                    │
│  [İptal]            [Gönder]       │
└────────────────────────────────────┘

POST /api/parent/children/${id}/suggest-allergen { name }
→ Alert "Gönderildi, onay bekleniyor"
→ fetchData() (pending listede görünür)
```

#### Tıbbi Durumlar Kartı
Alerjenler ile birebir aynı pattern, accent renk: #D97706 (orange)

```
POST /api/parent/children/${id}/conditions
Body: { condition_ids: childConditionIds }

POST /api/parent/children/${id}/suggest-condition { name }
```

#### İlaçlar Kartı

```
┌─────────────────────────────────────┐
│ İlaçlar    [+ Özel Ekle] [+Listeden]│
│                                     │
│  Ventolin                       [✕] │  ← Onaylı ilaç + sil
│  Doz: 2 puf                         │
│  Saatler: 08:00, 20:00              │
│  Günler: Pzt, Sal, Çar             │
│                                     │
│  Augmentin                      [✕] │
│  ...                                │
│                                     │
│  ── Onay Bekleyenler ────────────── │
│  Özel İlaç Adı   [Onay Bekleniyor]  │  ← Silinemiyor
└─────────────────────────────────────┘
```

**"+ Listeden Ekle" Modal:**
```
┌────────────────────────────────────┐
│  Listeden İlaç Ekle                │
│                                    │
│  İlaç Seç:                         │
│  ┌──────────────────────────────┐  │
│  │ Ventolin   ← seçili          │  │  ScrollView max 130px
│  │ Augmentin                    │  │
│  │ ...                          │  │
│  └──────────────────────────────┘  │
│                                    │
│  Doz (5ml, 1 tablet):              │
│  [_______________]                 │
│                                    │
│  Kullanım Saatleri (virgülle):     │
│  [08:00, 20:00]                    │
│                                    │
│  Kullanım Günleri:                 │
│  [Pzt][Sal][Çar][Per][Cum][Cmt][Paz│  ← Toggle chips
│                                    │
│  [İptal]              [Ekle]       │
└────────────────────────────────────┘

Ekle → POST /api/parent/children/${id}/medications {
  medications: [
    ...mevcut onaylı ilaçlar,
    { medication_id, dose, usage_time[], usage_days[] }
  ]
}
→ fetchData()
```

**İlaç Silme:**
```typescript
// Kaldırılmak istenen ID'yi çıkar, kalanları gönder:
const remaining = approvedMedications
  .filter(m => m.id !== removingId)
  .map(m => ({ medication_id: m.id, dose, usage_time, usage_days }))

POST /api/parent/children/${id}/medications { medications: remaining }
```

**"+ Özel Ekle" (ilaç öneri) Modal:**
```
Özel İlaç Ekle → POST /api/parent/children/${id}/suggest-medication {
  name, dose?, usage_time[], usage_days[]
}
→ fetchData() (pending listede görünür)
```

### Kritik Pending Kuralı
- `status === 'pending'` → amber section (sarı arka plan)
- **Silinemiyor** → X butonu yok
- **Kaydet butonuyla gönderilemiyor** → listeden çıkarılmıyor
- Okul yönetici onaylayana kadar görünür kalır

---

# BÖLÜM 15 — AİLE YÖNETİMİ: TAM MEKANİZMA DOKÜMANI

> Kaynak dosyalar: `family/index.tsx`, `family/[ulid].tsx`, `family/emergency.tsx`

---

## 15.1 Aile Listesi (`family/index.tsx`)

### Veri & State
```typescript
interface Family {
  id: string;              // ULID
  family_name: string;
  my_role: 'super_parent' | 'co_parent';
  member_count: number;
  pending_invitations_count: number;
}

interface Invitation {
  id: number;
  family: { id: string; family_name: string } | null;
  invited_by: { name: string; surname: string; email: string } | null;
  relation_type: string | null;
  children: InvitationChild[];   // masked_name + birth_year
  created_at: string;
}
```

**API — Paralel fetch:**
```typescript
Promise.all([
  GET /api/parent/families,           // Aileler
  GET /api/parent/family/invitations, // Bekleyen davetler
])
```

### Ekran Yapısı

```
Header: "Yönet / Ailem"    [Aile Oluştur buton]

FlatList:
  ┌── ListHeaderComponent ──────────────────┐
  │  (Davet varsa)                          │
  │  Bekleyen Davetler                      │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │ ✉️  Demir Ailesi                │    │  ← InvitationCard
  │  │     Ahmet Demir davet etti      │    │  Sol kenar: 4px amber
  │  │     ahmet@mail.com              │    │
  │  │                     [✓]  [✗]   │    │  ← Kabul/Ret butonları
  │  │ ┌─────────────────────────────┐ │    │
  │  │ │ Atanmış çocuklar:           │ │    │
  │  │ │ [👤 A** D**  · 2019]       │ │    │  ← Masked çocuk ismi
  │  │ └─────────────────────────────┘ │    │
  │  └─────────────────────────────────┘    │
  └─────────────────────────────────────────┘

  FamilyCard (her aile):
  ┌─────────────────────────────────────┐
  │ [🏠]  Demir Ailesi                  │  → family/[ulid]
  │        3 üye  [2 bekliyor]          │  ← amber pending badge
  │                   [Ana Veli]        │  ← rol badge (sağda)
  │                             [›]    │
  └─────────────────────────────────────┘

  (Aile yoksa boş durum):
  🏠 "Henüz aile profili yok"
  "Aile oluşturarak çocuklarınızı yönetin"
  [İlk Ailemi Oluştur]
```

### Davet Kabul Akışı (Güvenlik Kodu Zorunlu)
```
[✓] Tıkla
  ↓
Güvenlik Kodu Modal açılır:
  ┌────────────────────────────────────┐
  │  🛡️ (60px mavi ikon)              │
  │  Güvenlik Doğrulaması              │
  │  "Demir Ailesi ailesine katılmak   │
  │   için 6 haneli kodu girin"        │
  │                                    │
  │  Güvenlik Kodu                     │
  │  🔑 [  0  0  0  0  0  0  ]        │  ← number-pad, letter-spacing: 6
  │                                    │
  │  [İptal]         [Katıl]           │
  └────────────────────────────────────┘

POST /api/parent/family/invitations/${id}/accept { security_code }
Başarı → fetchData() + Alert "Aileye dahil oldunuz"
```

**Güvenlik Kodu:** Davet gönderen super_parent'ın sahip olduğu 6 haneli kod — aile detay ekranında gösterilir.

### Davet Reddetme
```
[✗] Tıkla → Alert "Daveti reddetmek istediğinize emin misiniz?"
[Reddet] → DELETE /api/parent/family/invitations/${id}/reject
→ fetchData()
```

### Aile Oluşturma Modal
```
[Aile Oluştur] buton → Bottom sheet modal:

┌────────────────────────────────────┐
│  Yeni Aile Oluştur                 │
│  "Oluşturduktan sonra davet        │
│   edebilirsiniz"                   │
│                                    │
│  Aile Adı                          │
│  🏠 [Örn: Aydoğdu Ailesi]          │
│                                    │
│  [İptal]           [Oluştur]       │
└────────────────────────────────────┘

POST /api/parent/families { family_name }
Başarı → modal kapanır, fetchData()
```

---

## 15.2 Aile Detayı (`family/[ulid].tsx`)

### Veri & State
```typescript
// Paralel fetch:
GET /api/parent/families/${ulid}       → family { id, family_name }
GET /api/parent/families/${ulid}/members → members[]

// Rol belirleme:
GET /api/parent/families → my_role (bu aile için)
```

**Member Interface:**
```typescript
interface Member {
  id: number;
  user_id: number;
  user: { id, name, surname, email, phone } | null;
  relation_type: string | null;
  role: 'super_parent' | 'co_parent';
  is_active: boolean;
  invitation_status: 'pending' | 'accepted';
  invitation_security_code: string | null;  // Sadece super_parent görebilir
}
```

### Ekran Layout

```
Header: [← Geri]  "Aile / Demir Ailesi"  [Üye Ekle - sadece super_parent]

─── Aile Adı Kartı ──────────────────────────────
  [🏠]  Aile Adı
        Demir Ailesi                    [✏️]
        ↑ super_parent ise düzenlenebilir

─── Acil Durum Kişileri ─────────────────────────
  [🚨]  Acil Durum Kişileri
        Acil iletişim listesini yönetin        [›]
        → family/emergency?familyUlid=X

─── Aile Üyeleri ────────────────────────────────
  [Avatar]  Ahmet Demir         [Ana Veli]
            ahmet@mail.com
            
  [Avatar]  Fatma Demir         [Eş Veli]   [✕]  ← super_parent ise sil ikonu
            fatma@mail.com
            Anne

  [Avatar]  Mehmet Veli         [Beklemede]  [✕]  ← Pending üye
            mehmet@mail.com
            🔑 Güvenlik Kodu: 483920     ← sadece super_parent görür, infoContainer
```

**Üye Kartı Stilleri:**
- Normal: Standart card
- Pending: Sol kenar 3px amber border

### Aile Adı Düzenleme (Super Parent)
```
Aile adı kartına tıkla (super_parent) → Bottom sheet modal:
  "Aile Adını Düzenle"
  🏠 [Demir Ailesi]   ← mevcut isim pre-fill
  [İptal]  [Kaydet]

PUT /api/parent/families/${ulid} { family_name }
→ Başarı: state güncelle, modal kapat
```

### Üye Ekleme Modal (Super Parent)

```
[Üye Ekle] → Bottom sheet modal (ScrollView içinde):

┌────────────────────────────────────────┐
│  Aile Üyesi Davet Et                   │
│  "Kabul ettiğinde aileye dahil olur.   │
│   İStudy hesabı olmalıdır."            │
│                                        │
│  E-posta Adresi                        │
│  ✉️ [ornek@mail.com]                   │
│                                        │
│  İlişki Türü (İsteğe bağlı)           │
│  👥 [Anne, Baba, Vasi...]              │
│                                        │
│  ─── Yetkiler ─────────────────────── │
│  🛡️ Yetkiler                           │
│  "Seçilmeyenlerde 'yetkiniz yok' uyarı│
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [✏️] Çocuk profili düzenleyebilir│  │  ← aktif: primaryContainer
│  │ [👤] Çocuk ekleyebilir           │  │
│  │ [🏫] Okula kayıt yapabilir       │  │
│  │ [👁] Tüm detayları görüntüleyebilir│ │
│  └──────────────────────────────────┘  │
│                                        │
│  ─── Çocuk Erişimi ─────────────────  │
│  👥 Çocuk Erişimi (İsteğe bağlı)      │
│  "Seçilmezse tüm çocuklara erişebilir" │
│                                        │
│  [☑ Ali Demir] [☐ Ayşe Demir]        │  ← chip toggle
│                                        │
│  [İptal]       [Davet Gönder]         │
└────────────────────────────────────────┘
```

**Yetki Satırı Tasarımı:**
```
┌─────────────────────────────────────────┐
│ [İkon kutu]  Yetki adı           [✓ □] │  ← checkbox sağda
│              (Aktif: primaryContainer)  │
└─────────────────────────────────────────┘
```

**API:**
```typescript
POST /api/parent/families/${ulid}/members {
  email: string,
  relation_type?: string,
  child_ids?: number[],
  permissions?: string[]  // ['can_view_child_details', 'can_edit_child_profile', ...]
}
→ Alert "Davet gönderildi, kabul ettiğinde dahil olacak"
→ fetchData()
```

**İzin Sistemi:**
| Yetki Anahtarı | TR Label |
|----------------|----------|
| `can_edit_child_profile` | Çocuk profili düzenleyebilir |
| `can_add_child` | Çocuk ekleyebilir |
| `can_enroll_child` | Okula kayıt yapabilir |
| `can_view_child_details` | Tüm detayları görüntüleyebilir |

**Varsayılan Seçili:** `can_view_child_details`

### Üye Silme (Super Parent)
```
Co-parent üye satırındaki [✕] tıkla:
  Alert "X kişiyi kaldırmak istediğinize emin misiniz?"
  [Kaldır] → DELETE /api/parent/families/${ulid}/members/${user_id}
  → fetchData()

Super_parent'ı kaldırma denemesi → Alert "Ana veli aileden kaldırılamaz"
```

---

## 15.3 Acil Durum Kişileri (`family/emergency.tsx`)

**Erişim:** `family/[ulid].tsx` "Acil Durum Kişileri" satırından, `familyUlid` param ile

### Veri & State
```typescript
GET /api/parent/families/${familyUlid}/emergency-contacts

interface EmergencyContact {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;               // '+90...' formatında
  phone_country_code: string | null;
  relationship: string;
  identity_number: string | null;
  passport_number: string | null;
  nationality_country_id: number | null;
  nationality?: Country | null;
  sort_order: number;
}
```

**Ülkeler:**
```typescript
GET /api/parent/countries → ülke listesi
// phone_code: "+90" formatında → normalize: .replace(/^\+/, '') → "90"
// Varsayılan: TR 🇹🇷 +90
```

### Ekran Layout

```
TopBar: [← Geri]  "Acil Kişiler"  [+ Ekle buton]

FlatList (her kişi):
  ┌─────────────────────────────────────┐
  │ [🚨]  Mehmet Amca                   │
  │        Amca                         │  ← relationship
  │        📞 +90 555 xxx xx xx         │
  │        🇹🇷 Türkiye                  │  ← varsa
  │                        [✏️]  [🗑️]  │  ← düzenle + sil
  └─────────────────────────────────────┘

Boş durum:
  🚨 (52px emoji)
  "Acil kişi eklenmedi"
  "Olası acil durumlarda ulaşılacak kişileri ekleyin"
  [İlk Kişiyi Ekle]
```

### Ekle/Düzenle Modal (Bottom Sheet)

**Modal trigger:**
- Ekle: TopBar "+ Ekle" butonu → editingId = null, form temizlenir
- Düzenle: Satır ✏️ butonu → editingId = contact.id, form pre-fill edilir

```
Bottom sheet (maxHeight: 92%, ScrollView, KeyboardAvoidingView):

┌────────────────────────────────────────┐
│  Acil Kişi Ekle  [✕]                  │
│                                        │
│  [Ad *]           [Soyad *]            │  ← 2 sütun
│                                        │
│  Telefon *                             │
│  ┌────────────┐ ┌──────────────────┐  │
│  │🇹🇷 +90  ▼│ │5xx xxx xx xx    │  │  ← inline ülke kodu seçici
│  └────────────┘ └──────────────────┘  │
│                                        │
│  (Ülke kodu seçici açık ise):          │
│  ┌──────────────────────────────────┐  │
│  │ 🔍 [Ülke veya kod ara...]        │  │
│  │ 🇹🇷 Türkiye             +90     │  │
│  │ 🇺🇸 United States       +1      │  │
│  │ 🇩🇪 Almanya              +49     │  │
│  │ ...                    maxH:200 │  │
│  └──────────────────────────────────┘  │
│                                        │
│  İlişki Türü *                         │
│  [Anne, Baba, Büyükanne, Amca...]      │
│                                        │
│  Uyruk (İsteğe bağlı)                  │
│  [Ülke seçin ▼]                        │
│  (Uyruk dropdown — aynı pattern)       │
│                                        │
│  (Uyruk seçilince gösterilir):         │
│  🪪 Kimlik Bilgileri (İsteğe bağlı)   │
│  TC Kimlik No: [___________]           │
│  Pasaport No:  [___________]           │
│  * Her iki alan boş bırakılabilir      │
│                                        │
│  [İptal]              [Kaydet]         │
└────────────────────────────────────────┘
```

### Inline Dropdown Mekanizması (iOS Kısıtı Çözümü)

Her picker birbirini kapatır — aynı anda sadece biri açık olabilir:
```typescript
// Telefon kodu açılınca:
setShowPhonePicker(true)
setShowNationalityPicker(false)

// Uyruk açılınca:
setShowNationalityPicker(true)
setShowPhonePicker(false)

// TextInput odaklanınca:
setShowPhonePicker(false)
setShowNationalityPicker(false)
```

### Kaydet Akışı
```typescript
Validasyon:
  - first_name, last_name zorunlu
  - phone zorunlu
  - relationship zorunlu

Phone format: `+${phoneCountry.phone_code}${form.phone}`

Ekle: POST /api/parent/families/${familyUlid}/emergency-contacts { ... }
Düzenle: PUT /api/parent/families/${familyUlid}/emergency-contacts/${editingId} { ... }
→ modal kapat, fetchContacts(true)
```

### Silme Akışı
```
[🗑️] → Alert "X kişisini silmek istediğinize emin misiniz?"
[Sil] → DELETE /api/parent/families/${familyUlid}/emergency-contacts/${id}
→ fetchContacts(true)
```

### Yetki Kısıtı — Co-parent
**Co-parent acil durum kişisi ekleyemez/düzenleyemez/silemez** (hard block, backend 403 döner).
UI'da bu durumda butonlar gösterilmemeli veya disabled olmalı.

---

# BÖLÜM 16 — OKUL YÖNETİMİ: TAM MEKANİZMA DOKÜMANI

> Kaynak dosyalar: `schools/index.tsx`, `schools/join.tsx`, `schools/[id]/index.tsx`

---

## 16.1 Okul Listesi (`schools/index.tsx`)

### Veri & State
```typescript
interface School {
  id: number;
  name: string;
  type: string | null;         // 'Anaokulu' | 'Kreş' | ...
  address: string | null;
  phone: string | null;
  logo: string | null;
  joined_at: string | null;
}

interface EnrollmentRequest {
  id: number;
  status: 'pending' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  school: { id, name, address } | null;
}
```

**API — Paralel fetch:**
```typescript
Promise.all([
  GET /api/parent/schools,                  // Onaylanmış okullar
  GET /api/parent/my-enrollment-requests,   // Tüm başvurular
])
```

### Ekran Yapısı

```
Header: "Kayıtlı / Okullarım"    [+ Katıl]

─── Onaylanmış Okullar ──────────────────────

  ┌─────────────────────────────────────┐
  │ [GS]  Güneş Anaokulu               │  ← SchoolInitials (2 harf, primaryContainer bg)
  │        [Anaokulu]                   │  ← type chip
  │        📍 Kadıköy, İstanbul         │
  │        Katılım: 15.09.2025          │
  │                              [›]   │
  └─────────────────────────────────────┘

─── Boş Durum (okul yoksa + başvuru yoksa) ──
  🏫 (40px ikon, 88px konteyner)
  "Kayıtlı okul yok"
  "Davet kodu ile bir okula katılabilirsiniz"
  [🚪 Okula Katıl]

─── Başvurularım Bölümü ─────────────────────
(Footer olarak, başvuru varsa gösterilir)

  Başvurularım    [N bekliyor]     [▼/▲]
  ──────────────────────────────────────
  [Bekleyen | Reddedilen]  ← Tab switch

  ┌──────────────────────────────────┐
  │ [GS]  Güneş Anaokulu        •   │  ← amber nokta (pending)
  │        📍 Kadıköy               │
  │        15.04.2026               │
  └──────────────────────────────────┘
  
  Reddedilen tab:
  ┌──────────────────────────────────┐
  │ [GA]  Gündüz Anaokulu       •   │  ← kırmızı nokta (rejected)
  │        "Kapasite dolu" (italik) │  ← rejection_reason
  │        10.04.2026               │
  └──────────────────────────────────┘
```

**Başvurular Bölümü Özellikleri:**
- Accordion: tıklanabilir header, açılır/kapanır
- İç tab: [Bekleyen N] [Reddedilen N] → segment kontrolü
- Her başvuruda: SchoolInitials + okul adı + adres + tarih + durum noktası

**SchoolInitials Komponenti:**
```typescript
// İsmin ilk 2 kelimesinden baş harfler alınır:
"Güneş Anaokulu" → "GA"
// Tek kelimeyse → ilk 2 harf: "Güneş" → "Gü"
// size parametresi, borderRadius = size * 0.3
```

---

## 16.2 Okula Katıl (`schools/join.tsx`)

### Ekran Yapısı

```
TopBar: [← Geri]  "Okula Katıl"

ScrollView:
  (Büyük ikon/illüstrasyon)

  ┌─────────────────────────────────────┐
  │  Kayıt Kodu                         │
  │  [________________________]         │  ← registration_code
  └─────────────────────────────────────┘

  ─── veya ─────────────────────────────

  ┌─────────────────────────────────────┐
  │  Davet Linki/Tokeni                 │
  │  [________________________]         │  ← invite_token
  └─────────────────────────────────────┘

  [Okula Katıl] ← primary buton
```

**API:**
```typescript
POST /api/parent/schools/join {
  registration_code?: string,
  invite_token?: string
}

Başarı → Alert "Okula katıldınız" + router.back()
Hata → Alert hata mesajı
```

---

## 16.3 Okul Detayı (`schools/[id]/index.tsx`)

### Veri & State
```typescript
// Paralel fetch (loadAll):
Promise.all([
  GET /api/parent/schools/${id},                        // Okul detayı
  GET /api/parent/schools/${id}/feed?page=1,            // Sosyal feed (paginated)
  GET /api/parent/schools/${id}/child-enrollments,      // Bu okula başvurular
  GET /api/parent/children,                             // Ailedeki tüm çocuklar
])
```

**SchoolDetail Interface:**
```typescript
interface SchoolDetail {
  id: number;
  name: string;
  type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  current_academic_year: { id: number; name: string } | null;
}
```

### Ekran Layout (FlatList üzerine kurulu)

```
TopBar: [← Geri]    "Güneş Anaokulu"

FlatList:
  ┌── ListHeaderComponent ──────────────────────┐
  │                                             │
  │  ─── Okul Bilgi Kartı ─────────────────── │
  │  [🏫 64px]                                 │
  │  Güneş Anaokulu (büyük başlık)             │
  │  Anaokulu (type)                           │
  │  📍 Kadıköy, İstanbul                      │
  │  📞 0216 xxx xx xx                         │
  │  [2025-2026 Eğitim Yılı] ← success badge  │
  │                                             │
  │  ─── Kayıtlı Çocuklar ─────────────────── │
  │  ✅ Bu Okula Kayıtlı Çocuklar              │  ← successContainer section
  │  ┌──────────────────────────────────────┐  │
  │  │ [Avatar] Ali Demir                ›  │  │  → children/${c.id}
  │  │           12.03.2020                 │  │
  │  └──────────────────────────────────────┘  │
  │                                             │
  │  ─── Çocuk Kayıt Butonu ────────────────── │
  │  [👶 Çocuğumu Bu Okula Ekle]               │  ← Sadece uygun çocuk varsa göster
  │                                             │
  │  ─── Onay Bekleyen Kayıtlar ────────────── │
  │  (varsa — amber kart)                       │
  │  ⏳ Onay Bekleyen Kayıtlar                  │
  │  Ali Demir      [Onay Bekleniyor]           │
  │                                             │
  │  ─── Etkinlik Sınıfları Linki ──────────── │
  │  ☆ Etkinlik Sınıfları              [›]     │  ← primaryContainer, → activity-classes
  │                                             │
  │  ─── Feed Başlığı ──────────────────────── │
  │  Okul Akışı                                 │
  └─────────────────────────────────────────────┘

  ─── Post Kartları (FlatList items) ────────────
  ┌─────────────────────────────────────────┐
  │ 📌 Sabitlenmiş  (varsa)                 │
  │                                         │
  │ [Avatar]  Ayşe Öğretmen                 │
  │            15.04.2026                   │
  │                                         │
  │ Post içeriği metni...                   │
  │                                         │
  │ 👍 12    💬 3                            │
  └─────────────────────────────────────────┘

  ListFooterComponent: yükleniyor spinner (sayfa sonunda)
```

**Feed Pagination:**
```typescript
// Infinite scroll:
onEndReached → handleLoadMore()
  if (!postsLoading && page < lastPage) fetchPosts(page + 1)

// Yeni sayfalar mevcut listeye eklenir (push, replace değil)
```

### Çocuk Kayıt Akışı (Enrollment Flow)

**Buton görünüm koşulu:**
```typescript
// Bu okula kayıtlı olmayan VE onay bekleyen talebi olmayan çocuk var mı?
const pendingChildIds = new Set(pendingEnrollments.map(e => e.child?.id))
const hasEligibleChildren = allFamilyChildren.some(
  c => c.school_id !== schoolId && !pendingChildIds.has(c.id)
)
// hasEligibleChildren = true ise buton gösterilir
```

**[👶 Çocuğumu Bu Okula Ekle] tıklanınca:**
```
Çocuk Seçme Modal açılır (bottom sheet, maxHeight: 80%):

┌────────────────────────────────────────┐
│ Çocuğumu Ekle                    [✕]  │
│ "Kayıt talebinde bulunmak için seçin"  │
│                                        │
│ (Yükleniyor ise: spinner)             │
│                                        │
│ (Uygun çocuk yoksa):                  │
│ "Tüm çocuklarınız zaten kayıtlı       │
│  veya başvuru bekleniyor"             │
│ [+ Çocuk Ekle] → children/add        │
│                                        │
│ (Uygun çocuk varsa):                  │
│ ┌──────────────────────────────────┐  │
│ │ [Avatar]  Ali Demir          →  │  │  ← Seçince kayıt başlar
│ │           12.03.2020            │  │
│ └──────────────────────────────────┘  │
│ ┌──────────────────────────────────┐  │
│ │ [Avatar]  Ayşe Demir         →  │  │
│ └──────────────────────────────────┘  │
└────────────────────────────────────────┘

Çocuk seçince (tıkla):
  POST /api/parent/schools/${id}/enroll-child { child_id }
  Başarı → Modal kapanır
         → Alert "Kayıt talebiniz gönderildi, okul onayını bekliyorsunuz"
         → fetchChildEnrollments() + fetchAllChildren() (güncelle)
```

### Onay Bekleyen Kayıtlar Bölümü
```
amber/warning arka plan kart:
  "⏳ Onay Bekleyen Kayıtlar"
  Ali Demir     [Onay Bekleniyor]
  Ayşe Demir    [Onay Bekleniyor]
```
Gösterim: `pendingEnrollments.length > 0`

### Pull-to-Refresh
```
onRefresh → loadAll(true)
  Tüm veriler yenilenir (okul + feed + enrollments + children)
```

---

## 16.4 Çocuk Okul Kayıt Durum Takibi

```
Çocuk bazında kayıt durumları:

1. KAYITSIZ (child.school_id = null, pending enrollment yok)
   → Okul detayında "Çocuğumu Ekle" butonu gösterilir
   → Çocuk detayında "Okul Kaydı" bölümü → "Okula Kaydet" CTA

2. ONAY BEKLENİYOR (pending_enrollment mevcut)
   → Çocuk detayında: amber kart "Kayıt Talebi Beklemede"
   → Okul detayında: pending list'te görünür
   → "Çocuğumu Ekle" butonunda bu çocuk görünmez

3. KAYITLI (child.school_id dolu, class_info mevcut)
   → Okul detayında "Kayıtlı Çocuklar" yeşil section'da gösterilir
   → Çocuk detayında: okul badge + sınıf kartı
   → Silme: önce okul yöneticisine removal-request

4. REDDEDİLDİ (enrollment_request.status = 'rejected')
   → Okul listesi ekranındaki "Başvurularım → Reddedilen" tabında
   → rejection_reason gösterilir (italik)
```

---

## BÖLÜM 17 — ÇAPRAZ MODÜL KRİTİK BAĞLANTILAR

### Aile ↔ Çocuk Bağlantısı
```
Aile oluştur → family_profile oluşur
Çocuk ekle → family_profile_ulid seçilmeli (zorunlu)
  → Aile yoksa blocker ekran gösterilir

Çocuk listesi → family_profile_id'ye göre gruplanır
  → Her aile kendi başlığı altında
```

### Çocuk ↔ Okul Bağlantısı
```
Çocuk ekle (add.tsx) → okul kaydı YOK (sonra yapılır)
Okul detay → "Çocuğumu Ekle" → enroll-child
  → Onay bekleme süreci
  → Okul tenant_admin onaylar → child.school_id set edilir

Çocuğu silmek isteyince:
  school_id dolu → silme talebi (removal-request) → okul admin onayı
  school_id boş → direkt sil
```

### Sağlık Öneri Sistemi ↔ Kayıt Onayı
```
suggest-allergen/condition/medication → status='pending'
  → Pending kayıtlar mobilde amber badge ile gösterilir
  → Silinemiyor

Admin/Tenant okul yöneticisi onaylar → status='approved'
  → Badge kalkar, normal chip haline gelir

Çocuk okula kayıt onaylandığında:
  → Pending sağlık kayıtları yeni okul tenant_id ile güncellenir
  (Backend otomatik propagation)
```

### Aile Daveti ↔ Güvenlik Kodu Akışı
```
Super_parent → Üye Ekle → email gir
  → Backend: invitation oluştur + 6 haneli security_code üret

Super_parent aile detayında bekleyen üye için:
  🔑 Güvenlik Kodu: 483920  (görünür)
  → Bu kodu davet edilen kişiye paylaşır (telefon/mesaj)

Davet edilen (co-parent) → Aile listesinde davet gelir:
  [✓] Kabul Et → Güvenlik Kodu Modal → 6 hane gir
  → POST /accept { security_code }
  → Eşleşince aileye katılır
```

### Co-parent Yetki Akışı
```
Üye ekleme sırasında: permissions[] seçilir
  default: ['can_view_child_details']
  
Sonradan güncelleme: PUT /parent/families/${ulid}/members/${memberId}/permissions
  (Mevcut uygulamada bu endpoint'in UI'ı henüz eklenmemiş)

Hard Block (değiştirilemez):
  - Co-parent acil durum kişisi ekleyemez/düzenleyemez/silemez
  - Co-parent başka co-parent ekleyemez/çıkaramaz
```
/
