# 🧠 iStudy Backend — AI Hafıza Dosyası (Project Memory)

> **Son Güncelleme:** 2026-02-19 (API response format düzeltmesi: paginatedResponse, TenantResource/SchoolResource genişletmesi, Dashboard stats mapping)
> **Amaç:** Bu dosya, projede çalışan yapay zeka araçlarının (Claude, Gemini, GPT, Copilot vb.) projeyi hızlıca anlayıp doğru kararlar vermesini sağlamak için hazırlanmıştır.

---

## 📌 1. Proje Kimliği

| Alan | Değer |
|------|-------|
| **Proje Adı** | iStudy Backend |
| **Tip** | SaaS Multi-Tenant Anaokulu/Kreş Yönetim Sistemi (Kindergarten/Preschool Management System) |
| **Framework** | Laravel 12 (PHP 8.4) |
| **API Tipi** | RESTful JSON API (Headless Backend) |
| **Auth Mekanizması** | Laravel Sanctum (Token-based) |
| **Veritabanı** | MySQL 8 (Docker), MySQL/PostgreSQL (Production) |
| **Audit DB** | Ayrı veritabanı (`audit` connection, `istudy_audit`) — Docker ortamında `AUDIT_DB_CONNECTION=mysql` ile ana DB kullanılır — ileride MongoDB'ye geçiş hazır |
| **Dil** | Türkçe mesajlar ve yorumlar kullanılır |
| **Proje Yolu** | `/Users/veysel.aydogdu/Desktop/WebProjects/iStudy/istudy-backend` |

---

## 📐 2. Mimari Genel Bakış

### 2.1 Multi-Tenant (Çoklu Kiracı) Mimari

```
┌─────────────────────────────────────────────┐
│                SUPER ADMIN                   │
│         (Tüm sistemi yönetir)               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐     ┌─────────────┐       │
│  │  Tenant A    │     │  Tenant B    │      │
│  │ (Kurum A)    │     │ (Kurum B)    │      │
│  ├─────────────┤     ├─────────────┤       │
│  │ School A-1   │     │ School B-1   │      │
│  │ School A-2   │     │ School B-2   │      │
│  └─────────────┘     └─────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

- Tenant = Kurum (Müşteri). Birden fazla okul (School) barındırabilir.
- Her okul altında sınıflar (Classes), çocuklar (Children), öğretmenler (Teachers), aileler (Families) bulunur.
- `BaseModel` üzerindeki `Global Scope` ile tenant izolasyonu sağlanır.
- Super Admin hariç **tüm kullanıcılar** yalnızca kendi tenant verisini görür.

### 2.2 Katmanlı Mimari

```
Request → Route → Middleware → Controller → Service → Model → Database
                                    ↓
                              FormRequest (Validation)
                                    ↓
                              JsonResponse (API Resource)
```

### 2.3 Rol Hiyerarşisi

| Rol | Açıklama | Erişim Kapsamı |
|-----|----------|----------------|
| `super_admin` | Platform sahibi | Tüm veriler, tüm tenant'lar |
| `tenant_owner` | Kurum sahibi | Kendi tenant'ındaki tüm okullar |
| `school_admin` | Okul yöneticisi | Yalnızca atandığı okul |
| `teacher` | Öğretmen | Kendi sınıflarındaki veriler |
| `parent` | Veli | Kendi çocuklarının verileri |

---

## 📁 3. Proje Dizin Yapısı

```
istudy-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   └── AuthController.php           ← Register, Login, Logout, Me
│   │   │   ├── Admin/
│   │   │   │   └── PackageController.php         ← Paket CRUD (Super Admin)
│   │   │   ├── Base/
│   │   │   │   └── BaseController.php            ← Tüm controller'ların atası
│   │   │   ├── Schools/
│   │   │   │   ├── BaseSchoolController.php
│   │   │   │   ├── SchoolController.php
│   │   │   │   ├── ClassController.php
│   │   │   │   ├── ChildController.php
│   │   │   │   ├── ActivityController.php
│   │   │   │   └── FamilyProfileController.php
│   │   │   ├── Tenant/
│   │   │   │   ├── BaseTenantController.php
│   │   │   │   ├── TenantController.php
│   │   │   │   ├── SubscriptionController.php     ← Aile abonelikleri (B2C)
│   │   │   │   └── PackageSelectionController.php ← Paket satın alma (B2B)
│   │   │   ├── Parents/
│   │   │   │   └── BaseParentController.php
│   │   │   └── Teachers/
│   │   │       └── BaseTeacherController.php
│   │   ├── Middleware/
│   │   │   └── EnsureActiveSubscription.php      ← Abonelik kontrolü middleware
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   │   ├── RegisterRequest.php
│   │   │   │   └── LoginRequest.php
│   │   │   ├── Package/
│   │   │   │   ├── StorePackageRequest.php
│   │   │   │   └── UpdatePackageRequest.php
│   │   │   ├── Activity/
│   │   │   │   ├── StoreActivityRequest.php
│   │   │   │   └── UpdateActivityRequest.php
│   │   │   ├── Child/  ... School/  ... SchoolClass/  ... Subscription/  ... Tenant/
│   │   └── Resources/
│   │       ├── PackageResource.php               ← Paket (limit label'ları + yıllık indirim %)
│   │       ├── TenantSubscriptionResource.php    ← Abonelik (durum etiketi)
│   │       ├── TenantPaymentResource.php         ← Ödeme kaydı
│   │       ├── UserResource.php                  ← Kullanıcı bilgisi
│   │       ├── AcademicYearResource.php ... SchoolResource.php ... TenantResource.php
│   ├── Models/
│   │   ├── Base/     (BaseModel, Role, Permission, AuditLog, ActivityLog, Country, UserContactNumber)
│   │   ├── Tenant/   (Tenant)                    ← + activeSubscription(), canCreateSchool(), canEnrollStudent()
│   │   ├── Package/                               ← B2B Paket Sistemi
│   │   │   ├── Package.php                        ← Limitler + fiyat + features
│   │   │   ├── TenantSubscription.php             ← Abonelik durumu + dönem
│   │   │   └── TenantPayment.php                  ← Ödeme kaydı
│   │   ├── Billing/                               ← Finans Modülleri
│   │   │   ├── Invoice.php / InvoiceItem.php      ← Fatura sistemi
│   │   │   ├── Transaction.php                    ← Sanal POS işlemleri
│   │   │   ├── Currency.php                       ← Para birimi tanımları (ISO 4217)
│   │   │   ├── ExchangeRate.php                   ← Döviz kurları (günlük)
│   │   │   └── ExchangeRateLog.php                ← API güncelleme logları
│   │   ├── School/                                ← Okul + Öğretmen Profil
│   │   │   ├── School.php, TeacherProfile.php     ← Genişletildi: CV, eğitim, sertifika, kurs, yetenek
│   │   │   ├── TeacherEducation.php               ← Eğitim geçmişi (lisans, yüksek lisans vb.)
│   │   │   ├── TeacherCertificate.php             ← Sertifikalar (okul onayı gerektirir)
│   │   │   ├── TeacherCourse.php                  ← Kurs/Seminer katılımı (okul onayı gerektirir)
│   │   │   └── TeacherSkill.php                   ← Yetenek/Uzmanlık alanları
│   │   ├── Academic/  ... Child/  ... Activity/  ... Health/
│   │   └── User.php                               ← + surname, country_id, contactNumbers(), fullName
│   ├── Observers/
│   │   └── HistoryObserver.php                    ← Gelişmiş: old_values, async, filtreleme, merkezi log
│   ├── Policies/     (Base + School + SchoolClass + Child + Activity + FamilyProfile + Tenant + FamilySubscription + Package)
│   ├── Providers/    (AppServiceProvider ← Policy + Package policy kayıtları)
│   ├── Jobs/
│   │   └── WriteActivityLog.php                   ← Asenkron activity log yazma (queue)
│   ├── Services/
│   │   ├── AuthService.php                       ← Register + Login + Logout
│   │   ├── CountryService.php                    ← RestCountries API sync + CRUD + telefon kodu/bölge listesi
│   │   ├── TeacherProfileService.php             ← CV yönetimi + onay workflow (pending→approved/rejected)
│   │   ├── ReportTemplateService.php             ← Dinamik Rapor Şablonu (Key-Value-Type) yönetimi
│   │   ├── MealMenuService.php                   ← Yemek Menü Planlama (Günlük/Haftalık/Aylık)
│   │   ├── PackageService.php                    ← Paket CRUD + aktif paket listesi
│   │   ├── TenantSubscriptionService.php         ← Abonelik oluşturma + iptal + usage raporu
│   │   ├── InvoiceService.php                    ← Fatura oluşturma + ödeme başlatma
│   │   ├── TransactionService.php                ← İşlem listeleme + filtreleme + istatistik
│   │   ├── CurrencyService.php                   ← Para birimi CRUD + kur API + dönüşüm + cache
│   │   ├── ActivityLogService.php                ← Activity log listeleme + istatistik + arşivleme
│   │   ├── BaseService.php  ... SchoolService  ... ClassService  ... ChildService  ... etc.
│   └── Traits/
│       ├── ChecksPackageLimits.php               ← Okul/Sınıf/Öğrenci limit kontrolü
│       └── Auditable.php                          ← Model bazlı audit özelleştirme trait
├── config/
│   ├── currency.php                               ← Para birimi & döviz kuru ayarları
│   └── audit.php                                  ← Activity log sistemi konfigürasyonu
├── database/
│   ├── migrations/
│   │   ├── 000001 → 000008 (mevcut migration'lar)
│   │   ├── 000009_create_package_system_tables.php ← packages + tenant_subscriptions + tenant_payments
│   │   ├── 000010_create_enhanced_features_tables.php ← SADECE ödeme alanları: events.fee/payment_required + activities.fee/currency/payment_required
│   │   ├── 000010_enhance_system_tables.php        ← Tüm yeni tablolar (school_enrollment_requests, report_templates, vb.) + mevcut tablo genişletmeleri (hasColumn guard'lı)
│   │   ├── 000012_create_invoice_and_transaction_tables.php ← invoices + items + transactions
│   │   ├── 000013_create_currency_tables.php       ← currencies + exchange_rates + exchange_rate_logs
│   │   ├── 000014_create_activity_log_tables.php   ← activity_logs + archive + summaries (AUDIT_DB_CONNECTION ile)
│   │   └── 000015_create_countries_contacts_teacher_cv_tables.php ← countries + user_contact_numbers + teacher CV tabloları
│   └── seeders/
│       ├── DatabaseSeeder.php                    ← Super Admin + RoleSeeder + PackageSeeder
│       ├── RoleSeeder.php                        ← 5 temel rol
│       ├── PackageSeeder.php                     ← 3 varsayılan paket
│       └── CurrencySeeder.php                    ← 4 varsayılan para birimi (USD, TRY, EUR, GBP)
├── routes/
│   ├── api.php                                   ← 4 katmanlı erişim: Public → Auth → Subscription → Admin
│   ├── web.php
│   └── console.php                               ← Cron: currency:update-rates (09:00) + audit:maintain (03:00) + countries:sync
├── bootstrap/
│   ├── app.php                                   ← + subscription.active middleware alias
│   └── providers.php
└── CLAUDE.md
```

---

## 🗄️ 4. Veritabanı Şeması (Entity-Relationship)

### 4.1 Tablolar ve Modüller

#### 🔐 Auth Modülü
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `users` | `App\Models\User` | Tüm sistem kullanıcıları |
| `roles` | `App\Models\Base\Role` | Roller (super_admin, tenant_owner, vb.) |
| `permissions` | `App\Models\Base\Permission` | İzinler |
| `role_user` | — (Pivot) | Kullanıcı-Rol ilişkisi (M2M) |
| `permission_role` | — (Pivot) | Rol-İzin ilişkisi (M2M) |

#### 🏢 Kurum Modülü (Institutions)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `tenants` | `App\Models\Tenant\Tenant` | Kiracı kurumlar |
| `schools` | `App\Models\School\School` | Okullar/Şubeler |
| `academic_years` | `App\Models\Academic\AcademicYear` | Eğitim dönemleri (2025-2026) |

#### 🌍 Ülkeler Modülü (Countries)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `countries` | `App\Models\Base\Country` | Ülkeler (RestCountries API'den senkronize) — ISO kodları, telefon kodları, para birimi, dil, bayrak, coğrafi veriler, `extra_data` JSON |

#### 👥 Kişiler Modülü (People)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `teacher_profiles` | `App\Models\School\TeacherProfile` | Öğretmen profilleri (genişletildi: CV, eğitim, sertifika, kurs, yetenek) |
| `teacher_educations` | `App\Models\School\TeacherEducation` | Öğretmen eğitim geçmişi (lisans, yüksek lisans vb.) |
| `teacher_certificates` | `App\Models\School\TeacherCertificate` | Öğretmen sertifikaları (okul onayı gerektirir: pending→approved/rejected) |
| `teacher_courses` | `App\Models\School\TeacherCourse` | Kurs/Seminer katılımı (okul onayı gerektirir) |
| `teacher_skills` | `App\Models\School\TeacherSkill` | Yetenek/Uzmanlık alanları (8 kategori, 4 seviye) |
| `user_contact_numbers` | `App\Models\Base\UserContactNumber` | Ek iletişim numaraları (WhatsApp, Telegram vb. — 12 tür) |
| `family_profiles` | `App\Models\Child\FamilyProfile` | Aile profilleri |
| `family_members` | `App\Models\Child\FamilyMember` | Aile üyeleri (anne, baba vb.) |
| `children` | `App\Models\Child\Child` | Çocuklar (Öğrenciler) |

#### 🎓 Akademik Yapılar
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `classes` | `App\Models\Academic\SchoolClass` | Sınıflar (Not: PHP'de `Class` reserved keyword olduğu için `SchoolClass` adlandırılır) |
| `child_class_assignments` | — (Pivot) | Çocuk-Sınıf atamaları (M2M) |
| `class_teacher_assignments` | — (Pivot) | Öğretmen-Sınıf atamaları (M2M) |

#### 🏥 Sağlık & Beslenme Modülü
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `allergens` | `App\Models\Health\Allergen` | Alerjenler |
| `medical_conditions` | `App\Models\Health\MedicalCondition` | Tıbbi durumlar |
| `medications` | `App\Models\Health\Medication` | İlaçlar |
| `food_ingredients` | `App\Models\Health\FoodIngredient` | Yemek malzemeleri |
| `meals` | `App\Models\Health\Meal` | Yemek menüleri |
| `child_allergens` | — (Pivot) | Çocuk-Alerjen (M2M) |
| `child_medications` | — (Pivot) | Çocuk-İlaç (M2M) |
| `child_conditions` | — (Pivot) | Çocuk-Tıbbi Durum (M2M) |
| `meal_ingredient_pivot` | — (Pivot) | Yemek-Malzeme (M2M) |

#### 📊 Takip & Aktiviteler Modülü
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `daily_child_reports` | `App\Models\Activity\DailyChildReport` | Günlük çocuk raporları (mood, appetite, notlar) |
| `attendances` | `App\Models\Activity\Attendance` | Yoklama (present, absent, late, excused) |
| `activities` | `App\Models\Activity\Activity` | Etkinlikler (ücretli/ücretsiz) |
| `report_templates` | `App\Models\Activity\ReportTemplate` | Dinamik Rapor Şablonları (Okul Yöneticisi tanımlar) |
| `report_template_inputs` | `App\Models\Activity\ReportTemplateInput` | Şablon Alanları (Label, Type: select/text/rating, Options: JSON) |
| `report_input_values` | `App\Models\Activity\ReportInputValue` | Girilen Değerler (Öğretmen doldurur) |
| `events` | `App\Models\Activity\Event` | Takvim olayları |
| `materials` | — | Materyaller |
| `child_activity_enrollments` | — (Pivot) | Çocuk-Aktivite kayıtları (M2M) |
| `child_event_participations` | — (Pivot) | Çocuk-Etkinlik katılımları (M2M) |
| `child_material_trackings` | — (Pivot) | Çocuk-Materyal takibi (M2M) |

#### 💰 Finans Modülü (Billing)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `subscription_plans` | `App\Models\Billing\SubscriptionPlan` | Abonelik planları |
| `plan_tier_pricing` | — | Çocuk sayısına göre kademeli fiyatlandırma |
| `family_subscriptions` | `App\Models\Billing\FamilySubscription` | Aile abonelikleri (active, cancelled, expired) |
| `payments` | `App\Models\Billing\Payment` | Ödemeler (Stripe, iyzico) |
| `revenue_shares` | `App\Models\Billing\RevenueShare` | Gelir paylaşım/komisyon |
| `invoices` | `App\Models\Billing\Invoice` | Faturalar (B2B/B2C) |
| `invoice_items` | `App\Models\Billing\InvoiceItem` | Fatura kalemleri |
| `transactions` | `App\Models\Billing\Transaction` | Sanal POS işlemleri (ödeme durumu + gateway) |

#### � Para Birimi & Döviz Kuru Modülü
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `currencies` | `App\Models\Billing\Currency` | Para birimi tanımları (ISO 4217, sembol, format) |
| `exchange_rates` | `App\Models\Billing\ExchangeRate` | Günlük döviz kurları (baz birime göre) |
| `exchange_rate_logs` | `App\Models\Billing\ExchangeRateLog` | API güncelleme logları (kaynak, süre, hata) |

#### �📜 History Tabloları (Eski Sistem — Geriye Dönük Uyumluluk)
Her ana tablo için `{tablo_adı}_histories` tablosu mevcuttur:
- `users_histories`, `roles_histories`, `permissions_histories`
- `tenants_histories`, `schools_histories`, `academic_years_histories`
- `teacher_profiles_histories`, `family_profiles_histories`, `family_members_histories`, `children_histories`
- `classes_histories`
- `allergens_histories`, `medical_conditions_histories`, `medications_histories`, `food_ingredients_histories`, `meals_histories`
- `daily_child_reports_histories`, `attendances_histories`, `activities_histories`, `events_histories`, `materials_histories`
- `subscription_plans_histories`, `plan_tier_pricing_histories`, `family_subscriptions_histories`, `payments_histories`, `revenue_shares_histories`
- `invoices_histories`, `transactions_histories`

**Eski History Yapısı (her tabloda aynı):**
```
id, original_id (index), operation_type (create/update/delete), snapshot (JSON), operated_by (FK→users), timestamps
```

#### 📊 Merkezi Activity Log (Yeni Sistem — Ayrı DB)
> **Önemli:** Ayrı `audit` veritabanında çalışır. MongoDB geçişine hazır (FK yok, document-friendly).

| Tablo | Veritabanı | Açıklama |
|-------|-----------|----------|
| `activity_logs` | AUDIT DB | Merkezi CRUD log (old/new values, changed fields, denormalize user) |
| `activity_logs_archive` | AUDIT DB | Saklama süresi dolan logların arşivi |
| `activity_log_summaries` | AUDIT DB | Günlük özet sayıları (dashboard performansı) |

**Activity Log Yapısı:**
```
id, user_id, user_name, user_email (denormalize),
model_type, model_label, model_id,
action (created/updated/deleted/restored/force_deleted),
old_values (JSON — sadece değişenler), new_values (JSON — sadece değişenler),
changed_fields (JSON — alan isimleri listesi),
tenant_id, school_id, ip_address, user_agent, url, method,
created_at (INSERT-only, updated_at yok)
```

### 4.2 İlişki Haritası (ER Diagram - Metin)

```
User ──────┬── belongsToMany ──── Role ──── belongsToMany ──── Permission
           │
           ├── hasMany ──── Tenant (owner_user_id)
           ├── hasMany ──── TeacherProfile (user_id)
           └── hasMany ──── FamilyProfile (owner_user_id)

Tenant ────┬── hasMany ──── School (tenant_id)
           └── hasMany ──── User (tenant_id)

School ────┬── belongsTo ──── Tenant
           ├── hasMany ──── AcademicYear (school_id)
           ├── hasMany ──── SchoolClass (school_id)  [hasMany through AcademicYear]
           ├── hasMany ──── TeacherProfile (school_id)
           ├── hasMany ──── Child (school_id)
           ├── hasMany ──── Activity (school_id)
           ├── hasMany ──── Event (school_id)
           └── hasMany ──── Meal (school_id)

AcademicYear ┬── belongsTo ──── School
             ├── hasMany ──── SchoolClass
             ├── hasMany ──── Activity
             └── hasMany ──── Event

SchoolClass ┬── belongsTo ──── School
            ├── belongsTo ──── AcademicYear
            ├── belongsToMany ──── Child (via child_class_assignments)
            └── belongsToMany ──── TeacherProfile (via class_teacher_assignments)

Child ──────┬── belongsTo ──── FamilyProfile
            ├── belongsTo ──── School
            ├── belongsTo ──── AcademicYear
            ├── belongsToMany ──── SchoolClass (via child_class_assignments)
            ├── belongsToMany ──── Allergen (via child_allergens)
            ├── belongsToMany ──── Medication (via child_medications)
            ├── belongsToMany ──── MedicalCondition (via child_conditions)
            ├── belongsToMany ──── Activity (via child_activity_enrollments)
            ├── belongsToMany ──── Event (via child_event_participations)
            ├── hasMany ──── DailyChildReport
            └── hasMany ──── Attendance

FamilyProfile ┬── belongsTo ──── User (owner_user_id)
              ├── belongsTo ──── Tenant
              ├── hasMany ──── FamilyMember
              ├── hasMany ──── Child
              └── hasMany ──── FamilySubscription

FamilySubscription ┬── belongsTo ──── FamilyProfile
                   └── belongsTo ──── SubscriptionPlan

Payment ──── belongsTo ──── FamilySubscription
RevenueShare ┬── belongsTo ──── Payment
             └── belongsTo ──── School

── B2B Paket Sistemi ──────────────────────────────────
Package ────── hasMany ──── TenantSubscription

TenantSubscription ┬── belongsTo ──── Tenant
                   ├── belongsTo ──── Package
                   └── hasMany ──── TenantPayment

TenantPayment ──── belongsTo ──── TenantSubscription

Tenant ────────┬── hasOne(active) ──── TenantSubscription
              └── hasMany ──────── TenantSubscription

── Fatura & İşlem Sistemi ─────────────────────────────
Invoice ───────┬── belongsTo ──── User, Tenant, School
               ├── hasMany ──── InvoiceItem
               └── hasMany ──── Transaction

Transaction ──── belongsTo ──── Invoice

── Para Birimi & Döviz Kuru ───────────────────────────
Currency ──────── hasMany ──── ExchangeRate
ExchangeRate ──── belongsTo ──── Currency (base + target)
```

---

## 💰 5. B2B Paket Sistemi (Platform Abonelikleri)

### 5.1 İş Akışı

```
┌─── KAYIT ──────────────────────────────────────────────┐
│ 1. POST /api/auth/register                             │
│    → User + Tenant oluşturulur                         │
│    → tenant_owner rolü atanır                          │
│    → Sanctum token döner                               │
└──────────────────────────────────────────────┬──────────┘
                                               │
┌─── PAKET SEÇİMİ ────────────────────────────┼──────────┐
│ 2. GET /api/packages                         │          │
│    → Aktif paketler listelenir               │          │
│ 3. POST /api/tenant/subscribe                │          │
│    → Paket seçilir, abonelik + ödeme         │          │
│      kaydı oluşturulur                       │          │
└──────────────────────────────────────────────┬──────────┘
                                               │
┌─── SİSTEM ERİŞİMİ ──────────────────────────┼──────────┐
│ 4. Aktif abonelik varsa → Okul, Sınıf,       │          │
│    Öğrenci oluşturabilir (limit dahilinde)   │          │
│    Middleware: subscription.active            │          │
└────────────────────────────────────────────────────────┘
```

### 5.2 Paket Yapısı

| Paket | Okul Limiti | Sınıf/Okul | Öğrenci | Aylık ₺ | Yıllık ₺ |
|-------|------------|------------|---------|---------|----------|
| **Başlangıç** | 1 | 3 | 30 | 299 | 2.990 |
| **Profesyonel** | 3 | 10 | 200 | 799 | 7.990 |
| **Kurumsal** | ∞ | ∞ | ∞ | 1.999 | 19.990 |

> `0` = sınırsız. Limitler `packages` tablosunda `max_schools`, `max_classes_per_school`, `max_students` sütunlarında saklanır.

### 5.3 Limit Kontrolü

Tenant modelinde 3 helper metod:
- `canCreateSchool()` → Okul oluşturulabilir mi?
- `canCreateClass(schoolId)` → Bu okulda sınıf oluşturulabilir mi?
- `canEnrollStudent()` → Tenant genelinde öğrenci kaydedilebilir mi?

`ChecksPackageLimits` trait'i Controller/Service'lerde kullanılır:
```php
use App\Traits\ChecksPackageLimits;

class SchoolController {
    use ChecksPackageLimits;
    
    public function store(...) {
        $this->checkSchoolLimit($tenant); // Limitaşıldıysa exception fırlatır
    }
}
```

### 5.4 Veritabanı Tabloları

| Tablo | Model | Açıklama |
|-------|-------|----------|
| `packages` | `App\Models\Package\Package` | Platform paketleri (limitler + fiyat + features) |
| `tenant_subscriptions` | `App\Models\Package\TenantSubscription` | Tenant abonelikleri (dönem + durum) |
| `tenant_payments` | `App\Models\Package\TenantPayment` | Ödeme kayıtları |
| `packages_histories` | — | Paket geçmişi |
| `tenant_subscriptions_histories` | — | Abonelik geçmişi |
| `tenant_payments_histories` | — | Ödeme geçmişi |

---

## 🔐 6. Auth Sistemi

### 6.1 Endpoint'ler

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/register` | Kayıt (User + Tenant) | ❌ |
| POST | `/api/auth/login` | Giriş (Token döner) | ❌ |
| POST | `/api/auth/logout` | Çıkış (Token silinir) | ✅ |
| GET | `/api/auth/me` | Profil bilgileri | ✅ |

### 6.2 Kayıt Akışı Detay

1. `RegisterRequest` ile validation
2. `AuthService::register()` ile:
   - User oluşturulur (password otomatik hash)
   - `tenant_owner` rolü atanır
   - Tenant oluşturulur (`institution_name` → `tenants.name`)
   - User'a `tenant_id` atanır
   - Sanctum token oluşturulur

---

## 🛣️ 7. API Route Yapısı (4 Katmanlı)

```
┌──────────────────────────────────────────────────────────┐
│ 1️⃣ HERKESE AÇIK                                         │
│   GET  /api/health                                      │
│   POST /api/auth/register                               │
│   POST /api/auth/login                                  │
│   GET  /api/packages                                    │
├──────────────────────────────────────────────────────────┤
│ 2️⃣ AUTH GEREKLİ (token, abonelik gerekmez)              │
│   POST /api/auth/logout                                 │
│   GET  /api/auth/me                                     │
│   POST /api/tenant/subscribe                            │
│   GET  /api/tenant/subscription                         │
│   GET  /api/tenant/subscription/history                 │
│   GET  /api/tenant/subscription/usage                   │
│   POST /api/tenant/subscription/cancel                  │
│   apiResource: tenants (except store)                   │
├──────────────────────────────────────────────────────────┤
│ 3️⃣ ABONELİK GEREKLİ (middleware: subscription.active)   │
│   apiResource: schools                                  │
│   apiResource: schools/{id}/classes                     │
│   apiResource: schools/{id}/children                    │
│   apiResource: schools/{id}/activities                  │
│   apiResource: schools/{id}/families                    │
│   apiResource: subscriptions (B2C)                      │
├──────────────────────────────────────────────────────────┤
│ 4️⃣ ADMIN ONLY (Super Admin)                              │
│   apiResource: admin/packages                           │
└──────────────────────────────────────────────────────────┘
```

---

## ⚙️ 8. Temel Mimari Bileşenler

### 5.1 BaseModel (`app/Models/Base/BaseModel.php`)

**Tüm model'lerin atası.** Aşağıdaki ortak davranışları sağlar:

| Özellik | Açıklama |
|---------|----------|
| **SoftDeletes** | `deleted_at` ile geri dönüşlü silme |
| **HasFactory** | Factory desteği |
| **Auditable (trait)** | Model bazlı audit özelleştirme (exclude/include fields, label) |
| **Auto created_by** | `creating` event'inde `auth()->id()` ile doldurulur |
| **Auto updated_by** | `updating` event'inde `auth()->id()` ile doldurulur |
| **Tenant Global Scope** | Login olan kullanıcının `tenant_id`'sine göre otomatik filtreleme. Super Admin hariç. |
| **History Observer** | Her create/update/delete'te hem `activity_logs` (audit DB) hem `{tablo}_histories` (eski uyumluluk) kaydeder |
| **createdBy() / updatedBy()** | User ilişkileri (belongsTo) |

**⚠️ ÖNEMLİ:** `User` modeli `BaseModel`'den **türemez** (Authenticatable'dan türer). Dolayısıyla User için tenant scope ve history özelliği `BaseModel` üzerinden gelmez; ayrı implement edilmelidir gerektiğinde.

### 5.2 BaseService (`app/Services/BaseService.php`)

**Tüm service'lerin atası.** Ortak CRUD mantığını sağlar:

```php
abstract class BaseService
{
    abstract protected function model(): string;  // Alt sınıf hangi Model'i kullandığını döndürür

    public function getAll(array $filters = []): LengthAwarePaginator  // Sayfalı listeleme
    public function create(array $data): Model                         // Yeni kayıt
    public function update(Model $model, array $data): Model           // Güncelleme
    public function delete(Model $model): bool                         // Soft delete
    protected function applyFilters($query, array $filters): void      // Alt sınıf override edebilir
}
```

Alt sınıflar sadece `model()` ve isteğe bağlı `applyFilters()` override eder.

### 5.3 BaseController (`app/Http/Controllers/Base/BaseController.php`)

**Tüm controller'ların atası.** Standart response helper'ları sağlar:

```php
// Authenticated user helper
protected function user(): User

// Başarılı response: { success: true, message: "...", data: {...} }
protected function successResponse(mixed $data, ?string $message, int $code = 200): JsonResponse

// Hatalı response: { success: false, message: "...", data: null }
protected function errorResponse(string $message, int $code = 400): JsonResponse

// Sayfalı response: { success: true, message: "...", data: [...], meta: {current_page, last_page, per_page, total} }
// ResourceCollection veya plain paginator kabul eder. data her zaman düz dizi döner.
protected function paginatedResponse(mixed $collection): JsonResponse
```

### 5.4 Role-Specific Base Controller'lar

| Controller | Namespace | Kullanım |
|-----------|-----------|----------|
| `BaseSchoolController` | `Controllers\Schools` | Okul erişim kontrolü yapar. `school_id` parameter'ını doğrular. `$this->school` property sağlar. |
| `BaseTenantController` | `Controllers\Tenant` | `$this->tenant()` helper'ı ile mevcut tenant'ı döndürür. |
| `BaseParentController` | `Controllers\Parents` | `$this->familyProfile()` helper'ı ile velinin aile profilini döndürür. |
| `BaseTeacherController` | `Controllers\Teachers` | `$this->teacherProfile()` helper'ı ile öğretmen profilini döndürür. |

### 5.5 BasePolicy (`app/Policies/BasePolicy.php`)

Tüm policy'lerin atası. `before()` hook'u ile **Super Admin** tüm işlemlere otomatik izinlidir.

### 5.6 HistoryObserver (`app/Observers/HistoryObserver.php`) — Gelişmiş

Her `BaseModel` türevi model'de otomatik çalışır. **İki katmanlı loglama:**

**Katman 1 — Merkezi Activity Log (Yeni, Ayrı DB):**
- `created` → `activity_logs` tablosuna tüm yeni değerleri JSON olarak kaydeder
- `updated` → `old_values` (önceki) + `new_values` (sonraki) + `changed_fields` kaydeder
- `deleted` / `force_deleted` → Silinen kaydın tüm verilerini `old_values`'a kaydeder
- `restored` → Geri yükleme işlemini loglar
- Denormalize kullanıcı bilgisi (user_name, user_email) → JOIN gerektirmez
- Hassas alanlar filtrelenir (password, token vb.)
- JSON boyut kontrolü (64KB limit, auto-truncate)
- Asenkron destek: `config/audit.php → async = true` olduğunda queue üzerinden yazar

**Katman 2 — Eski _histories Tabloları (Geriye Dönük Uyumluluk):**
- `{tablo}_histories` tablosuna `snapshot` (JSON) kaydeder (eski sistem)
- History tablosu yoksa sessizce geçer

**Auditable Trait ile Özelleştirme:**
```php
class School extends BaseModel {
    protected array $auditExclude = ['cached_stats'];  // Bu alanları loglama
    protected array $auditInclude = ['name', 'status']; // Sadece bunları logla
    protected string $auditLabel = 'Okul';              // Okunabilir etiket
}
```

---

## 🔧 6. Controller Kodlama Standartları

### 6.1 Standart Controller Şablonu

```php
class XxxController extends BaseSchoolController // veya BaseTenantController
{
    // Constructor ile Service injection
    public function __construct(XxxService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    // READ İşlemleri (index, show): Transaction KULLANILMAZ
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Model::class);
            $data = $this->service->getAll(request()->all());
            return $this->paginatedResponse($data);
        } catch (\Throwable $e) {
            Log::error('XxxController::index Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // WRITE İşlemleri (store, update, destroy): Transaction KULLANILIR
    public function store(StoreXxxRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', Model::class);

            $data = $request->validated();
            $data['created_by'] = $this->user()->id;
            // school_id eklemesi (okul controller'larında)
            if (!isset($data['school_id']) && request()->has('school_id')) {
                $data['school_id'] = request('school_id');
            }
            $item = $this->service->create($data);

            DB::commit();
            return $this->successResponse(XxxResource::make($item), 'Kayıt oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('XxxController::store Error', [...]);
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // update → $data['updated_by'] = $this->user()->id;
    // destroy → Sadece service->delete() çağırır
}
```

### 6.2 Temel Kurallar

1. **Try-Catch zorunlu:** Her method'da `try-catch (Throwable)` kullanılır
2. **Transaction yönetimi:** Write işlemleri (`store`, `update`, `destroy`) → `DB::beginTransaction()` + `DB::commit()` / `DB::rollBack()`
3. **Read işlemleri** (`index`, `show`) → Transaction **kullanılmaz**
4. **Log::error zorunlu:** Catch bloğunda detaylı hata loglanır
5. **Response standartları:** Sadece `successResponse()`, `errorResponse()`, `paginatedResponse()` kullanılır
6. **Form Request:** Validation controller dışında, ayrı `StoreXxxRequest` / `UpdateXxxRequest` sınıflarında yapılır
7. **Authorization:** Controller method'larında `$this->authorize()` ile Policy kullanılır
8. **Türkçe yorumlar:** Her method'a Türkçe açıklama
9. **created_by / updated_by:** Manuel olarak `$data` array'ine eklenir

### 6.3 API Response Formatı

```json
// Başarılı (Tekil)
{
  "success": true,
  "message": "İşlem başarılı.",
  "data": { ... }
}

// Başarılı (Sayfalı)
{
  "success": true,
  "message": "Veriler başarıyla listelendi.",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73
  }
}

// Hatalı
{
  "success": false,
  "message": "Hata mesajı...",
  "data": null
}
```

---

## 🔗 7a. Foreign Key Stratejisi

### Genel Kural: `restrictOnDelete`

Tüm modellerde **soft delete** kullanıldığından, foreign key'lerde `cascadeOnDelete()` yerine `restrictOnDelete()` tercih edilir.

| Durum | Strateji | Neden |
|-------|----------|-------|
| **Soft-delete'li tablo FK** | `restrictOnDelete()` | Hard-delete engellensin; fiziksel silme yapılamaz |
| **Pivot/junction tablo FK** | `cascadeOnDelete()` | Pivot satırı silindiğinde cascade doğal ve beklenen davranış |
| **`nullOnDelete()`** | Bazı opsiyonel FK'lar | Referans silinince NULL'a set (örn. `picked_up_by`) |

### Pivot Tablolar (cascadeOnDelete kalır)
| Tablo | Dosya |
|-------|-------|
| `role_user` | 000001_create_auth_tables.php |
| `permission_role` | 000001_create_auth_tables.php |
| `child_class_assignments` | 000004_create_academic_tables.php |
| `meal_ingredient_pivot` | 000005_create_health_tables.php |
| `child_allergens` | 000005_create_health_tables.php |
| `child_medications` | 000005_create_health_tables.php |
| `child_conditions` | 000005_create_health_tables.php |
| `child_activity_enrollments` | 000006_create_activity_tables.php |
| `child_event_participations` | 000006_create_activity_tables.php |
| `child_material_trackings` | 000006_create_activity_tables.php |
| `class_teacher_assignments` | 000008_create_teacher_tables.php |
| `school_role_permissions` | 000010_enhance_system_tables.php |
| `homework_class_assignments` | 000010_enhance_system_tables.php |
| `notification_user` | 000010_enhance_system_tables.php |
| `food_ingredient_allergens` | 000010_enhance_system_tables.php |

**Kural:** Yeni migration yazarken soft-delete'li tablolara FK ekliyorsan `->restrictOnDelete()` kullan. Yalnızca yukarıdaki pivot tablolar ve gerçek junction tabloları `->cascadeOnDelete()` alır.

---

## 🏗️ 7b. Standart Alanlar (Her Tabloda Bulunan)

Her ana tabloda aşağıdaki standart alanlar bulunur:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | bigint (PK) | Auto-increment birincil anahtar |
| `created_by` | foreignId → users | Kaydı oluşturan kullanıcı |
| `updated_by` | foreignId → users (nullable) | Kaydı güncelleyen kullanıcı |
| `created_at` | timestamp | Oluşturulma tarihi |
| `updated_at` | timestamp | Güncellenme tarihi |
| `deleted_at` | timestamp (nullable) | Soft delete tarihi |

---

## 📌 10. Önemli Notlar ve Dikkat Edilecekler

### 10.1 Bilinen Mimari Kararlar

1. **`SchoolClass` isimlendirmesi:** PHP'de `Class` reserved keyword olduğu için model `SchoolClass` olarak adlandırılmıştır. Veritabanı tablosu `classes`'tır.

2. **`User` modeli `BaseModel`'den türemez:** Authenticatable sınıfından türediği için BaseModel'deki tenant scope, history observer gibi özellikler User'a otomatik uygulanmaz.

3. **İki ayrı abonelik sistemi:**
   - **B2B (Platform ↔ Tenant):** `packages` + `tenant_subscriptions` + `tenant_payments` — Admin'in kurumsal müşterilere sattığı paketler.
   - **B2C (Okul ↔ Aile):** `subscription_plans` + `family_subscriptions` + `payments` — Okulların ailelere sunduğu abonelikler.

4. **Seeder ve auth bağımlılığı:** `DatabaseSeeder` önce User oluşturur, sonra `auth()->login()` ile context simüle eder ki `BaseModel`'in `created_by` otomatik ataması çalışsın.

5. **EnsureActiveSubscription middleware:** Route seviyesinde çalışır (`subscription.active` alias). Super Admin bypass'ı yapar. Yalnızca okul/sınıf/öğrenci gibi kaynakları korur; paket seçimi ve auth endpoint'leri korumasızdır.

6. **ChecksPackageLimits trait:** Controller veya Service'lerde `use` edilir. Limit aşıldığında açıklayıcı Türkçe hata mesajı ile exception fırlatır.

### 10.1c Admin Controller'larda paginatedResponse Kullanımı (Önemli)

Admin controller'larında `paginatedResponse()` çağrısında **`->resource` kullanılmaz**:

```php
// ✅ DOĞRU — ResourceCollection direkt geçilir
return $this->paginatedResponse(TenantResource::collection($tenants));

// ❌ YANLIŞ — ->resource paginator'ı döndürür, resource dönüşümü kaybolur
return $this->paginatedResponse(TenantResource::collection($tenants)->resource);
```

`BaseController::paginatedResponse()` artık `ResourceCollection` alabilir ve `toArray(request())['data']` ile resource dönüşümünü uygular. Plain paginator da desteklenir (fallback).

### 10.1d Resource Sınıflarındaki Alanlar

**TenantResource** ek alanlar: `subscription` (activeSubscription → package.name dahil)

**SchoolResource** ek alanlar: `status` (is_active'den türetilir: "active"/"inactive"), `tenant` (id+name), `classes_count`, `children_count`

### 10.1b Migration 000010 Çakışması (Çözüldü)

İki dosya aynı `000010` timestamp önekini paylaşıyordu ve çakışmaya neden oluyordu:

- `000010_create_enhanced_features_tables.php` — **Sadece ödeme alanları** içerir (`events.fee/payment_required`, `activities.fee/currency/payment_required`). `hasColumn` guard'lı.
- `000010_enhance_system_tables.php` — Tüm yeni tablo oluşturmaları + mevcut tablo genişletmeleri. **Tüm `Schema::table` blokları `hasColumn` guard'lıdır** (idempotent).

**Kural:** Bu iki dosyaya yeni ekleme yaparken çakışmaya dikkat et. Yeni tablo → `enhance_system_tables.php`; sadece `events`/`activities` ödeme alanı → `create_enhanced_features_tables.php`.

### 10.2 Tamamlanan ve Kalan Eksiklikler

| Durum | Açıklama |
|-------|----------|
| ✅ **API Routes** | 4 katmanlı erişim yapısı: Public → Auth → Subscription → Admin |
| ✅ **Auth Sistemi** | Register/Login/Logout/Me endpoint'leri + AuthService + Sanctum token |
| ✅ **B2B Paket Sistemi** | Package/TenantSubscription/TenantPayment modelleri, controller, service, seeder |
| ✅ **Fatura & İşlem Sistemi** | Invoice + InvoiceItem + Transaction modülleri, sanal POS entegrasyonu |
| ✅ **Para Birimi & Döviz Kuru** | Currency + ExchangeRate + 4 API entegrasyonu + cron + cache |
| ✅ **Gelişmiş Activity Log** | Merkezi activity_logs (ayrı DB) + arşivleme + özet + async queue |
| ✅ **Middleware** | `EnsureActiveSubscription` — aktif abonelik kontrolü |
| ✅ **Seeders** | RoleSeeder (5 rol) + PackageSeeder (3 paket) + CurrencySeeder (4 para birimi) |
| ✅ **Service katmanı** | BaseService + 14 somut service |
| ✅ **API Resources** | 17 Resource sınıfı |
| ✅ **Policies** | BasePolicy + 8 policy |
| ✅ **FormRequests** | 16 FormRequest (Auth + Package + mevcut modeller) |
| ✅ **Traits** | `ChecksPackageLimits` + `Auditable` |
| ✅ **Cron Jobs** | `currency:update-rates` (09:00) + `audit:maintain` (03:00) |
| ⚠️ **Tests** | Test dosyaları henüz yazılmamış. |
| ⚠️ **Ödeme entegrasyonu** | Şimdilik simüle, iyzico/Stripe entegrasyonu eklenecek. |

### 10.3 Naming Conventions

| Konu | Kural | Örnek |
|------|-------|-------|
| **Model** | PascalCase, tekil | `SchoolClass`, `Package` |
| **Tablo** | snake_case, çoğul | `packages`, `tenant_subscriptions` |
| **Controller** | PascalCase + Controller | `PackageController`, `AuthController` |
| **FormRequest** | Store/Update + Model + Request | `StorePackageRequest` |
| **Service** | Model + Service | `AuthService`, `PackageService` |
| **Policy** | Model + Policy | `PackagePolicy` |
| **Resource** | Model + Resource | `PackageResource` |
| **Middleware** | EnsureXxx / CheckXxx | `EnsureActiveSubscription` |
| **Trait** | ChecksXxx / HasXxx | `ChecksPackageLimits` |
| **Seeder** | Model + Seeder | `RoleSeeder`, `PackageSeeder` |

---

## 🔗 9. Teknoloji ve Paket Listesi

### Production Dependencies
| Paket | Versiyon | Kullanım |
|-------|---------|----------|
| `php` | ^8.2 | Çalışma ortamı |
| `laravel/framework` | ^12.0 | Ana framework |
| `laravel/tinker` | ^2.10.1 | REPL debugging |

### Dev Dependencies
| Paket | Versiyon | Kullanım |
|-------|---------|----------|
| `laravel/boost` | ^1.0 | AI asistan MCP server |
| `laravel/pail` | ^1.2.2 | Log görüntüleme |
| `laravel/pint` | ^1.24 | Kod formatlama |
| `laravel/sail` | ^1.41 | Docker geliştirme ortamı |
| `fakerphp/faker` | ^1.23 | Test verisi |
| `phpunit/phpunit` | ^11.5.3 | Unit/Feature testler |

---

## 🚀 10. Geliştirme Komutları

### Yerel Geliştirme
```bash
# Projeyi kurma
composer setup

# Geliştirme ortamını başlatma (server + queue + logs + vite)
composer dev

# Testleri çalıştırma
composer test

# Kod formatlama
vendor/bin/pint --dirty

# Migration
php artisan migrate

# Yeni model oluşturma
php artisan make:model ModelName --no-interaction
```

### Docker ile Çalışma

```bash
cd dockerfiles

# İlk kurulum (tüm servisleri build et + başlat)
docker compose up -d --build

# Sadece başlat (build olmadan)
docker compose up -d

# Durdur (container'ları sil)
docker compose down

# PHP/Laravel logları
docker logs istudy-app

# Laravel Artisan (container içinde)
docker exec -it istudy-app php artisan migrate
docker exec -it istudy-app php artisan db:seed

# DB sıfırlama (geliştirme)
docker exec istudy-db mysql -uroot -proot -e \
  "DROP DATABASE IF EXISTS istudy; CREATE DATABASE istudy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON istudy.* TO 'istudy'@'%'; FLUSH PRIVILEGES;"
docker restart istudy-app

# Frontend admin yeniden build
docker compose build frontend-admin && docker compose up -d frontend-admin
```

### Docker Servis Portları
| Servis | Port | URL |
|--------|------|-----|
| Laravel API (HTTPS) | 443 | https://localhost/api |
| Laravel API (HTTP→HTTPS) | 80 | http://localhost → redirect |
| Laravel API (HTTP, yerel geliştirme) | 8000 | http://localhost:8000/api |
| Frontend Admin | 3001 | http://localhost:3001 |
| PHPMyAdmin | 8080 | http://localhost:8080 |

### Docker .env Ayarları
```env
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=istudy
DB_USERNAME=istudy
DB_PASSWORD=password

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_CLIENT=phpredis

# Docker'da audit logları ana DB'ye yazılır (istudy_audit ayrı DB yoktur)
AUDIT_DB_CONNECTION=mysql
```

---

## 📊 11. Hızlı Referans — Model → Tablo → İlişkiler

### Mevcut Modeller
| Model | Tablo | belongsTo | hasMany | belongsToMany |
|-------|-------|-----------|---------|---------------|
| `User` | users | — | Tenant(owner), TeacherProfile, FamilyProfile | Role |
| `Tenant` | tenants | User(owner) | School, User(tenant_id) | — |
| `School` | schools | Tenant | AcademicYear, SchoolClass, TeacherProfile, Child, EnrollmentRequest, SchoolRole, Announcement, Homework, MealMenuSchedule, ReportTemplate, SystemNotification, ChildPricingSetting | — |
| `AcademicYear` | academic_years | School | SchoolClass, Activity, Event | — |
| `SchoolClass` | classes | School, AcademicYear | — | Child, TeacherProfile |
| `TeacherProfile` | teacher_profiles | User, School | — | SchoolClass |
| `FamilyProfile` | family_profiles | User(owner), Tenant | FamilyMember, Child, FamilySubscription, AuthorizedPickup | — |
| `FamilyMember` | family_members | FamilyProfile, User | — | — |
| `Child` | children | FamilyProfile, School, AcademicYear | DailyChildReport, Attendance, AuthorizedPickup, HomeworkCompletion, EventPayment, ActivityPayment | SchoolClass, Allergen, Medication, MedicalCondition, Activity, Event |
| `Activity` | activities | School, AcademicYear | ActivityPayment | Child |
| `Event` | events | School, AcademicYear | EventPayment | Child |
| `Attendance` | attendances | Child | — | — |
| `DailyChildReport` | daily_child_reports | Child, ReportTemplate | ReportInputValue | — |
| `Allergen` | allergens | — | — | Child |
| `Medication` | medications | — | — | Child |
| `MedicalCondition` | medical_conditions | — | — | Child |
| `Meal` | meals | School, AcademicYear | MealMenuSchedule | FoodIngredient |
| `SubscriptionPlan` | subscription_plans | — | — | — |
| `FamilySubscription` | family_subscriptions | FamilyProfile, SubscriptionPlan | — | — |
| `Payment` | payments | FamilySubscription | RevenueShare | — |
| `RevenueShare` | revenue_shares | Payment, School | — | — |
| `Role` | roles | — | — | User, Permission |
| `Permission` | permissions | — | — | Role |

### 🆕 Yeni Eklenen Modeller (2026-02-13)
| Model | Tablo | Açıklama |
|-------|-------|----------|
| `SchoolEnrollmentRequest` | school_enrollment_requests | Veli okul kayıt talebi sistemi |
| `AuthorizedPickup` | authorized_pickups | Çocuğu okuldan alabilecek yetkili kişiler |
| `ReportTemplate` | report_templates | Okul bazlı dinamik rapor şablonları |
| `ReportTemplateInput` | report_template_inputs | Rapor şablonu input tanımları |
| `ReportInputValue` | report_input_values | Öğretmenlerin doldurduğu rapor değerleri |
| `SchoolRole` | school_roles | Okul/sınıf bazlı özel roller |
| `SchoolRolePermission` | school_role_permissions | Rol izinleri |
| `SchoolUserRole` | school_user_roles | Kullanıcı-rol atamaları |
| `SystemNotification` | system_notifications | Gelişmiş bildirim sistemi |
| `NotificationPreference` | notification_preferences | Bildirim tercihleri |
| `Homework` | homework | Ödev ve okul sonrası etkinlik |
| `HomeworkCompletion` | homework_completions | Ödev tamamlama durumu |
| `EventPayment` | event_payments | Etkinlik ödeme takibi |
| `ActivityPayment` | activity_payments | Aktivite ödeme takibi |
| `MealMenuSchedule` | meal_menu_schedules | Yemek menü takvimi |
| `ChildPricingSetting` | child_pricing_settings | Kademeli çocuk fiyatlandırma |
| `Announcement` | announcements | Okul/sınıf duyuruları |

### 🆕 Yeni Eklenen Modeller (2026-02-14)
| Model | Tablo | Açıklama |
|-------|-------|----------|
| `Invoice` | invoices | B2B/B2C fatura sistemi |
| `InvoiceItem` | invoice_items | Fatura kalemleri |
| `Transaction` | transactions | Sanal POS işlemleri (ödeme durumu + hash) |
| `Currency` | currencies | Para birimi tanımları (ISO 4217, baz birim, format) |
| `ExchangeRate` | exchange_rates | Günlük döviz kurları (baz birime göre) |
| `ExchangeRateLog` | exchange_rate_logs | API güncelleme logları |
| `ActivityLog` | activity_logs (AUDIT DB) | Merkezi CRUD log (old/new values, denormalize) |

---

## 💱 13. Para Birimi & Döviz Kuru Sistemi

### 13.1 Mimari
```
BAZ PARA BİRİMİ (örn: USD, is_base=true)
  │
  ├── Tüm fiyatlar BAZ birim cinsinden saklanır
  ├── Dönüşüm: tutar × kur = hedef para birimi
  └── Örnek: 100 USD × 32.50 = ₺3,250.00 TRY
```

### 13.2 API Kaynakları
| Kaynak | API Key | Özellik |
|--------|---------|----------|
| ExchangeRate-API | Opsiyonel | Varsayılan, en kolay |
| Open Exchange Rates | Zorunlu | Popüler, güvenilir |
| Fixer.io | Zorunlu | AB odaklı |
| TCMB | ❌ Gereksiz | TRY bazlı, XML, limitsiz |

### 13.3 Endpoint'ler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/currencies` | Aktif para birimleri |
| `GET` | `/api/currencies/rates` | Güncel kurlar |
| `GET` | `/api/currencies/convert?amount=100&from=USD&to=TRY` | Dönüşüm |
| `GET` | `/api/currencies/history/{code}` | Kur geçmişi |
| `POST` | `/api/admin/currencies` | Para birimi ekle |
| `POST` | `/api/admin/currencies/fetch-rates` | API'den kur çek |
| `PATCH` | `/api/admin/currencies/{id}/set-base` | Baz birim ayarla |

### 13.4 Cron Job
```bash
currency:update-rates → Her gün 09:00 (config ile ayarlanabilir)
```

### 13.5 .env Değişkenleri
```env
CURRENCY_BASE=USD
CURRENCY_API_SOURCE=exchangerate-api
EXCHANGERATE_API_KEY=
CURRENCY_AUTO_UPDATE=true
CURRENCY_UPDATE_TIME=09:00
```

---

## � 14. Gelişmiş Activity Log & History Modülü

### 14.1 Çift Katmanlı Mimari
```
BaseModel (Auditable trait)
  │
  └── HistoryObserver
        ├── 1. activity_logs (AUDIT DB) ← Merkezi, gelişmiş, ayrı DB
        │     ├── old_values (güncelleme öncesi değerler)
        │     ├── new_values (güncelleme sonrası değerler)
        │     └── changed_fields (değişen alan isimleri)
        │
        └── 2. {table}_histories (ANA DB) ← Eski uyumluluk (snapshot)

  Queue (async=true) ──→ WriteActivityLog Job
  CronJob (03:00)    ──→ audit:maintain (arşiv + özet + temizleme)
```

### 14.2 Performans Stratejileri
| Strateji | Açıklama |
|----------|----------|
| **Ayrı DB** | Ana uygulamanın performansını etkilemez |
| **Denormalize** | user_name, user_email → JOIN gerektirmez |
| **INSERT-only** | updated_at yok, sadece created_at |
| **Composite Index** | (model_type, model_id), (user_id, created_at) |
| **Async Queue** | `AUDIT_ASYNC=true` → ana response gecikmiyor |
| **Only Dirty** | Sadece değişen alanlar kaydedilir |
| **JSON Truncation** | 64KB limit, auto-truncate |
| **Chunk Archive** | 1000'lik parçalarla arşivleme (bellek koruması) |
| **Summary Table** | Günlük sayılar → dashboard sorguları hızlı |
| **FK Yok** | MongoDB geçişine hazır |

### 14.3 Admin Endpoint'leri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/admin/activity-logs` | Tüm loglar (12+ filtre) |
| `GET` | `/api/admin/activity-logs/stats` | İstatistikler |
| `GET` | `/api/admin/activity-logs/daily-summary` | Günlük özet (grafik) |
| `GET` | `/api/admin/activity-logs/models` | Mevcut model türleri |
| `POST` | `/api/admin/activity-logs/archive` | Arşivleme trigger |
| `GET` | `/api/admin/activity-logs/user/{userId}` | Kullanıcı aktivitesi |
| `GET` | `/api/admin/activity-logs/model/{type}/{id}` | Kayıt değişiklik geçmişi |
| `GET` | `/api/admin/activity-logs/version/{type}/{id}/{logId}` | Versiyon detayı |
| `GET` | `/api/admin/activity-logs/{id}` | Tek log detayı |

### 14.4 Cron Job & Artisan
```bash
audit:maintain           → Her gün 03:00 (arşivleme + özet güncelleme)
audit:maintain --archive-only
audit:maintain --clean-archive --archive-days=730
```

### 14.5 .env Değişkenleri
```env
# Production: Ayrı veritabanı
AUDIT_DB_DATABASE=istudy_audit

# Docker geliştirme: Ana DB'yi kullan (istudy_audit oluşturmaya gerek yok)
AUDIT_DB_CONNECTION=mysql

AUDIT_ASYNC=false               # true → queue ile asenkron
AUDIT_RETENTION_DAYS=365        # Arşivleme eşiği
AUDIT_ONLY_DIRTY=true           # Sadece değişen alanlar
AUDIT_MAX_JSON_SIZE=65535       # 64KB JSON limit
```

### 14.6 MongoDB Geçiş Planı
```
Mevcut (MySQL)              →  Gelecek (MongoDB)
─────────────────────────      ─────────────────────
config/database.php:audit  →  driver: mongodb
activity_logs tablosu      →  activity_logs collection
FK yok, JSON document      →  BSON document (native)
Sadece config değişir      →  Kod değişikliği minimum
```

---

## �🔑 15. Yeni Özellik Eklerken Kontrol Listesi

1. ✅ Migration oluştur (+ `{tablo}_histories` tablosu opsiyonel — artık activity_logs merkezi log tutuyor)
2. ✅ Model oluştur (`BaseModel`'den türet → otomatik activity log aktif)
3. ✅ İsteğe bağlı: `$auditExclude`, `$auditLabel` ile audit özelleştir
4. ✅ FormRequest oluştur (`StoreXxxRequest`, `UpdateXxxRequest`)
5. ✅ API Resource oluştur (`XxxResource`)
6. ✅ Service oluştur (`XxxService`)
7. ✅ Policy oluştur (yetkilendirme kuralları)
8. ✅ Controller oluştur (uygun Base Controller'dan türet)
9. ✅ Route tanımla (`routes/api.php`)
10. ✅ Test yaz (Feature + Unit)
11. ✅ `vendor/bin/pint --dirty` çalıştır

---

> 📝 **Not:** Bu dosya proje geliştikçe güncellenmelidir. Her yeni modül, migration veya mimari değişiklikte bu dosyanın güncellenmesi önerilir.
