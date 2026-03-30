# iStudy — Veli Mobil Uygulaması Tasarım Promptu

> Bu doküman, iStudy veli mobil uygulamasının baştan sona yeniden tasarlanması için bir AI tasarım ajanına verilecek kapsamlı promptu içerir.

---

## GÖREV

iStudy adlı anaokulu/kreş yönetim SaaS platformunun **veli (parent) mobil uygulamasını** React Native + Expo kullanarak baştan tasarla ve geliştir. Uygulama Türkçe arayüzlüdür. Hedef kitle 25–45 yaş, çocuk sahibi ebeveynler.

---

## TEKNOLOJİ YIĞINI

| Alan | Teknoloji |
|------|-----------|
| Framework | React Native 0.83+ / Expo ~55 |
| Routing | Expo Router v3 (file-based) |
| State | React Context (AuthContext) |
| HTTP | Axios + AsyncStorage interceptor |
| Token | `parent_token` (AsyncStorage) |
| API Base URL | Android emulator: `http://10.0.2.2:8000/api` |
| Dil | TypeScript, Türkçe UI |

**Kurulu paketler:**
- `expo`, `expo-router`, `react`, `react-native`
- `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler`
- `react-native-reanimated`
- `@react-native-async-storage/async-storage`
- `@expo/vector-icons` (Ionicons)
- `axios`

---

## TASARIM SİSTEMİ

### Renk Paleti

```
Primary:      #208AEF  — butonlar, aktif sekmeler, vurgu
Success:      #059669  — onay, ödendi, katıldı
Danger:       #EF4444  — sil, hata, gecikmiş
Warning:      #D97706  — bekliyor, uyarı (amber)
Info:         #3B82F6  — bilgi badge

Background:   #F5F8FF  — ekran arka planı
Card:         #FFFFFF  — kart arka planı
Border:       #E5E7EB
TextPrimary:  #1A1A2E  — başlık
TextSecondary:#6B7280  — açıklama
TextMuted:    #9CA3AF  — meta/label

Avatar yeşil:  bg #D1FAE5, text #059669
Avatar mavi:   bg #EFF6FF, text #208AEF
```

### Tipografi

```
Büyük başlık:   24px, fontWeight 800
Orta başlık:    18–20px, fontWeight 700
Kart başlığı:   15–16px, fontWeight 700
Alt başlık:     14px, fontWeight 600
Gövde:          14px, fontWeight 400
Meta/etiket:    12–13px, fontWeight 500–600
Küçük label:    11–12px, fontWeight 500
```

### UI Bileşen Standartları

- **Kart**: `borderRadius: 14–16`, `backgroundColor: #FFF`, `shadowColor: #1E3A5F`, `shadowOpacity: 0.06–0.08`, `elevation: 2`
- **Buton (Primary)**: `backgroundColor: #208AEF`, `borderRadius: 12–14`, `paddingVertical: 14`, beyaz text, fontWeight 700
- **Buton (Outline)**: border 1.5 #208AEF, transparent bg, primary renk text
- **Badge/Rozet**: `borderRadius: 8–12`, küçük yatay padding, dolgu renk
- **Avatar**: Daire, initials (2 harf), arka plan tonu
- **Bottom Tab Bar**: 5 ikon, aktif → mavi #208AEF, pasif → #9CA3AF; height Android 72, iOS 96
- **Modal (Bottom Sheet)**: `borderTopLeftRadius: 24`, `borderTopRightRadius: 24`, `backgroundColor: #fff`, overlay `rgba(0,0,0,0.45)`
- **SafeAreaView**: Tüm ekranlarda zorunlu
- **ScrollView + RefreshControl**: Çekip yenile
- **FlatList**: Sayfalandırılmış listeler (sonsuz kaydırma)

### Stil Kuralları

- `StyleSheet.create()` — Tailwind yok
- `KeyboardAvoidingView` form ekranlarında
- Boş durum: merkezi Ionicons ikonu (büyük, soluk renk) + açıklama metni
- Yükleniyor: `ActivityIndicator` size="large" color="#208AEF"
- Hata: `Alert.alert('Hata', mesaj)`

---

## NAVIGASYON YAPISI

```
_layout.tsx (Root)
│
├── (auth)/                    ← Token YOK → bu gruba yönlendir
│   ├── _layout.tsx            ← Stack navigator, headerShown: false
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   └── verify-email.tsx
│
└── (app)/                     ← Token VAR → bu gruba yönlendir
    ├── _layout.tsx            ← Tabs (5 görünür tab + gizliler)
    │
    ├── [TAB 1] index.tsx           Akış (home ikonu)
    ├── [TAB 2] meal-menu/          Yemek Listesi (restaurant ikonu)
    │   ├── _layout.tsx             Stack
    │   └── index.tsx
    ├── [TAB 3] activities/         Etkinlikler (flame ikonu)
    │   ├── _layout.tsx             Stack
    │   ├── index.tsx               2 sekme: Etkinlikler + Etkinlik Sınıfları
    │   ├── [id].tsx                Etkinlik Sınıfı detay
    │   └── event/
    │       └── [id].tsx            Etkinlik detay
    ├── [TAB 4] stats.tsx           İstatistikler (bar-chart ikonu)
    ├── [TAB 5] profile.tsx         Profil (person ikonu)
    │
    ├── [GİZLİ] children/           href: null
    │   ├── _layout.tsx             Stack
    │   ├── index.tsx
    │   ├── add.tsx
    │   └── [id]/
    │       ├── index.tsx
    │       ├── edit.tsx
    │       └── health.tsx
    ├── [GİZLİ] schools/            href: null
    │   ├── _layout.tsx             Stack
    │   ├── index.tsx
    │   ├── join.tsx
    │   └── [id]/
    │       └── index.tsx
    ├── [GİZLİ] activity-classes/   href: null (activities tab'ından ulaşılır)
    │   ├── _layout.tsx             Stack
    │   ├── index.tsx
    │   └── [id].tsx
    ├── [GİZLİ] family/             href: null
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   └── emergency.tsx
    └── [GİZLİ] invoices/           href: null (Profil'den açılır)
        ├── _layout.tsx             Stack
        ├── index.tsx
        └── [id].tsx
```

### Auth Flow

1. App açılır → `AsyncStorage`'dan `parent_token` + `parent_user` okunur
2. Token var → `(app)/`'a yönlendir; token yok → `(auth)/login`'e
3. Login başarılı → `saveAuth(token, user)` → `(app)/`'a push
4. 401 response → Axios interceptor → token sil → `authEvent.trigger()` → login'e yönlendir

---

## AUTH GROUP EKRANLAR

---

### login.tsx

**Amaç:** E-posta + şifre ile giriş

**İçerik:**
- Üst: Logo/ikon alanı, uygulama adı "iStudy", kısa slogan
- E-posta input (`keyboardType="email-address"`)
- Şifre input + göster/gizle toggle (Ionicons eye/eye-off)
- "Giriş Yap" butonu (primary, full width)
- "Şifremi Unuttum" metin linki
- "Hesabın yok mu? Kayıt Ol" linki

**State:** `email`, `password`, `showPassword`, `loading`

**API:** `POST /parent/auth/login` → `{ email, password }` → `{ token, user }`

---

### register.tsx

**Amaç:** Yeni veli kaydı

**İçerik:**
- Ad input
- Soyad input
- E-posta input
- Telefon: ülke kodu seçici (bayrak + +kod + chevron) + numara input (yan yana)
- Şifre input + güç göstergesi (4 renk segment: kırmızı/turuncu/sarı/yeşil, canlı güncelleme)
- Şifre tekrar input
- "Kayıt Ol" primary butonu
- "Zaten hesabın var? Giriş Yap" linki

**Ülke Kodu Seçici Modali:**
- Arama input'u (ülke adı filtresi)
- FlatList: her satır → bayrak emoji + ülke adı + +kod
- Seçince modal kapanır, seçili ülke gösterilir

**Şifre Güç Kuralları:** uzunluk (8+), büyük harf, rakam, özel karakter

**State:** `form` objesi, `showPassword`, `showConfirm`, `countryModalVisible`, `countries[]`, `selectedCountry`, `passwordStrength (0–4)`, `loading`

**API:**
- `GET /parent/auth/countries` → ülke listesi (id, name, iso2, phone_code, flag_emoji)
- `POST /parent/auth/register` → `{ name, surname, email, phone_country_code?, phone?, password, password_confirmation }`

---

### forgot-password.tsx

**Amaç:** Şifre sıfırlama maili gönder

**İçerik:**
- Geri butonu
- İkon + başlık + açıklama
- E-posta input
- "Sıfırlama Linki Gönder" butonu
- Başarı sonrası: onay mesajı + "Giriş Yap" butonu

**API:** `POST /parent/auth/forgot-password` → `{ email }`

---

### verify-email.tsx

**Amaç:** E-posta doğrulama bekletme ekranı

**İçerik:**
- E-posta ikonu + başlık
- Açıklama metni (gönderilen adrese tıklamaları gerektiği)
- "Tekrar Gönder" butonu
- "Atla ve Devam Et" butonu (gri, metin linki)

**API:** `POST /parent/auth/resend-verification`

---

## APP GROUP — 5 ANA TAB

---

### index.tsx — Akış (Ana Sayfa)

**Amaç:** Okul ve global sosyal gönderileri göster

**İçerik:**
- Üst: 2 sekme → "Genel" | "Okullar" (animasyonlu alt çizgi göstergesi)
- Gönderi kartları:
  - Avatar (yazar baş harfleri, renkli daire)
  - Yazar adı + tarih (sağ taraf)
  - Metin içerik
  - Medya: resim (tam genişlik, borderRadius 10) veya video placeholder
  - Reaksiyon ikonu + sayısı, yorum ikonu + sayısı
  - Sabit gönderi: altın yıldız rozeti
  - Global gönderi: "Genel" etiketi
- Sonsuz kaydırma + RefreshControl

**State:** `activeTab: 'global'|'schools'`, `globalPosts[]`, `schoolPosts[]`, `page`, `lastPage`, `loading`, `refreshing`, `loadingMore`

**API:**
- `GET /parent/feed/global?page=N` → `{ data: Post[], meta: { last_page } }`
- `GET /parent/feed/schools?page=N`

**Tip:**
```typescript
Post {
  id: number; content: string; visibility: string
  is_pinned: boolean; is_global: boolean; published_at: string
  author: { id: number; name: string; surname: string } | null
  media: { id: number; url: string; type: string }[]
  reactions_count: number; comments_count: number
}
```

---

### meal-menu/index.tsx — Yemek Listesi

**Amaç:** Çocuğun sınıfına göre aylık yemek takvimi

**İçerik:**
- **Çocuk seçici** (birden fazla çocukta görünür):
  - Kapalı: seçili çocuk adı + dropdown ikonu
  - Açık: `position: absolute, zIndex: 10` liste (her satır: çocuk adı + okul/sınıf)
  - Tek çocuk: otomatik seçilir, seçici gösterilmez
- **Ay navigasyonu**: Sol ok (geçmiş) + "Mart 2026" + Sağ ok (gelecek aya geçiş engellenir)
- **Accordion günler** (her gün için `DayCard`):
  - Kapalı: tarih (14 Mart) + gün kısaltması (CUM) + öğün sayısı badge
  - Açık: animasyonlu expand, chevron 180° döner
  - Her öğün: öğün adı + yemek adı + besin listesi + alerjen chip'leri
- **Alerjen risk badge**: Düşük (yeşil), Orta (sarı/amber), Yüksek (kırmızı)
- Boş durumlar: okul kaydı yok / o ay menü yok

**State:** `children[]`, `selectedChild`, `childrenLoaded`, `year`, `month`, `menuData[]`, `loading`, `expandedDays: Set<string>`, `childSelectorOpen`

**API:**
- `GET /parent/meal-menus/children` → `[ { id, full_name, school_name, class_name } ]`
- `GET /parent/meal-menus?child_id=X&year=Y&month=M` → `[ { date, meals: [ { id, schedule_type, meal: { id, name, meal_type, ingredients: [ { name, allergens: [ { name, risk_level } ] } ] } } ] } ]`

---

### activities/index.tsx — Etkinlikler

**Amaç:** İki sekme: Okul etkinlikleri + Etkinlik sınıfları

**İçerik:**
- **Üst başlık**: "Etkinlikler"
- **2 sekme tab bar** (animasyonlu alt çizgi göstergesi):
  1. "Etkinlikler" — okul etkinlikleri
  2. "Etkinlik Sınıfları" — devam eden kurs sınıfları

**Etkinlikler Sekmesi — `ActivityCard`:**
- Sol: mavi/gri ikon kutusu (bayrak Ionicons)
- Etkinlik adı + okul adı
- Sağ: Durum rozeti (Katıldınız/X Çocuk / Kayıt Gerekli)
- Ücretli/Ücretsiz rozeti
- Tarih aralığı metni (ör: "21 Mar – 17 Nis")
- Sınıf kapsamı (ör: "Ay Sınıfı, Güneş Sınıfı" veya "Her sınıfa açık")
- Kayıt gerekli ama kayıtlı değilse: kilitli görsel (soluk arka plan, kilit ikonu, "Detayları görmek için katılın")
- Her zaman tıklanabilir → `/(app)/activities/event/{id}`

**Etkinlik Sınıfları Sekmesi — `ActivityClassCard`:**
- Yeşil ikon kutusu (yıldız Ionicons)
- Sınıf adı + dil etiketi (TR/EN)
- Açıklama (2 satır truncate)
- Meta: yaş aralığı + program + konum + kapasite
- Ücretli/Ücretsiz rozeti
- Kayıtlıysa mavi "Kayıtlı" rozeti
- Tıklanınca → `/(app)/activities/{id}`

**Lazy yükleme:** Etkinlikler tab açılışta, Etkinlik Sınıfları yalnızca sekme tıklanınca
**State:** Ayrı pagination state her sekme için (`actPage`, `acPage` vb.)

**API:**
- `GET /parent/activities?page=N&per_page=20`
- `GET /parent/activity-classes?page=N&per_page=20`

---

### activities/event/[id].tsx — Etkinlik Detay

**Amaç:** Etkinlik bilgileri + kayıt yönetimi + galeri + katılımcılar

**İçerik:**

**1. NavBar:** Geri butonu + "Etkinlik Detayı" başlığı

**2. Hero bölümü:**
- Büyük bayrak ikonu (mavi veya gri daire arka plan)
- Etkinlik adı (22px, bold)
- Okul adı (alt başlık)
- Rozet grubu: Katılım durumu (Katıldınız/X Çocuk/Kayıt Gerekli) + Ücretli/Ücretsiz

**3. Kayıt Yönetimi bölümü** (uygun çocuk varsa gösterilir):
- Kayıtlı her çocuk için satır:
  - Avatar (yeşil, baş harf) + çocuk adı + "Katılıyor" etiketi
  - `cancellation_allowed=true` ise "Ayrıl" butonu (kırmızı, X ikonu)
- Unenrolled uygun çocuk varsa: "Etkinliğe Katıl" / "Başka Çocuk Ekle" butonu (mavi)
- `cancellation_deadline` varsa + kayıtlıysa: "Son iptal tarihi: XX.XX.XXXX" notu
- `enrollments_count` varsa (kayıtlıysa görünür): "X kişi katılıyor"

**4. Etkinlik Bilgileri bölümü:**
- Açıklama (varsa)
- Info grid satırları (ikon + label + değer):
  - Başlangıç tarihi + saati
  - Bitiş tarihi + saati
  - Açık sınıflar: tag chip listesi veya "Her sınıfa açık etkinlik" (yeşil)

**5. Materyaller** (`canSeeExtras=true` ise):
- "Getirilmesi Gerekenler" başlığı
- Her materyal: `checkmark-circle-outline` ikonu + metin

**6. Galeri Kilitli Uyarısı** (`is_enrollment_required=true` + kayıtsız):
- Kilit ikonu + "Galeri Kilitli" + açıklama

**7. Galeri** (`canSeeExtras=true` ise):
- 3 sütun grid (tile boyutu: `(SCREEN_W-32-12)/3`)
- Resim: `Image` bileşeni
- Video: mor arka plan, play-circle ikonu
- Belge: amber arka plan, document ikonu
- Tıklanınca Lightbox modal açılır

**8. Katılımcılar** (`canSeeExtras=true` + liste doluysa):
- "Katılımcılar (X)" başlığı
- Her kişi: renkli daire avatar + gizlenmiş ad (ör: "Ali B.")

**Modallar:**

**Çocuk Seçim Modali (Bottom Sheet):**
- Handle çubuğu (gri yatay çizgi)
- Başlık: "Hangi çocuk katılacak?"
- Alt başlık: etkinlik adı
- Her uygun çocuk satırı:
  - Radio button (selected → filled, unselected → empty)
  - Çocuk adı
  - Zaten kayıtlıysa: gri + "Kayıtlı" amber rozeti + seçilemiyor
- İptal + Katıl butonları (yan yana)

**Galeri Lightbox Modali:**
- Tam ekran siyah arka plan
- Sağ üst: X kapatma butonu (beyaz)
- Resim: `resizeMode="contain"` full size
- Video/belge: ikon + dosya adı + boyut + "Aç / İndir" butonu (`Linking.openURL`)
- Alt: caption metni (varsa)

**State:** `activity`, `children[]`, `loading`, `refreshing`, `enrolling`, `selectedGallery`, `pickerVisible`, `pickerChildId`

**API:**
- `GET /parent/activities/{id}` → ActivityDetail
- `GET /parent/children` → FamilyChild[]
- `POST /parent/activities/{id}/enroll` → `{ child_id }`
- `DELETE /parent/activities/{id}/unenroll` → `{ child_id }`

**Tipler:**
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
FamilyChild {
  id: number; first_name: string; last_name: string; full_name: string
  school_id: number | null; classes?: { id: number; name: string }[]
}
```

---

### activities/[id].tsx — Etkinlik Sınıfı Detay (activities tab'ından)

`activity-classes/[id].tsx` ile aynı içerik (bakınız: Etkinlik Sınıfları bölümü)

---

### stats.tsx — İstatistikler

**Amaç:** Çocukların devam durumu istatistikleri

**İçerik:**
- **Yatay kaydırmalı çocuk seçici:**
  - Her çocuk için bir sekme butonu (ad + aktif çizgi)
  - Seçili → mavi, diğerleri gri
- **Okul & Sınıf bilgi kartı** (seçili çocuk için):
  - Okul adı (tıklanabilir → okul detayına gider)
  - Sınıf adı
- **2x2 İstatistik kartları:**
  - Geldi (yeşil) / Gelmedi (kırmızı) / Geç Geldi (amber) / İzinli (mavi)
  - Her kart: sayı (büyük) + label
- **Devam çubuğu:** Renkli bölmeli progress bar (yüzde gösterimi)
- **Katılım oranı badge:** `% XX` başarı oranı
- Boş durum: çocuk yoksa / veri yoksa açıklama

**State:** `children[]`, `selectedChildId`, `stats`, `loading`, `refreshing`

**API:**
- `GET /parent/children`
- `GET /parent/children/{id}/stats` → `{ child, school, classes, attendance: { total, present, absent, late, excused } }`

---

### profile.tsx — Profil

**Amaç:** Kullanıcı bilgileri ve navigasyon merkezi

**İçerik:**
- **Avatar:** Büyük daire (80px), ad+soyad baş harfleri, mavi arka plan
- **Ad Soyad** (20px bold) + e-posta (gri)
- **E-posta doğrulama rozeti:** Doğrulandıysa yeşil "Doğrulandı", değilse amber "Doğrulama Bekleniyor"
- **Bekleyen fatura uyarı banner** (varsa): amber arka plan, `!` ikonu, "X bekleyen faturanız var" + "Görüntüle" butonu
- **Liste bölümleri** (her biri beyaz kart içinde):
  - **Hesap**: "Bilgilerimi Düzenle" satırı
  - **Çocuklar & Okullar**: "Çocuklarım" satırı → `/(app)/children` + "Okullarım" satırı → `/(app)/schools`
  - **Aile**: "Aile Üyeleri" satırı → `/(app)/family`
  - **Mali İşlemler**: "Faturalarım" satırı → `/(app)/invoices` + bekleyen fatura sayı badge'i (turuncu)
  - **Uygulama Hakkında**: versiyon numarası
- **"Çıkış Yap" butonu** (kırmızı, bottom) → `Alert.alert` onay → logout API → token sil → login'e git

**`useFocusEffect`:** Her odaklanmada fatura stats fetch et

**API:**
- `GET /parent/invoices/stats`
- `POST /parent/auth/logout`

---

## APP GROUP — STACK EKRANLAR

---

### children/index.tsx — Çocuklarım

**Amaç:** Ailenin çocuk listesi

**İçerik:**
- **Sağ üst header butonu:** `+` (Ionicons add) → `/(app)/children/add`
- **Çocuk kartları:**
  - Avatar dairesi (renkli, baş harf)
  - Ad Soyad (bold)
  - Cinsiyet ikonu (male/female/other)
  - Yaş: doğum tarihinden hesapla (ör: "3 yaş")
  - Kan grubu badge (kırmızı)
  - Okul badge (varsa): mavi daire + okul adı kısaltması
- **Boş durum:** "Henüz çocuk eklemediniz" + "Çocuk Ekle" butonu

**API:** `GET /parent/children`

---

### children/add.tsx — Çocuk Ekle

**Amaç:** Yeni çocuk kaydı (uzun form)

**Form Bölümleri:**

**1. Temel Bilgiler:**
- Ad (zorunlu)
- Soyad (zorunlu)
- Doğum Tarihi → custom date picker modal (Yıl/Ay/Gün scroll)
- Cinsiyet: 3 seçenek buton (Erkek/Kız/Diğer)
- Kan Grubu: modal seçici (A+, A-, B+, B-, AB+, AB-, O+, O-)

**2. İletişim:**
- Telefon: ülke kodu seçici + numara (register ekranıyla aynı pattern)
- TC Kimlik No (opsiyonel)

**3. Uyruk:**
- Ülke seçici modal (arama + bayrak listesi)
- TR seçilirse TC Kimlik alanı; başka ülke seçilirse pasaport/TC toggle

**4. Diller:**
- Çoklu dil seçim modali (checkbox listesi, arama)

**5. Sağlık Bilgileri:**
- Alerjenler: "Alerjen Ekle" butonu → MultiSelectPickerModal
  - Önerilen liste (checkbox) + özel ekle input ("Ekle" butonu)
  - Seçilen alerjenler chip grid olarak gösterilir
- Rahatsızlıklar: aynı pattern
- İlaçlar: "İlaç Ekle" butonu → ilaç formu modali
  - İlaç adı (önerilen listeden veya özel)
  - Doz (text)
  - Kullanım Saatleri (HH:MM text, "+" ile birden fazla eklenebilir)
  - Kullanım Günleri (Pzt/Sal/Çar/Per/Cum/Cmt/Paz checkbox)

**6. Notlar:**
- Veli Notu (textarea)
- Özel Not (textarea)

**Footer:** Sticky "Kaydet" butonu (primary, full width)

**Modallar:**
1. Tarih seçici: Yıl/Ay/Gün ScrollView (drum/picker stili), "Tamam" butonu
2. Ülke seçici: FlatList + arama + bayrak emoji + ülke adı + telefon kodu
3. Dil seçici: FlatList + arama + checkbox
4. Alerjen/Hastalık seçici (MultiSelectPickerModal): önerilen checkbox listesi + özel ekle
5. İlaç formu: ad + doz + saatler + günler

**API:**
- `GET /parent/allergens` → `[ { id, name, status } ]`
- `GET /parent/medical-conditions`
- `GET /parent/medications`
- `GET /parent/countries`
- `GET /parent/blood-types`
- `POST /parent/children` → FormData veya JSON (tüm alanlar)

---

### children/[id]/index.tsx — Çocuk Detay

**Amaç:** Çocuğun tüm bilgileri tek ekranda

**İçerik:**

**Üst Header:**
- Geri butonu (sol)
- "Düzenle" butonu (sağ) → `/(app)/children/{id}/edit`

**Profil Bölümü:**
- Profil fotoğrafı (80px daire, tıklanabilir → galeri/kamera seçimi)
  - Fotoğraf yoksa: avatar (baş harf, mavi)
  - Yükleme sırasında: spinner overlay
- Ad Soyad (büyük başlık)
- Durum badge (Aktif=yeşil / Pasif=gri)
- Okul badge: tıklanabilir mavi rozet (okul adı) veya "Okul Yok" gri

**Bekleyen Kayıt Bildirimi** (varsa — sarı bildirim kartı):
- "X okuluna kayıt talebiniz inceleniyor"

**Sınıf Bilgi Kartı** (okul+sınıfa kayıtlıysa):
- Sınıf adı + renkli dot
- Öğrenci istatistikleri: Toplam/Erkek/Kız/Kapasite
- Yaş aralığı
- Öğretmen chip listesi

**Kişisel Bilgiler bölümü:**
- Doğum tarihi (DD.MM.YYYY)
- Cinsiyet (ikon + Türkçe)
- Kan grubu
- TC Kimlik / Pasaport No (varsa)
- Uyruk (bayrak emoji + ülke adı)
- Diller (virgülle ayrılmış)

**Sağlık Bilgileri bölümü:**
- Alerjenler: her biri için rozet — Onaylı (yeşil), Onay Bekleniyor (amber)
- Rahatsızlıklar: aynı pattern
- İlaçlar: ad + doz + kullanım saatleri + günler

**Notlar:**
- Veli notu
- Özel not

**Footer butonları:**
- "Sağlık Bilgilerini Düzenle" → `/(app)/children/{id}/health`
- "Çocuğu Sil" (kırmızı):
  - Okulsuzsa: `Alert.alert` onay → `DELETE /parent/children/{id}`
  - Okulluysa: `Alert.alert` "Kaldırma talebi gönderilsin mi?" → `POST /parent/children/{id}/removal-request`

**API:**
- `GET /parent/children/{id}`
- `POST /parent/children/{id}/profile-photo` (multipart)
- `DELETE /parent/children/{id}`
- `POST /parent/children/{id}/removal-request`

---

### children/[id]/edit.tsx — Çocuk Düzenle

`children/add.tsx` ile aynı form yapısı, önceden doldurulmuş.
Footer: "Güncelle" butonu

**API:**
- `GET /parent/children/{id}`
- `PUT /parent/children/{id}`

---

### children/[id]/health.tsx — Sağlık Bilgileri Düzenle

**Amaç:** Alerjen / rahatsızlık / ilaç yönetimi

**İçerik:**
- **Alerjenler bölümü:**
  - Mevcut liste: her biri chip (Onaylı → silme X'i göster; Onay Bekleniyor → kaldırılamaz, gri)
  - "Alerjen Ekle" butonu → MultiSelectPickerModal
- **Rahatsızlıklar bölümü:** Aynı
- **İlaçlar bölümü:**
  - Her ilaç için kart: ad + doz + günler + saatler + sil butonu (Onay Bekleniyor: silinemez)
  - "İlaç Ekle" butonu → ilaç formu modali
- Footer: "Kaydet" butonu

**Pending items:** `status === 'pending'` → "Onay Bekleniyor" amber badge, kaldırılamaz, readonly

**API:**
- `GET /parent/children/{id}`
- `GET /parent/allergens`, `GET /parent/medical-conditions`, `GET /parent/medications`
- `POST /parent/children/{id}/allergens` → `{ allergen_ids[], custom_name? }`
- `POST /parent/children/{id}/conditions`
- `POST /parent/children/{id}/medications` → `[{ medication_id?, custom_name?, dose, usage_time[], usage_days[] }]`

---

### schools/index.tsx — Okullarım

**Amaç:** Kayıtlı okullar + kayıt talepleri

**İçerik:**
- **Sağ üst:** "Katıl" butonu → `/(app)/schools/join`
- **Kayıtlı okul kartları:**
  - Avatar (okul baş harfi)
  - Okul adı + tür etiketi (Kreş/Anaokulu)
  - Adres
  - Katılım tarihi
  - Tıklanınca → `/(app)/schools/{id}`
- **"Kayıt Taleplerim" daraltılabilir bölüm** (talep varsa):
  - Chevron ile aç/kapat
  - Alt sekmeler: Bekleyen (sayı badge) / Reddedilen
  - Talep kartları: okul adı + adres + durum noktası + ret gerekçesi + tarih
- Boş durum: "Henüz bir okula kayıtlı değilsiniz" + "Okula Katıl" butonu

**API:**
- `GET /parent/schools`
- `GET /parent/my-enrollment-requests`

---

### schools/join.tsx — Okula Katıl

**Amaç:** Davet kodu/token ile okula başvuru

**İçerik:**
- Geri butonu
- Anahtar/kilit ikonu + "Okul Davet Kodu" başlığı
- Açıklama metni
- Davet kodu text input
- "Gönder" butonu (primary)
- Başarı: yeşil checkmark + "Talebiniz okula iletildi" mesajı + "Tamam" butonu

**API:** `POST /parent/schools/join` → `{ invite_token }`

---

### schools/[id]/index.tsx — Okul Detay

**Amaç:** Okul bilgileri + feed + çocuk kayıt

**İçerik:**
- **Header:** Geri butonu + okul adı
- **Okul bilgi kartı:**
  - Avatar (büyük, okul baş harfi)
  - Okul adı + tür
  - Adres, telefon, e-posta (ikon + değer satırları)
- **Kayıtlı çocuklar bölümü** (varsa — yeşil kart):
  - Her çocuk için tıklanabilir satır → çocuk detayına gider
- **"Etkinlik Sınıfları" butonu:** `/(app)/activity-classes`
- **2 sekme tab bar:**
  1. **Feed:** `FlatList` gönderi kartları (sonsuz kaydırma)
  2. **Çocuk Kaydı:**
     - Kayıtsız çocuklar listesi (checkbox seçimi)
     - "Kaydı Gönder" butonu
- **Çocuk kayıt başarı/hata:** `Alert.alert`

**API:**
- `GET /parent/schools/{id}`
- `GET /parent/schools/{id}/feed?page=N`
- `GET /parent/children`
- `POST /parent/schools/{id}/enroll-child` → `{ child_id }`

---

### activity-classes/index.tsx — Etkinlik Sınıfları Listesi

**Amaç:** Tenant'a ait tüm etkinlik sınıfları

**İçerik:** `activities/index.tsx` içindeki "Etkinlik Sınıfları" sekmesiyle aynı `ActivityClassCard` bileşeni

(Bu ekran hidden tab, `activities/index.tsx` ikinci sekmesinden veya okul detayından erişilir)

**API:** `GET /parent/activity-classes?page=N&per_page=20`

---

### activity-classes/[id].tsx — Etkinlik Sınıfı Detay

**Amaç:** Etkinlik sınıfı bilgileri + kayıt yönetimi + galeri

**İçerik:**

**1. Header:** Geri butonu (sola ok)

**2. Hero bölümü:**
- Sınıf adı (büyük, bold)
- Dil etiketi (TR/EN) + Ücretli/Ücretsiz badge
- Açıklama

**3. Bilgi kartları grid (2 sütun):**
- Yaş aralığı (people ikonu)
- Kapasite (grid ikonu) — "X/Y"
- Program (time ikonu)
- Konum (location ikonu)
- Tarih aralığı (calendar, full width)

**4. Kayıt Durumu bölümü:**
- Kayıtlı her çocuk:
  - Checkmark (yeşil) + çocuk adı
  - "İptal" butonu (kırmızı metin)
- Kayıtlı çocuk yoksa: "Kayıtlı çocuğunuz yok."
- Kayıt yapılabilecek çocuk varsa: "Çocuğumu Kayıt Et" butonu (mavi)

**5. Öğretmenler** (varsa):
- Her öğretmen: person ikonu + ad + rol

**6. Materyaller** (varsa):
- Her materyal: renkli dot (kırmızı=zorunlu, yeşil=opsiyonel) + ad + adet + "Zorunlu" badge

**7. Galeri butonu:**
- "Galeriyi Görüntüle" tıklanınca → galeri API'si fetch → full-screen modal

**Çocuk Kayıt Modali (Bottom Sheet):**
- Başlık: "Çocuğumu Kayıt Et"
- Alt başlık: "Kayıt etmek istediğiniz çocuğu seçin"
- Çocuk listesi (radio seçim):
  - Seçili → mavi border + mavi background
  - Her çocuk: radio ikon + ad
- Ücretli ise sarı info notu (fiyat + "Ödeme zorunlu/Sonra ödenebilir")
- İptal + Kayıt Et butonları

**Galeri Full-Screen Modal:**
- Siyah arka plan
- Tüm fotoğraflar dikey scroll grid
- Sağ üst: X kapat
- Boş durum: "Galeri boş."

**State:** `activityClass`, `gallery[]`, `galleryLoaded`, `myEnrollments[]`, `familyChildren[]`, `showEnrollModal`, `selectedChildId`, `enrolling`, `showGallery`, `loading`, `refreshing`

**API:**
- `GET /parent/activity-classes/{id}`
- `GET /parent/activity-classes/my-enrollments`
- `GET /parent/children`
- `POST /parent/activity-classes/{id}/enroll` → `{ child_id }`
- `DELETE /parent/activity-classes/{id}/children/{childId}/unenroll`
- `GET /parent/activity-classes/{id}/gallery`

**Tip:**
```typescript
ActivityClassDetail {
  id: number; name: string; description: string | null
  language: string; age_min: number | null; age_max: number | null
  capacity: number | null; active_enrollments_count: number
  is_paid: boolean; price: string | null; currency: string
  invoice_required: boolean; start_date: string | null; end_date: string | null
  schedule: string | null; location: string | null; is_school_wide: boolean
  school_classes: { id: number; name: string }[]
  teachers: { id: number; name: string; role: string | null }[]
  materials: { id: number; name: string; quantity: string | null; is_required: boolean; description: string | null }[]
  enrolled_child_ids: number[]
}
```

---

### family/index.tsx — Aile Üyeleri

**Amaç:** Aile üyelerini görme ve yönetme

**İçerik:**
- **Sağ üst:** "Üye Ekle" butonu (yalnızca `super_parent` için görünür)
- **Üye kartları:**
  - Avatar (baş harf, renk kodlu)
  - Ad Soyad
  - İlişki türü (Anne, Baba, Büyükanne vb.)
  - Rol rozeti: "Ana Veli" (mavi) / "Eş Veli" (gri)
  - Aktif/Pasif nokta göstergesi
  - Kaldır butonu (kırmızı çöp kutusu) — Ana Veli için gizli
- Boş durum

**Üye Ekleme Modali (Bottom Sheet):**
- Başlık: "Aile Üyesi Ekle"
- E-posta input
- İlişki türü input (opsiyonel)
- İptal + Ekle butonları

**Kaldır:** `Alert.alert` onay → `DELETE /parent/family/members/{userId}`

**API:**
- `GET /parent/family/members`
- `POST /parent/family/members` → `{ email, relation_type? }`
- `DELETE /parent/family/members/{userId}`

**Tip:**
```typescript
FamilyMember {
  id: number; user_id: number
  user: { id: number; name: string; surname: string; email: string; phone: string | null } | null
  relation_type: string; role: 'super_parent'|'co_parent'; is_active: boolean
}
```

---

### family/emergency.tsx — Acil İletişim Kişileri

**Amaç:** Acil durum kişileri CRUD

**İçerik:**
- Kişi kartları: ad + ilişki + telefon + ülke bayrağı
- "Kişi Ekle" butonu (sağ üst)

**Kişi Ekle/Düzenle Modali:**
- Ad (zorunlu)
- Soyad
- İlişki türü (ör: Dede, Komşu)
- Telefon: inline ülke kodu seçici (dropdown, NOT nested Modal) + numara
- Uyruk: inline ülke seçici (opsiyonel)
- TC Kimlik / Pasaport (uyruk seçilirse, toggle ile ikisi arasında seçim)

**NOT:** iOS nested Modal açılamaz → ülke seçicileri inline dropdown pattern kullanır

**API:**
- `GET /parent/family/emergency-contacts`
- `POST /parent/family/emergency-contacts`
- `PUT /parent/family/emergency-contacts/{id}`
- `DELETE /parent/family/emergency-contacts/{id}`

---

### invoices/index.tsx — Faturalarım

**Amaç:** Tüm fatura listesi + istatistikler

**İçerik:**
- **İstatistik satırı (3 kart yatay):**
  - Bekleyen (amber): sayı
  - Gecikmiş (kırmızı): sayı
  - Ödendi (yeşil): sayı
- **Fatura kartları:**
  - Sol renkli border (Gecikmiş=kırmızı, İade=mor, diğerleri normal)
  - Fatura numarası + modül badge (Etkinlik Sınıfı/Abonelik vb.)
  - Fatura tipi rozeti: Normal / İade (mor, return ikonu)
  - Çocuk adı (person ikonu)
  - Son ödeme tarihi (calendar ikonu)
  - Sağ: Tutar + para birimi + durum badge
  - Gecikmiş: kırmızı nokta + "Gecikmiş!" uyarısı
- Sonsuz kaydırma + RefreshControl

**Durum badge renkleri:**
- `draft`: gri — "Taslak"
- `pending`: amber — "Bekliyor"
- `paid`: yeşil — "Ödendi"
- `overdue`: kırmızı — "Gecikmiş"
- `cancelled`: gri — "İptal"
- `refunded`: mor — "İade Edildi"

**API:**
- `GET /parent/invoices?page=N&per_page=15`
- `GET /parent/invoices/stats`

**Tip:**
```typescript
Invoice {
  id: number; invoice_no: string
  module: 'subscription'|'activity_class'|'manual'|'event'|'activity'
  invoice_type: 'invoice'|'refund'
  status: 'draft'|'pending'|'paid'|'cancelled'|'overdue'|'refunded'
  total_amount: number; currency: string
  due_date: string | null; paid_at: string | null
  is_overdue: boolean; created_at: string
  activity_class: { id: number; name: string } | null
  child: { id: number; full_name: string } | null
}
InvoiceStats {
  total: number; pending_count: number; paid_count: number
  overdue_count: number; pending_amount: number
}
```

---

### invoices/[id].tsx — Fatura Detay

**Amaç:** Fatura detayı + kalemler + ödeme geçmişi

**İçerik:**

**1. Hero kart:**
- Fatura numarası (bold)
- Durum rozeti (renkli)
- Modül badge
- Büyük tutar + para birimi

**2. Fatura Bilgileri bölümü:**
- Düzenleme tarihi
- Son ödeme tarihi
- Ödeme tarihi (ödendiyse)
- Çocuk adı

**3. Etkinlik Sınıfı bilgisi** (varsa):
- Sınıf adı, konum, program, tarih aralığı

**4. Kalemler tablosu:**
- Başlık satırı: Açıklama | Adet | Birim Fiyat | Toplam
- Her kalem satırı
- Ara toplam
- **Genel Toplam** (bold, büyük)

**5. Ödeme İşlemleri** (varsa):
- Her işlem: sipariş ID + tutar + durum + banka + kart son 4 hanesi + hata mesajı

**6. İade linkleri:**
- Normal faturada iade varsa: "İade Faturasına Git" linki
- İade faturasında: "Orijinal Faturaya Git" + iade gerekçesi

**API:** `GET /parent/invoices/{id}`

**Tip:**
```typescript
InvoiceDetail {
  id: number; invoice_no: string; module: string; invoice_type: 'invoice'|'refund'
  original_invoice_id: number | null; refund_reason: string | null
  status: string; total_amount: number; currency: string; notes: string | null
  issue_date: string; due_date: string | null; paid_at: string | null
  is_overdue: boolean; created_at: string
  items: InvoiceItem[]
  transactions: Transaction[]
  activity_class: { id: number; name: string; location: string|null; schedule: string|null; start_date: string|null; end_date: string|null } | null
  child: { id: number; full_name: string } | null
  refund_invoice: { id: number; invoice_number: string; status: string } | null
  original_invoice: { id: number; invoice_number: string; amount: number; currency: string; status: string } | null
}
InvoiceItem { id: number; description: string; quantity: number; unit_price: number; total_price: number }
Transaction {
  id: number; order_id: string; amount: number
  status: 0|1|2  // 0=bekliyor, 1=başarılı, 2=başarısız
  payment_gateway: string; bank_name: string|null; card_last_four: string|null
  error_message: string|null; created_at: string
}
```

---

## ORTAK YARDIMCI DOSYALAR

### src/lib/api.ts

```typescript
// Axios instance — token interceptor + 401 handler
const api = axios.create({ baseURL: 'http://10.0.2.2:8000/api' });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('parent_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401) {
    await AsyncStorage.multiRemove(['parent_token', 'parent_user']);
    authEvent.trigger();
  }
  return Promise.reject(error);
});
export default api;
```

### src/lib/auth.ts

```typescript
export const TOKEN_KEY = 'parent_token';
export const USER_KEY = 'parent_user';
export async function saveAuth(token: string, user: object) { ... }
export async function clearAuth() { ... }
export function getApiError(err: unknown): string {
  return (err as any)?.response?.data?.message ?? 'Bir hata oluştu.';
}
```

### src/lib/authEvent.ts

```typescript
// 401 global callback pattern
let callback: (() => void) | null = null;
export const authEvent = {
  register: (cb: () => void) => { callback = cb; },
  trigger: () => { if (callback) callback(); },
  unregister: () => { callback = null; },
};
```

---

## KRİTİK NOTLAR

1. **Expo Router Stack Layout Zorunluluğu:** Her klasörde `_layout.tsx` ile Stack navigator tanımla; aksi halde alt ekranlar ayrı tab olarak görünür
   ```typescript
   export default function Layout() {
     return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="index" /><Stack.Screen name="[id]" /></Stack>;
   }
   ```

2. **iOS nested Modal:** Modal içinde Modal açılamaz (iOS). Ülke/uyruk seçicileri inline dropdown olarak yaz

3. **Signed URL (galeri/profil foto):** Mobile `<Image>` auth header gönderemez. Backend imzalı URL döner, mobil doğrudan erişir

4. **API hata mesajı:** `getApiError(err)` helper kullan: `err?.response?.data?.message ?? 'Bir hata oluştu.'`

5. **Tab label uzun:** `fontSize: 8, fontWeight: '600', flexWrap: 'wrap', textAlign: 'center'` + tab bar height Android: 72, iOS: 96

6. **Tarih formatlama:** `new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR')` — timezone sorununu önler

7. **Tab fetch flag:** `const [xxxFetched, setXxxFetched] = useState(false)` pattern kullan; `data.length === 0` kontrolüyle karıştırma

8. **Pagination state:** `page`, `lastPage`, `loadingMore` ayrı state'lere yönet; `onEndReachedThreshold: 0.3`

9. **Gizli tab'lar:** `href: null` ile tab bar'dan gizle ama route olarak erişilebilir bırak

---

## TÜM API ENDPOINT LİSTESİ

```
# Auth (Public)
POST   /parent/auth/register
POST   /parent/auth/login
POST   /parent/auth/forgot-password
GET    /parent/auth/countries
GET    /parent/auth/blood-types

# Auth (Token)
POST   /parent/auth/logout
POST   /parent/auth/resend-verification

# Referans
GET    /parent/allergens
GET    /parent/medical-conditions
GET    /parent/medications
GET    /parent/countries
GET    /parent/blood-types

# Çocuklar
GET    /parent/children
GET    /parent/children/{id}
POST   /parent/children
PUT    /parent/children/{id}
DELETE /parent/children/{id}
POST   /parent/children/{id}/profile-photo      (multipart)
GET    /parent/children/{id}/photo              (signed, auth header gerekmez)
GET    /parent/children/{id}/stats
POST   /parent/children/{id}/allergens
POST   /parent/children/{id}/conditions
POST   /parent/children/{id}/medications
POST   /parent/children/{id}/suggest-allergen
POST   /parent/children/{id}/suggest-condition
POST   /parent/children/{id}/suggest-medication
POST   /parent/children/{id}/removal-request

# Aile
GET    /parent/family/members
POST   /parent/family/members
DELETE /parent/family/members/{userId}
GET    /parent/family/emergency-contacts
POST   /parent/family/emergency-contacts
PUT    /parent/family/emergency-contacts/{id}
DELETE /parent/family/emergency-contacts/{id}

# Okullar
GET    /parent/schools
GET    /parent/schools/{id}
GET    /parent/schools/{id}/feed
GET    /parent/my-enrollment-requests
POST   /parent/schools/join
POST   /parent/schools/{id}/enroll-child

# Etkinlikler
GET    /parent/activities
GET    /parent/activities/{id}
POST   /parent/activities/{id}/enroll
DELETE /parent/activities/{id}/unenroll

# Etkinlik Sınıfları
GET    /parent/activity-classes
GET    /parent/activity-classes/{id}
GET    /parent/activity-classes/my-enrollments
POST   /parent/activity-classes/{id}/enroll
DELETE /parent/activity-classes/{id}/children/{childId}/unenroll
GET    /parent/activity-classes/{id}/gallery

# Yemek
GET    /parent/meal-menus/children
GET    /parent/meal-menus?child_id=X&year=Y&month=M

# Feed
GET    /parent/feed/global
GET    /parent/feed/schools

# Faturalar
GET    /parent/invoices
GET    /parent/invoices/stats
GET    /parent/invoices/{id}
```

---

## DOSYA OLUŞTURMA SIRASI (Öneri)

1. `src/lib/api.ts`, `src/lib/auth.ts`, `src/lib/authEvent.ts`
2. `src/app/_layout.tsx` (root AuthContext)
3. `(auth)/` grubu: login → register → forgot-password → verify-email
4. `(app)/_layout.tsx` (Tab navigator)
5. `(app)/index.tsx` (Feed)
6. `(app)/profile.tsx`
7. `(app)/stats.tsx`
8. `(app)/meal-menu/` (layout + index)
9. `(app)/activities/` (layout + index + event/[id] + [id])
10. `(app)/children/` (layout + index + add + [id]/index + [id]/edit + [id]/health)
11. `(app)/schools/` (layout + index + join + [id]/index)
12. `(app)/activity-classes/` (layout + index + [id])
13. `(app)/family/` (layout + index + emergency)
14. `(app)/invoices/` (layout + index + [id])

---

## EKSİK / ÖNCE OLUŞTURULACAK EKRANLAR

Aşağıdaki ekranlar mutlaka oluşturulmalıdır. Her birini yukarıdaki spec'e birebir uygun şekilde yaz.

---

### ✅ (auth)/register.tsx — Kayıt Ol

**Dosya yolu:** `src/app/(auth)/register.tsx`

**Amaç:** Yeni veli hesabı oluşturma

**Ekranda neler var:**
- KeyboardAvoidingView + ScrollView
- Üst: geri butonu + "Hesap Oluştur" başlığı
- **Ad** TextInput (zorunlu)
- **Soyad** TextInput (zorunlu)
- **E-posta** TextInput (`keyboardType="email-address"`, zorunlu)
- **Telefon satırı** (yatay, yan yana):
  - Sol: Ülke kodu seçici butonu → bayrak emoji + "+90" metni + chevron ikonu (dokunulunca `countryModalVisible=true`)
  - Sağ: Numara TextInput (`keyboardType="phone-pad"`)
- **Şifre** TextInput (`secureTextEntry`) + sağda göster/gizle toggle (eye/eye-off Ionicons)
- **Şifre Güç Çubuğu:** 4 eşit segment, sola→sağa dolar
  - 1 segment dolu → kırmızı (Zayıf)
  - 2 segment → turuncu
  - 3 segment → sarı
  - 4 segment → yeşil (Güçlü)
  - Kural kontrolleri: `length>=8`, büyük harf, rakam, özel karakter
- **Şifre Tekrar** TextInput (`secureTextEntry`) + göster/gizle toggle
- **"Kayıt Ol"** butonu (primary, full width, loading spinner)
- Alt: "Zaten hesabın var mı? **Giriş Yap**" linki

**Ülke Kodu Seçici Modal:**
- `Modal visible={countryModalVisible}` transparent + slide animasyon
- Bottom sheet stili (borderTopRadius 24)
- Üst: "Ülke Kodu" başlığı + X kapat
- Arama TextInput (`placeholder="Ülke ara..."`)
- FlatList: her satır → `{flag_emoji} {name} {+phone_code}` + dokunulunca seç ve kapat
- Varsayılan seçili: Türkiye (+90)

**State:**
```typescript
const [form, setForm] = useState({
  name: '', surname: '', email: '',
  phone: '', password: '', passwordConfirm: '',
});
const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
const [countries, setCountries] = useState<Country[]>([]);
const [countrySearch, setCountrySearch] = useState('');
const [countryModalVisible, setCountryModalVisible] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
const [loading, setLoading] = useState(false);
```

**Şifre güç hesaplama:**
```typescript
function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}
```

**Validasyon:**
- Boş alan kontrolü
- E-posta format
- Şifre güç ≥ 3
- Şifre eşleşmesi

**API:**
- `GET /parent/auth/countries` → `Country[]` — sayfa açılınca fetch
- `POST /parent/auth/register` → `{ name, surname, email, phone_country_code?, phone?, password, password_confirmation }`
- Başarıda: `saveAuth(token, user)` → `router.replace('/(app)')` (veya verify-email'e yönlendir)

---

### ✅ (auth)/forgot-password.tsx — Şifremi Unuttum

**Dosya yolu:** `src/app/(auth)/forgot-password.tsx`

**Amaç:** Şifre sıfırlama e-postası gönder

**Ekranda neler var (2 aşamalı):**

**Aşama 1 — Form:**
- Geri butonu (sol üst)
- Üst merkez: kilit/anahtar ikonu (büyük, mavi daire arka plan)
- "Şifremi Unuttum" başlığı
- Açıklama: "E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz."
- **E-posta** TextInput (`keyboardType="email-address"`)
- **"Sıfırlama Linki Gönder"** butonu (primary, full width, loading spinner)
- Alt: "Şifreni hatırladın mı? **Giriş Yap**" linki → `router.back()`

**Aşama 2 — Başarı (state `sent=true`):**
- Büyük yeşil checkmark ikonu (checkmark-circle, #059669, 64px)
- "E-posta Gönderildi!" başlığı
- "**{email}** adresine şifre sıfırlama bağlantısı gönderdik." açıklama metni
- "Giriş Yap" butonu (primary) → `router.replace('/(auth)/login')`

**State:**
```typescript
const [email, setEmail] = useState('');
const [loading, setLoading] = useState(false);
const [sent, setSent] = useState(false);
```

**API:** `POST /parent/auth/forgot-password` → `{ email }`
- Başarıda: `setSent(true)`
- Hata: `Alert.alert('Hata', getApiError(err))`

---

### ✅ (app)/stats.tsx — İstatistikler

**Dosya yolu:** `src/app/(app)/stats.tsx`

**Amaç:** Çocuğun okul devam istatistiklerini göster

**Ekranda neler var:**

**Header bölümü:**
- "İstatistikler" başlığı (24px, bold)

**Çocuk seçici (yatay kaydırmalı ScrollView, `horizontal`):**
- Her çocuk için sekme butonu: `[Ad Soyad]`
- Seçili → mavi arka plan, beyaz metin, borderRadius 20
- Seçili değil → şeffaf arka plan, gri metin
- `showsHorizontalScrollIndicator={false}`

**Veri bölümü (seçili çocuk için):**

**Okul & Sınıf Bilgi Kartı** (beyaz kart, padding 16, borderRadius 14):
- Satır 1: school-outline ikonu + okul adı (tıklanabilir → `router.push('/(app)/schools/{school.id}')`)
- Satır 2: book-outline ikonu + sınıf adı (varsa)
- Sınıf yoksa: "Henüz bir sınıfa atanmadı" gri metin

**2×2 İstatistik Kartları Gridi:**
- Her kart: beyaz, borderRadius 14, padding 16, ortalanmış içerik
  - Üst: renkli büyük ikon (Ionicons 32px)
  - Sayı: 36px, fontWeight 800, renk
  - Label: 13px, gri
- **Geldi** (checkmark-circle, #059669 yeşil)
- **Gelmedi** (close-circle, #EF4444 kırmızı)
- **Geç Geldi** (time, #D97706 amber)
- **İzinli** (document-text, #3B82F6 mavi)

**Devam Çubuğu:**
- Etiket: "Devam Durumu"
- Renkli progress bar (yükseklik 12, borderRadius 6):
  - Yeşil segment: `present/total * 100%`
  - Kırmızı: `absent/total * 100%`
  - Amber: `late/total * 100%`
  - Mavi: `excused/total * 100%`
- Renk lejant satırı (her renk için nokta + label + sayı)

**Katılım Oranı Badge:**
- Yuvarlak badge (64px), `#208AEF` border
- İçinde: `%XX` büyük bold + "Katılım Oranı" küçük

**Boş durumlar:**
- Hiç çocuk yoksa: merkezi "Henüz çocuğunuz eklenmemiş" + "Çocuk Ekle" butonu → `/(app)/children/add`
- Çocuk var ama veri yoksa: "İstatistik verisi bulunamadı."

**State:**
```typescript
const [children, setChildren] = useState<ChildSummary[]>([]);
const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
const [stats, setStats] = useState<ChildStats | null>(null);
const [loading, setLoading] = useState(true);
const [statsLoading, setStatsLoading] = useState(false);
const [refreshing, setRefreshing] = useState(false);
```

**API:**
- `GET /parent/children` → ChildSummary[] — ilk açılışta
- `GET /parent/children/{id}/stats` → ChildStats — çocuk seçilince

**Tipler:**
```typescript
ChildSummary { id: number; first_name: string; last_name: string; full_name: string }
ChildStats {
  child: { id: number; full_name: string }
  school: { id: number; name: string } | null
  classes: { id: number; name: string }[]
  attendance: { total: number; present: number; absent: number; late: number; excused: number }
}
```

---

### ✅ (app)/profile.tsx — Profil

**Dosya yolu:** `src/app/(app)/profile.tsx`

**Amaç:** Kullanıcı bilgileri + tüm navigasyon menüsü

**`useFocusEffect` ile her odaklanmada:**
- `GET /parent/invoices/stats` → bekleyen fatura sayısı fetch et

**Ekranda neler var:**

**Üst profil alanı** (beyaz kart, ortalanmış):
- Avatar dairesi (80×80px, borderRadius 40):
  - Arka plan: `#208AEF`
  - İçinde: ad + soyadın baş harfleri (beyaz, 28px, bold)
- Ad Soyad (20px, fontWeight 800, #1A1A2E)
- E-posta (14px, #6B7280)
- E-posta doğrulama rozeti:
  - Doğrulandı → `checkmark-circle` yeşil + "Doğrulandı"
  - Doğrulanmadı → `alert-circle` amber + "Doğrulama Bekleniyor"

**Bekleyen Fatura Uyarı Banner** (`pendingCount > 0` ise görünür):
- Arka plan: `#FEF3C7` (amber açık)
- Sol: `alert-circle` ikonu (#D97706)
- Metin: "{pendingCount} bekleyen faturanız var"
- Sağ: "Görüntüle" butonu → `router.push('/(app)/invoices')`

**Menü Bölümleri** (her biri beyaz kart, gap: 1px içeride `borderBottomWidth: 1, borderBottomColor: '#F3F4F6'`):

**Bölüm: Hesap**
- Satır: `person-outline` + "Profil Bilgilerim" + chevron → (profil düzenleme — şimdilik `Alert.alert('Yakında', 'Bu özellik çok yakında eklenecek.')`)

**Bölüm: Çocuklar & Okullar**
- Satır: `people-outline` + "Çocuklarım" + chevron → `router.push('/(app)/children')`
- Satır: `school-outline` + "Okullarım" + chevron → `router.push('/(app)/schools')`

**Bölüm: Aile**
- Satır: `heart-outline` + "Aile Üyeleri" + chevron → `router.push('/(app)/family')`
- Satır: `call-outline` + "Acil İletişim Kişileri" + chevron → `router.push('/(app)/family/emergency')`

**Bölüm: Mali İşlemler**
- Satır: `receipt-outline` + "Faturalarım" + chevron sağı
  - Bekleyen count varsa sağ tarafta turuncu daire badge (`{pendingCount}`)
  - `router.push('/(app)/invoices')`

**Bölüm: Uygulama Hakkında**
- Satır: `information-circle-outline` + "Versiyon" + sağda "1.0.0" gri metin (chevron yok)

**"Çıkış Yap" butonu** (tam genişlik, kırmızı, `borderRadius 12`, `marginTop: 24`):
- İkon: `log-out-outline` + "Çıkış Yap"
- `onPress`: `Alert.alert('Çıkış', 'Çıkış yapmak istediğinize emin misiniz?', [İptal, Evet])`
- Onayda:
  1. `POST /parent/auth/logout`
  2. `clearAuth()`
  3. `router.replace('/(auth)/login')`

**Menü satırı bileşeni (tekrar kullanılır):**
```typescript
function MenuRow({ icon, label, onPress, rightText?, badgeCount? }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#6B7280" />
      <Text style={styles.menuLabel}>{label}</Text>
      {badgeCount ? <View style={styles.badge}><Text>{badgeCount}</Text></View> : null}
      {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
      {!rightText && <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />}
    </TouchableOpacity>
  );
}
```

**State:**
```typescript
const [user, setUser] = useState<AuthUser | null>(null);
const [pendingCount, setPendingCount] = useState(0);
const [logoutLoading, setLogoutLoading] = useState(false);
```

**Kullanıcı bilgisi:** `AsyncStorage.getItem('parent_user')` → JSON.parse → `setUser`

**API:**
- `GET /parent/invoices/stats` → `{ pending_count }` → `setPendingCount`
- `POST /parent/auth/logout` — çıkış yapınca

---

### ✅ (app)/family/index.tsx — Aile Üyeleri

**Dosya yolu:** `src/app/(app)/family/index.tsx`

**Amaç:** Aile üyelerini listele, ekle, kaldır

**Ekranda neler var:**

**Header:**
- Geri butonu (sol) → `router.back()`
- "Aile Üyeleri" başlığı (orta)
- Sağ üst: "Üye Ekle" butonu (mavi `+` ikonu) — yalnızca `user.role === 'super_parent'` ise görünür

**Üye Kartları** (`FlatList`):
Her kart (beyaz, borderRadius 14, padding 14, shadow):
- **Sol:** Avatar dairesi (44px, renkli arka plan, baş harf)
  - `super_parent` → mavi (`#EFF6FF` bg, `#208AEF` text)
  - `co_parent` → gri (`#F3F4F6` bg, `#6B7280` text)
- **Orta (flex:1):**
  - Ad Soyad (15px, bold, #1F2937)
  - İlişki türü (13px, #6B7280) — ör: "Anne", "Baba"
  - E-posta (12px, #9CA3AF)
  - Rol rozeti + Aktiflik noktası:
    - `super_parent` → mavi badge "Ana Veli"
    - `co_parent` → gri badge "Eş Veli"
    - Aktif → yeşil nokta; Pasif → gri nokta
- **Sağ:** Kaldır butonu (çöp kutusu ikonu, kırmızı)
  - Gizlenme koşulları: kendisi ise VEYA hedef `super_parent` ise → buton gösterilmez
  - `onPress` → `Alert.alert('Üyeyi Kaldır', 'Emin misiniz?', [İptal, Kaldır(kırmızı)])`

**Boş durum:**
- `people-outline` ikonu (48px, #D1D5DB)
- "Aile üyesi bulunamadı."

**Üye Ekleme Modali (Bottom Sheet):**
- Handle çubuğu
- Başlık: "Aile Üyesi Ekle"
- Açıklama: "Sisteme kayıtlı kullanıcının e-postasını girin."
- **E-posta** TextInput (`keyboardType="email-address"`, autoCapitalize="none")
- **İlişki Türü** TextInput (opsiyonel, placeholder: "ör: Anne, Baba, Büyükbaba...")
- Butonlar (yan yana): "İptal" (outline) + "Ekle" (primary, loading spinner)
- Hata: `Alert.alert('Hata', message)` — kullanıcı bulunamazsa "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı."

**State:**
```typescript
const [members, setMembers] = useState<FamilyMember[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);
const [addEmail, setAddEmail] = useState('');
const [addRelation, setAddRelation] = useState('');
const [adding, setAdding] = useState(false);
const [currentUserRole, setCurrentUserRole] = useState<'super_parent'|'co_parent'>('co_parent');
```

**API:**
- `GET /parent/family/members` → `FamilyMember[]`
- `POST /parent/family/members` → `{ email, relation_type? }` → 200 başarı / 404 kullanıcı yok
- `DELETE /parent/family/members/{userId}`

**Tip:**
```typescript
FamilyMember {
  id: number
  user_id: number
  user: { id: number; name: string; surname: string; email: string; phone: string | null } | null
  relation_type: string
  role: 'super_parent' | 'co_parent'
  is_active: boolean
}
```

---

### ✅ (app)/family/emergency.tsx — Acil İletişim Kişileri

**Dosya yolu:** `src/app/(app)/family/emergency.tsx`

**Amaç:** Acil durum iletişim kişilerini CRUD ile yönet

**Ekranda neler var:**

**Header:**
- Geri butonu + "Acil İletişim Kişileri" başlığı
- Sağ üst: `+` "Kişi Ekle" butonu

**Kişi Kartları** (`FlatList`):
Her kart (beyaz, borderRadius 14, padding 14):
- **Sol:** Kırmızı daire avatar (`#FEE2E2` bg, `#EF4444` text, kişi baş harfi)
- **Orta:**
  - Ad Soyad (bold)
  - İlişki türü (gri)
  - Telefon: bayrak emoji + numara
  - Uyruk (varsa): bayrak emoji + ülke adı
- **Sağ butonlar (dikey):**
  - Düzenle ikonu (mavi kalem)
  - Sil ikonu (kırmızı çöp) → `Alert.alert` onay

**Boş durum:**
- `call-outline` ikonu + "Henüz acil iletişim kişisi eklenmemiş."

**Kişi Ekle/Düzenle Modali (Bottom Sheet, büyük):**
- Handle çubuğu
- Başlık: "Acil Kişi Ekle" veya "Kişiyi Düzenle"
- ScrollView içinde form alanları:

  **Ad** TextInput (zorunlu)
  **Soyad** TextInput
  **İlişki Türü** TextInput (ör: "Dede", "Komşu", "Bakıcı")

  **Telefon satırı** (yatay):
  - Sol: Inline ülke kodu seçici (DropDown, NOT Modal):
    - Kapalı: bayrak + +kod + küçük chevron (border, borderRadius 8, padding 10)
    - Açık: `position: 'absolute'`, `zIndex: 100`, beyaz kart, `maxHeight: 200`, ScrollView, her ülke satırı tıklanabilir
  - Sağ: Telefon numara TextInput (`flex:1`, `keyboardType="phone-pad"`)
  - **⚠️ KRİTİK:** Modal içinde Modal açılmaz (iOS kısıtı). Ülke seçici mutlaka `position: 'absolute'` inline dropdown olmalı.

  **Uyruk** (opsiyonel):
  - Inline dropdown seçici (aynı pattern, ülke listesi)
  - Seçili değilse "Uyruk seçin (opsiyonel)" placeholder

  **TC Kimlik / Pasaport** (uyruk seçildiyse görünür):
  - Toggle: [TC Kimlik No] [Pasaport No] — iki buton
  - Seçime göre ilgili TextInput

- Butonlar: "İptal" + "Kaydet" (primary, loading)

**⚠️ iOS Nested Modal Notu:**
Bu ekran zaten bir Modal içinde. İçinde ülke seçimi için yeni Modal AÇILMAMALI. Bunun yerine:
```typescript
// Inline dropdown — Modal değil:
{countryDropdownOpen && (
  <View style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 100,
                 backgroundColor: '#fff', borderRadius: 10, maxHeight: 200,
                 shadowColor: '#000', elevation: 8 }}>
    <ScrollView>
      {filteredCountries.map(c => (
        <TouchableOpacity onPress={() => { setSelectedCountry(c); setCountryDropdownOpen(false); }}>
          <Text>{c.flag_emoji} {c.name} +{c.phone_code}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
```

**State:**
```typescript
const [contacts, setContacts] = useState<EmergencyContact[]>([]);
const [loading, setLoading] = useState(true);
const [showModal, setShowModal] = useState(false);
const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
const [form, setForm] = useState({ name:'', surname:'', relation_type:'', phone:'', identity_type:'tc'|'passport', identity_number:'', passport_number:'' });
const [phoneCountry, setPhoneCountry] = useState<Country | null>(null);
const [nationalityCountry, setNationalityCountry] = useState<Country | null>(null);
const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
const [nationalityDropdownOpen, setNationalityDropdownOpen] = useState(false);
const [countries, setCountries] = useState<Country[]>([]);
const [saving, setSaving] = useState(false);
```

**API:**
- `GET /parent/family/emergency-contacts`
- `POST /parent/family/emergency-contacts` → `{ name, surname?, relation_type?, phone?, phone_country_code?, nationality_country_id?, identity_number?, passport_number? }`
- `PUT /parent/family/emergency-contacts/{id}` → aynı body
- `DELETE /parent/family/emergency-contacts/{id}`
- `GET /parent/countries` → ülke listesi (sayfa açılınca bir kez fetch)

---

### ✅ (app)/invoices/index.tsx — Faturalarım Listesi

**Dosya yolu:** `src/app/(app)/invoices/index.tsx`

**Amaç:** Tüm faturaları listele, istatistikleri göster

**Ekranda neler var:**

**Header:**
- Geri butonu + "Faturalarım" başlığı

**İstatistik Satırı** (3 kart yatay, `ScrollView horizontal` veya flex row):
Kart yapısı (padding 14, borderRadius 12):
- **Bekleyen** (amber): `time-outline` ikonu + sayı (24px bold) + "Bekleyen" label
- **Gecikmiş** (kırmızı): `alert-circle-outline` + sayı + "Gecikmiş"
- **Ödendi** (yeşil): `checkmark-circle-outline` + sayı + "Ödendi"

**Fatura Listesi** (`FlatList`, sonsuz kaydırma):
Her fatura kartı (beyaz, borderRadius 14, padding 14, shadow):

Sol renkli dikey çizgi (width:4, borderRadius 2, height: '100%'):
- `overdue` veya `pending` gecikmiş → `#EF4444` kırmızı
- `refund` tipi → `#7C3AED` mor
- `paid` → `#059669` yeşil
- diğerleri → `#E5E7EB` gri

**Kart üst satırı:**
- Sol: fatura numarası (13px, bold, #1F2937) + modül badge (küçük, renkli)
  - `activity` / `activity_class` → mavi "Etkinlik"
  - `subscription` → mor "Abonelik"
  - `manual` → gri "Manuel"
- Sağ: durum rozeti (renkli, dolu arka plan)

**Modül badge renkleri:**
- activity/activity_class: `#EFF6FF` bg, `#208AEF` text
- subscription: `#F5F3FF` bg, `#7C3AED` text
- manual/other: `#F9FAFB` bg, `#6B7280` text

**Kart alt satırı:**
- Sol: `person-outline` + çocuk adı (varsa) | `receipt-outline` genel fatura
- Sağ: tutar (16px, bold) + para birimi

**Kart orta bilgi:**
- Son ödeme tarihi: `calendar-outline` + tarih
- `is_overdue=true` ise kırmızı satır: `alert-circle` + "Gecikmiş!" (bold, kırmızı)
- `invoice_type='refund'` ise mor satır: `return-down-back-outline` + "İade Faturası"

**Tıklanınca:** `router.push('/(app)/invoices/{id}')`

**Boş durum:** `receipt-outline` (48px, gri) + "Henüz faturanız bulunmuyor."

**Footer yükleyici:** `loadingMore` → `ActivityIndicator`

**State:**
```typescript
const [invoices, setInvoices] = useState<Invoice[]>([]);
const [stats, setStats] = useState<InvoiceStats | null>(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [page, setPage] = useState(1);
const [lastPage, setLastPage] = useState(1);
const [loadingMore, setLoadingMore] = useState(false);
```

**API:**
- `GET /parent/invoices/stats` → `InvoiceStats`
- `GET /parent/invoices?page=N&per_page=15` → `{ data: Invoice[], meta: { last_page } }`

**Tipler:**
```typescript
Invoice {
  id: number; invoice_no: string
  module: 'subscription'|'activity_class'|'manual'|'event'|'activity'
  invoice_type: 'invoice'|'refund'
  status: 'draft'|'pending'|'paid'|'cancelled'|'overdue'|'refunded'
  total_amount: number; currency: string
  due_date: string | null; paid_at: string | null
  is_overdue: boolean; created_at: string
  activity_class: { id: number; name: string } | null
  child: { id: number; full_name: string } | null
}
InvoiceStats {
  total: number; pending_count: number
  paid_count: number; overdue_count: number; pending_amount: number
}
```

---

### ✅ (app)/invoices/[id].tsx — Fatura Detayı

**Dosya yolu:** `src/app/(app)/invoices/[id].tsx`

**Amaç:** Tek faturanın tam detayı

**Ekranda neler var:**

**Header:**
- Geri butonu + "Fatura Detayı"

**ScrollView + RefreshControl**

**Hero Kart** (beyaz, borderRadius 16, padding 20, shadow, ortalanmış):
- Fatura numarası (13px, gri, monospace veya letter-spacing)
- Durum rozeti (büyük, renkli badge, 16px, bold)
- Tutar: `{total_amount} {currency}` (32px, fontWeight 800)
- Modül + invoice_type satırı

**Bilgiler Bölümü** (beyaz kart, ikonlu satırlar):
- `calendar-outline` Düzenleme Tarihi: `{issue_date}`
- `time-outline` Son Ödeme: `{due_date}` (gecikmiş ise kırmızı)
- `checkmark-circle-outline` Ödeme Tarihi: `{paid_at}` (ödendiyse göster)
- `person-outline` Çocuk: `{child.full_name}` (varsa)
- `alert-circle-outline` "Gecikmiş!" uyarı satırı (`is_overdue=true` ise kırmızı)

**Etkinlik Sınıfı Bilgisi** (varsa — mavi sol border'lı kart):
- `star-outline` ikonu + sınıf adı (bold)
- Konum, program, tarih aralığı

**Kalemler Tablosu** (beyaz kart):
- Başlık: "Fatura Kalemleri"
- Her satır: açıklama | adet | birim fiyat | satır toplamı
- Ayırıcı çizgi
- **Ara Toplam** satırı (sağa hizalı)
- **Genel Toplam** satırı (bold, büyük, primary renk)

**Ödeme İşlemleri** (varsa — beyaz kart):
- Başlık: "Ödeme Geçmişi"
- Her işlem satırı:
  - Sol: durum ikonu (0=gri time, 1=yeşil checkmark, 2=kırmızı close)
  - Orta: `#{order_id}` + banka + kart `****{last_four}` + tarih
  - Sağ: tutar + durum badge
  - Hata mesajı varsa: kırmızı küçük metin

**İade Bilgisi** (normal faturada iade varsa):
- Mor sol border'lı kart
- `return-down-back-outline` + "Bu faturanın iadesi mevcut"
- İade fatura numarası + durum
- "İadeye Git" butonu → `router.push('/(app)/invoices/{refund_invoice.id}')`

**Orijinal Fatura Bilgisi** (iade faturasında):
- "Orijinal Fatura" başlığı
- Fatura no + tutar + durum
- "Orijinal Faturaya Git" butonu → `router.push(...)`

**İade/iptal gerekçesi** (varsa, `refund_reason`):
- Gri info kutusu + gerekçe metni

**State:**
```typescript
const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
```

**API:** `GET /parent/invoices/{id}` → `InvoiceDetail`

**Tipler:**
```typescript
InvoiceDetail {
  id: number; invoice_no: string; module: string
  invoice_type: 'invoice'|'refund'
  original_invoice_id: number | null
  refund_reason: string | null
  status: string; total_amount: number; currency: string
  notes: string | null; issue_date: string
  due_date: string | null; paid_at: string | null
  is_overdue: boolean; created_at: string
  items: InvoiceItem[]
  transactions: Transaction[]
  activity_class: {
    id: number; name: string
    location: string|null; schedule: string|null
    start_date: string|null; end_date: string|null
  } | null
  child: { id: number; full_name: string } | null
  refund_invoice: { id: number; invoice_number: string; status: string } | null
  original_invoice: { id: number; invoice_number: string; amount: number; currency: string; status: string } | null
}
InvoiceItem {
  id: number; description: string
  quantity: number; unit_price: number; total_price: number
}
Transaction {
  id: number; order_id: string; amount: number
  status: 0|1|2   // 0=bekliyor 1=başarılı 2=başarısız
  payment_gateway: string
  bank_name: string | null; card_last_four: string | null
  error_message: string | null; created_at: string
}
```

---

### ✅ (app)/activity-classes/index.tsx — Etkinlik Sınıfları Listesi

**Dosya yolu:** `src/app/(app)/activity-classes/index.tsx`

**Amaç:** Tenant'a ait tüm etkinlik sınıflarını listele

**Ekranda neler var:**

**Header:**
- Geri butonu + "Etkinlik Sınıfları" başlığı

**FlatList (sonsuz kaydırma + RefreshControl)**

**Etkinlik Sınıfı Kartı** (`ActivityClassCard` bileşeni):
- **Kart üst satırı (flexRow):**
  - Sol (flex:1):
    - Sınıf adı (16px, fontWeight 600, #111827)
    - Dil etiketi (11px, #9CA3AF): `{language.toUpperCase()}` — ör: "TR", "EN"
  - Sağ: Kayıtlı çocuk varsa mavi "Kayıtlı" badge (checkmark + metin)

- **Açıklama** (varsa, 2 satır truncate, 13px, #6B7280)

- **Meta bilgiler satırı** (flexWrap, gap: 8):
  - Yaş aralığı: `people-outline` + "{age_min}-{age_max} yaş" (varsa)
  - Program: `time-outline` + `{schedule}` (varsa)
  - Konum: `location-outline` + `{location}` (varsa)
  - Kapasite: `person-outline` + "{active_enrollments_count}/{capacity}" (varsa)

- **Kart alt satırı** (borderTop, paddingTop: 8):
  - Sol: Ücretli → amber badge (card ikonu + fiyat + döviz); Ücretsiz → yeşil badge
  - Sağ: `chevron-forward` ikonu gri

- **Tıklanınca:** `router.push('/(app)/activity-classes/{item.id}')`

**Boş durum:**
- `star-outline` (48px, #D1D5DB) + "Etkinlik Sınıfı Yok" + "Okulunuzda henüz etkinlik sınıfı bulunmuyor."

**State:**
```typescript
const [activityClasses, setActivityClasses] = useState<ActivityClass[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [page, setPage] = useState(1);
const [lastPage, setLastPage] = useState(1);
const [loadingMore, setLoadingMore] = useState(false);
```

**API:** `GET /parent/activity-classes?page=N&per_page=20`

---

### ✅ (app)/activity-classes/[id].tsx — Etkinlik Sınıfı Detay + Kayıt Akışı

**Dosya yolu:** `src/app/(app)/activity-classes/[id].tsx`

**Amaç:** Sınıf detayları + çocuk kayıt/iptal + galeri

**Ekranda neler var:**

**Header (navBar):**
- Geri butonu

**ScrollView + RefreshControl**

**Hero Bölümü** (beyaz, padding 20):
- Sınıf adı (22px, fontWeight 700)
- Rozet grubu (flexRow, gap 8):
  - Dil badge (mavi, `{language.toUpperCase()}`)
  - Ücretli: amber badge (card ikonu + `{price} {currency}`)
  - Ücretsiz: yeşil badge

- Açıklama (varsa, 14px, #6B7280)

**Bilgi Kartları Grid** (2 sütun, flexWrap):
Her kart (beyaz, borderRadius 10, padding 12, shadow, alignItems center):
- Ionicons ikonu (20px, mavi)
- Label (11px, gri)
- Değer (13px, bold)

Gösterilecekler (sadece değer doluysa göster):
- Yaş aralığı: `people-outline` + "{age_min}-{age_max} yaş"
- Kapasite: `grid-outline` + "{active_enrollments_count}/{capacity}"
- Program: `time-outline` + `{schedule}`
- Konum: `location-outline` + `{location}`
- Tarih aralığı: `calendar-outline` + "{start} – {end}" (flex:2 tam genişlik)

**Kayıt Durumu Bölümü** (beyaz kart, padding 16):
- Başlık: "Kayıt Durumu" (sectionTitle)
- Kayıtlı her çocuk için satır:
  - `checkmark-circle` (yeşil, 20px) + çocuk adı (bold)
  - "İptal" butonu (kırmızı metin, sağ)
- Kayıtlı çocuk yoksa: "Kayıtlı çocuğunuz yok." (gri)
- Kayıt yapılabilecek (`availableChildren.length > 0`) → "Çocuğumu Kayıt Et" mavi butonu

**Öğretmenler Bölümü** (varsa — beyaz kart):
- Başlık: "Öğretmenler"
- Her satır: `person-outline` + ad + rol (gri, küçük)
- Alt border ayırıcı

**Materyaller Bölümü** (varsa — beyaz kart):
- Başlık: "Getirilmesi Gerekenler"
- Her materyal:
  - Renkli dot (kırmızı=zorunlu, yeşil=opsiyonel)
  - Ad + `× {quantity}` (varsa) + açıklama (gri, küçük)
  - Sağ: "Zorunlu" kırmızı badge (is_required=true ise)

**Galeri Butonu** (mavi arka planlı buton satırı):
- `images-outline` + "Galeriyi Görüntüle" + `chevron-forward`
- Tıklanınca → galeri API fetch → `setShowGallery(true)`

---

**ÇOCUK KAYIT AKIŞI — Adım Adım:**

**Adım 1: "Çocuğumu Kayıt Et" butonuna bas**

Buton görünme koşulu: `availableChildren.length > 0`
```typescript
// Kayıt yapılabilecek çocuklar = okula kayıtlı + henüz bu sınıfa kayıt olmamış
const availableChildren = familyChildren.filter(c =>
  c.school_id != null && !enrolledChildIds.has(c.id)
);
```

**Adım 2: Çocuk Seçim Modali Açılır**

`Modal visible={showEnrollModal}` transparent animationType="slide"

Bottom Sheet layout:
```
┌─────────────────────────────────┐
│  ────  (handle çubuğu)          │
│  Çocuğumu Kayıt Et              │
│  Kayıt etmek istediğiniz çocuğu │
│  seçin                          │
│                                 │
│  ┌─────────────────────────────┐│
│  │ ○  Ali Yılmaz               ││  ← seçilmemiş (border gri)
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ◉  Ayşe Yılmaz              ││  ← seçili (border mavi, bg açık mavi)
│  └─────────────────────────────┘│
│                                 │
│  ⚠️ Bu etkinlik ücretlidir:     │  ← is_paid=true ise göster (amber box)
│     150.00 TRY (Ödeme zorunlu) │
│                                 │
│  [    İptal    ] [  Kayıt Et  ] │
└─────────────────────────────────┘
```

Her çocuk seçim satırı:
```typescript
<TouchableOpacity
  style={[styles.childItem, selectedChildId === child.id && styles.childItemSelected]}
  onPress={() => setSelectedChildId(child.id)}
>
  <Ionicons
    name={selectedChildId === child.id ? 'checkmark-circle' : 'radio-button-off'}
    size={20}
    color={selectedChildId === child.id ? '#208AEF' : '#9CA3AF'}
  />
  <Text>{child.full_name}</Text>
</TouchableOpacity>
```

Ücret notu (is_paid=true):
```typescript
{activityClass.is_paid && (
  <View style={styles.invoiceNotice}>
    <Ionicons name="information-circle-outline" size={16} color="#D97706" />
    <Text>Bu etkinlik ücretlidir: {activityClass.price} {activityClass.currency}
      {activityClass.invoice_required ? ' (Ödeme zorunlu)' : ' (Sonra ödenebilir)'}
    </Text>
  </View>
)}
```

**Adım 3: "Kayıt Et" butonuna bas**

- Aktif olma koşulu: `selectedChildId !== null && !enrolling`
- Tıklanınca `handleEnroll()` çağrılır

**Adım 4: API Çağrısı**
```typescript
const handleEnroll = async () => {
  if (!selectedChildId) return;
  setEnrolling(true);
  try {
    await api.post(`/parent/activity-classes/${activityClassId}/enroll`, {
      child_id: selectedChildId,
    });
    Alert.alert('Başarılı', 'Çocuğunuz etkinlik sınıfına kaydedildi.');
    setShowEnrollModal(false);
    setSelectedChildId(null);
    loadDetail(); // sayfayı yenile
  } catch (err) {
    Alert.alert('Hata', getApiError(err));
  } finally {
    setEnrolling(false);
  }
};
```

**Adım 5: Başarı → Sayfa Yenilenir**
- Modal kapanır
- `loadDetail()` tetiklenir → `enrolled_child_ids` güncellenir
- Kayıt Durumu bölümünde yeni çocuk görünür
- "Çocuğumu Kayıt Et" butonu, artık kayıt yapılacak çocuk kalmadıysa kaybolur

---

**KAYIT İPTAL AKIŞI:**

**Adım 1: Kayıtlı çocuğun yanındaki "İptal" butonuna bas**
```typescript
const handleUnenroll = (childId: number, childName: string) => {
  Alert.alert(
    'Kaydı İptal Et',
    `${childName} adlı çocuğun kaydını iptal etmek istiyor musunuz?`,
    [
      { text: 'Hayır', style: 'cancel' },
      {
        text: 'Evet, İptal Et',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(
              `/parent/activity-classes/${activityClassId}/children/${childId}/unenroll`
            );
            Alert.alert('Başarılı', 'Kayıt iptal edildi.');
            loadDetail();
          } catch (err) {
            Alert.alert('Hata', getApiError(err));
          }
        },
      },
    ]
  );
};
```

**Adım 2:** Onay alert → API → sayfa yenilenir → çocuk listeden kalkar

---

**GALERİ AKIŞI:**

**Adım 1:** "Galeriyi Görüntüle" butonuna bas → `loadGallery()` → API fetch

**Adım 2:** `Modal visible={showGallery}` tam ekran siyah arka plan açılır

**Galeri Modali:**
- Sağ üst: `close-circle` (beyaz, 32px) kapatma
- `ScrollView` vertical: fotoğraflar dikey sıralı
- Her fotoğraf: tam genişlik `Image` + caption (varsa gri metin)
- Boş: "Galeri boş." gri metin

**State özeti:**
```typescript
const [activityClass, setActivityClass] = useState<ActivityClassDetail | null>(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [gallery, setGallery] = useState<GalleryItem[]>([]);
const [galleryLoaded, setGalleryLoaded] = useState(false);
const [showGallery, setShowGallery] = useState(false);
const [myEnrollments, setMyEnrollments] = useState<MyEnrollment[]>([]);
const [familyChildren, setFamilyChildren] = useState<FamilyChild[]>([]);
const [showEnrollModal, setShowEnrollModal] = useState(false);
const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
const [enrolling, setEnrolling] = useState(false);
```

**İlk yükleme (paralel):**
```typescript
const loadDetail = async () => {
  const [detailRes, enrollmentsRes, childrenRes] = await Promise.all([
    api.get(`/parent/activity-classes/${activityClassId}`),
    api.get('/parent/activity-classes/my-enrollments'),
    api.get('/parent/children'),
  ]);
  // state güncelle...
};
```

**API:**
- `GET /parent/activity-classes/{id}` → ActivityClassDetail
- `GET /parent/activity-classes/my-enrollments` → MyEnrollment[]
- `GET /parent/children` → FamilyChild[]
- `POST /parent/activity-classes/{id}/enroll` → `{ child_id }`
- `DELETE /parent/activity-classes/{id}/children/{childId}/unenroll`
- `GET /parent/activity-classes/{id}/gallery` → GalleryItem[]

**Tipler:**
```typescript
ActivityClassDetail {
  id: number; name: string; description: string | null
  language: string; age_min: number | null; age_max: number | null
  capacity: number | null; active_enrollments_count: number
  is_paid: boolean; price: string | null; currency: string
  invoice_required: boolean
  start_date: string | null; end_date: string | null
  schedule: string | null; location: string | null; is_school_wide: boolean
  school_classes: { id: number; name: string }[]
  teachers: { id: number; name: string; role: string | null }[]
  materials: { id: number; name: string; quantity: string | null; is_required: boolean; description: string | null }[]
  enrolled_child_ids: number[]
}
MyEnrollment {
  enrollment_id: number
  activity_class: { id: number } | null
  child: { id: number; name: string } | null
  invoice: { status: string; amount: string; currency: string; payment_required: boolean } | null
}
GalleryItem { id: number; url: string; caption: string | null }
FamilyChild { id: number; full_name: string; school_id: number | null }
```
