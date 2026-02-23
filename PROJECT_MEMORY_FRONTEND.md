# 🧠 iStudy Frontend Tenant & Website — Proje Hafıza Dosyası

> **Son Güncelleme:** 2026-02-22 (İlk kurulum — frontend-admin'den türetildi)
> **Amaç:** Bu dosya, `frontend-tenant-and-website` projesinin mimarisini, kararlarını ve kodlama standartlarını tüm AI ajanlarının doğru davranış üretebilmesi için belgeler.

---

## 📌 1. Proje Kimliği

| Alan | Değer |
|------|-------|
| **Proje Adı** | iStudy Frontend Tenant & Website |
| **Tip** | Müşteri (Tenant) Portalı + Kamuya Açık Web Sitesi |
| **Framework** | Next.js 16 (App Router) |
| **Dil** | TypeScript 5 |
| **Styling** | **Tailwind CSS v3** (`tailwind.config.js` + `postcss.config.mjs`) — v4 DEĞİL |
| **UI Tema** | **Vristo Tema** — `styles/globals.css` (.panel, .btn, .form-input, .sidebar, .badge vb.) |
| **State Management** | **Redux** (`@reduxjs/toolkit` + `react-redux`) — `themeConfigSlice` ile tema/sidebar |
| **API İletişimi** | Axios (Merkezi `apiClient` yapısı) |
| **Auth Token** | **`tenant_token`** — `localStorage` → `admin_token` DEĞİL, her zaman `tenant_token` |
| **Form Yönetimi** | React Hook Form + Zod v4 |
| **Bildirimler** | Sonner (toast) |
| **Popup/Dialog** | **SweetAlert2** + `@headlessui/react` |
| **İkonlar** | `lucide-react` + Vristo custom SVG (`components/icon/`) |
| **Port (dev)** | **3002** — Admin: 3001, Tenant: 3002 |
| **Proje Yolu** | `/Users/veysel.aydogdu/Desktop/WebProjects/iStudy/istudy-backend/frontend-tenant-and-website` |
| **Kaynak (Base)** | `frontend-admin` kopyasından türetildi (Vristo tema, Tailwind v3, Redux stack aynı) |

---

## 📐 2. Uygulama Katmanları (3 Katmanlı Yapı)

```
┌─────────────────────────────────────────────────────────┐
│  1. Kamuya Açık Web Sitesi  → (website) route group     │
│     /               Ana sayfa (landing)                  │
│     /pricing        Paket fiyatlandırma                  │
│     /about          Hakkımızda                           │
│     /contact        İletişim formu                       │
│     Layout: PublicNavbar + PublicFooter (server comp.)  │
├─────────────────────────────────────────────────────────┤
│  2. Auth Akışı  → (auth) route group                    │
│     /login             Giriş                            │
│     /register          Adım 1: Hesap oluştur            │
│     /register/plans    Adım 2: Paket seç                │
│     Layout: SADECE passthrough <>{children}</>          │
├─────────────────────────────────────────────────────────┤
│  3. Tenant Dashboard  → (tenant) route group            │
│     /dashboard         Ana panel                        │
│     /schools           Okul listesi                     │
│     /schools/[id]      Okul detayı                      │
│     /subscription      Abonelik yönetimi                │
│     /invoices          Fatura geçmişi                   │
│     /notifications     Bildirimler                      │
│     /profile           Profil & şifre                   │
│     Layout: Sidebar + Header (tenant_token guard)       │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 3. Dizin Yapısı (Tam)

```
frontend-tenant-and-website/
├── app/
│   ├── layout.tsx                      ← Root Layout (Nunito font, ProviderComponent, Toaster)
│   ├── globals.css                     ← Tailwind v3 (@tailwind base/components/utilities)
│   ├── (website)/                      ← Kamuya açık, PublicNavbar+PublicFooter
│   │   ├── layout.tsx                  ← Server component, import PublicNavbar + PublicFooter
│   │   ├── page.tsx                    ← Ana sayfa (tenant_token→/dashboard redirect)
│   │   ├── pricing/page.tsx            ← GET /packages, aylık/yıllık toggle
│   │   ├── about/page.tsx              ← Statik, misyon/vizyon kartları
│   │   └── contact/page.tsx            ← RHF+Zod iletişim formu
│   ├── (auth)/                         ← ⚠️ SADECE passthrough layout!
│   │   ├── layout.tsx                  ← return <>{children}</> — başka hiçbir şey ekleme!
│   │   ├── login/page.tsx              ← tenant_token → /dashboard yönlendir
│   │   └── register/
│   │       ├── page.tsx                ← Adım 1: Hesap bilgileri
│   │       └── plans/page.tsx          ← Adım 2: Paket seç → /dashboard
│   └── (tenant)/                       ← tenant_token guard, Sidebar+Header
│       ├── layout.tsx                  ← Auth check: tenant_token yoksa /login
│       ├── dashboard/page.tsx          ← Stats + usage bars + recent schools
│       ├── schools/
│       │   ├── page.tsx                ← CRUD listesi (paginated, search)
│       │   └── [id]/page.tsx           ← Sınıflar + Öğrenciler tab
│       ├── subscription/page.tsx       ← Mevcut plan / paket seçimi + geçmiş
│       ├── invoices/page.tsx           ← Fatura tablosu
│       ├── notifications/page.tsx      ← Okundu/okunmadı yönetimi
│       └── profile/page.tsx            ← Profil + şifre değiştir (2 bağımsız form)
├── components/
│   ├── PublicNavbar.tsx                ← Sticky navbar, mobile hamburger
│   ├── PublicFooter.tsx                ← Dark footer, 4 kolon
│   ├── dropdown.tsx                    ← react-popper tabanlı dropdown
│   ├── icon/                           ← Vristo SVG icon bileşenleri
│   ├── layouts/                        ← ⚠️ "layouts" (çoğul) — "layout" değil
│   │   ├── sidebar.tsx                 ← Tenant nav (6 item), tenant_token logout
│   │   ├── header.tsx                  ← Sayfa başlıkları, /auth/me, unread badge
│   │   ├── content-animation.tsx
│   │   ├── footer.tsx
│   │   ├── loading.tsx
│   │   ├── main-container.tsx
│   │   ├── overlay.tsx
│   │   ├── provider-component.tsx      ← Redux Provider + App wrapper
│   │   ├── scroll-to-top.tsx
│   │   └── setting.tsx                 ← Vristo tema özelleştirme paneli
│   └── ui/                             ← Vristo UI bileşenleri (badge, vb.)
├── lib/
│   ├── apiClient.ts                    ← Axios, tenant_token, withCredentials KALDIRILDI
│   ├── exportUtils.ts
│   └── utils.ts
├── types/
│   └── index.ts                        ← Tüm TypeScript tipleri
├── store/
│   ├── index.tsx
│   └── themeConfigSlice.tsx
├── hooks/
│   └── useDebounce.ts
├── styles/
│   ├── globals.css                     ← Vristo CSS + Tailwind v3
│   └── animate.css
├── public/assets/images/auth/          ← bg-gradient.png, map.png, objects
├── App.tsx                             ← ⚠️ Root div'de `relative` class OLMAMALI
├── theme.config.tsx
├── i18n.ts
├── .env.local                          ← NEXT_PUBLIC_API_URL=http://localhost:8000/api
├── tailwind.config.js                  ← Vristo renk paleti (v3)
├── postcss.config.mjs
├── package.json                        ← name: frontend-tenant-and-website, dev: port 3002
└── next.config.ts
```

> **ÖNEMLİ:** `app/page.tsx` YOK. `/` URL'si `app/(website)/page.tsx`'e aittir. İkisi aynı anda olursa Next.js route conflict atar.

---

## 🔑 4. Auth Sistemi (KRİTİK)

### Token Anahtarı: `tenant_token`

**Her zaman `tenant_token` kullan. `admin_token` YAZMA.**

```typescript
// ✅ DOĞRU
localStorage.setItem('tenant_token', token)
localStorage.getItem('tenant_token')
localStorage.removeItem('tenant_token')

// ❌ YANLIŞ
localStorage.setItem('admin_token', token)
```

### Auth Akışı

```
1. (website)/page.tsx
   → useEffect: tenant_token varsa /dashboard yönlendir

2. /login
   → POST /auth/login
   → response.data.data.token
   → localStorage.setItem('tenant_token', token)
   → router.push('/dashboard')

3. /register (Adım 1)
   → POST /auth/register { name, email, password, password_confirmation, phone?, institution_name }
   → localStorage.setItem('tenant_token', token)
   → router.push('/register/plans')

4. /register/plans (Adım 2)
   → tenant_token yoksa /register'a redirect
   → GET /packages
   → POST /tenant/subscribe { package_id, billing_cycle }
   → router.push('/dashboard')
   → "Şimdi Değil, Atla" → router.push('/dashboard')

5. (tenant)/layout.tsx
   → useEffect: tenant_token yoksa /login yönlendir

6. apiClient.ts
   → Request interceptor: Authorization: Bearer {tenant_token}
   → Response interceptor: 401 → removeItem('tenant_token') + /login redirect
   → withCredentials: KALDIRILDI (token-based, SPA cookie değil)

7. Logout (sidebar + header)
   → localStorage.removeItem('tenant_token')
   → window.location.href = '/login'
```

---

## 🔗 5. API → Sayfa Eşleşme Tablosu

| Sayfa | Kullanılan Endpoint'ler |
|-------|------------------------|
| `(website)/page.tsx` | `GET /packages` (herkese açık, auth yok) |
| `(website)/pricing/page.tsx` | `GET /packages` |
| `(auth)/login/page.tsx` | `POST /auth/login` |
| `(auth)/register/page.tsx` | `POST /auth/register` |
| `(auth)/register/plans/page.tsx` | `GET /packages`, `POST /tenant/subscribe` |
| `(tenant)/dashboard/page.tsx` | `GET /auth/me`, `GET /tenant/subscription`, `GET /tenant/subscription/usage`, `GET /schools` |
| `(tenant)/schools/page.tsx` | `GET /schools` (?page, ?search), `POST /schools`, `DELETE /schools/{id}` |
| `(tenant)/schools/[id]/page.tsx` | `GET /schools/{id}`, `GET /schools/{id}/classes`, `GET /schools/{id}/children` |
| `(tenant)/subscription/page.tsx` | `GET /tenant/subscription`, `GET /tenant/subscription/usage`, `GET /tenant/subscription/history`, `POST /tenant/subscribe`, `POST /tenant/subscription/cancel`, `GET /packages` |
| `(tenant)/invoices/page.tsx` | `GET /invoices/tenant` (?page) |
| `(tenant)/notifications/page.tsx` | `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` |
| `(tenant)/profile/page.tsx` | `GET /auth/me`, `PUT /auth/me`, `POST /auth/change-password` |
| `components/layouts/header.tsx` | `GET /auth/me` (initials), `GET /notifications/unread-count` (badge) |

### API Response Formatı (Backend Standardı)

```json
// Tekil başarı
{ "success": true, "message": "...", "data": { ... } }

// Sayfalı liste
{ "success": true, "message": "...", "data": [...], "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 73 } }

// Hata
{ "success": false, "message": "...", "data": null }
```

**Frontend erişim kalıpları:**
- `res.data.data` → veri (tekil veya dizi)
- `res.data.meta` → pagination bilgisi
- `res.data.data.token` → auth token

---

## 🎨 6. UI/Stilin Kullanımı (Vristo Tema)

### Vristo CSS Sınıfları

```html
<!-- Panel kartı -->
<div className="panel">...</div>

<!-- Butonlar -->
<button className="btn btn-primary">Kaydet</button>
<button className="btn btn-outline-primary btn-sm">Detay</button>
<button className="btn btn-outline-danger">Sil</button>
<button className="btn btn-gradient">Giriş Yap</button>

<!-- Form input -->
<input className="form-input" />
<textarea className="form-input" />

<!-- Tablo -->
<div className="table-responsive">
  <table className="table-hover">...</table>
</div>

<!-- Badge -->
<span className="badge badge-outline-success">Aktif</span>
<span className="badge badge-outline-danger">İptal</span>
<span className="badge badge-outline-warning">Bekliyor</span>
<span className="badge badge-outline-info">Deneme</span>
<span className="badge badge-outline-secondary">Pasif</span>

<!-- Form hata durumu -->
<div className={errors.field ? 'has-error' : ''}>
  <input className="form-input" />
  <p className="mt-1 text-xs text-danger">{errors.field.message}</p>
</div>
```

### Vristo Renk Tokenleri

```
text-primary    → Ana mavi
text-success    → Yeşil
text-danger     → Kırmızı
text-warning    → Sarı/turuncu
text-info       → Cyan/açık mavi
text-secondary  → Gri/mor
text-dark       → Koyu metin
text-white-dark → Açık tema dark metin
bg-primary/10   → %10 opasite primary arka plan
```

### Tailwind v3 — Kesin Kurallar

```css
/* globals.css — Doğru (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* YANLIŞ (v4 sözdizimi) */
@import "tailwindcss";
```

- `tailwind.config.js` (`.ts` değil)
- `postcss.config.mjs`: `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`

---

## 💻 7. Kodlama Standartları

### 7.1 Sayfa Şablonu

```tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

export default function XxxPage() {
    const [items, setItems] = useState<Type[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/endpoint');
            if (res.data?.data) setItems(res.data.data);
        } catch {
            toast.error('Yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);
    // ...
}
```

### 7.2 Hata Yakalama

```tsx
} catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    toast.error(error.response?.data?.message ?? 'İşlem sırasında hata oluştu.');
}
```

### 7.3 Zod v4 + RHF Kullanımı

```tsx
import * as z from 'zod';       // ⚠️ import * as z (named import değil)
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({ ... });
const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
});
// Dinamik/generic schema için tip uyumsuzluğu olursa:
// (useForm as any)({ resolver: zodResolver(schema as any) })
```

### 7.4 Paralel Veri Çekme

```tsx
// Promise.all ile paralel API çağrısı
const [subRes, usageRes] = await Promise.all([
    apiClient.get('/tenant/subscription').catch(() => ({ data: { data: null } })),
    apiClient.get('/tenant/subscription/usage').catch(() => ({ data: { data: null } })),
]);
if (subRes.data?.data) setSubscription(subRes.data.data);
if (usageRes.data?.data) setUsage(usageRes.data.data);
```

### 7.5 Pagination Standardı

```tsx
// Backend parametreleri
apiClient.get('/endpoint', { params: { page, search: search || undefined } })

// State
const [page, setPage] = useState(1);
const [lastPage, setLastPage] = useState(1);
// Search değişince page reset
onChange={(e) => { setSearch(e.target.value); setPage(1); }}

// UI
<button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
    <ChevronLeft />
</button>
<span>{page} / {lastPage}</span>
<button disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>
    <ChevronRight />
</button>
```

### 7.6 SweetAlert2 Onay Paterni

```tsx
import Swal from 'sweetalert2';

const result = await Swal.fire({
    title: 'Silmek istediğinize emin misiniz?',
    text: 'Bu işlem geri alınamaz.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Evet, Sil',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#e7515a',
});
if (!result.isConfirmed) return;
// silme işlemi...
```

### 7.7 ApexCharts (Grafik Kullanımı)

```tsx
// SSR hatası alınır — dynamic import zorunlu
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
```

---

## 🗺️ 8. Sidebar Navigasyon Yapısı

```typescript
// components/layouts/sidebar.tsx
const navGroups = [
    {
        label: 'ANA MENÜ',
        items: [{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]
    },
    {
        label: 'YÖNETİM',
        items: [{ title: 'Okullarım', href: '/schools', icon: School }]
    },
    {
        label: 'HESAP',
        items: [
            { title: 'Aboneliğim', href: '/subscription', icon: CreditCard },
            { title: 'Faturalar',  href: '/invoices',     icon: FileText },
        ]
    },
    {
        label: 'SİSTEM',
        items: [
            { title: 'Bildirimler', href: '/notifications', icon: Bell },
            { title: 'Profil',      href: '/profile',       icon: User },
        ]
    },
];
```

### Header sayfa başlıkları

```typescript
const pageTitles: Record<string, string> = {
    '/dashboard':    'Dashboard',
    '/schools':      'Okullarım',
    '/subscription': 'Aboneliğim',
    '/invoices':     'Faturalar',
    '/notifications':'Bildirimler',
    '/profile':      'Profil',
};
```

---

## 🏗️ 9. Route Group Mimarisi (DETAYLI)

### `(website)` — Kamuya Açık

- **Layout:** Server component. Redux KULLANMAZ. PublicNavbar + `<main>` + PublicFooter.
- **`page.tsx` (ana sayfa):** `'use client'` — `useEffect` ile `tenant_token` kontrolü + `GET /packages` ile pricing preview.
- **`pricing/page.tsx`:** `'use client'` — aylık/yıllık toggle state. `GET /packages`.
- **`about/page.tsx`:** Server component (statik). `export const metadata` ile SEO.
- **`contact/page.tsx`:** `'use client'` — RHF+Zod form. Backend endpoint henüz yok, simüle.

### `(auth)` — Auth Sayfaları

- **Layout:** `export default function AuthLayout({ children }) { return <>{children}</>; }` — **SADECE BU.** Başka hiçbir şey ekleme. Wrapper div bile eklersen login sayfasının `absolute inset-0` arka planı küçük kalır.
- **`login/page.tsx`:** Vristo "Login Boxed" stili. `absolute inset-0` gradient bg. `bg-gradient.png` + dekoratif objeler. Glassmorphism kart.
- **`register/page.tsx`:** Aynı Vristo bg stili. 6 alan: name, institution_name, email, phone?, password, password_confirmation.
- **`register/plans/page.tsx`:** Tam ekran gradient bg. Paket seçim kartları. "Şimdi Değil, Atla" butonu.

### `(tenant)` — Korumalı Dashboard

- **Layout:** `'use client'` — `useEffect` ile `tenant_token` kontrolü. `Loader2` spinner (yükleme ekranı).
- Tüm tenant sayfaları `p-6` padding + `.panel` kart yapısı kullanır.

---

## 📋 10. TypeScript Tipleri (Özet)

```typescript
// types/index.ts

PaginatedResponse<T>    // success, message, data[], meta{current_page, last_page, per_page, total}
ApiResponse<T>          // success, message, data

User                    // id, name, surname?, email, phone?, tenant_id?, tenant?{id, name}
Package                 // id, name, monthly_price, yearly_price, max_schools, max_students, package_features?
PackageFeature          // id, key, label, value_type('bool'|'text'), value?
TenantSubscription      // id, status('active'|'cancelled'|'expired'|'trial'), billing_cycle, package?
SubscriptionUsage       // schools{used,limit}, students{used,limit}, classes{used,limit}
School                  // id, name, address?, phone?, email?, status?, classes_count?, children_count?
Invoice                 // id, invoice_number?, status, total_amount, currency, created_at
InvoiceItem             // id, invoice_id, description, quantity, unit_price, total_price
TenantNotification      // id, title, body, type, is_read, created_at
```

---

## ⚠️ 11. Kritik Bug Fix'ler (Bunları Tekrarlama)

### 1. `(auth)/layout.tsx` — Sadece Passthrough

```tsx
// ✅ DOĞRU — tam olarak bu, başka hiçbir şey
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
// ❌ YANLIŞ — wrapper div eklenirse login bg bozulur
export default function AuthLayout({ children }) {
    return <div className="min-h-screen">{children}</div>;  // BU YANLIŞ
}
```

### 2. `App.tsx` — `relative` Class Yok

```tsx
// ✅ DOĞRU
<div className={`${themeConfig.sidebar ? 'toggle-sidebar' : ''} main-section ...`}>
// ❌ YANLIŞ — login sayfasındaki absolute inset-0 bg küçük kalır
<div className={`relative ${themeConfig.sidebar ? 'toggle-sidebar' : ''} ...`}>
```

### 3. `app/page.tsx` — Oluşturma

`(website)/page.tsx` zaten `/` URL'sini alır. `app/page.tsx` oluşturulursa Next.js route conflict verir.

### 4. `components/layouts` — Çoğul

Dizin adı `layouts` (çoğul). `layout` (tekil) değil. Import yollarında dikkat:
```typescript
import Sidebar from '@/components/layouts/sidebar';  // ✅
import Sidebar from '@/components/layout/sidebar';   // ❌
```

### 5. `withCredentials: false` (apiClient)

Admin'deki `withCredentials: true` KALDIRILDI. Bu uygulama token-based auth kullanır, Sanctum SPA cookie kullanmaz.

### 6. `tenant_token` vs `admin_token`

Bu projede hiçbir yerde `admin_token` kullanılmaz. Tüm `localStorage` işlemleri `tenant_token` ile yapılır.

---

## 🔧 12. PublicNavbar & PublicFooter

### PublicNavbar (`components/PublicNavbar.tsx`)

- `'use client'` — `useState` ile mobile hamburger toggle
- **Sticky + backdrop-blur** header
- Nav linkleri: Ana Sayfa `/`, Özellikler `/#features`, Fiyatlandırma `/pricing`, Hakkımızda `/about`, İletişim `/contact`
- Desktop: Logo | Nav linkleri | "Giriş Yap" (btn-outline-primary) + "Ücretsiz Başla" (btn-primary)
- Mobile: Hamburger ile collapse menü

### PublicFooter (`components/PublicFooter.tsx`)

- Server component (import yok, `'use client'` değil)
- **Dark (`bg-dark`) arka plan**, beyaz metin
- 4 kolon: Brand (logo + açıklama), Ürün, Şirket, Hesap
- Alt çizgi: © yılı + telif

---

## 🚀 13. Geliştirme Komutları

```bash
# Proje dizinine gir
cd frontend-tenant-and-website

# Geliştirme sunucusu (port 3002)
npm run dev

# Production build
npm run build

# Lint (eslint v10 + eslint-plugin-react uyumsuzluğu — admin ile aynı bilinen hata)
npm run lint

# TypeScript type check
npx tsc --noEmit
```

---

## 🐳 14. Docker Yapılandırması

### Servis: `frontend-tenant`

```yaml
# dockerfiles/docker-compose.yml
frontend-tenant:
  build:
    context: ..
    dockerfile: dockerfiles/node/Dockerfile.tenant
  container_name: istudy-frontend-tenant
  restart: unless-stopped
  ports:
    - "3002:3000"       # Host: 3002, Container: 3000
  environment:
    NODE_ENV: production
    NEXT_PUBLIC_API_URL: https://localhost/api
  networks:
    - istudy-network
  depends_on:
    - webserver
```

### Dockerfile: `dockerfiles/node/Dockerfile.tenant`

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY frontend-tenant-and-website/package*.json ./
RUN npm install
COPY frontend-tenant-and-website/ .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Tüm Servis Portları

| Servis | Host Port | Açıklama |
|--------|-----------|----------|
| Laravel API (HTTPS) | 443 | https://localhost/api |
| Laravel API (HTTP) | 8000 | http://localhost:8000/api (yerel geliştirme) |
| Frontend Admin | 3001 | http://localhost:3001 |
| **Frontend Tenant & Website** | **3002** | **http://localhost:3002** |
| PHPMyAdmin | 8080 | http://localhost:8080 |

---

## 📊 15. Sayfa Detay Notları

### Dashboard (`/dashboard`)

- `Promise.all` ile 4 paralel istek: `/auth/me`, `/tenant/subscription`, `/tenant/subscription/usage`, `/schools`
- Abonelik yoksa → warning banner + "Paket Seç" CTA
- Usage progress bar renkleri:
  - 0–70%: `bg-success`
  - 70–90%: `bg-warning`
  - 90%+: `bg-danger`
  - Limit = 0 (sınırsız): bar gösterilmez, "Sınırsız" text

### Schools CRUD (`/schools`)

- `GET /schools?page=1&search=xxx` — paginated + search
- Yeni okul: modal dialog → `POST /schools { name, address, phone, email }`
- Sil: SweetAlert2 onay → `DELETE /schools/{id}`
- Satır tıklama: `Link href="/schools/{id}"`

### Schools Detail (`/schools/[id]`)

- Tab sistem: Sınıflar | Öğrenciler (state tabanlı, headlessui değil)
- `GET /schools/{id}/classes` — sınıf sayısı, kapasite
- `GET /schools/{id}/children` — öğrenci adı, soyadı, doğum tarihi

### Subscription (`/subscription`)

- Abonelik varsa: plan bilgisi + kullanım bars + geçmiş tablosu + "İptal Et" butonu
- Abonelik yoksa: aylık/yıllık toggle + paket kartları + "Seç" butonu
- İptal: SweetAlert2 → `POST /tenant/subscription/cancel`

### Notifications (`/notifications`)

- Okunmamış → koyu stil (`bg-primary/5`)
- Okunmuş → açık stil
- Bireysel: `PATCH /notifications/{id}/read`
- Toplu: `PATCH /notifications/read-all`

### Profile (`/profile`)

- **2 bağımsız form kartı** — paylaşılan state yok
- Profil: `GET /auth/me` ile pre-fill → `PUT /auth/me`
- Şifre: current_password, password, password_confirmation → `POST /auth/change-password`

---

## 🔗 16. İlgili Projeler

| Proje | Yol | Port | Token |
|-------|-----|------|-------|
| **Backend (Laravel API)** | `istudy-backend/` | 8000 / 443 | Bearer token (Sanctum) |
| **Frontend Admin** | `frontend-admin/` | 3001 | `admin_token` |
| **Frontend Tenant & Website** | `frontend-tenant-and-website/` | 3002 | `tenant_token` |

### Admin ile Farklar

| Konu | Frontend Admin | Frontend Tenant & Website |
|------|---------------|--------------------------|
| Token | `admin_token` | `tenant_token` |
| Giriş sonrası redirect | `/` (tenants sayfası) | `/dashboard` |
| Sidebar nav | 6 grup, ~20 item | 4 grup, 6 item |
| Route group | `(dashboard)` | `(tenant)` |
| Public pages | Yok | Var `(website)` |
| `withCredentials` | `true` | Kaldırıldı (`false`) |
| Docker port | 3001 | 3002 |

---

## ✅ 17. Tamamlanan Özellikler

| Modül | Durum | Açıklama |
|-------|-------|----------|
| **Auth (Login/Logout/Register)** | ✅ Tam | tenant_token, 2 adımlı onboarding |
| **Paket Seçimi (Onboarding)** | ✅ Tam | Aylık/yıllık toggle, API'den gerçek veri |
| **Kamuya Açık Web Sitesi** | ✅ Tam | Ana sayfa, pricing, about, contact |
| **Dashboard** | ✅ Tam | Stats, usage bars, son okullar tablosu |
| **Okullar (CRUD)** | ✅ Tam | Liste, ekle, sil, pagination, search |
| **Okul Detayı** | ✅ Tam | Sınıflar + öğrenciler tab |
| **Abonelik** | ✅ Tam | Plan bilgisi, usage, geçmiş, iptal, paket seçimi |
| **Faturalar** | ✅ Tam | Sayfalı tablo, durum badge |
| **Bildirimler** | ✅ Tam | Okundu/okunmadı, toplu işaret |
| **Profil** | ✅ Tam | Profil güncelleme + şifre değiştir |
| **Sidebar & Header** | ✅ Tam | tenant_token logout, /auth/me, unread badge |
| **PublicNavbar & Footer** | ✅ Tam | Responsive, mobile hamburger |
| **Docker** | ✅ Tam | Dockerfile.tenant + docker-compose servis |
| **TypeScript Build** | ✅ 0 Hata | `npm run build` — 16 route, temiz build |

---

## 📌 18. Yeni Özellik Eklerken Kontrol Listesi

1. ✅ Token: `tenant_token` kullan (hiçbir yerde `admin_token` yazma)
2. ✅ Route: `(tenant)` grubunda mı, `(website)` grubunda mı, `(auth)` grubunda mı?
3. ✅ Sidebar'a yeni route eklenecekse `components/layouts/sidebar.tsx` + `components/layouts/header.tsx` güncelle
4. ✅ API endpoint: `apiClient.get/post/put/patch/delete('/...')` → `res.data.data` pattern
5. ✅ Loading state: `useState(true)` + spinner
6. ✅ Hata yakalama: `catch` + `toast.error(...)`
7. ✅ Silme işlemleri: SweetAlert2 onay dialogu
8. ✅ Tailwind v3 sınıfları kullan — v4 sözdizimi YAZMA
9. ✅ `app/page.tsx` OLUŞTURMA
10. ✅ `(auth)/layout.tsx`'e wrapper EKLEME

---

> 📝 **Not:** Bu dosya proje geliştikçe güncellenmelidir. Her yeni sayfa, bileşen veya API entegrasyonunda bu dosyanın ilgili bölümünün güncellenmesi önerilir.
