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
