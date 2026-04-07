# 🧠 iStudy Frontend Admin — Proje Hafıza Dosyası

> **Son Güncelleme:** 2026-04-06 (Global veri sayfaları (/global/*), sidebar yenilendi, dashboard API'den gerçek veri çeker, seeders eklendi)
> **Amaç:** Bu dosya, Frontend Admin panelinin geliştirilme sürecini, mimari kararlarını, kullanılan teknolojileri ve bileşen yapısını belgelemek için oluşturulmuştur.

> **İlgili Proje:** `frontend-tenant-and-website` (port 3002) — admin kopyasından üretildi. Token: `tenant_token`. Detaylar için bu repo'ya bakın.

---

## 📌 1. Proje Kimliği

| Alan | Değer |
|------|-------|
| **Proje Adı** | iStudy Frontend Admin |
| **Tip** | Super Admin Yönetim Paneli |
| **Framework** | Next.js 16 (App Router) |
| **Dil** | TypeScript 5 |
| **Styling** | **Tailwind CSS v3** (`tailwind.config.js` + `postcss.config.mjs`) — v4 DEĞİL |
| **UI Tema** | **Vristo Tema** — `styles/globals.css` (.panel, .btn, .form-input, .sidebar, .badge vb.) |
| **State Management** | **Redux** (`@reduxjs/toolkit` + `react-redux`) — `themeConfigSlice` ile tema/sidebar/RTL |
| **API İletişimi** | Axios (Merkezi `apiClient` yapısı) |
| **Form Yönetimi** | React Hook Form + Zod |
| **Bildirimler** | Sonner (toast) |
| **Tema Toggle** | Redux `themeConfig.theme` (Vristo built-in) — next-themes kaldırıldı |
| **Grafikler** | **ApexCharts** (`react-apexcharts` — SSR için dynamic import zorunlu) |
| **Popup/Dialog** | **SweetAlert2** (`sweetalert2`) + `@headlessui/react` (modal) |
| **Dropdown** | `react-popper` + `@popperjs/core` — `components/dropdown.tsx` |
| **Accordion** | `react-animate-height` |
| **Scroll** | `react-perfect-scrollbar` |
| **İkonlar** | `lucide-react` + Vristo custom SVG icon bileşenleri (`components/icon/`) |
| **CSV Export** | `lib/exportUtils.ts` (BOM destekli, Türkçe Excel uyumlu) |
| **Proje Yolu** | `/Users/veysel.aydogdu/Desktop/WebProjects/iStudy/istudy-backend/frontend-admin` |

---

## 📂 2. Dizin Yapısı (Güncel)

```
frontend-admin/
├── app/
│   ├── page.tsx                   ← Root: auth kontrolü → /tenants veya /login yönlendirir
│   ├── layout.tsx                 ← Root Layout (Geist font, Sonner Toaster, lang="tr")
│   ├── globals.css                ← Tailwind v3 (@tailwind base/components/utilities)
│   ├── (auth)/
│   │   ├── layout.tsx             ← ⚠️ Sadece passthrough: return <>{children}</> — wrapper ekleme!
│   │   └── login/
│   │       └── page.tsx           ← Vristo "Login Boxed" stili, RHF+Zod, apiClient
│   └── (dashboard)/
│       ├── layout.tsx             ← Auth kontrolü (admin_token check), Sidebar + Header
│       ├── page.tsx               ← Finance dashboard (ComponentsDashboardIStudy)
│       ├── tenants/ ... schools/ ... users/ ... packages/ ... finance/ ... health/
│       ├── subscriptions/ ... activity-logs/ ... notifications/ ... settings/
│       ├── apps/
│       │   └── invoice/
│       │       ├── list/page.tsx  ← Fatura listesi, arama filtresi, tablo
│       │       └── preview/page.tsx ← Fatura önizleme, yazdır, KDV hesaplama
│       └── ui/
│           ├── buttons/page.tsx
│           ├── alerts/page.tsx
│           ├── forms/page.tsx      ← form-input, form-select, form-checkbox, custom switch
│           ├── tabs/page.tsx       ← State tabanlı tabs (headlessui Tab değil)
│           ├── modals/page.tsx     ← @headlessui/react (Dialog, Transition)
│           ├── accordions/page.tsx ← react-animate-height + IconCaretDown
│           ├── dropdowns/page.tsx  ← Dropdown component (react-popper)
│           ├── sweetalerts/page.tsx ← sweetalert2 — 11 örnek
│           └── pricing/page.tsx   ← Aylık/Yıllık toggle, 3 plan kartı
├── components/
│   ├── dashboard/
│   │   └── components-dashboard-istudy.tsx ← Finance dashboard (ApexCharts dynamic import)
│   ├── icon/                      ← Vristo'dan kopyalanan SVG icon bileşenleri
│   │   └── icon-*.tsx             ← x, caret-down, plus, edit, trash-lines, download,
│   │                                  printer, send, arrow-left, bell, tag, eye,
│   │                                  circle-check, info-circle, horizontal-dots,
│   │                                  binance, bitcoin, ethereum, litecoin, solana, tether
│   └── layouts/                   ← ⚠️ "layout" değil "layouts" (çoğul)
│       ├── sidebar.tsx            ← Vristo sidebar (Redux toggle, 6 nav grubu)
│       ├── header.tsx             ← Vristo header (tema toggle, kullanıcı dropdown)
│       ├── setting.tsx            ← Vristo tema özelleştirme paneli
│       └── provider-component.tsx ← Redux Provider + App wrapper
├── hooks/
│   └── useDebounce.ts
├── lib/
│   ├── apiClient.ts               ← Axios (Bearer token, 401 redirect)
│   ├── exportUtils.ts             ← exportToCsv() helper
│   └── utils.ts                   ← cn() utility
├── types/
│   └── index.ts
├── store/
│   ├── index.tsx                  ← Redux store
│   └── themeConfigSlice.tsx       ← Tema/sidebar/RTL/menü state
├── styles/
│   ├── globals.css                ← Vristo CSS sınıfları + Tailwind v3
│   └── animate.css
├── public/
│   └── assets/images/auth/        ← bg-gradient.png, map.png, coming-soon-object*.png, polygon-object.svg
├── App.tsx                        ← ⚠️ Root div'de `relative` class OLMAMALI — login bg bozulur
├── theme.config.tsx               ← Varsayılan tema
├── i18n.ts                        ← i18n stub
├── .env.local                     ← NEXT_PUBLIC_API_URL=http://localhost:8000/api
├── tailwind.config.js             ← Vristo renk paleti (v3)
├── postcss.config.mjs             ← { tailwindcss: {}, autoprefixer: {} }
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🎨 2b. Vristo Tema Entegrasyonu (v8 — 2026-02-22)

### Temel Kural
**Yeni UI bileşeni gerektiğinde:** `frontend-template/vristo-next-starter/` veya `frontend-template/vristo-next-main/` içinde ilgili component'i bul, adapte et, `PanelCodeHighlight` wrapper'larını çıkar.

### Kritik Dosyalar
| Dosya | Açıklama |
|-------|----------|
| `tailwind.config.js` | Vristo renk paleti (primary, secondary, success, danger, warning, info...) |
| `styles/globals.css` | `.panel`, `.btn`, `.btn-primary`, `.form-input`, `.form-checkbox`, `.sidebar`, `.badge`, `.table-responsive` vb. |
| `store/themeConfigSlice.tsx` | Redux: theme, menu, layout, rtlClass, sidebar (toggle), semidark |
| `App.tsx` | localStorage'dan tema okur, class'ları root div'e uygular — `relative` class OLMAMALI |
| `components/layouts/provider-component.tsx` | Redux Provider + App wrapper |

### ⚠️ Kritik Bug Fix'ler (Bir Daha Yapma)
1. **`app/(auth)/layout.tsx`** mutlaka basit passthrough olmalı:
   ```tsx
   export default function AuthLayout({ children }) { return <>{children}</>; }
   ```
   Wrapper/max-width eklenirse login sayfası küçük kalır.

2. **`App.tsx`** root div'de `relative` class OLMAMALI:
   ```tsx
   // Yanlış: className={`relative ${themeConfig.sidebar ? ...}`}
   // Doğru: className={`${themeConfig.sidebar ? ...}`}
   ```
   `relative` varsa login sayfasındaki `absolute inset-0` arka plan küçük kalır.

3. **ApexCharts SSR** — dynamic import zorunlu:
   ```tsx
   const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
   ```

### Sidebar Navigasyon Grupları (2026-04-06 güncellendi)
```
GENEL BAKIŞ     → / (Dashboard — real API data)
YÖNETİM        → /tenants, /schools, /users
PAKET & SATIŞ  → /packages, /subscriptions, /finance
GLOBAL VERİLER → /global/allergens, /global/medical-conditions, /global/medications,
                   /global/food-ingredients, /global/countries, /global/currencies
                   (collapsible accordion group — başta open eğer /global/* yolundaysa)
DESTEK         → /contact-requests
SİSTEM         → /activity-logs, /notifications, /settings
```

### Global Veri Sayfaları (2026-04-06)
- `/global/allergens` — CRUD (ad, açıklama, risk seviyesi: low/medium/high)
- `/global/medical-conditions` — CRUD (ad, açıklama)
- `/global/medications` — CRUD (ad, kullanım notu — silme only, no update)
- `/global/food-ingredients` — CRUD + alerjen seçici (checkbox multi-select)
- `/global/countries` — CRUD + aktif/pasif toggle
- `/global/currencies` — CRUD + temel para birimi set + aktif/pasif toggle
Eski `/health` sayfası hâlâ mevcut (4 tab combined view); sidebar'dan kaldırıldı.

### npm Güvenlik Açığı Çözüm Yöntemi
`eslint-config-next` eski `minimatch` getirdiğinde — `package.json`'a ekle:
```json
"overrides": { "minimatch": "^10.2.1" }
```
Ayrıca `eslint` → `^10.0.1` ve `typescript-eslint` → canary versiyona yükselt. Sonuç: 0 güvenlik açığı.

### Vristo Bileşenlerinden Adapte Etme Notları
- **`PanelCodeHighlight`** wrapper'larını çıkar (showcase wrapper, gerek yok)
- **Tabs** için state tabanlı implementasyon kullan (`@headlessui/react` Tab component yerine) — daha basit
- **Invoice** için `mantine-datatable` yerine plain HTML table + manuel search filtresi yeterli
- Vristo'nun bazı ikonları `components/icon/` altında bulunamayabilir — `lucide-react` kullan

---

## 🔗 3. Backend API Endpoint Eşleşmeleri

| Sayfa | Kullanılan Endpoint'ler |
|-------|------------------------|
| **Dashboard** | `GET /admin/dashboard/stats`, `GET /admin/dashboard/recent-activities`, `GET /admin/activity-logs/daily-summary`, `GET /admin/subscriptions/stats` |
| **Tenants** | `GET /admin/tenants`, `POST /auth/register`, `DELETE /admin/tenants/:id` |
| **Tenant Detay** | `GET /admin/tenants/:id`, `GET /admin/tenants/:id/schools`, `GET /admin/tenants/:id/subscriptions` |
| **Schools** | `GET /admin/schools`, `PATCH /admin/schools/:id/toggle-status`, `DELETE /admin/schools/:id` |
| **School Detay** | `GET /admin/schools/:id`, `GET /admin/schools/:id/classes`, `GET /admin/schools/:id/children` |
| **Users** | `GET /admin/users` (?role, ?search, ?page), `POST /admin/users`, `DELETE /admin/users/:id` |
| **Packages** | `GET /packages`, `POST /admin/packages`, `PUT /admin/packages/:id`, `GET/POST/PUT/DELETE /admin/package-features` |
| **Finance** | `GET /admin/invoices`, `GET /admin/transactions`, `GET /admin/transactions/stats` |
| **Health** | `GET/POST/PUT/DELETE /admin/allergens`, `/admin/medical-conditions`, `/admin/food-ingredients`, `/admin/medications` |
| **Subscriptions** | `GET /admin/subscriptions`, `GET /admin/subscriptions/stats`, `PATCH /admin/subscriptions/:id/status`, `PATCH /admin/subscriptions/:id/extend` |
| **Activity Logs** | `GET /admin/activity-logs`, `GET /admin/activity-logs/stats` |
| **Notifications** | `GET /admin/system/notifications`, `POST /admin/system/notifications` |
| **Settings/Countries** | `GET /admin/countries`, `POST /admin/countries/sync`, `PATCH /admin/countries/:id/toggle-active` |
| **Settings/Currencies** | `GET /admin/currencies`, `POST /admin/currencies`, `PUT /admin/currencies/:id`, `DELETE /admin/currencies/:id`, `POST /admin/currencies/fetch-rates`, `PATCH /admin/currencies/:id/set-base`, `PATCH /admin/currencies/:id/toggle-status` |

---

## 🎨 4. Kodlama Pattern'ları (Standartlar)

### 4.1 Sayfa Şablonu

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import apiClient from "@/lib/apiClient"
// ...imports

export default function XxxPage() {
    const [items, setItems] = useState<Type[]>([])
    const [loading, setLoading] = useState(true)

    const fetchItems = useCallback(async () => {
        setLoading(true)
        try {
            const res = await apiClient.get("/admin/xxx")
            if (res.data?.data) { setItems(res.data.data) }
        } catch {
            toast.error("Yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchItems() }, [fetchItems])
    // ...
}
```

### 4.2 Hata Yakalama
```tsx
} catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message ?? "İşlem sırasında hata oluştu.")
}
```

### 4.3 Zod v4 + RHF Uyumluluğu
```tsx
// Generic/dinamik schema kullanımında resolver tip uyumsuzluğu olur
(useForm as any)({ resolver: zodResolver(schema as any) })
```

### 4.4 Pagination Standartı
- Backend: `?page=1&per_page=15` parametreleri
- Frontend: `meta.current_page`, `meta.last_page`, ChevronLeft/Right butonlar
- `page` state'i, search/filter değişince `setPage(1)` ile reset edilir

### 4.5 Badge Kullanımı
```tsx
import { Badge } from "@/components/ui/badge"
<Badge variant="success">Aktif</Badge>
// variant: default | success | warning | danger | secondary | outline
```

### 4.6 Detay Sayfaları Pattern
```tsx
// Promise.all ile paralel veri çekme
const [mainRes, relatedRes] = await Promise.all([
    apiClient.get(`/admin/resource/${id}`),
    apiClient.get(`/admin/resource/${id}/related`).catch(() => ({ data: { data: [] } }))
])
```

---

## 🔐 5. Auth Akışı

```
1. app/page.tsx → localStorage'da admin_token var mı?
   - Var → /tenants'a yönlendir
   - Yok → /login'e yönlendir

2. /login sayfası:
   - CSRF çağrısı YOK (token-based auth, cookie/session değil)
   - Login: POST /auth/login → { data: { token } }
   - Token yolu: response.data.data.token
   - Token → localStorage.setItem('admin_token', token)
   - Başarıda → router.push('/')

3. (dashboard)/layout.tsx:
   - localStorage'da token kontrolü
   - Yoksa → /login'e yönlendir

4. apiClient.ts:
   - Request interceptor: Authorization: Bearer {token}
   - Response interceptor: 401 → localStorage.clear + /login yönlendir
```

---

## ✅ 6. Tamamlanan Özellikler

| Modül | Durum | Açıklama |
|-------|-------|----------|
| **Auth (Login/Logout)** | ✅ Tam | Token-based auth (CSRF yok), token → localStorage, response.data.data.token yolu |
| **Dashboard** | ✅ Tam | Gerçek API istatistikleri (nested→flat mapping) + son aktiviteler (type/description→RecentActivity mapping) + Recharts grafikleri (AreaChart aktivite trendi, BarChart abonelik dağılımı) |
| **Kurumlar (Tenants)** | ✅ Tam | Liste, yeni kurum, silme, /admin/tenants endpoint |
| **Kurum Detayı** | ✅ Tam | Okul listesi + abonelik geçmişi tabları |
| **Okullar** | ✅ Tam | Arama/filtre, durum toggle, silme, pagination |
| **Okul Detayı** | ✅ Tam | Sınıflar + öğrenciler tabları |
| **Kullanıcılar** | ✅ Tam | Tab bazlı (öğretmen/veli/öğrenci/tümü), arama, pagination |
| **Paketler** | ✅ Tam | Kart görünümü, CRUD, limit formatı, Tab-based UI (Paketler + Özellikler), Feature pivot tablo yapısı, özellik yönetimi (key, label, value_type, display_order) |
| **Finans** | ✅ Tam | Fatura listesi + POS işlemleri + istatistik kartları |
| **Sağlık & Beslenme** | ✅ Tam | Alerjen + Tıbbi Durum + Besin + İlaç CRUD (generic CrudTab) |
| **Abonelikler** | ✅ Tam | Liste, durum filtresi, uzatma, iptal, istatistikler |
| **Aktivite Kayıtları** | ✅ Tam | Filtre, değişiklik detayı dialog, istatistikler — ActivityLogResource nested yapıya (user.name, model.label, context.ip_address, changes.old_values) güncellendi |
| **Bildirimler** | ✅ Tam | Form + geçmiş listesi, hedef kitle seçimi |
| **Ayarlar - Ülkeler** | ✅ Tam | Tablo, API sync, aktif/pasif toggle |
| **Ayarlar - Para Birimleri** | ✅ Tam | CRUD (edit + sil dahil), kur güncelleme, baz birim seçimi — baz birim silinemez (guard mevcut) |
| **Dark Mode** | ✅ Tam | Redux `themeConfigSlice` (Vristo built-in) |
| **useDebounce Hook** | ✅ Tam | hooks/useDebounce.ts |
| **TypeScript Tipleri** | ✅ Tam | types/index.ts — tüm entity tipleri |
| **CSV Export** | ✅ Tam | lib/exportUtils.ts — tenants/schools/subscriptions sayfalarında |
| **ApexCharts Grafikleri** | ✅ Tam | Dashboard'da sparkline + area chart (dynamic import, SSR safe) |
| **Vristo Tema** | ✅ Tam | Tailwind v3, Redux, CSS sınıf sistemi, sidebar/header tam entegrasyon |
| **Login Sayfası** | ✅ Tam | Vristo "Login Boxed" stili, glassmorphism kart, gradient arka plan |
| **Invoice Listesi** | ✅ Tam | `/apps/invoice/list` — arama, tablo, durum badge'leri |
| **Invoice Önizleme** | ✅ Tam | `/apps/invoice/preview` — yazdır, KDV hesaplama, logo |
| **UI Bileşenleri** | ✅ Tam | 9 sayfa: buttons, alerts, forms, tabs, modals, accordions, dropdowns, sweetalerts, pricing |
| **npm Güvenlik** | ✅ Tam | 0 güvenlik açığı — eslint v10 + typescript-eslint canary + minimatch override |

---

## ⚠️ 7. Önemli Notlar

### Tailwind v3 — Kesin Kural
- `globals.css`: `@tailwind base/components/utilities` kullanır (v4'teki `@import "tailwindcss"` değil)
- `postcss.config.mjs`: `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`
- Yeni paket kurarken Tailwind v4 bağımlılığı gelirse build çöker — dikkat

### components/layouts vs components/layout
- Dizin adı **`layouts`** (çoğul). `layout` değil. Import yollarında dikkat et.

### Route Çakışması Çözümü
- `app/page.tsx` ve `app/(dashboard)/page.tsx` aynı `/` URL'sini çözebilirdi.
- `app/page.tsx` → client-side auth check + redirect (localStorage → /tenants veya /login)
- Sidebar "Dashboard" linki `/tenants`'a işaret eder (çakışmayı önler)

### ActivityLogResource — Nested Yapı (ÖNEMLİ)
`ActivityLogResource` düz (flat) değil **nested** yapı döndürür. `ActivityLog` TypeScript tipi bu yapıya göre tanımlanmıştır:
- `log.user.name`, `log.user.email` (flat `user_name` değil)
- `log.model.label`, `log.model.type`, `log.model.id`
- `log.context.ip_address`, `log.context.url`, `log.context.method`
- `log.changes.old_values`, `log.changes.new_values`, `log.changes.changed_fields`
- `log.action_label`, `log.description`, `log.time_ago`

### AdminTenantController::show() — Nested Response
`GET /admin/tenants/:id` endpoint'i `{ tenant: TenantResource, stats: {...} }` nested döndürür.
Frontend'de `tenantRes.data.data.tenant` ile Tenant nesnesi çıkarılır.

### Health Endpoint'leri (Backend)
- `/admin/allergens`, `/admin/medical-conditions`, `/admin/food-ingredients`, `/admin/medications` backend'de `AdminHealthController`'a bağlandı.
- Tüm CRUD endpoint'leri `routes/api.php`'de `admin` prefix + `super.admin` middleware altında tanımlı.

### Zod v4 + RHF Uyumluluğu
- Generic/dinamik schema kullanımında resolver tip uyumsuzluğu olur.
- Çözüm: `(useForm as any)({ resolver: zodResolver(schema as any) })`

### Subscriptions/Activity Logs Endpoints
- Bu endpoint'lerin backend'de karşılığı olması gerekir.
- Yoksa sayfalar empty state gösterir (graceful degradation).

### API Response Format — Paginated Listeleme
Backend `paginatedResponse()` her zaman şu formatta döner:
```json
{ "success": true, "message": "...", "data": [...], "meta": { "current_page": 1, "last_page": 1, "per_page": 15, "total": N } }
```
Frontend sayfalarda `res.data.data` → items dizisi, `res.data.meta` → pagination bilgisi.

**Önceki hatırlatıcı:** `->resource` kaldırıldı. Admin controller'larında `Resource::collection($paginator)` direkt geçilir.

### Dashboard Stats Mapping
`/admin/dashboard/stats` nested yapı döner: `{ tenants: { total, with_active_subscription }, schools: { total }, ... }`
Dashboard page bu yapıyı düz `DashboardStats` tipine map eder:
- `d.tenants.total` → `total_tenants`
- `d.tenants.with_active_subscription` → `active_tenants`
- `d.subscriptions.total_revenue` → `monthly_revenue` ve `total_revenue`

### Dashboard Recent Activities Mapping
`/admin/dashboard/recent-activities` `{ type, description, data, timestamp }` formatında döner.
Frontend `RecentActivity` tipine map edilir: `type.replace(/_/g, " ")` → `action`, `description` → `model_label`, `timestamp` → `created_at`.

---

## 🚀 8. Geliştirme Komutları

```bash
# Geliştirme ortamı
cd frontend-admin
npm run dev

# Production build (test)
npm run build

# Lint
npm run lint

# TypeScript kontrolü
npx tsc --noEmit
```

---

## 📋 9. Yapılacaklar (Sonraki Adımlar)

| Öncelik | Görev | Durum |
|---------|-------|-------|
| Orta | Backend: Abonelik endpoint'leri (`GET/PATCH /admin/subscriptions`) | ✅ Tamamlandı |
| Orta | Backend: Activity Log endpoint'leri (`GET /admin/activity-logs`, stats) | ✅ Tamamlandı |
| Orta | Backend: Tenant detay endpoint'leri (`GET /admin/tenants/:id/schools`, `/subscriptions`) | ✅ Tamamlandı |
| Orta | Backend: School detay endpoint'leri (`GET /admin/schools/:id/classes`, `/children`) | ✅ Tamamlandı |
| Düşük | Export to CSV işlevselliği | ✅ Tamamlandı |
| Düşük | Recharts ile gerçek grafik entegrasyonu (dashboard) | ✅ Tamamlandı |
| Düşük | Test dosyaları | Bekliyor |

### 9.1 Tip Düzeltmeleri (v3)

- `ActivityLogStats.total` → `total_logs` (backend response ile uyumlu)
- `SubscriptionStats`: `trial` kaldırıldı, `suspended` + `expiring_this_week` + `total_monthly_revenue` + `total_yearly_revenue` eklendi
- `activity-logs/page.tsx`: `stats.total` → `stats.total_logs` render kısmı güncellendi
- `subscriptions/page.tsx`: `stats.trial` → `stats.suspended`, `stats.monthly_revenue` → `stats.total_monthly_revenue`

### 9.2 CSV Export (v3)

- `lib/exportUtils.ts` oluşturuldu — `exportToCsv<T>(filename, rows, columns)` generic utility
- BOM (`\uFEFF`) ile Türkçe karakterler Excel'de doğru görünür
- CSV İndir butonu eklenen sayfalar: **tenants**, **schools**, **subscriptions**
- Mevcut sayfa state'i export edilir — ek API çağrısı yok

### 9.3 Dashboard Recharts Grafikleri (v3)

- `recharts` paketi kuruldu (`npm install recharts`)
- Yeni API çağrıları: `GET /admin/activity-logs/daily-summary`, `GET /admin/subscriptions/stats`
- **Aktivite Trend Grafiği** — `AreaChart`, son 14 gün, created/updated/deleted alanları
- **Abonelik Dağılım Grafiği** — `BarChart` + `Cell` ile renk kodlu (aktif/iptal/dolmuş/askıda)
- Dashboard layout: stats grid → aktivite trend → [abonelik bar | son aktiviteler]
- Grafik verileri yoksa (API dönmüyorsa) bölüm render edilmez (graceful degradation)

### 9.5 Bug Düzeltmeleri & Yeni Özellikler (v7)

**Kurum Detay Fix:**
- `GET /admin/tenants/:id` nested `{ tenant, stats }` response'u doğru parse edildi
- `tenantRes.data.data.tenant` ile Tenant nesnesi çıkarılıyor

**ActivityLog Nested Tip Düzeltmesi:**
- `ActivityLogResource` nested yapı döndürdüğü için `ActivityLog` TypeScript tipi güncellendi
- `activity-logs/page.tsx` tüm alan erişimleri düzeltildi (`log.user?.name`, `log.context?.ip_address` vb.)

**Besin Düzenle Özelliği (IngredientTab):**
- Düzenle butonu (Pencil ikonu) eklendi
- Edit dialog: isim, alerjen bilgisi, alerjen çoklu seçim pre-fill ile
- `PUT /admin/food-ingredients/:id` API çağrısı

**Para Birimi Düzenle/Sil (CurrenciesTab):**
- Düzenle butonu (Pencil) + Edit dialog eklendi → `PUT /admin/currencies/:id`
- Sil butonu (Trash2) eklendi → `DELETE /admin/currencies/:id`
- Baz para birimi (`is_base=true`) silme butonu gösterilmez

**Kullanıcı Profili Dialog (users/page.tsx):**
- "Profili Gör" dropdown item'ına onClick bağlandı
- Avatar, ad-soyad, roller (renkli badge), kurum adı, kayıt tarihi gösterilen profil dialog'u

### 9.4 Package Features CRUD (v6)

**Backend:**
- `PackageFeatureController` — full CRUD (`/admin/package-features`)
- `package_features` tablosu: `id`, `key` (unique, regex: `^[a-z0-9_]+$`), `label`, `value_type` ('bool' | 'text'), `description`, `display_order`
- `package_feature_pivot` tablosu: `package_id`, `package_feature_id`, `value` (dinamik: checkbox → "1", text → kullanıcı girişi)
- Validation: key benzersizlik, value_type enum, kullanımda olan feature silinemiyor
- PackageService: `syncPackageFeatures()` metoduyla pivot senkronizasyonu

**Frontend:**
- `packages/page.tsx` Tabs ile 2 sekmeye ayrıldı: **Paketler** (mevcut kart UI) + **Özellikler** (yeni CRUD)
- `FeaturesManagement` component: tablo, create/edit dialog, delete butonları
- Paket formlarında dinamik özellik seçimi:
  - `value_type='bool'` → Checkbox (label gösterilir)
  - `value_type='text'` → Text Input (kullanıcı değer girer, ör: "500 GB")
- TypeScript: `PackageFeature` tipi güncellendi (`description`, `display_order` eklendi)
- Badge: Özellik value_type görsel gösterimi (Checkbox | Text)

**Pivot Yapı:**
- Paketler → Features ilişkisi many-to-many
- Her paket birden fazla feature barındırabilir
- Feature değeri pivot tabloda saklanır (esnek yapı)

---

---

## 🐳 10. Docker Yapılandırması

Tüm Docker dosyaları `dockerfiles/` dizininde bulunur.

### Servisler

| Servis | İmaj | Port | Açıklama |
|--------|------|------|----------|
| `app` | php:8.4-fpm (custom) | 9000 (internal) | Laravel PHP-FPM |
| `webserver` | nginx:alpine | 80, 443 | Reverse proxy + SSL |
| `db` | mysql:8.0 | 3306 (internal) | MySQL veritabanı |
| `redis` | redis:7-alpine | 6379 (internal) | Cache + Queue |
| `frontend-admin` | node:22-alpine (custom) | **3001**→3000 | Next.js Admin Paneli (host:3001) |
| `phpmyadmin` | phpmyadmin/phpmyadmin | 8080 | DB yönetim arayüzü |

### Dizin Yapısı

```
dockerfiles/
├── docker-compose.yml
├── php/
│   └── Dockerfile       ← PHP 8.4-FPM + Redis + intl + opcache + GD
├── node/
│   └── Dockerfile       ← Node 22 Alpine — Next.js build & start
├── nginx/
│   └── conf.d/
│       └── default.conf ← HTTP→HTTPS, gzip, güvenlik header'ları
└── ssl/
    ├── nginx-selfsigned.crt
    └── nginx-selfsigned.key
```

### Temel Komutlar

```bash
cd dockerfiles

# İlk kurulum (image build + container başlat)
docker compose up -d --build

# Sadece başlat
docker compose up -d

# Durdur
docker compose down

# PHP logları
docker logs istudy-app

# Laravel artisan (container içinde)
docker exec -it istudy-app php artisan migrate

# Frontend admin yeniden build
docker compose build frontend-admin && docker compose up -d frontend-admin
```

### Önemli Notlar

- **API URL**: Docker production'da `NEXT_PUBLIC_API_URL=https://localhost/api` (nginx SSL üzerinden). Yerel geliştirmede `http://localhost:8000/api` (`.env.local`). Nginx port 8000 plain HTTP olarak Laravel'e proxy eder.
- **Frontend Port**: Host makinede `3001` portu kullanılır (`3001:3000`). Port 3000 başka proje tarafından kullanılıyor.
- **Redis**: `REDIS_CLIENT=phpredis` — PHP Dockerfile'da PECL ile kurulur
- **Healthcheck**: `app` servisi, `db` ve `redis` servisleri sağlıklı olana kadar bekler
- **SSL**: Self-signed sertifika (`ssl/` dizininde), production'da Let's Encrypt ile değiştirilmeli
- **Audit DB**: Docker ortamında `AUDIT_DB_CONNECTION=mysql` env var'ı ile audit logları ana `istudy` DB'ye yazılır (`istudy_audit` ayrı DB oluşturmaya gerek yok)
- **Entrypoint**: PHP container başlarken otomatik olarak `.env` kopyalama, `composer install`, `key:generate`, `migrate --force` çalıştırır (`dockerfiles/php/entrypoint.sh`)

---

> 📝 **Not:** Bu dosya proje geliştikçe güncellenmelidir.
