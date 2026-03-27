# iStudy — Veli Mobil Uygulaması Tasarım Brifing

> Bu doküman, iStudy veli mobil uygulamasının tüm ekranlarını, kullanıcı işlemlerini, veri yapılarını ve mevcut tasarım referanslarını kapsar. Yeni tasarım için AI ajanına verilecek kaynak materyaldir.

---

## Uygulama Genel Bilgi

| Alan | Değer |
|------|-------|
| Platform | React Native 0.83+ / Expo ~55 |
| Router | Expo Router v3 (file-based) |
| Hedef Kitle | Anaokulu/kreş öğrencisi velileri |
| Dil | Türkçe |
| Backend | Laravel 12 REST API (Bearer token) |
| Token Saklama | AsyncStorage → `parent_token` |

### Uygulamanın Amacı

Veliler bu uygulama üzerinden:
- Çocuklarının okul, sınıf ve devamsızlık bilgilerini görür
- Etkinlik ve etkinlik sınıflarına çocukları adına kayıt yaptırır
- Yemek listelerini ve çocukların alerjen risklerini görür
- Okul sosyal gönderilerini takip eder
- Faturaları görür ve takip eder
- Aile üyelerini ve acil iletişim kişilerini yönetir

---

## Mevcut Renk Paleti ve Tasarım Tokenları

```
Primary:    #208AEF  (mavi — butonlar, aktif sekmeler, vurgu)
Success:    #059669  (yeşil — katıldı, ödendi, onaylandı)
Danger:     #EF4444  (kırmızı — sil, hata, gecikmiş)
Warning:    #D97706  (amber — bekliyor, uyarı)
Info:       #3B82F6  (açık mavi — bilgi badgeleri)

Background: #F5F8FF  (ekran arkaplanı)
White:      #FFFFFF  (kart arkaplanı)
Border:     #E5E7EB
TextPrim:   #1A1A2E  (başlık)
TextSec:    #6B7280  (alt metin)
TextMuted:  #9CA3AF  (etiket, meta)

Avatar BG (success): #D1FAE5, text: #059669
Avatar BG (primary): #EFF6FF, text: #208AEF
```

### Tipografi

```
Büyük başlık:   20px, fontWeight 800
Orta başlık:    17–18px, fontWeight 700
Kart başlığı:   15–16px, fontWeight 700
Alt başlık:     14px, fontWeight 600
Gövde metin:    14px, fontWeight 400
Meta / etiket:  12–13px, fontWeight 500–600
Küçük label:    11–12px, fontWeight 500
```

### Mevcut UI Bileşen Kalıpları

- **Kart**: `borderRadius: 16`, `backgroundColor: #FFF`, gölge (`shadowColor: #1E3A5F`, opacity 0.06–0.08)
- **Buton (Primary)**: `backgroundColor: #208AEF`, `borderRadius: 14`, `paddingVertical: 14`, beyaz metin
- **Buton (Outline)**: şeffaf arka plan, primary renk border+metin
- **Badge**: `borderRadius: 8–12`, küçük padding, dolgu renk
- **Avatar**: daire, initials tabanlı (2 harf), arka plan tonu + kalın metin
- **Tab Bar**: alt kısımda, 5 ikon, aktif → mavi
- **Section Header**: `fontSize 16, fontWeight 700, #1F2937`
- **SafeAreaView**: tüm ekranlarda
- **ScrollView** + `RefreshControl`: çekip yenile
- **FlatList**: sayfalandırılmış listeler için (sonsuz kaydırma)
- **Modal (Bottom Sheet)**: yarı saydam arka plan, üstten yuvarlak köşe sheet

---

## Navigasyon Yapısı

```
Root (_layout.tsx)
│
├── (auth)/              ← Token yok → burada
│   ├── login
│   ├── register
│   ├── forgot-password
│   └── verify-email
│
└── (app)/               ← Token var → burada
    │
    ├── Tab Bar (5 sekme)
    │   ├── [1] Akış (index)           Ana sayfa feed
    │   ├── [2] Yemek Listesi (meal-menu)
    │   ├── [3] Etkinlikler (activities)
    │   ├── [4] İstatistikler (stats)
    │   └── [5] Profil (profile)
    │
    └── Stack (tab bar dışı, profilden erişim)
        ├── children/          Çocuklar
        ├── schools/           Okullar
        ├── activity-classes/  Etkinlik Sınıfları
        ├── family/            Aile
        └── invoices/          Faturalar
```

---

## Ekranlar — Detaylı Katalog

---

### AUTH GROUP

---

#### 1. Giriş Ekranı
**Dosya**: `(auth)/login.tsx`
**Erişim**: Uygulama açılışında, çıkış yapıldığında

**Ekranda Ne Var:**
- Üst bölüm: logo/ikon, uygulama adı, kısa slogan
- Form: e-posta input, şifre input (göster/gizle toggle)
- "Giriş Yap" butonu
- "Şifremi Unuttum" bağlantısı
- "Kayıt Ol" bağlantısı

**Kullanıcı İşlemleri:**
- E-posta ve şifre girerek giriş yapma
- Şifreyi göster/gizle toggle
- Şifremi Unuttum ekranına gitme
- Kayıt Ol ekranına gitme

**API:**
- `POST /parent/auth/login` → `{ email, password }`

---

#### 2. Kayıt Ekranı
**Dosya**: `(auth)/register.tsx`

**Ekranda Ne Var:**
- Ad, Soyad alanları
- E-posta alanı
- Telefon: ülke kodu seçici (bayrak + kod) + numara girişi
- Şifre + güç göstergesi (4 seviyeli renk çubuğu)
- Şifre tekrar
- "Kayıt Ol" butonu
- Giriş bağlantısı

**Kullanıcı İşlemleri:**
- Ülke kodu arama modali açma (arama yapılabilir liste, bayrak + kod)
- Şifre güç barı canlı güncelleme (uzunluk, büyük harf, özel karakter, rakam)
- Form doğrulama
- Kayıt olma
- Giriş ekranına dönme

**API:**
- `GET /parent/auth/countries` → ülke listesi (ülke kodu seçici için)
- `POST /parent/auth/register` → `{ name, surname, email, password, password_confirmation, phone? }`

---

#### 3. Şifremi Unuttum
**Dosya**: `(auth)/forgot-password.tsx`

**Ekranda Ne Var:**
- E-posta giriş formu
- "Sıfırlama Linki Gönder" butonu
- Başarı durumu: onay mesajı + "Giriş Yap" butonu

**Kullanıcı İşlemleri:**
- E-posta girme, sıfırlama isteği gönderme
- Başarı sonrası giriş ekranına gitme

**API:**
- `POST /parent/auth/forgot-password` → `{ email }`

---

#### 4. E-posta Doğrulama
**Dosya**: `(auth)/verify-email.tsx`

**Ekranda Ne Var:**
- Bilgilendirme metni
- "Tekrar Gönder" butonu
- "Atla ve Devam Et" butonu

**Kullanıcı İşlemleri:**
- Doğrulama e-postasını tekrar gönderme
- Doğrulamayı atlayarak uygulamaya girme

**API:**
- `POST /parent/auth/resend-verification`

---

### APP GROUP — TAB EKRANLARI

---

#### 5. Akış (Ana Sayfa Feed)
**Dosya**: `(app)/index.tsx`
**Tab İkonu**: Ev
**Tab Adı**: Akış

**Ekranda Ne Var:**
- Üst: 2 sekme → "Genel" / "Okullar"
- Gönderi kartları:
  - Yazar adı + avatar (baş harf)
  - Tarih
  - Metin içerik
  - Medya (resim/video — varsa)
  - Reaksiyon sayısı + yorum sayısı
  - Sabit gönderi rozeti (varsa)
  - Genel gönderi etiketi (varsa)
- Sonsuz kaydırma (sayfalandırma)
- Çekip yenile

**Kullanıcı İşlemleri:**
- Genel / Okul gönderileri arasında sekme değiştirme
- Çekip yenileme
- Aşağı kaydırarak daha fazla yükleme

**API:**
- `GET /parent/feed/global?page={page}`
- `GET /parent/feed/schools?page={page}`

**Veri Tipi:**
```typescript
Post {
  id: number
  content: string
  visibility: string
  is_pinned: boolean
  is_global: boolean
  published_at: string
  author: { id: number; name: string; surname: string } | null
  media: { id: number; url: string; type: string }[]
  reactions_count: number
  comments_count: number
}
```

---

#### 6. Yemek Listesi
**Dosya**: `(app)/meal-menu/index.tsx`
**Tab İkonu**: Restoran/Yemek
**Tab Adı**: Yemek

**Ekranda Ne Var:**
- Çocuk/Sınıf seçici (dropdown)
- Günlük yemek kartları:
  - Tarih ve gün adı
  - Öğün adı (kahvaltı, öğle yemeği, ikindi vs.)
  - İçindekiler listesi
  - Her içindeki için alerjen uyarı rozeti (Yüksek / Orta / Düşük risk)
- Animasyonlu sekme kaydırma
- Boş durum

**Kullanıcı İşlemleri:**
- Çocuk seçimi (sınıfa göre yemek filtresi)
- Günler arasında kaydırma
- Alerjen uyarılarını görme

**Veri Tipi:**
```typescript
Allergen { id: number; name: string; risk_level: 'low'|'medium'|'high'|null }
Ingredient { id: number; name: string; allergens: Allergen[] }
MealEntry {
  id: number; meal_id: number; schedule_type: string
  meal: { id: number; name: string; meal_type: string; ingredients: Ingredient[] }
}
DayMenu { date: string; meals: MealEntry[] }
```

---

#### 7. Etkinlikler Listesi
**Dosya**: `(app)/activities/index.tsx`
**Tab İkonu**: Bayrak
**Tab Adı**: Etkinlikler

**Ekranda Ne Var:**
- Etkinlik kartları:
  - İkon (bayrak, mavi veya gri)
  - Etkinlik adı + okul adı
  - Tarih aralığı (ör: "21 Mar – 17 Nis")
  - Ücretli / Ücretsiz rozeti
  - Kayıt Gerekli rozeti
  - Sınıf kapsamı (hangi sınıflar / "Her sınıfa açık")
  - Kayıt durumu: "Katıldınız" / "X Çocuk" rozeti (kayıtlıysa)
  - Kilitli görünüm (kayıt gerekli ama kayıt olmamış)
- Sonsuz kaydırma
- Çekip yenile

**Kullanıcı İşlemleri:**
- Etkinlik kartına tıklayarak detaya gitme
- Çekip yenileme
- Aşağı kaydırarak daha fazla yükleme

**API:**
- `GET /parent/activities?page={page}`

**Veri Tipi:**
```typescript
Activity {
  id: number; name: string; description: string | null
  is_paid: boolean; is_enrollment_required: boolean; price: string | null
  start_date: string | null; end_date: string | null
  school: { id: number; name: string } | null
  classes: { id: number; name: string }[]
  enrollments_count?: number
  enrolled_child_ids?: number[]
}
```

---

#### 8. Etkinlik Detay
**Dosya**: `(app)/activities/event/[id].tsx`

**Ekranda Ne Var:**
- Üst: geri butonu, "Etkinlik Detayı" başlığı
- Hero bölümü:
  - Büyük ikon (bayrak)
  - Etkinlik adı
  - Okul adı
  - Rozetler: katılım durumu (Katıldınız / X Çocuk Katılıyor), Ücretli/Ücretsiz, Kayıt Gerekli
- Kayıt Yönetimi bölümü (uygun çocuk varsa):
  - Kayıtlı çocuklar (her biri için avatar + adı + "Katılıyor" etiketi + "Ayrıl" butonu)
  - "Etkinliğe Katıl" / "Başka Çocuk Ekle" butonu
  - Son iptal tarihi notu
  - Toplam katılımcı sayısı
- Etkinlik Bilgileri bölümü:
  - Başlangıç tarihi + saati
  - Bitiş tarihi + saati
  - Açık Olduğu Sınıflar (etiket listesi veya "Her sınıfa açık etkinlik")
- Getirilmesi Gerekenler bölümü (varsa — materyaller)
- Galeri Kilitli uyarısı (kayıt gerekli ama kayıt yok)
- Galeri bölümü (erişim varsa): 3 sütun grid, resim/video/belge
- Katılımcılar bölümü (erişim varsa)

**Kullanıcı İşlemleri:**
- Kayıt seçim modalını açma (uygun çocuğu seçme)
  - Her zaman modal açılır (tek çocuk olsa bile)
  - Kayıtlı çocuklar "Kayıtlı" etiketiyle gösterilir, seçilemez
  - Kayıtsız çocuklar seçilebilir (radio button)
  - "Katıl" butonu
- Etkinlikten ayrılma (her kayıtlı çocuk için ayrı "Ayrıl" butonu)
- Galeri öğesine tıklayarak tam ekran görüntüleme
- Belge açma / indirme
- Çekip yenileme

**Modaller:**
1. **Çocuk Seçim Modali** (bottom sheet):
   - Başlık: "Hangi çocuk katılacak?"
   - Etkinlik adı alt başlık
   - Her uygun çocuk için radio satırı (kayıtlıysa gri + "Kayıtlı" tag)
   - "İptal" + "Katıl" butonları
2. **Galeri Lightbox Modali**: tam ekran görüntüleyici

**API:**
- `GET /parent/activities/{id}`
- `GET /parent/children`
- `POST /parent/activities/{id}/enroll` → `{ child_id }`
- `DELETE /parent/activities/{id}/unenroll` → `{ child_id }`

**Veri Tipi:**
```typescript
ActivityDetail {
  id: number; name: string; description: string | null
  is_paid: boolean; is_enrollment_required: boolean
  cancellation_allowed: boolean; cancellation_deadline: string | null
  price: string | null
  start_date: string | null; start_time: string | null
  end_date: string | null; end_time: string | null
  enrolled_child_ids: number[]; enrollments_count: number | null
  school: { id: number; name: string } | null; school_id: number | null
  classes: { id: number; name: string }[]
  gallery: GalleryItem[]; materials: string[]; participants: { name: string }[]
}
GalleryItem {
  id: number; file_type: 'image'|'video'|'document'
  mime_type: string; file_size: number; original_name: string
  caption: string | null; sort_order: number; url: string; created_at: string
}
```

---

#### 9. İstatistikler
**Dosya**: `(app)/stats.tsx`
**Tab İkonu**: Bar chart
**Tab Adı**: İstatistikler

**Ekranda Ne Var:**
- Yatay kaydırmalı çocuk seçici (her çocuk için sekme butonu)
- Okul & sınıf bilgi kartı
- 4 istatistik kartı (2x2 grid):
  - Geldi (Present) — yeşil
  - Gelmedi (Absent) — kırmızı
  - Geç Geldi (Late) — amber
  - İzinli (Excused) — mavi
- Görsel devamsızlık çubuğu (renkli bölmeli bar)
- Katılım oranı badge (%)
- Boş durum (çocuk yoksa / veri yoksa)
- Çekip yenile

**Kullanıcı İşlemleri:**
- Farklı çocuklar arasında sekme geçişi
- Okula tıklama (okul detayına gitme)
- Çekip yenileme

**API:**
- `GET /parent/children`
- `GET /parent/children/{childId}/stats`

**Veri Tipi:**
```typescript
ChildStats {
  child: { id: number; full_name: string }
  school: { id: number; name: string } | null
  classes: { id: number; name: string }[]
  attendance: { total: number; present: number; absent: number; late: number; excused: number }
}
```

---

#### 10. Profil
**Dosya**: `(app)/profile.tsx`
**Tab İkonu**: Kişi
**Tab Adı**: Profil

**Ekranda Ne Var:**
- Avatar dairesi (baş harfler, büyük)
- Ad Soyad, e-posta
- E-posta doğrulama rozeti
- Bekleyen fatura uyarı banner (varsa — kırmızı/turuncu)
- Liste bölümleri:
  - Hesap
  - Çocuklar & Okullar → Çocuklarım + Okullarım
  - Aile → Aile Üyeleri
  - Mali İşlemler → Faturalarım
  - Uygulama Hakkında (versiyon numarası)
- "Çıkış Yap" butonu (kırmızı)

**Kullanıcı İşlemleri:**
- Çocuklarım ekranına gitme
- Okullarım ekranına gitme
- Aile Üyeleri ekranına gitme
- Faturalarım ekranına gitme
- Çıkış yapma (onay alert'i)

**API:**
- `GET /parent/invoices/stats` → bekleyen fatura sayısı/tutarı
- `POST /parent/auth/logout`

---

### APP GROUP — STACK EKRANLARI

---

### ÇOCUKLAR

#### 11. Çocuklar Listesi
**Dosya**: `(app)/children/index.tsx`

**Ekranda Ne Var:**
- Sağ üst: "Ekle" (+) butonu
- Çocuk kartları:
  - Avatar dairesi (baş harfler)
  - Ad Soyad
  - Cinsiyet ikonu (erkek/kız/diğer)
  - Yaş (doğum tarihinden hesaplanır)
  - Kan grubu rozeti
- Boş durum: "Henüz çocuk eklemediniz" + "Çocuk Ekle" butonu
- Çekip yenile

**Kullanıcı İşlemleri:**
- Çocuk kartına tıklayarak detay ekranına gitme
- "Ekle" butonuyla yeni çocuk ekleme ekranına gitme
- Çekip yenileme

**API:**
- `GET /parent/children`

**Veri Tipi:**
```typescript
ChildSummary {
  id: number; first_name: string; last_name: string; full_name: string
  birth_date: string | null; gender: 'male'|'female'|'other' | null
  blood_type: string | null; profile_photo: string | null; status: string
}
```

---

#### 12. Çocuk Ekle
**Dosya**: `(app)/children/add.tsx`

**Ekranda Ne Var:**
- Uzun form, bölümler halinde:
  - **Temel Bilgiler**: Ad, Soyad, Doğum Tarihi (picker), Cinsiyet (seçim), Kan Grubu (seçim)
  - **İletişim**: Telefon (ülke kodu + numara), TC Kimlik No
  - **Uyruk**: Ülke seçici modal (arama yapılabilir, bayraklı)
  - **Diller**: Çoklu seçim modali
  - **Sağlık**: Alerjenler + Rahatsızlıklar + İlaçlar (her biri modal)
  - **Notlar**: Veli Notu, Özel Not (text area)
- "Kaydet" butonu (footer sticky)

**Modaller:**
1. **Tarih Seçici**: Yıl / Ay / Gün rulolar (drum picker stili)
2. **Ülke Seçici**: Arama alanı + liste (bayrak + ülke adı + telefon kodu)
3. **Dil Seçici**: Çoklu checkbox listesi
4. **Alerjen Seçici**: Önerilen liste + özel ekle girişi
5. **Rahatsızlık Seçici**: Önerilen liste + özel ekle girişi
6. **İlaç Formu**: Ad seçimi, Doz, Kullanım Zamanları (saat picker), Kullanım Günleri (checkbox)

**Kullanıcı İşlemleri:**
- Tüm form alanlarını doldurma
- Tarih pickerı açma (yıl/ay/gün scroll)
- Ülke arama ve seçme
- Dil çoklu seçim
- Önerilen alerjenlerden seçme veya özel alerjen ekleme
- İlaç bilgilerini detaylı girme (saat, gün seçimi)
- Formu kaydetme

**API:**
- `GET /parent/auth/countries`
- `GET /parent/allergens`
- `GET /parent/medical-conditions`
- `GET /parent/medications`
- `POST /parent/children`

---

#### 13. Çocuk Detay
**Dosya**: `(app)/children/[id]/index.tsx`

**Ekranda Ne Var:**
- **Profil Bölümü**:
  - Profil fotoğrafı (dairesel, tıklanabilir — fotoğraf ekle/değiştir)
  - Ad Soyad (büyük başlık)
  - Durum rozeti (Aktif/Pasif)
  - Okul rozeti (kayıtlı okul adı veya "Okul Yok")
- **Bekleyen Kayıt Bildirimi** (varsa — sarı kart):
  - "X okuluna kayıt talebiniz inceleniyor" mesajı
- **Sınıf Bilgi Kartı** (okul ve sınıfa kayıtlıysa):
  - Sınıf adı + renk noktası
  - Öğrenci istatistikleri: Toplam / Erkek / Kız / Kapasite
  - Yaş aralığı
  - Öğretmen listesi (chip tarzı)
- **Kişisel Bilgiler**:
  - Doğum tarihi
  - Cinsiyet
  - Kan grubu
  - TC Kimlik No
  - Uyruk (bayrak emoji + ülke adı)
  - Konuştuğu diller
- **Sağlık Bilgileri**:
  - Alerjenler (her biri için isim + durum rozeti: Onaylı/Bekliyor)
  - Rahatsızlıklar (aynı şekilde)
  - İlaçlar (isim + doz + kullanım zamanı/günleri)
- **Notlar**:
  - Veli notu
  - Özel not
- **Butonlar** (footer):
  - "Sağlık Bilgilerini Düzenle"
  - "Çocuğu Sil" (kırmızı — koşullu: kayıtsızsa doğrudan sil, okula kayıtlıysa kaldırma talebi)

**Kullanıcı İşlemleri:**
- Profil fotoğrafına tıklama → kamera/galeri seçim sheet → fotoğraf yükleme
- Sağ üst "Düzenle" butonu → düzenleme ekranına gitme
- Sağlık bilgilerini düzenleme
- Çocuğu silme:
  - Okula kayıtlı değilse: onay alertı → doğrudan silme
  - Okula kayıtlıysa: "Kaldırma Talebi" gönderme alertı → okula bildirim
- Çekip yenileme

**API:**
- `GET /parent/children/{id}`
- `POST /parent/children/{id}/profile-photo` (FormData)
- `DELETE /parent/children/{id}` (kayıtsız çocuk için)
- `POST /parent/children/{id}/removal-request` (kayıtlı çocuk için)

---

#### 14. Çocuk Düzenle
**Dosya**: `(app)/children/[id]/edit.tsx`

Çocuk Ekle ekranıyla aynı form, önceden dolu. Değişiklik "Güncelle" butonuyla kaydedilir.

**API:**
- `GET /parent/children/{id}`
- `PUT /parent/children/{id}`

---

#### 15. Sağlık Bilgileri Düzenle
**Dosya**: `(app)/children/[id]/health.tsx`

**Ekranda Ne Var:**
- Alerjenler bölümü: mevcut liste + "Ekle" butonu → seçim modali
- Rahatsızlıklar bölümü: aynı yapı
- İlaçlar bölümü: her ilaç için detaylı kart (doz, saat, günler) + ekle modali
- "Kaydet" butonu

**Modaller:**
- Alerjen ekleme (önerilen + özel)
- Rahatsızlık ekleme (önerilen + özel)
- İlaç ekleme (ad, doz, saat picker, gün checkbox)

**API:**
- `GET /parent/children/{id}`
- `GET /parent/allergens`
- `GET /parent/medical-conditions`
- `GET /parent/medications`
- `PUT /parent/children/{id}/health`

---

### OKULLAR

#### 16. Okullar Listesi
**Dosya**: `(app)/schools/index.tsx`

**Ekranda Ne Var:**
- Sağ üst: "Katıl" butonu
- Kayıtlı okul kartları:
  - Avatar (okul adı baş harfi)
  - Okul adı
  - Tür etiketi (Kreş/Anaokulu vs.)
  - Adres
  - Katılım tarihi
- Daraltılabilir "Kayıt Taleplerim" bölümü (varsa):
  - Sekmeler: Bekleyen (sayı rozeti) / Reddedilen
  - Talep kartları: okul adı, adres, durum noktası, ret gerekçesi (varsa), tarih
- Boş durum: "Henüz bir okula kayıtlı değilsiniz" + "Okula Katıl" butonu
- Çekip yenile

**Kullanıcı İşlemleri:**
- Okul kartına tıklayarak okul detayına gitme
- "Katıl" butonuyla okula katılma ekranına gitme
- Talepler bölümünü genişletme/daraltma
- Bekleyen / Reddedilen sekme değişimi
- Çekip yenileme

**API:**
- `GET /parent/schools`
- `GET /parent/my-enrollment-requests`

---

#### 17. Okula Katıl
**Dosya**: `(app)/schools/join.tsx`

**Ekranda Ne Var:**
- Geri butonu
- İkon + başlık ("Okul Davet Kodu")
- Açıklama metni
- Davet kodu / token girişi
- "Gönder" butonu
- Başarı sonrası onay mesajı

**Kullanıcı İşlemleri:**
- Davet kodu veya token girme
- Talebi gönderme
- Başarı mesajını görme

**API:**
- `POST /parent/schools/join` → `{ invite_token }`

---

#### 18. Okul Detay
**Dosya**: `(app)/schools/[id]/index.tsx`

**Ekranda Ne Var:**
- Okul başlığı: avatar, adı, türü
- Bilgiler: adres, telefon, e-posta
- Sekmeler:
  1. **Feed**: Okulun gönderileri (gönderi kartları, sonsuz kaydırma)
  2. **Çocuk Kaydı**: Çocukları okula kayıt etme
- Çocuk kayıt modalı

**Kullanıcı İşlemleri:**
- Feed / Çocuk Kaydı sekme değişimi
- Feed'de aşağı kaydırarak daha fazla yükleme
- Çocuk kayıt modalı açma
  - Kayıtsız çocukları gösterme
  - Çoklu seçim
  - "Kaydı Gönder" butonu

**API:**
- `GET /parent/schools/{id}`
- `GET /parent/schools/{id}/feed?page={page}`
- `GET /parent/children`
- `POST /parent/schools/{id}/enroll-child` → `{ child_id }`

---

### ETKİNLİK SINIFLARI

#### 19. Etkinlik Sınıfları Listesi
**Dosya**: `(app)/activity-classes/index.tsx`

**Ekranda Ne Var:**
- Etkinlik sınıfı kartları:
  - Ad
  - Dil etiketi (ör: TR, EN)
  - Açıklama (2 satır truncate)
  - Meta bilgiler: yaş aralığı, program, konum, kapasite/kayıt sayısı
  - Ücretli / Ücretsiz + fatura etiketi
  - Kayıt rozeti (kayıtlı çocuklar varsa)
- Sonsuz kaydırma
- Çekip yenile

**Kullanıcı İşlemleri:**
- Karta tıklayarak detaya gitme
- Çekip yenileme
- Daha fazla yükleme

**API:**
- `GET /parent/activity-classes?page={page}`

**Veri Tipi:**
```typescript
ActivityClass {
  id: number; name: string; description: string | null
  language: string; age_min: number | null; age_max: number | null
  capacity: number | null; active_enrollments_count: number
  is_paid: boolean; price: string | null; currency: string
  invoice_required: boolean; start_date: string | null; end_date: string | null
  schedule: string | null; location: string | null; is_school_wide: boolean
  school_classes: { id: number; name: string }[]; enrolled_child_ids: number[]
}
```

---

#### 20. Etkinlik Sınıfı Detay
**Dosya**: `(app)/activity-classes/[id].tsx`

**Ekranda Ne Var:**
- Başlık: ad, dil etiketi, kayıt rozeti
- Açıklama metni
- Bilgiler: dil, yaş aralığı, kapasite, program, konum, tarih aralığı
- Öğretmenler listesi
- Materyaller (zorunlu/opsiyonel, açıklamalı)
- Kayıtlı çocuklar ve kayıt yönetimi
- "Kayıt Ol" butonu

**Kullanıcı İşlemleri:**
- Etkinlik sınıfına çocuk kayıt etme (çocuk seçim modalı)
- Çekip yenileme

**API:**
- `GET /parent/activity-classes/{id}`
- `GET /parent/children`
- `POST /parent/activity-classes/{id}/enroll` → `{ child_ids[] }`

---

### AİLE

#### 21. Aile Üyeleri
**Dosya**: `(app)/family/index.tsx`

**Ekranda Ne Var:**
- Sağ üst: "Üye Ekle" butonu
- Üye kartları:
  - Avatar (baş harfler)
  - Ad Soyad
  - İlişki türü (ör: Anne, Baba, Büyükanne)
  - Rol rozeti: "Ana Veli" (mavi) veya "Eş Veli" (gri)
  - Aktif/Pasif göstergesi
  - Kaldır butonu (Ana Veli kaldırılamaz)
- Boş durum
- Çekip yenile

**Kullanıcı İşlemleri:**
- "Üye Ekle" → modal açılır (e-posta + ilişki türü)
- Üye kaldırma (Ana Veli hariç — onay alertı)
- Çekip yenileme

**Modaller:**
- Üye Ekleme: e-posta girişi + ilişki türü girişi + "Ekle" butonu

**API:**
- `GET /parent/family/members`
- `POST /parent/family/members` → `{ email, relation_type? }`
- `DELETE /parent/family/members/{id}`

**Veri Tipi:**
```typescript
FamilyMember {
  id: number; user_id: number
  user: { id: number; name: string; surname: string; email: string; phone: string | null } | null
  relation_type: string; role: 'super_parent'|'co_parent'; is_active: boolean
}
```

---

#### 22. Acil İletişim Kişileri
**Dosya**: `(app)/family/emergency.tsx`

Acil durum iletişim kişilerini yönetme ekranı.

**API:**
- `GET /parent/family/emergency-contacts`
- `POST /parent/family/emergency-contacts`
- `PUT /parent/family/emergency-contacts/{id}`
- `DELETE /parent/family/emergency-contacts/{id}`

---

### FATURALAR

#### 23. Faturalar Listesi
**Dosya**: `(app)/invoices/index.tsx`

**Ekranda Ne Var:**
- Üst istatistik kartı:
  - Bekleyen fatura sayısı
  - Gecikmiş sayısı
  - Toplam bekleyen tutar
- Fatura kartları:
  - Fatura numarası
  - Modül (Etkinlik Sınıfı / Abonelik vs.)
  - Fatura tipi: Normal / İade (farklı renk/ikon)
  - Çocuk adı
  - Son ödeme tarihi
  - Tutar + para birimi
  - Durum rozeti: Taslak / Bekliyor / Ödendi / Gecikmiş / İptal / İade
  - Gecikmiş uyarı (kırmızı nokta + "Gecikmiş!")
- Sonsuz kaydırma
- Çekip yenile

**Kullanıcı İşlemleri:**
- Fatura kartına tıklayarak detaya gitme
- Çekip yenileme
- Daha fazla yükleme

**API:**
- `GET /parent/invoices?page={page}&per_page=15`
- `GET /parent/invoices/stats`

**Veri Tipi:**
```typescript
Invoice {
  id: number; invoice_no: string; module: string
  invoice_type: 'invoice'|'refund'; status: string
  total_amount: number; currency: string; due_date: string | null
  paid_at: string | null; is_overdue: boolean; created_at: string
  activity_class: { id: number; name: string } | null
  child: { id: number; full_name: string } | null
}
InvoiceStats { total: number; pending_count: number; paid_count: number; overdue_count: number; pending_amount: number }
```

---

#### 24. Fatura Detay
**Dosya**: `(app)/invoices/[id].tsx`

**Ekranda Ne Var:**
- Fatura numarası + durum rozeti
- Bilgiler: düzenleme tarihi, son ödeme tarihi, ödeme tarihi
- Etkinlik sınıfı bilgisi (varsa): ad, konum, program, tarih aralığı
- Çocuk adı
- Kalemler tablosu:
  - Açıklama / Adet / Birim fiyat / Toplam (her satır)
  - Ara toplam
  - Genel toplam
- Ödeme İşlemleri (varsa):
  - Her işlem: sipariş ID, tutar, durum (Bekliyor/Başarılı/Başarısız), banka, kart son 4 hanesi, hata mesajı
- İade fatura bilgisi (normal faturada iade varsa)
- Orijinal fatura bilgisi (iade faturasında)
- Çekip yenile

**Kullanıcı İşlemleri:**
- Fatura bilgilerini görüntüleme
- Ödeme işlemi geçmişini görme
- Çekip yenileme

**API:**
- `GET /parent/invoices/{id}`

**Veri Tipi:**
```typescript
InvoiceItem { id: number; description: string; quantity: number; unit_price: number; total_price: number }
Transaction {
  id: number; order_id: string; amount: number
  status: 0|1|2  // 0=bekliyor, 1=başarılı, 2=başarısız
  payment_gateway: string; bank_name: string | null; card_last_four: string | null
  error_message: string | null; created_at: string
}
InvoiceDetail {
  id: number; invoice_no: string; module: string; invoice_type: 'invoice'|'refund'
  original_invoice_id: number | null; refund_reason: string | null
  status: string; total_amount: number; currency: string; notes: string | null
  issue_date: string; due_date: string | null; paid_at: string | null
  is_overdue: boolean; created_at: string
  items: InvoiceItem[]; transactions: Transaction[]
  activity_class: { id: number; name: string; location: string | null; schedule: string | null; start_date: string | null; end_date: string | null } | null
  child: { id: number; full_name: string } | null
  refund_invoice: { id: number; invoice_number: string; status: string } | null
  original_invoice: { id: number; invoice_number: string; amount: number; currency: string; status: string } | null
}
```

---

## Ortak UI Kalıpları

### Statü Rozetleri

| Statü | Renk | Türkçe |
|-------|------|--------|
| pending | Amber | Bekliyor |
| paid | Yeşil | Ödendi |
| overdue | Kırmızı | Gecikmiş |
| cancelled | Gri | İptal |
| refunded | Mor | İade |
| draft | Gri | Taslak |
| active | Yeşil | Aktif |
| rejected | Kırmızı | Reddedildi |
| approved | Yeşil | Onaylandı |

### Onay Alertları

Silme, ayrılma, çıkış gibi geri dönüşü zor işlemlerde:
- React Native `Alert.alert` kullanılır
- 2 buton: İptal (gri) + Onayla (kırmızı/mavi)

### Boş Durum
- Merkezi hizalanmış ikon (Ionicons, büyük, açık renk)
- Açıklama metni
- İsteğe bağlı aksiyon butonu

### Sayfalandırma (Infinite Scroll)
- `FlatList` + `onEndReached` + `onEndReachedThreshold: 0.3`
- Footer: yükleme spinner veya "daha fazla yok" mesajı
- `RefreshControl` ile çekip yenile

### Yükleniyor Durumu
- Ekran ortasında `ActivityIndicator` (mavi renk)
- Sayfa gövdesi görünmez

---

## Tüm API Endpoint Listesi

### Auth
```
POST   /parent/auth/login
POST   /parent/auth/register
POST   /parent/auth/forgot-password
POST   /parent/auth/resend-verification
POST   /parent/auth/logout
GET    /parent/auth/countries
```

### Children
```
GET    /parent/children
GET    /parent/children/{id}
POST   /parent/children
PUT    /parent/children/{id}
DELETE /parent/children/{id}
POST   /parent/children/{id}/profile-photo
POST   /parent/children/{id}/removal-request
GET    /parent/children/{id}/stats
GET    /parent/allergens
GET    /parent/medical-conditions
GET    /parent/medications
```

### Schools
```
GET    /parent/schools
GET    /parent/schools/{id}
GET    /parent/schools/{id}/feed
GET    /parent/my-enrollment-requests
POST   /parent/schools/join
POST   /parent/schools/{id}/enroll-child
```

### Activities
```
GET    /parent/activities
GET    /parent/activities/{id}
POST   /parent/activities/{id}/enroll
DELETE /parent/activities/{id}/unenroll
```

### Activity Classes
```
GET    /parent/activity-classes
GET    /parent/activity-classes/{id}
POST   /parent/activity-classes/{id}/enroll
```

### Family
```
GET    /parent/family/members
POST   /parent/family/members
DELETE /parent/family/members/{id}
GET    /parent/family/emergency-contacts
POST   /parent/family/emergency-contacts
PUT    /parent/family/emergency-contacts/{id}
DELETE /parent/family/emergency-contacts/{id}
```

### Invoices
```
GET    /parent/invoices
GET    /parent/invoices/{id}
GET    /parent/invoices/stats
```

### Feed
```
GET    /parent/feed/global
GET    /parent/feed/schools
```

---

## Tasarım Ajansına Notlar

1. **Hedef kullanıcı**: 25–45 yaş, çocuk sahibi ebeveynler, orta-üst segment
2. **Birincil kullanım amacı**: Hızlı bilgi edinme, çocuk takibi, kayıt/fatura işlemleri
3. **Ton**: Güvenilir, sıcak, profesyonel — okul/eğitim sektörü
4. **Kritik akışlar** (öncelikli tasarlanmalı):
   - Onboarding: Kayıt → E-posta doğrulama → Okul katılımı → Çocuk ekleme
   - Günlük kullanım: Feed okuma, yemek listesi, etkinlik takibi
   - İşlemsel: Etkinliğe kayıt, fatura görüntüleme
5. **Mevcut ikonlar**: Expo Vector Icons / Ionicons kütüphanesi
6. **Desteklenen platformlar**: iOS ve Android (React Native cross-platform)
7. **Ekran boyutları**: Küçük (iPhone SE) → Büyük (iPad mini) arası tüm boyutlar
