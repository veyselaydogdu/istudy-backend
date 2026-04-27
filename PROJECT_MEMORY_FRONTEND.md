# iStudy Frontend Tenant & Website — Hafıza Dosyası

> Son Güncelleme: 2026-04-30 | Next.js 16, TypeScript 5, Tailwind v3, Vristo, Redux, Axios
> Port: 3002 | Token: `tenant_token` | Yol: `frontend-tenant-and-website/`

---

## 1. Sayfa Yapısı (Route Grupları)

```
app/
  (website)/          Kamuya açık — PublicNavbar + PublicFooter (server layout)
    page.tsx          → tenant_token varsa /dashboard redirect
    pricing/          GET /packages
    about/, contact/
  (auth)/             ⚠️ SADECE passthrough: return <>{children}</> — başka hiçbir şey ekleme!
    login/            POST /auth/login
    register/         POST /auth/register → /register/plans
    register/plans/   GET /packages, POST /tenant/subscribe
    subscription/select-plan/  Abonelik yok sayfası (Atla butonu YOK)
  (tenant)/           tenant_token + subscription guard — Sidebar + Header
    layout.tsx        token yoksa /login, abonelik yoksa /subscription/select-plan
    dashboard/        GET /auth/me, /tenant/subscription, /tenant/subscription/usage, /schools
    schools/          GET/POST/PUT/DELETE /schools
    schools/[id]/     okul detayı (classes CRUD + teacher atama + child-requests)
    schools/[id]/classes/[classId]/  supply-list, attendance, meal-menus/monthly
    meals/            meals + food-ingredients + allergens CRUD
    activities/       activities CRUD (school seçici, start/end date, class checkbox)
    activity-classes/ activity-classes CRUD (school opsiyonel, filterSchoolId/formSchoolId ayrı state)
    activity-classes/[id]/  detay (tüm API çağrıları /activity-classes/{id}/... tenant-level)
    academic-years/   academic-years CRUD + set-current + close
    teachers/         tenant-level öğretmen: Öğretmeni Davet Et + Katılma Talepleri + activate/deactivate
    subscription/     mevcut plan + kullanım + planı değiştir + geçmiş
    invoices/         GET /invoices/tenant
    notifications/    gelen inbox + bildirim gönder
    profile/          GET/PUT /auth/me, POST /auth/change-password
```

---

## 2. Auth Sistemi (KRİTİK)

**Token anahtarı: HER ZAMAN `tenant_token`** — `admin_token` YAZMA.

```typescript
// apiClient.ts — her istek için:
Authorization: Bearer {localStorage.getItem('tenant_token')}
// 401 → removeItem('tenant_token') + /login redirect
// withCredentials: KALDIRILDI (token-based, SPA cookie değil)
```

**Auth Akışı:**
1. `(website)/page.tsx`: tenant_token varsa /dashboard yönlendir
2. Login: `POST /auth/login` → `res.data.data.token` → `localStorage.setItem('tenant_token', token)`
3. Register: `POST /auth/register` → token → /register/plans
4. `(tenant)/layout.tsx`: token yoksa /login, abonelik yoksa /subscription/select-plan

---

## 3. API Endpoint Eşleşmeleri

| Sayfa | Endpoint'ler |
|-------|-------------|
| `dashboard` | `GET /auth/me`, `/tenant/subscription`, `/tenant/subscription/usage`, `/schools` |
| `schools` | `GET/POST/PUT/DELETE /schools`, `GET /countries` |
| `schools/[id]` | `GET /schools/{id}`, `/classes`, `/teachers?detailed=1`, `/teachers/{id}`, `GET /teacher-role-types`, `GET /teachers`, `/classes/{classId}/teachers` |
| `schools/[id]/classes/[classId]` | `GET/POST/PUT/DELETE /schools/{id}/classes/{classId}/supply-list`, `POST /schools/{id}/attendances`, `GET /meal-menus/monthly` |
| `meals` | `GET/POST/PUT/DELETE /meals`, `/food-ingredients`, `/allergens` |
| `activities` | `GET/POST/PUT/DELETE /schools/{id}/activities`, `GET /academic-years?school_id`, `GET /schools/{id}/classes` |
| `activity-classes` | `GET/POST/PUT/DELETE /activity-classes` (?school_id filter) |
| `activity-classes/[id]` | `GET /activity-classes/{id}`, `/enrollments`, `/teachers`, `/materials`, `/gallery`, `/invoices` |
| `academic-years` | `GET /schools`, `GET/POST/PUT/DELETE /academic-years`, `PATCH /academic-years/{id}/set-current\|close` |
| `teachers` | `GET /teachers`, `POST /teachers/{id}/invite`, `GET /teachers/{id}/join-requests`, `PATCH /teachers/{id}/approve\|reject`, `PATCH /teachers/{id}/activate\|deactivate`, `DELETE /teachers/{id}/membership` |
| `subscription` | `GET/POST /tenant/subscription`, `/tenant/subscription/usage\|history\|cancel`, `GET /packages` |
| `invoices` | `GET /invoices/tenant` |
| `notifications` | `GET /notifications`, `PATCH /notifications/{id}/read\|read-all`, `POST /notifications` |
| `profile` | `GET/PUT /auth/me`, `POST /auth/change-password` |
| header | `GET /auth/me`, `GET /notifications/unread-count` |

---

## 4. TypeScript Tipleri (types/index.ts)

```typescript
PaginatedResponse<T>     // success, message, data[], meta{current_page, last_page, per_page, total}
ApiResponse<T>           // success, message, data

User                     // id, name, surname?, email, phone?, tenant_id?, tenant?{id,name}
Package                  // id, name, monthly_price, yearly_price, max_schools, max_students, package_features?
PackageFeature           // id, key, label, value_type('bool'|'text'), value?
TenantSubscription       // id, status, billing_cycle, package_id, package?
SubscriptionUsage        // schools{used,limit}, students{used,limit}, classes{used,limit}
Country                  // id, name, iso2, phone_code?
School                   // id, name, country_id?, country?, description?, code?, address?, city?,
                         //   phone?, fax?, gsm?, whatsapp?, email?, website?, is_active?,
                         //   classes_count?, children_count?
SchoolClass              // id, school_id, academic_year_id?, name, description?,
                         //   age_min?: number, age_max?: number,  capacity?, color?
Teacher                  // id, user_id, school_id?, name, title?, role?
TeacherProfile           // id, user_id, name, email?, phone?, title?, specialization?,
                         //   employment_type?, employment_label?, experience_years?,
                         //   school_count?, schools?{id,name,is_active,role_type_name?}[], classes?[]
SchoolTeacher            // id, user_id, name, title?, employment_type?, is_active, role_type?{id,name}
TeacherRoleType          // id, tenant_id, name, sort_order?, is_active?
Allergen                 // id, name, description?, risk_level?('low'|'medium'|'high'), tenant_id?
FoodIngredient           // id, name, is_custom?, allergens?: Allergen[]
Meal                     // id, school_id, name, meal_type?, ingredients?{id,name,allergens?[]}[]
SupplyItem               // id, name, description?, quantity?, due_date?
Activity                 // id, school_id, name, description?, is_paid?, price?,
                         //   capacity?, address?, start_date?, end_date?, classes?: SchoolClass[]
AcademicYear             // id, school_id, name, start_date, end_date, is_active?
Child                    // id, name, surname?, birth_date?, gender?, status?, classes?{id,name,school_id}[]
ActivityClass            // id, school_id?, school?, name, description?, start_date?, end_date?,
                         //   capacity?, address?, is_active?, price?, enrolled_count?
Invoice                  // id, invoice_number?, status, total_amount, currency, created_at
TenantNotification       // id, title, body, type, is_read, created_at
```

---

## 5. Kodlama Standartları

### Sayfa Şablonu
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
        } catch { toast.error('Yüklenirken hata oluştu.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);
}
```

### Hata Yakalama
```tsx
} catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    toast.error(error.response?.data?.message ?? 'İşlem sırasında hata oluştu.');
}
```

### Zod v4
```tsx
import * as z from 'zod';  // named import değil
// Generic schema + RHF uyumsuzluğu için:
(useForm as any)({ resolver: zodResolver(schema as any) })
```

### Pagination
```tsx
// Backend: ?page=1&per_page=15
// Search değişince: setPage(1)
// Meta: res.data.meta.current_page, res.data.meta.last_page
```

### Tab Fetch Flag (KRİTİK)
```tsx
const [teachersFetched, setTeachersFetched] = useState(false);
// tab değişince:
if (tab === 'teachers' && !teachersFetched) fetchTeachers();
// data.length === 0 kontrolü YANLIŞ — boş liste de olsa tekrar fetch atar
```

### Paralel Veri Çekme
```tsx
const [subRes, usageRes] = await Promise.all([
    apiClient.get('/tenant/subscription').catch(() => ({ data: { data: null } })),
    apiClient.get('/tenant/subscription/usage').catch(() => ({ data: { data: null } })),
]);
```

### ApexCharts
```tsx
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
```

### Private Görsel — AuthImg (KRİTİK)
Tüm backend private medya URL'leri `auth:sanctum + signed` middleware gerektirir.
Tenant frontend'de her zaman `AuthImg` bileşeni kullan — raw `<img>` veya Next.js `<Image>` YAZMA:
```tsx
import AuthImg from '@/components/AuthImg';
<AuthImg src={cls.logo_url} alt="logo" className="h-10 w-10 rounded-xl object-cover"
         fallback={<span>?</span>} />
```
- `AuthImg` → `useAuthImage` hook → `apiClient.get(url, { responseType: 'blob', baseURL: '' })` → blob URL
- `apiClient` otomatik `Authorization: Bearer {tenant_token}` ekler
- Kullanılan sayfalar: `social/`, `meals/`, `schools/[id]/` (logo + galeri)

---

## 6. Kritik Bug Fix'ler

1. **`(auth)/layout.tsx`**: `return <>{children}</>;` — başka HİÇBİR ŞEY ekleme. Wrapper div eklersen login bg bozulur.

2. **`App.tsx`**: Root div'de `relative` class OLMAMALI — login'deki `absolute inset-0` bg küçük kalır.

3. **`app/page.tsx` OLUŞTURMA** — `(website)/page.tsx` zaten `/` alır, route conflict olur.

4. **Dizin adı `layouts` (çoğul)** — `layout` değil: `@/components/layouts/sidebar`

5. **`tenant_token` vs `admin_token`** — Bu projede hiçbir yerde `admin_token` kullanılmaz.

6. **`withCredentials` kaldırıldı** — token-based auth, SPA cookie değil.

7. **Öğretmen yönetimi**: `teachers/page.tsx` → "Yeni Öğretmen" butonu YOK, "Öğretmeni Davet Et" (email modal) var. "Katılma Talepleri" sekmesi var. Tenant `store()` → 405 döner.

8. **`activity-classes/[id]` API çağrıları**: `/activity-classes/{id}/...` tenant-level endpoint (okul iterasyonu yok).

9. **Tailwind v3**: `@tailwind base; @tailwind components; @tailwind utilities;` — `@import "tailwindcss"` v4 sözdizimi YAZMA.

---

## 7. Sidebar Navigasyon

```
ANA MENÜ:    Dashboard (/dashboard)
YÖNETİM:     Okullarım (/schools), Öğretmenler (/teachers), Yemekler (/meals),
             Etkinlikler (/activities), Etkinlik Sınıfları (/activity-classes), Eğitim Yılları (/academic-years)
HESAP:       Aboneliğim (/subscription), Faturalar (/invoices)
SİSTEM:      Bildirimler (/notifications), Profil (/profile)
```
