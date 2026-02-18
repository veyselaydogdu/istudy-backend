# 🧠 iStudy Frontend Admin — Proje Hafıza Dosyası

> **Son Güncelleme:** 2026-02-14
> **Amaç:** Bu dosya, Frontend Admin panelinin geliştirilme sürecini, mimari kararlarını, kullanılan teknolojileri ve bileşen yapısını belgelemek için oluşturulmuştur.

---

## 📌 1. Proje Kimliği

| Alan | Değer |
|------|-------|
| **Proje Adı** | iStudy Frontend Admin |
| **Tip** | Super Admin Yönetim Paneli |
| **Framework** | Next.js 16 (App Router) |
| **Dil** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Kütüphanesi** | Radix UI Primitives + Lucide Icons + Framer Motion |
| **State Management** | React Context + Hooks (Gerekirse Zustand) |
| **API İletişimi** | Axios (Merkezi `apiClient` yapısı) |
| **Form Yönetimi** | React Hook Form + Zod |

---

## 📂 2. Dizin Yapısı

```
frontend-admin/
├── app/
│   ├── (auth)/             # Authentication sayfaları (Login)
│   ├── (dashboard)/        # Admin panel içi sayfalar (Layout ile korunur)
│   │   ├── tenants/        # Kurum (Müşteri) yönetimi
│   │   ├── schools/        # Tüm okulların listesi ve detayları
│   │   ├── users/          # Tüm kullanıcılar (Öğretmen, Veli, Öğrenci)
│   │   ├── health/         # Sağlık & Beslenme (Alerji, Hastalık, Yemek İçeriği)
│   │   ├── packages/       # B2B Paket yönetimi
│   │   ├── finance/        # Faturalar, Ödemeler ve Raporlar
│   │   ├── notifications/  # Bildirim Gönderme Paneli
│   │   ├── settings/       # Ülke, Para Birimi, Dil Ayarları
│   │   └── page.tsx        # Dashboard özet ekranı
│   ├── layout.tsx          # Root Layout
│   └── globals.css         # Global stiller
├── components/
│   ├── ui/                 # Temel UI bileşenleri (Shadcn-like)
│   ├── layout/             # Sidebar, Header
│   └── business/           # İşe özel bileşenler
├── lib/
│   ├── apiClient.ts        # Axios instance
│   └── utils.ts            # Helper'lar
└── ...
```

---

## � 4. Modül Detayları (Süper Admin)

### 4.1 Kurum ve Okul Yönetimi (`/tenants`, `/schools`)
- **Tenants:** Sistemdeki "Müşteri" kurumların listesi, paket atamaları, aktif/pasif durumları.
- **Schools:** Tüm tenant'lara bağlı okulların global listesi. Bir okula tıklayınca detayda o okulun öğretmen ve sınıflarını salt-okunur (veya admin yetkisiyle düzenlenebilir) görme.

### 4.2 Kullanıcı Havuzu (`/users`)
- Sistemdeki tüm aktörlerin (Öğretmen, Ebeveyn, Öğrenci) aranabildiği merkezi ekran.
- Filtreler: Kurum, Okul, Rol.

### 4.3 Sağlık ve Beslenme Havuzu (`/health`)
- **Global Veritabanı:** Süper admin tarafından yönetilen ortak veri havuzu.
- **Alerjenler:** (Fıstık, Süt, Gluten vb.)
- **Hastalıklar:** (Astım, Diyabet vb.)
- **Yemek İçerikleri:** (Besin değerleri, kalori vb.)
- *Not:* Okullar bu havuzdan seçim yapar.

### 4.4 Finans ve Muhasebe (`/finance`)
- **Faturalar:** Kesilen tüm B2B faturaların listesi ve durumları (Ödendi, Bekliyor).
- **İşlemler (Transactions):** Sanal POS hareketleri.
- **Raporlar:** Aylık/Yıllık gelir raporları, paket bazlı karlılık.

### 4.5 İletişim ve Bildirimler (`/notifications`)
- Müşteri gruplarına (Tüm Okul Müdürleri, Sadece X Paketini Kullananlar vb.) toplu bildirim gönderme ekranı.
- Push Notification (Firebase) ve Email entegrasyon arayüzü.

### 4.6 Sistem Ayarları (`/settings`)
- **Ülkeler:** Sistemde aktif olan ülkeler ve telefon kodları.
- **Para Birimleri:** Döviz kurları ve aktif para birimleri.
- **Sistem Dili:** Desteklenen dillerin yönetimi.

---
