# iStudy Frontend Admin — Hafıza Dosyası

> Son Güncelleme: 2026-04-06 | Next.js 16, TypeScript 5, Tailwind v3, Vristo, Redux
> Port: 3001 | Token: `admin_token` | Yol: `frontend-admin/`
> NOT: Tenant frontend (`frontend-tenant-and-website/`) ile aynı tech stack. Temel farklar burada belgelenir.

---

## 1. Proje Kimliği

- **Token**: `admin_token` (localStorage) — tenant'tan farklı
- **Login endpoint**: `POST /auth/login` → `res.data.data.token` → `localStorage.setItem('admin_token', token)`
- **API base**: `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
- **Auth layout**: `(auth)/layout.tsx` → `return <>{children}</>` — başka hiçbir şey ekleme
- **Dashboard route**: `app/page.tsx` → `admin_token` varsa /tenants, yoksa /login

---

## 2. Dizin Yapısı (Özet)

```
app/
  page.tsx                    ← root: auth kontrolü → /tenants veya /login
  (auth)/login/
  (dashboard)/
    page.tsx                  ← Dashboard (ComponentsDashboardIStudy — ApexCharts)
    tenants/                  ← kurum listesi + detay
    schools/                  ← okul listesi + detay
    users/                    ← tab bazlı (öğretmen/veli/öğrenci/tümü)
    packages/                 ← paket CRUD + özellik yönetimi (2 tab)
    subscriptions/            ← abonelik listesi + durum filtresi
    finance/                  ← fatura + işlemler + istatistikler
    activity-logs/            ← filtre + değişiklik detayı dialog
    notifications/            ← form + geçmiş listesi
    settings/countries|currencies/
    global/allergens|medical-conditions|medications|food-ingredients|countries|currencies/
    apps/invoice/list|preview/
components/
  dashboard/components-dashboard-istudy.tsx
  icon/                       ← Vristo SVG icon'lar
  layouts/                    ← "layouts" (çoğul!) sidebar, header, provider-component
lib/
  apiClient.ts               ← Axios, Bearer admin_token, 401 → /login
  exportUtils.ts             ← exportToCsv<T>() — BOM destekli Türkçe Excel
store/ hooks/ types/
```

---

## 3. API Endpoint Eşleşmeleri

| Sayfa | Endpoint'ler |
|-------|-------------|
| Dashboard | `GET /admin/dashboard/stats`, `/dashboard/recent-activities`, `/admin/activity-logs/daily-summary`, `/admin/subscriptions/stats` |
| Tenants | `GET /admin/tenants`, `POST /auth/register`, `DELETE /admin/tenants/:id` |
| Tenant Detay | `GET /admin/tenants/:id` → `{ tenant, stats }` nested, `/tenants/:id/schools`, `/tenants/:id/subscriptions` |
| Schools | `GET /admin/schools`, `PATCH /admin/schools/:id/toggle-status`, `DELETE /admin/schools/:id` |
| School Detay | `GET /admin/schools/:id`, `/schools/:id/classes`, `/schools/:id/children` |
| Users | `GET /admin/users` (?role,?search,?page), `POST /admin/users`, `DELETE /admin/users/:id` |
| Packages | `GET /packages`, `POST /admin/packages`, `PUT /admin/packages/:id`, `GET/POST/PUT/DELETE /admin/package-features` |
| Finance | `GET /admin/invoices`, `/admin/transactions`, `/admin/transactions/stats` |
| Health | `GET/POST/PUT/DELETE /admin/allergens`, `/admin/medical-conditions`, `/admin/food-ingredients`, `/admin/medications` |
| Global Veriler | Aynı health endpoint'leri — `/global/*` sayfalarına taşındı |
| Subscriptions | `GET /admin/subscriptions`, `/admin/subscriptions/stats`, `PATCH /admin/subscriptions/:id/status`, `/extend` |
| Activity Logs | `GET /admin/activity-logs`, `/admin/activity-logs/stats` |
| Notifications | `GET /admin/system/notifications`, `POST /admin/system/notifications` |
| Countries | `GET /admin/countries`, `POST /admin/countries/sync`, `PATCH /admin/countries/:id/toggle-active` |
| Currencies | `GET /admin/currencies`, CRUD + `fetch-rates`, `set-base`, `toggle-status` |

---

## 4. Sidebar Navigasyon (Güncel)

```
GENEL BAKIŞ:   / (Dashboard)
YÖNETİM:       /tenants, /schools, /users
PAKET & SATIŞ: /packages, /subscriptions, /finance
GLOBAL VERİLER: /global/allergens, /global/medical-conditions, /global/medications,
                /global/food-ingredients, /global/countries, /global/currencies
                (collapsible accordion — /global/* yolunda başta açık)
DESTEK:        /contact-requests
SİSTEM:        /activity-logs, /notifications, /settings
```

---

## 5. Kritik Notlar

### Dashboard Stats Mapping
`/admin/dashboard/stats` nested yapı döner → frontend düz `DashboardStats` tipine map eder:
- `d.tenants.total` → `total_tenants`
- `d.tenants.with_active_subscription` → `active_tenants`
- `d.subscriptions.total_revenue` → `monthly_revenue` ve `total_revenue`

### Dashboard Recent Activities Mapping
`/admin/dashboard/recent-activities` → `{ type, description, data, timestamp }` formatı
→ `type.replace(/_/g, " ")` → `action`, `description` → `model_label`, `timestamp` → `created_at`

### AdminTenantController::show() Response
`GET /admin/tenants/:id` → `{ tenant: TenantResource, stats: {...} }` nested döner.
Frontend: `tenantRes.data.data.tenant` ile Tenant nesnesi çıkarılır.

### ActivityLogResource Nested Yapı
Flat `user_name` değil, nested:
- `log.user.name`, `log.user.email`
- `log.model.label`, `log.model.type`, `log.model.id`
- `log.context.ip_address`, `log.context.url`, `log.context.method`
- `log.changes.old_values`, `log.changes.new_values`, `log.changes.changed_fields`
- `log.action_label`, `log.description`, `log.time_ago`

### paginatedResponse Kullanımı
```php
// DOĞRU — ->resource KULLANMA:
return $this->paginatedResponse(TenantResource::collection($tenants));
```

### Package Features (Pivot Yapı)
- `package_features`: key (unique), label, value_type ('bool'|'text'), display_order
- `package_feature_pivot`: package_id, package_feature_id, value (bool→"1", text→string)
- `packages/page.tsx` 2 tab: Paketler (kart UI) + Özellikler (CRUD)

### Vristo Tema (Kritik Bug'lar)
1. `(auth)/layout.tsx` → SADECE `return <>{children}</>` — wrapper div bozar
2. `App.tsx` root div'de `relative` class OLMAMALI — login bg küçük kalır
3. `ApexCharts` → `dynamic(() => import('react-apexcharts'), { ssr: false })`
4. `layouts` dizin adı çoğul: `@/components/layouts/sidebar`

### Tailwind v3
`globals.css`: `@tailwind base/components/utilities` — v4 sözdizimi KULLANMA.

### CSV Export
`lib/exportUtils.ts` → `exportToCsv<T>(filename, rows, columns)` — BOM destekli. Kullanılan: tenants, schools, subscriptions.

### Subscription + ActivityLog Type Düzeltmeleri
- `SubscriptionStats`: `trial` yok → `suspended`, `expiring_this_week`, `total_monthly_revenue`, `total_yearly_revenue`
- `ActivityLogStats.total` → `total_logs`
