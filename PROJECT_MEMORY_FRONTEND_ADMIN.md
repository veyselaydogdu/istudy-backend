# 🧠 iStudy Frontend Admin — Proje Hafıza Dosyası

> **Son Güncelleme:** 2026-02-20 (ActivityLog nested tip düzeltmesi, kurum detay fix, besin düzenle, para birimi edit/sil, kullanıcı profili dialog — v7)
> **Amaç:** Bu dosya, Frontend Admin panelinin geliştirilme sürecini, mimari kararlarını, kullanılan teknolojileri ve bileşen yapısını belgelemek için oluşturulmuştur.

---

## 📌 1. Proje Kimliği

| Alan | Değer |
|------|-------|
| **Proje Adı** | iStudy Frontend Admin |
| **Tip** | Super Admin Yönetim Paneli |
| **Framework** | Next.js 16 (App Router) |
| **Dil** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **UI Kütüphanesi** | Radix UI Primitives + Lucide Icons |
| **State Management** | React State + Hooks (useState, useEffect, useCallback) |
| **API İletişimi** | Axios (Merkezi `apiClient` yapısı) |
| **Form Yönetimi** | React Hook Form + Zod |
| **Bildirimler** | Sonner (toast) |
| **Tema** | next-themes (light/dark/system) |
| **Grafikler** | Recharts 3 (AreaChart, BarChart, ResponsiveContainer) |
| **CSV Export** | lib/exportUtils.ts (BOM destekli, Türkçe Excel uyumlu) |
| **Proje Yolu** | `/Users/veysel.aydogdu/Desktop/WebProjects/iStudy/istudy-backend/frontend-admin` |

---

## 📂 2. Dizin Yapısı (Güncel)

```
frontend-admin/
├── app/
│   ├── page.tsx                   ← Root: auth kontrolü → /tenants veya /login yönlendirir
│   ├── layout.tsx                 ← Root Layout (Geist font, ThemeProvider, Sonner Toaster, lang="tr")
│   ├── globals.css                ← Tailwind v4 + CSS variables (light/dark mode)
│   ├── (auth)/
│   │   ├── layout.tsx             ← Merkezi layout (login için)
│   │   └── login/
│   │       └── page.tsx           ← Login sayfası (Zod + RHF, token → localStorage, CSRF yok — token-based auth)
│   └── (dashboard)/
│       ├── layout.tsx             ← Auth kontrolü (admin_token check), Sidebar + Header
│       ├── page.tsx               ← Dashboard özet (gerçek API data: stats + recent activities)
│       ├── tenants/
│       │   ├── page.tsx           ← Kurum CRUD (tablo + dialog form, /admin/tenants)
│       │   └── [id]/
│       │       └── page.tsx       ← Kurum detayı: okul listesi + abonelik geçmişi tabları
│       ├── schools/
│       │   ├── page.tsx           ← Okul listesi (tablo, filtre, durum toggle, /admin/schools)
│       │   └── [id]/
│       │       └── page.tsx       ← Okul detayı: sınıflar + öğrenciler tabları
│       ├── users/
│       │   └── page.tsx           ← Kullanıcı havuzu (tab: öğretmen/veli/öğrenci/tümü, pagination)
│       ├── packages/
│       │   └── page.tsx           ← B2B Paket CRUD (kart görünümü, /admin/packages)
│       ├── finance/
│       │   └── page.tsx           ← Fatura + POS İşlemleri tabları, istatistik kartları
│       ├── health/
│       │   └── page.tsx           ← Alerjenler + Tıbbi Durumlar + Besin İçerikleri + İlaçlar CRUD
│       ├── subscriptions/
│       │   └── page.tsx           ← Abonelik listesi, durum filtresi, uzatma dialog, istatistikler
│       ├── activity-logs/
│       │   └── page.tsx           ← Aktivite kayıtları, filtreler, değişiklik detay dialog
│       ├── notifications/
│       │   └── page.tsx           ← Bildirim gönderme formu + gönderim geçmişi
│       └── settings/
│           └── page.tsx           ← Ülkeler (sync + toggle) + Para Birimleri (CRUD + kur güncelleme)
├── components/
│   ├── ui/
│   │   ├── badge.tsx              ← Badge (variant: default/success/warning/danger/secondary/outline)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx             ← Radix UI Select (filter dropdowns için)
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   └── layout/
│       ├── sidebar.tsx            ← Fixed sidebar, nav items (Abonelikler + Aktivite eklendi), logout
│       └── header.tsx             ← Sticky header, dark mode toggle (next-themes), user avatar
├── hooks/
│   └── useDebounce.ts             ← Debounce hook (delay: 400ms default)
├── lib/
│   ├── apiClient.ts               ← Axios instance (Bearer token, 401 redirect, CSRF)
│   ├── exportUtils.ts             ← exportToCsv() helper (BOM, Türkçe Excel uyumlu)
│   └── utils.ts                   ← cn() utility (clsx + tailwind-merge)
├── types/
│   └── index.ts                   ← Tüm TypeScript tipleri (User, Tenant, School, Invoice, ActivityLog, etc.)
├── public/
├── .env.local                     ← NEXT_PUBLIC_API_URL=http://localhost:8000/api
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

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
| **Dark Mode** | ✅ Tam | next-themes, header toggle, system default |
| **useDebounce Hook** | ✅ Tam | hooks/useDebounce.ts |
| **Select Component** | ✅ Tam | Radix UI Select wrapper |
| **TypeScript Tipleri** | ✅ Tam | types/index.ts — tüm entity tipleri (`ActivityLogStats.total_logs`, `SubscriptionStats` güncellendi) |
| **Badge Bileşeni** | ✅ Tam | 6 variant, dark mode uyumlu |
| **CSV Export** | ✅ Tam | lib/exportUtils.ts — tenants/schools/subscriptions sayfalarında "CSV İndir" butonu |
| **Recharts Grafikleri** | ✅ Tam | Dashboard'da aktivite trend (AreaChart) + abonelik dağılım (BarChart) |

---

## ⚠️ 7. Önemli Notlar

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
