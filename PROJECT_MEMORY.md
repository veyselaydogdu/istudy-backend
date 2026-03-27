# 🧠 iStudy Backend — AI Hafıza Dosyası (Project Memory)

> **Son Güncelleme:** 2026-03-27 (Etkinlik fatura sistemi: invoice/refund/cancellation; start_time/end_time; ActivityInvoiceService)
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
│   │   │   │   ├── ClassController.php             ← age_min/age_max fix, $e->getCode() → 500
│   │   │   │   ├── ClassManagementController.php  ← Öğretmen-sınıf atama (GET/POST/DELETE); dual-source: school_id + pivot
│   │   │   │   ├── ChildController.php
│   │   │   │   ├── ActivityController.php          ← start/end date + class sync eklendi
│   │   │   │   ├── TenantMealController.php        ← Yemek + besin + allerjen sync; ingredients.allergens response
│   │   │   │   ├── TenantAllergenController.php    ← Tenant allerjen CRUD (global+özel)
│   │   │   │   ├── TenantTeacherController.php     ← YENİ: Tenant-level öğretmen CRUD + school assignment
│   │   │   │   ├── TeacherRoleTypeController.php    ← YENİ: Tenant-level görev türü CRUD (Sınıf Öğretmeni vb.)
│   │   │   │   ├── TenantActivityClassController.php ← YENİ: Tenant geneli etkinlik sınıfı CRUD + alt kaynak (enrollment/teacher/material/gallery/invoice)
│   │   │   │   ├── ActivityClassGalleryController.php ← imzalı URL ile galeri dosyası serve eder
│   │   │   │   └── FamilyProfileController.php
│   │   │   ├── Tenant/
│   │   │   │   ├── BaseTenantController.php
│   │   │   │   ├── TenantController.php
│   │   │   │   ├── SubscriptionController.php     ← Aile abonelikleri (B2C)
│   │   │   │   └── PackageSelectionController.php ← Paket satın alma (B2B)
│   │   │   ├── Parents/
│   │   │   │   ├── BaseParentController.php         ← getFamilyProfile() (owner+co_parent) + findOwnedChild()
│   │   │   │   ├── ParentAuthController.php         ← register/login/logout/me/forgot/reset/verify
│   │   │   │   ├── ParentChildController.php        ← CRUD + syncAllergens/Medications/Conditions + saveMedications()
│   │   │   │   ├── ParentFamilyController.php       ← members/addMember/removeMember + emergency contacts
│   │   │   │   ├── ParentSchoolController.php       ← mySchools/joinSchool/socialFeed/globalFeed
│   │   │   │   ├── ParentReferenceController.php    ← allergens/conditions/medications/countries
│   │   │   │   ├── ParentActivityClassController.php ← YENİ: etkinlik listesi + kayıt (okul-specific + tenant-wide) + galeri
│   │   │   │   ├── ParentInvoiceController.php      ← (2026-04-07): index/stats/show — canonical invoices tablosu, dual-strategy sorgu
│   │   │   │   ├── ParentActivityController.php     ← (2026-04-11): index/show/enroll/unenroll/gallery — show() 403 DÖNDÜRMEZ, galeri koşullu
│   │   │   │   ├── ParentMealMenuController.php     ← YENİ (2026-04-10): children + index — çocuğun sınıfına göre aylık yemek takvimi
│   │   │   │   └── AuthorizedPickupController.php
│   │   │   └── Teachers/
│   │   │       └── BaseTeacherController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureActiveSubscription.php      ← Abonelik kontrolü middleware (super admin bypass dahil)
│   │   │   ├── EnsureSuperAdmin.php              ← Super Admin erişim kontrolü
│   │   │   └── ForceJsonResponse.php             ← Tüm /api/* rotalarında Accept: application/json zorlar
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
│   │   │   ├── Teacher/                            ← YENİ
│   │   │   │   ├── StoreTeacherRequest.php         ← User+TeacherProfile alanları (email unique)
│   │   │   │   └── UpdateTeacherRequest.php        ← Sadece profil alanları + phone
│   │   │   ├── Child/  ... School/  ... SchoolClass/  ... Subscription/  ... Tenant/
│   │   └── Resources/
│   │       ├── PackageResource.php               ← Paket (limit label'ları + yıllık indirim %)
│   │       ├── TenantSubscriptionResource.php    ← Abonelik (durum etiketi)
│   │       ├── TenantPaymentResource.php         ← Ödeme kaydı
│   │       ├── UserResource.php                  ← Kullanıcı bilgisi
│   │       ├── AcademicYearResource.php ... SchoolResource.php ... TenantResource.php
│   │       ├── ActivityResource.php      ← (2026-04-10) school alanı eklendi: whenLoaded('school') ile {id,name}
│   ├── Models/
│   │   ├── Base/     (BaseModel, Role, Permission, AuditLog, ActivityLog, Country, UserContactNumber)
│   │   ├── Tenant/   (Tenant)                    ← + activeSubscription(), canCreateSchool(), canEnrollStudent()
│   │   ├── ActivityClass/                         ← YENİ: Etkinlik Sınıfı Modülü
│   │   │   ├── ActivityClass.php                 ← BaseModel; school_id nullable (tenant-wide için)
│   │   │   ├── ActivityClassEnrollment.php       ← plain Model (NOT BaseModel — parent tenant_id=NULL)
│   │   │   ├── ActivityClassTeacher.php          ← pivot teacher ataması
│   │   │   ├── ActivityClassMaterial.php         ← materyal listesi
│   │   │   ├── ActivityClassGallery.php          ← galeri öğesi (private storage, signed URL)
│   │   │   └── ActivityClassInvoice.php          ← ücretli kayıt faturası
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
│   │   ├── 000015_create_countries_contacts_teacher_cv_tables.php ← countries + user_contact_numbers + teacher CV tabloları
│   │   ├── 2026_02_27_115618_create_social_posts_tables.php ← social_posts, social_post_media, social_post_class_tags, social_post_reactions, social_post_comments
│   │   ├── 2026_03_01_102126_add_is_active_to_classes_table.php
│   │   ├── 2026_03_01_102151_make_academic_year_nullable_on_activities_and_meals.php
│   │   ├── 2026_03_01_102220_create_school_meal_types_table.php
│   │   ├── 2026_03_06_104123_create_food_ingredient_allergens_table.php ← hasTable guard (pivot zaten vardı)
│   │   ├── 2026_03_06_120405_make_academic_year_nullable_on_classes_table.php
│   │   ├── 2026_03_06_130545_add_age_min_age_max_to_classes_table.php ← hasColumn guard'lı; Docker ile çalıştırıldı ✅
│   │   ├── 2026_03_06_131331_add_tenant_id_to_teacher_profiles_and_create_school_assignments.php ← tenant_id backfill + school_teacher_assignments pivot ✅
│   │   ├── 2026_03_06_200942_create_teacher_role_types_and_add_to_assignments.php ← teacher_role_types tablosu + school_teacher_assignments.teacher_role_type_id FK ✅
│   │   ├── 2026_04_01_000001_create_activity_classes_table.php ← activity_classes + activity_class_school_class_assignments (kısa FK: acsc_*) ✅
│   │   ├── 2026_04_01_000002_create_activity_class_enrollments_table.php ← activity_class_enrollments (ace_unique_enrollment) ✅
│   │   ├── 2026_04_01_000003_create_activity_class_support_tables.php ← teachers + materials + gallery + invoices (act_unique) ✅
│   │   ├── 2026_04_02_000001_make_activity_class_school_id_nullable.php ← activity_classes.school_id nullable (tenant-wide destek) ✅
│   │   ├── 2026_04_02_000001_add_refund_fields_to_activity_class_invoices.php ← invoice_type enum + original_invoice_id (self FK) + refund_reason + refunded status ✅
│   │   ├── 2026_04_02_000002_add_billing_module_fields_to_invoices.php ← invoices: module + invoice_type + original_invoice_id (self FK) + refund_reason ✅
│   │   └── 2026_04_02_000003_add_main_invoice_id_to_activity_class_invoices.php ← activity_class_invoices.main_invoice_id → invoices.id FK ✅
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
│   ├── app.php                                   ← + subscription.active, super.admin middleware alias + ForceJsonResponse (api group) + Global API Exception Handler (401/422/404/HttpException/500)
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
| `countries` | `App\Models\Base\Country` | Ülkeler (RestCountries API'den senkronize) — `id, name, iso2, phone_code, flag_emoji, region, ...` — 250 ülke mevcut |

**⚠️ KRİTİK — Countries Tablosu Yapısı:**
- Tablo kolonu: `name, iso2, phone_code, flag_emoji` (NOT: `name_tr` yok, `official_name/native_name` var)
- `phone_code` formatı: `+90`, `+1`, `+44` şeklinde `+` prefix ile saklanır
- Frontend'de kullanmadan önce `+` prefix kaldırılmalı: `.replace(/^\+/, '')`
- `sort_order` alanı — Öncelikli ülkeler (TR: 100, US: 95, GB: 90, DE: 85, FR: 80, NL: 75, SA: 70, AE: 65, AZ: 60)

#### 👥 Kişiler Modülü (People)
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `teacher_profiles` | `App\Models\School\TeacherProfile` | Öğretmen profilleri — YENİ: `tenant_id` eklendi, `school_id` nullable (eski uyumluluk), tenant-level sahiplik; relations: `tenant()`, `schools()` via pivot |
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
| `classes` | `App\Models\Academic\SchoolClass` | Sınıflar — `id, school_id, academic_year_id, name, description, age_min (tinyInt unsigned nullable), age_max (tinyInt unsigned nullable), color, logo, capacity` (Not: PHP'de `Class` reserved keyword olduğu için `SchoolClass` adlandırılır) |
| `child_class_assignments` | — (Pivot) | Çocuk-Sınıf atamaları (M2M) |
| `class_teacher_assignments` | — (Pivot) | Öğretmen-Sınıf atamaları (M2M) |
| `school_teacher_assignments` | — (Pivot) | YENİ: Öğretmen-Okul atamaları (M2M) — `school_id, teacher_profile_id, employment_type, start_date, end_date, is_active, teacher_role_type_id (FK, nullable)` |
| `teacher_role_types` | `App\Models\School\TeacherRoleType` | YENİ: Tenant-level öğretmen görev türleri (Sınıf Öğretmeni, Yardımcı Öğretmen vb.) — `id, tenant_id, name, sort_order, is_active` |
| `activity_class_assignments` | — (Pivot) | Etkinlik-Sınıf atamaları (M2M) — `activity_id, class_id` |

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
| `food_ingredient_allergens` | — (Pivot) | Besin Öğesi-Alerjen (M2M) — `food_ingredient_id, allergen_id` |

> **Allergen tenant_id:** `allergens.tenant_id = NULL` → Global (tüm tenant'lar görür, sadece admin düzenler). `allergens.tenant_id = X` → Tenant'a özel (X tenant'ı oluşturdu, düzenleyebilir). `TenantAllergenController` her iki grubu birleştirerek döndürür.

#### 📊 Takip & Aktiviteler Modülü
| Tablo | Model | Açıklama |
|-------|-------|----------|
| `daily_child_reports` | `App\Models\Activity\DailyChildReport` | Günlük çocuk raporları (mood, appetite, notlar) |
| `attendances` | `App\Models\Activity\Attendance` | Yoklama (present, absent, late, excused) |
| `activities` | `App\Models\Activity\Activity` | Etkinlikler (ücretli/ücretsiz) — `id, school_id, academic_year_id, name, description, is_paid, price, start_date (date nullable), end_date (date nullable)` |
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
            ├── belongsToMany ──── TeacherProfile (via class_teacher_assignments)
            └── belongsToMany ──── Activity (via activity_class_assignments)

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

── Etkinlik & Sağlık Ek İlişkiler ───────────────────
Activity ──────┬── belongsTo ──── School
               ├── belongsTo ──── AcademicYear
               ├── belongsToMany ──── Child (via child_activity_enrollments)
               └── belongsToMany ──── SchoolClass (via activity_class_assignments)

FoodIngredient ── belongsToMany ──── Allergen (via food_ingredient_allergens)
Allergen ──────── (tenant_id=NULL: global | tenant_id=X: tenant-specific)
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

**Paket Alanları:**
- `name` (string): Paket adı
- `description` (text, nullable): Paket açıklaması
- `max_schools`, `max_classes_per_school`, `max_students` (int): Limitler (0 = sınırsız)
- `monthly_price`, `yearly_price` (decimal): Fiyatlar
- `is_active` (boolean): Aktif/pasif durumu
- `sort_order` (int): Gösterim sırası
- `features` (json, deprecated): Eski özellikler alanı (kullanım dışı)

**Paket Özellikleri (Package Features) — Yeni Yapı:**
- Her paket, dinamik özellikler (features) içerebilir
- Özellikler `package_features` tablosunda tanımlanır:
  - `key` (string): Özellik anahtarı (örn: "unlimited_users", "24_7_support")
  - `value_type` (enum: 'bool'|'text'): Özellik tipi
  - `label` (string): Görüntülenen ad
  - `display_order` (int): Sıralama
- Paket-özellik ilişkisi `package_feature_pivot` tablosunda saklanır:
  - `package_id`, `package_feature_id`
  - `value` (text): bool için "1"/"0", text için özel metin (örn: "10 GB")
- İlişki: `Package::packageFeatures()` (many-to-many with pivot)

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
| `packages` | `App\Models\Package\Package` | Platform paketleri (limitler + fiyat + description + sort_order) |
| `package_features` | `App\Models\PackageFeature` | Paket özellik tanımları (key, value_type, label, display_order) |
| `package_feature_pivot` | — | Paket-özellik ilişkisi (package_id, package_feature_id, value) |
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
| POST | `/api/auth/forgot-password` | Şifre sıfırlama e-postası | ❌ |
| POST | `/api/auth/reset-password` | Şifre sıfırla (token + email) | ❌ |
| POST | `/api/auth/logout` | Çıkış (Token silinir) | ✅ |
| GET | `/api/auth/me` | Profil bilgileri | ✅ |

### 6.2 Kayıt Akışı Detay

1. `RegisterRequest` ile validation (güçlü şifre kuralları dahil)
2. `AuthService::register()` ile:
   - User oluşturulur (password otomatik hash)
   - `tenant_owner` rolü atanır
   - Tenant oluşturulur (`institution_name` → `tenants.name`)
   - User'a `tenant_id` atanır
   - Sanctum token oluşturulur

### 6.3 Güçlü Şifre Kuralları (Tenant + Parent)

Hem tenant kaydı (`RegisterRequest`) hem tenant şifre sıfırlama (`AuthController::resetPassword`) için:

```php
'password' => [
    'required', 'string', 'min:8', 'confirmed',
    'regex:/[A-Z]/',         // En az 1 büyük harf
    'regex:/[0-9]/',         // En az 1 rakam
    'regex:/[^A-Za-z0-9]/', // En az 1 özel karakter
]
```

Frontend `register/page.tsx` ve `reset-password/page.tsx`'te aynı kurallar Zod ile validate edilir, `PasswordStrengthBar` bileşeni (4 çubuk + kural listesi) anlık güç göstergesi sağlar.

### 6.4 Şifre Sıfırlama Akışı (Tenant Web)

```
1. Kullanıcı /forgot-password → POST /api/auth/forgot-password {email}
2. Backend: Password::sendResetLink() → User::sendPasswordResetNotification()
3. User::sendPasswordResetNotification():
   - tenant_id NULL ise  → mobile deep link: parentmobileapp://reset-password?token=...&email=...
   - tenant_id NOT NULL  → web URL: {TENANT_FRONTEND_URL}/reset-password?token=...&email=...
4. Kullanıcı e-postadaki linke tıklar → /reset-password?token=...&email=...
5. POST /api/auth/reset-password {token, email, password, password_confirmation}
```

**Önemli:** `TENANT_FRONTEND_URL` env değişkeni (varsayılan: `http://localhost:3002`) `config/app.php`'de `tenant_frontend_url` olarak tanımlanmıştır.

---

## 🛣️ 7. API Route Yapısı (4 Katmanlı)

```
┌──────────────────────────────────────────────────────────┐
│ 1️⃣ HERKESE AÇIK                                         │
│   GET  /api/health                                      │
│   POST /api/auth/register                               │
│   POST /api/auth/login                                  │
│   POST /api/auth/forgot-password                        │
│   POST /api/auth/reset-password                         │
│   GET  /api/packages                                    │
│   GET  /api/countries/phone-codes  ← telefon kodu dropdown │
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
│   GET/POST/DELETE schools/{id}/classes/{classId}/teachers│
│   GET/POST/PUT/DELETE schools/{id}/teachers (school-level teacher mgmt, ?detailed=1) │
│   GET/POST/PUT/DELETE teacher-role-types (tenant-level TeacherRoleType CRUD) │
│   GET/POST/PUT/DELETE teachers (tenant-level TenantTeacherController CRUD) │
│   GET teachers/{id}/schools (okul atamaları)                │
│   POST/DELETE teachers/{id}/schools                         │
│   apiResource: schools/{id}/children                    │
│   GET/PATCH schools/{id}/child-enrollment-requests      │   ← Çocuk okul kayıt talepleri
│   PATCH schools/{id}/child-enrollment-requests/{id}/approve │
│   PATCH schools/{id}/child-enrollment-requests/{id}/reject  │
│   apiResource: schools/{id}/activities                  │
│   apiResource: schools/{id}/families                    │
│   apiResource: subscriptions (B2C)                      │
│   GET/POST/PUT/DELETE: academic-years                   │
│   PATCH: academic-years/{id}/set-current                │
│   PATCH: academic-years/{id}/close                      │
│   GET/POST/PUT/DELETE: meals + food-ingredients         │
│   GET/POST/PUT/DELETE: allergens (tenant allerjen mgmt) │
│   GET: meal-menus/monthly                               │
│   POST: notifications (gönder)                          │
│   GET: notifications + PATCH read                       │
│   GET: invoices/tenant                                  │
│   GET/POST/PUT/DELETE: activity-classes (tenant geneli) │ ← okul opsiyonel
│   GET/POST/DELETE: activity-classes/{id}/enrollments   │
│   POST/DELETE: activity-classes/{id}/teachers          │
│   POST/PUT/DELETE: activity-classes/{id}/materials     │
│   GET/POST/DELETE: activity-classes/{id}/gallery       │
│   GET/PATCH: activity-classes/{id}/invoices            │
│   GET/POST/PUT/DELETE: schools/{id}/activity-classes   │ ← okul-specific (eski uyumluluk)
├──────────────────────────────────────────────────────────┤
│ VELİ MOBIL API (prefix: /api/parent/, auth:sanctum)     │
│   POST parent/auth/register|login|logout|forgot-password│
│   GET  parent/auth/me                                   │
│   GET/POST/PUT/DELETE parent/children + sağlık sync    │
│   POST parent/children/{id}/profile-photo               │
│   GET  parent/children/{id}/photo (signed)              │
│   GET/POST/DELETE parent/family/members                 │
│   CRUD parent/family/emergency-contacts                 │
│   GET/POST parent/schools; POST parent/schools/join     │
│   GET  parent/schools/{id}/feed                         │
│   GET  parent/feed/global                               │
│   GET  parent/activity-classes (+enroll/unenroll/gallery)│
│   GET  parent/activities                ← YENİ 2026-04-10│
│   GET  parent/meal-menus/children       ← YENİ 2026-04-10│
│   GET  parent/meal-menus                ← YENİ 2026-04-10│
│   GET  parent/invoices|invoices/stats|invoices/{id}     │
│   GET  parent/allergens|conditions|medications          │
│   GET  parent/countries|blood-types                     │
│   POST parent/children/{id}/enroll-child (okul talebi) │
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
// Authenticated user helper — nullable (kimlik doğrulaması yapılmamış isteklerde null döner, TypeError olmaz)
protected function user(): ?User

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
| `BaseParentController` | `Controllers\Parents` | `getFamilyProfile()`: owner_user_id → family_members (co_parent) sırasıyla arar. `findOwnedChild(int $id)` dahil. Tüm parent controller'lar buradan türer. |
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
| `activity_class_assignments` | 2026_02_24_120000_add_fields_to_classes_and_activities.php |

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

### 10.1e Güvenlik Katmanları (2026-02-19 Güncelleme)

Güvenlik raporu (`tests/SECURITY_AND_ERRORS_REPORT.md`) tüm maddeleri uygulandı. Özet:

| Katman | Çözüm | Dosya |
|--------|-------|-------|
| **Stack Trace Kapatma** | `APP_DEBUG=false` | `.env` |
| **Global Exception Handler** | AuthException→401, ValidationException→422, ModelNotFound/NotFound→404, HttpException→native status, Generic→500 | `bootstrap/app.php` |
| **XSS Koruması** | `regex:/^[^<>&"\']*$/` tüm health text alanları | `AdminHealthController.php` |
| **Rate Limiting** | `throttle:5,1` login, `throttle:10,1` register | `routes/api.php` |
| **Force JSON Response** | `ForceJsonResponse` middleware — `api` group prepend | `ForceJsonResponse.php`, `bootstrap/app.php` |
| **BaseController null** | `user(): ?User` nullable return type | `BaseController.php` |
| **Teacher 404** | `first()` + manuel 404 (firstOrFail kaldırıldı) | `BaseTeacherController.php` |
| **Admin Validation 422** | `$request->validate()` try-catch dışına alındı | Admin controllers |
| **Dashboard Revenue fix** | `year` nullable, default `now()->year` | `AdminDashboardController.php` |
| **Nginx Security Headers** | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, HSTS | `nginx/conf.d/default.conf` |
| **Super Admin Bypass** | `isSuperAdmin()` kontrolü zaten mevcut | `EnsureActiveSubscription.php` |
| **Register 422 mesajı** | `attributes()` + açık `name` mesajı | `RegisterRequest.php` |

**Kural:** Yeni controller yazarken:
1. `$request->validate()` her zaman try-catch **dışında** olmalı → 422 garantisi
2. `firstOrFail()` yerine `first() + null kontrolü` kullan → 404 garantisi
3. Catch bloğunda `$e->getMessage()` response'a yazılmamalı → generic mesaj

### 10.1f BelongsToMany Pivot Accessor Bug (ÇÖZÜLMESİ GEREKİYOR)

**Sorun:** `->with(['relation' => fn($q) => $q->where(...)->withPivot(...)])` şeklinde constraint callback ile eager load yapıldığında, dönen model'de `->pivot` accessor çalışmaz. Hata: `Call to undefined relationship [pivot] on model [School]`.

**Sebep:** Laravel, BelongsToMany eager loading'de constraint callback kullanıldığında `setRelation('pivot', ...)` call'unu atlayabilir. Sonuçta modelde pivot ilişkisi kurulamamış olur.

**Çözüm (ClassManagementController::schoolTeachers):** Pivot verilerini ORM accessor'dan değil `DB::table()` ile doğrudan çek:
```php
$pivotMap = DB::table('school_teacher_assignments')
    ->where('school_id', $schoolId)
    ->whereIn('teacher_profile_id', $teacherIds)
    ->get()
    ->keyBy('teacher_profile_id');
// $pivot = $pivotMap->get($teacher->id); // stdClass olarak gelir
```

**Kural:** Pivot verilerini okurken ORM `->pivot` accessor yerine `DB::table(pivot_table)` kullanmayı tercih et. Özellikle `whereHas`/constraint ile filtrelenmiş eager loading'de.

### 10.1h Laravel 12 Filesystem — Private Disk (KRİTİK)

**Laravel 12 `config/filesystems.php` varsayılanı:**
```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),  // ← private klasörü
    'serve' => true,
    'throw' => false,
],
```

- `local` disk = `storage/app/private/` — web'den **hiçbir şekilde doğrudan erişilemez**
- `Storage::disk('private')` → **HATA** ("disk private does not have a configured driver") — bu isimde disk tanımlı değil
- Özel (auth-protected) dosyalar için `Storage::disk('local')` kullan
- `public` disk = `storage/app/public/` — `storage:link` ile web'e açılır

**Signed URL Pattern (auth-protected dosya sunma):**
```php
// 1. Dosyayı local diske kaydet (private klasör)
$path = $request->file('photo')->store('children/photos', 'local');

// 2. Signed URL üret (1 saatlik)
$signedUrl = URL::signedRoute('parent.child.photo', ['child' => $id], now()->addHours(1));

// 3. Route: signed middleware, auth:sanctum OLMADAN (Image component header gönderemez)
Route::get('/parent/children/{child}/photo', [ParentChildController::class, 'servePhoto'])
    ->name('parent.child.photo')
    ->middleware('signed');

// 4. Controller: stream et
return Storage::disk('local')->response($childModel->profile_photo);
```

**Avantaj:** Mobil `<Image source={{ uri: signedUrl }}>` — özel Authorization header gerekmez. URL'yi ele geçiren biri imzayı taklit edemez ve URL 1 saat sonra geçersiz olur. Her API çağrısında `ParentChildResource` taze signed URL üretir.

### 10.1g Docker PHP Opcache (KRİTİK)

**Sorun:** Docker volume mount ile çalışırken (`../:/var/www/html`) PHP dosyası değişse bile API eski kodu döndürmeye devam edebilir.

**Sebep:** PHP opcache container restart olmadan sıfırlanmaz.

**Çözüm:** PHP kodu değiştikten sonra container yeniden başlat:
```bash
docker compose -f dockerfiles/docker-compose.yml restart app
```

**Kural:** Backend API beklenmedik şekilde eski yanıt dönüyorsa → önce container'ı yeniden başlat.

---

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
| ✅ **Güvenlik** | 13/13 güvenlik açığı kapatıldı (XSS, stack trace, rate limit, exception handler, nginx headers, vb.) |
| ✅ **E2E Testler** | Playwright E2E testleri yazıldı (`tests/e2e/` — 273/273 geçti). Unit testler: Vitest (`tests/unit/` — 19/19). |
| ✅ **TenantMealController** | Yemek + besin öğesi CRUD + allerjen sync (allergen_ids) |
| ✅ **TenantAllergenController** | Tenant allerjen CRUD (global read-only, tenant-specific CRUD) |
| ✅ **ClassManagementController** | Öğretmen-sınıf atama GET/POST/DELETE |
| ✅ **ActivityController güncelleme** | start_date, end_date, class_ids sync (activity_class_assignments) |
| ✅ **StoreSchoolClassRequest bug fix** | grade_level + branch kaldırıldı (DB'de yok), description+age_min+age_max eklendi (age_group yerine iki ayrı integer alan; gte:age_min validation) |
| ⚠️ **Migration bekliyor** | `2026_02_24_104108_add_contact_fields_to_schools_table.php` + `2026_02_24_120000_add_fields_to_classes_and_activities.php` (classes: description+age_min+age_max, activities: start_date+end_date, pivot: activity_class_assignments) → `php artisan migrate` Docker ayağa kalkınca çalıştırılacak |
| ⚠️ **PHPUnit Tests** | Backend PHP unit/feature test dosyaları henüz yazılmamış. |
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
| Frontend Tenant & Website | 3002 | http://localhost:3002 |
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
| `School` | schools | Tenant, Country? | AcademicYear, SchoolClass, TeacherProfile, Child, EnrollmentRequest, SchoolRole, Announcement, Homework, MealMenuSchedule, ReportTemplate, SystemNotification, ChildPricingSetting | — |
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

### 🆕 Yeni Eklenen Modeller (2026-04-02) — Etkinlik Sınıfları
| Model | Tablo | Açıklama |
|-------|-------|----------|
| `ActivityClass` | activity_classes | Etkinlik sınıfı. `school_id` nullable = tenant-wide. BaseModel'den türer (tenant scope aktif). |
| `ActivityClassEnrollment` | activity_class_enrollments | Öğrenci kaydı. **plain Model** (NOT BaseModel) — parent tenant_id=NULL olduğu için. |
| `ActivityClassTeacher` | activity_class_teachers | Öğretmen ataması (belongsToMany pivot). |
| `ActivityClassMaterial` | activity_class_materials | Materyal listesi. |
| `ActivityClassGallery` | activity_class_gallery | Galeri öğesi. Private storage + signed URL. SoftDeletes. |
| `ActivityClassInvoice` | activity_class_invoices | Ücretli kayıt faturası. |

### 🆕 Yeni Eklenen Modeller (2026-02-24)
| Model | Namespace | Tablo | Açıklama |
|-------|-----------|-------|----------|
| `Material` | `App\Models\Activity\Material` | materials | İhtiyaç listesi (class_id, school_id, name, description, quantity, due_date). BaseModel'den türer. |

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

## 🌍 16a. Ülkeler (Countries) Sistemi — Tam Rehber

### 16a.1 Genel Yapı

Countries tablosu RestCountries API (v3.1) ile senkronize edilir. **250 ülke** mevcut.

```
countries tablosu
├── id, name, iso2, iso3, numeric_code
├── phone_code (+90 formatında, + prefix'li)
├── phone_root, phone_suffixes (JSON)
├── flag_emoji (🇹🇷), flag_png, flag_svg
├── currency_code, currency_name, currency_symbol
├── region, subregion, capital
├── latitude, longitude, population
├── sort_order (öncelikli ülkeler yüksek değer)
├── is_active (default: true)
└── extra_data (JSON — tld, borders, car, vb.)
```

### 16a.2 Telefon Kodu Formatı

| DB'de Saklanan | Frontend'e Dönen | Kullanım |
|----------------|------------------|----------|
| `+90` | `+90` (CountryService) | `.replace(/^\+/, '')` → `90` |

**Telefon kodu üretme kuralı (`CountryService::mapApiData`):**
- Tek suffix → `root + suffix` (örn: TR: `+9` + `0` = `+90`)
- Birden fazla suffix → yalnızca `root` (örn: US: `+1` — çünkü `+1201, +1202...` olmaz)

### 16a.3 Sync Komutu

```bash
# Tüm ülkeleri senkronize et (250 ülke, ~2 sn)
docker compose -f dockerfiles/docker-compose.yml exec app php artisan countries:sync

# Tek ülke güncelle
docker compose -f dockerfiles/docker-compose.yml exec app php artisan countries:sync --iso=TR
```

**⚠️ RestCountries API Kısıtı:** `fields` parametresi ile max 10 field istenilebilir.
Kullanılan 10 field: `name,cca2,cca3,idd,flag,flags,region,currencies,latlng,population`

### 16a.4 API Endpoint'leri

| Method | Endpoint | Auth | Açıklama | Response |
|--------|----------|------|----------|----------|
| `GET` | `/api/countries/phone-codes` | ❌ | Telefon kodu dropdown | `[{id, name, iso2, phone_code, flag_emoji}]` |
| `GET` | `/api/countries` | ❌ | Tüm aktif ülkeler (paginated) | CountryResource |
| `GET` | `/api/countries/regions` | ❌ | Bölge listesi | `[string]` |
| `GET` | `/api/parent/auth/countries` | ❌ | Mobil — public | `[{id, name, iso2, phone_code, flag_emoji}]` |
| `GET` | `/api/parent/countries` | ✅ | Mobil — auth gerekli | `[{id, name, iso2, phone_code, flag_emoji}]` |

### 16a.5 Frontend Kullanım Örneği (Tenant Web — register/page.tsx)

```tsx
// Ülkeleri çek + phone_code normalize et
useEffect(() => {
  apiClient.get('/countries/phone-codes').then((res) => {
    const data = (res.data?.data || []).map((c) => ({
      ...c,
      phone_code: c.phone_code.replace(/^\+/, ''), // "+90" → "90"
    }));
    setPhoneCodes(data);
    const turkey = data.find((c) => c.iso2 === 'TR') || data[0] || null;
    setSelectedCode(turkey);
  }).catch(() => {});
}, []);

// Telefon input — sadece rakam, max 10 hane
const handlePhoneChange = (e) => {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
  setValue('phone', digits);
};

// Gönderirken birleştir
const fullPhone = phoneValue.trim()
  ? `+${selectedCode.phone_code}${phoneValue.trim()}`
  : undefined;
// Sonuç: "+905551234567"
```

### 16a.6 Frontend Kullanım Örneği (Mobil — parent-mobile-app/register.tsx)

```tsx
// Ülkeleri çek (public endpoint — auth gerekmez)
useEffect(() => {
  api.get('/parent/auth/countries').then((res) => {
    const list = res.data.data.map((c) => ({
      ...c,
      phone_code: c.phone_code.replace(/^\+/, ''), // normalize
    }));
    setCountries(list);
    const tr = list.find((c) => c.iso2 === 'TR');
    if (tr) setSelectedCountry(tr);
  }).catch(() => {});
}, []);

// Telefon input — sadece rakam, max 10 hane
const handlePhoneChange = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  updateField('phone', digits);
};
```

### 16a.7 Cache

`CountryService::phoneCodeList()` → `Cache::remember('countries:phone_codes', 3600)` — 1 saat.
Sync veya `toggleActive()` sonrası cache otomatik temizlenir (`Cache::forget('countries:phone_codes')`).

---

## 🏗️ 16. Tenant Panel Backend Değişiklikleri (2026-02-24)

### 16.1 Okul Limiti Bug Fix

**Sorun:** `SchoolController::store()` paket limitini kontrol etmiyordu; tenant paketi sınırını aşarak okul ekleyebiliyordu.

**Çözüm:** `SchoolController` içine `ChecksPackageLimits` trait eklendi ve `store()` başında çağrılıyor:
```php
use App\Traits\ChecksPackageLimits;
class SchoolController extends BaseSchoolController {
    use ChecksPackageLimits;

    public function store(StoreSchoolRequest $request): JsonResponse {
        $tenant = Tenant::with('activeSubscription.package')->find($this->user()->tenant_id);
        $this->checkSchoolLimit($tenant); // Limit aşıldıysa exception fırlatır
        // ...
    }
}
```

### 16.2 Schools Tablosu — Yeni Alanlar

**Migration:** `2026_02_24_104108_add_contact_fields_to_schools_table.php`
⚠️ **Bu migration henüz çalıştırılmadı!** Docker DB ayağa kalktığında `php artisan migrate` çalıştırılmalı.

Eklenen alanlar:
- `country_id` (FK → countries, nullable, nullOnDelete)
- `city` (string 100, nullable)
- `fax` (string 20, nullable)
- `gsm` (string 20, nullable)
- `whatsapp` (string 20, nullable)

**School modeli `$fillable`'a eklenenler:** `country_id`, `city`, `fax`, `gsm`, `whatsapp`, `description`, `website`, `registration_code`

**School modeli ilişki:** `country()` → `belongsTo(Country::class, 'country_id')->withDefault()`

**StoreSchoolRequest / UpdateSchoolRequest yeni kurallar:**
```php
'country_id' => ['nullable', 'exists:countries,id'],
'city'       => ['nullable', 'string', 'max:100'],
'fax'        => ['nullable', 'string', 'max:20'],
'gsm'        => ['nullable', 'string', 'max:20'],
'whatsapp'   => ['nullable', 'string', 'max:20'],
'description'=> ['nullable', 'string'],
'website'    => ['nullable', 'string', 'max:255'],
```

### 16.3 TenantMealController (YENİ)

`App\Http\Controllers\Schools\TenantMealController` — BaseController'dan türer.

**Besin Öğeleri:**
- `GET /food-ingredients` → Global (tenant_id=null) + tenant'a özel ingredients
- `POST /food-ingredients` → Tenant-scope yeni ingredient (is_custom=true)
- `PUT /food-ingredients/{id}` → Sadece kendi tenant'ının ingredientini günceller
- `DELETE /food-ingredients/{id}` → Sadece is_custom=true olanları siler

**Yemekler:**
- `GET /meals` (?school_id) → Okul yemekleri (ingredients ile)
- `POST /meals` → `{ school_id, name, meal_type, ingredient_ids[] }` — pivot ile sync
- `PUT /meals/{id}` → Güncelle + ingredient sync
- `DELETE /meals/{id}` → Sil

### 16.4 ClassManagementController (YENİ)

`App\Http\Controllers\Schools\ClassManagementController` — BaseController'dan türer.

**Öğretmen Atama:**
- `GET /schools/{school_id}/classes/{class_id}/teachers` → Sınıfa atanmış öğretmenler
- `POST /schools/{school_id}/classes/{class_id}/teachers` → `{ teacher_profile_id, role? }` — syncWithoutDetaching
- `DELETE /schools/{school_id}/classes/{class_id}/teachers/{teacher_profile_id}` → Öğretmeni kaldır (detach)
- `GET /schools/{school_id}/teachers` → Okulun tüm öğretmen profilleri

**İhtiyaç Listesi (Supply List = materials tablosu):**
- `GET /schools/{school_id}/classes/{class_id}/supply-list` → Sınıfın ihtiyaç listesi
- `POST /schools/{school_id}/classes/{class_id}/supply-list` → `{ name, description?, quantity?, due_date? }` — academic_year_id otomatik bulunur
- `PUT /schools/{school_id}/classes/{class_id}/supply-list/{material_id}` → Güncelle
- `DELETE /schools/{school_id}/classes/{class_id}/supply-list/{material_id}` → Sil

### 16.5 Yeni Rotalar (routes/api.php)

`subscription.active` middleware + tenant scope altına eklendi:

```php
// schools/{school_id} prefix içinde:
Route::prefix('classes/{class_id}')->group(function () {
    Route::get('/teachers', [ClassManagementController, 'classTeachers']);
    Route::post('/teachers', [ClassManagementController, 'assignTeacher']);
    Route::delete('/teachers/{teacher_profile_id}', [ClassManagementController, 'removeTeacher']);
    Route::get('/supply-list', [ClassManagementController, 'supplyList']);
    Route::post('/supply-list', [ClassManagementController, 'addSupplyItem']);
    Route::put('/supply-list/{material_id}', [ClassManagementController, 'updateSupplyItem']);
    Route::delete('/supply-list/{material_id}', [ClassManagementController, 'deleteSupplyItem']);
});
Route::get('/teachers', [ClassManagementController, 'schoolTeachers']);

// schools prefix dışında:
Route::prefix('food-ingredients')->group(...)  // TenantMealController
Route::prefix('meals')->group(...)             // TenantMealController
```

### 16.7 Öğretmen Modülü Rotaları (2026-03-06)

`subscription.active` middleware altına eklendi:

```php
Route::prefix('teachers')->group(function () {
    Route::get('/', [TenantTeacherController::class, 'index']);           // ?search, ?school_id, ?per_page
    Route::post('/', [TenantTeacherController::class, 'store']);          // User + TeacherProfile oluştur, teacher rolü ata
    Route::get('/{id}', [TenantTeacherController::class, 'show']);
    Route::put('/{id}', [TenantTeacherController::class, 'update']);
    Route::delete('/{id}', [TenantTeacherController::class, 'destroy']);  // soft delete
    Route::get('/{id}/schools', [TenantTeacherController::class, 'schoolAssignments']);
    Route::post('/{id}/schools', [TenantTeacherController::class, 'assignToSchool']);
    Route::delete('/{id}/schools/{schoolId}', [TenantTeacherController::class, 'removeFromSchool']);
});
```

**Öğretmen Mimarisi:**
- `teacher_profiles.tenant_id` → öğretmen tenant'a aittir (okula değil)
- `teacher_profiles.school_id` → nullable (geriye uyumluluk)
- `school_teacher_assignments` pivot → öğretmen birden fazla okula atanabilir
- `ClassManagementController::schoolTeachers()` → hem `school_id` hem pivot'tan öğretmen getirir

### 16.6 Pint Düzeltmeleri

`vendor/bin/pint --dirty` çalıştırıldı. Düzeltilen dosyalar:
- `SchoolResource.php`, `UpdateSchoolRequest.php`, `StoreSchoolRequest.php`
- `TenantMealController.php`, `ClassManagementController.php`

---

---

## 🧪 17. Test Suite Altyapısı (2026-02-26)

### 17.1 Genel Durum

```
php artisan test                     → 105 passing / 31 failing (tümü @group bug)
php artisan test --exclude-group=bug → 99 passing / 0 failing
```

31 başarısız test tamamı `@group bug` annotation'lı olup **kasıtlı olarak belgelenmiş hatalardır**.
Düzeltme rehberi: `TASKS_FOR_FIX.md` — BUG-001 → BUG-011.

### 17.2 PHP 8.4 + SQLite + RefreshDatabase Uyumluluk Düzeltmesi

**Sorun:** PHP 8.4'te `SQLiteConnection::executeBeginTransactionStatement()` → `exec("BEGIN DEFERRED TRANSACTION")` kullanır. PDO'nun `inTransaction()` bayrağını güncellemez. `performRollBack(0)` → `inTransaction()` false → rollback atlanır → "cannot start a transaction within a transaction" hatası.

**Düzeltme Dosyaları:**
- `tests/Database/TestSQLiteConnection.php` — `executeBeginTransactionStatement()` → `PDO::beginTransaction()`, `performRollBack(0)` → `exec('ROLLBACK')` direkt
- `tests/TestCase.php` — `Connection::resolverFor('sqlite', ...)` ile custom connection kayıt

### 17.3 Controller Bug Düzeltmeleri

#### AcademicYearController::destroy() — Transaction Leak
`is_current` kontrolünde `DB::rollBack()` eksikti:
```php
if ($academicYear->is_current) {
    DB::rollBack(); // ← eklendi
    return $this->errorResponse('...', 422);
}
```

#### TenantAllergenController::destroy() — ModelNotFoundException → 404
`firstOrFail()` catch(\Throwable) içindeydi → 500. `ModelNotFoundException` catch'i eklendi:
```php
} catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
    return $this->errorResponse('Allerjen bulunamadı.', 404);
} catch (\Throwable $e) { ...
```

#### TenantMealController — 3 metod düzeltildi
- `ingredientDestroy()` — ModelNotFoundException → 404
- `mealDestroy()` — ModelNotFoundException → 404
- `mealStore()` — `academic_year_id` validation + `Meal::create()` eklendi (`meals.academic_year_id NOT NULL`)

#### FoodIngredient::allergens() — Global Scope Sorunu
```php
// ÖNCE:
return $this->belongsToMany(Allergen::class, 'food_ingredient_allergens', ...);
// SONRA:
return $this->belongsToMany(Allergen::class, 'food_ingredient_allergens', ...)->withoutGlobalScopes();
```
**Neden:** `BaseModel` tenant global scope'u `allergens.tenant_id = $userId` filtresi ekliyor. Global allerjenler (tenant_id=null) relationship üzerinden yüklendiğinde filtreleniyor. `withoutGlobalScopes()` ile allergens her zaman eksiksiz döner.

### 17.4 Test Dosyası Düzeltmeleri

#### Soft-Delete assertDatabaseMissing Hatası
`BaseModel` extends `SoftDeletes`. Silinen kayıt DB'de `deleted_at` set olmuş halde kalır.
`assertDatabaseMissing('table', ['id' => $id])` → FAIL çünkü kayıt hâlâ var.
**Düzeltme:** `assertDatabaseMissing('table', ['id' => $id, 'deleted_at' => null])`

Düzeltilen testler:
- `AcademicYearApiTest::destroy_aktif_olmayan_egitim_yilini_siler`
- `TenantAllergenApiTest::destroy_kendi_allerjenini_siler`
- `TenantMealApiTest::ingredient_destroy_kendi_tenant_besinini_siler`
- `TenantMealApiTest::meal_destroy_kendi_yemegini_siler`
- `ClassManagementApiTest::supply_list_kalem_sil`

#### academic_year_id NOT NULL Eksikliği
`meals.academic_year_id` ve `materials.academic_year_id` NOT NULL.

- `ApiTestHelpers::createMeal()` → `academic_year_id` yoksa otomatik `createAcademicYear()` çağırır
- `TenantMealApiTest::meal_store_yeni_yemek_olusturur` → `createAcademicYear()` + request'e `academic_year_id` eklendi
- `TenantMealApiTest::meal_store_malzeme_atamasiyla_yemek_olusturur` → aynı
- `ClassManagementApiTest::supply_list_kalem_guncelle` → `Material::create()` içine `academic_year_id` eklendi
- `ClassManagementApiTest::supply_list_kalem_sil` → aynı

### 17.5 Çocuk Okul Kayıt Talebi Sistemi (2026-03-16)

#### Akış
1. Veli mobil uygulamada "Okullarım" → okul seç → "Çocuğumu Ekle" → henüz okulda olmayan çocuklarını gösterir → çocuk seç → talep oluşturulur
2. Tenant panel → Okul Detayı → "Onay Bekleyen Öğrenciler" sekmesi → talepleri listeler, onay/red yapabilir
3. Onay sonrası: `children.school_id = schoolId` set edilir, çocuk "Öğrenciler" sekmesinde belirir

#### Backend Dosyaları
- **Model:** `app/Models/School/SchoolChildEnrollmentRequest.php`
  - Tablo: `school_child_enrollment_requests`
  - Unique: `(school_id, child_id)` — bir çocuk bir okula birden fazla talep gönderemez
  - Statüler: `pending / approved / rejected`
- **Controller (Tenant):** `app/Http/Controllers/Schools/ChildEnrollmentRequestController.php`
  - Extends `BaseController` (BaseSchoolController DEĞİL — kendi school erişim kontrolünü yapar)
  - `index(Request, int $schoolId)` — `withoutGlobalScope('tenant')` zorunlu (parent'ın çocukları tenant_id=NULL)
  - `approve(int $schoolId, int $id)` — `children.school_id = schoolId` set eder
  - `reject(Request, int $schoolId, int $id)` — `rejection_reason` required min:5
- **Controller (Parent):** `app/Http/Controllers/Parents/ParentSchoolController.php`
  - `enrollChild(Request, int $school)` — Çocuğun aileye ait olduğunu, başka okulda olmadığını, duplicate talep olmadığını doğrular
  - `myChildEnrollments(int $school)` — Ailenin o okul için çocuk kayıt taleplerini listeler

#### ChildController Kritik Düzeltmeler (2026-03-16)

**Nested route positional arg hatası:**
`schools/{school_id}/children/{child}` → Laravel iki route param'ı positional olarak geçirir.
`show(Child $child)` çağrısında `school_id='1'` birinci arg olarak gelir → TypeError!

```php
// YANLIŞ:
public function show(Child $child): JsonResponse
// DOĞRU:
public function show(int $school_id, Child $child): JsonResponse
public function update(UpdateChildRequest $request, int $school_id, Child $child): JsonResponse
public function destroy(int $school_id, Child $child): JsonResponse
```

**FamilyProfile tenant scope sorunu:**
Parent kullanıcıların `tenant_id = NULL`. Tenant admin `ChildController::show()` veya `index()` çağırdığında `FamilyProfile` eager loading'e global scope `WHERE tenant_id = {X}` ekler → parent'ın family profile'ı NULL döner.

```php
// index() — listede veli bilgisi göstermek için:
->with(['familyProfile' => fn($q) => $q->withoutGlobalScope('tenant')->with('owner')])

// show() — detayda tüm aile bilgisi için:
$child->load([
    'familyProfile' => fn($q) => $q->withoutGlobalScope('tenant')->with(['owner', 'members.user']),
    'allergens' => fn($q) => $q->withoutGlobalScope('tenant'),
    'medications' => fn($q) => $q->withoutGlobalScope('tenant'),
    'conditions' => fn($q) => $q->withoutGlobalScope('tenant'),
    ...
]);
```

**Sağlık verileri tenant scope sorunu:**
Global allerjenler (`tenant_id=NULL`) ve parent önerilen allerjenler (`tenant_id=NULL`) tenant scope ile filtrelenir. Tenant admin bir çocuğun tüm sağlık verisini görebilmeli → `withoutGlobalScope('tenant')` her üç sağlık ilişkisinde kullanılmalı.

**ChildController::index() ChildResource dönüşümü:**
`paginatedResponse($plainPaginator)` raw model data döndürür (ChildResource bypass edilir). `ChildResource::collection($paginator)` ile döndür ki `family_profile` alanı doğru serialize edilsin.

### 17.7 Öğretmen Profil — Yeni Alanlar (2026-03-17)

Migration: `2026_03_16_125757_add_contact_fields_to_teacher_profiles.php`

```php
$table->string('phone_country_code', 10)->nullable();
$table->string('whatsapp_number', 30)->nullable();
$table->string('whatsapp_country_code', 10)->nullable();
$table->string('identity_number', 50)->nullable();
$table->string('passport_number', 50)->nullable();
// country_id zaten vardı → uyruk olarak kullanılır
```

- `TeacherProfile::$fillable` ve `StoreTeacherRequest`/`UpdateTeacherRequest` validation'ına eklendi
- `TenantTeacherController::formatTeacher()` döner: `nationality` (id/name/iso2/flag_emoji), `phone_country_code`, `whatsapp_number`, `whatsapp_country_code`, `identity_number`, `passport_number`
- **API ülke listesi**: `/api/parent/auth/countries` (public, auth gerektirmez) — tenant frontend'den de kullanılır

### 17.8 Sınıfa Öğrenci Ataması (2026-03-17)

**Yeni endpoint'ler** (`ClassManagementController`):
```
POST   /schools/{school_id}/classes/{class_id}/children   → assignChild
DELETE /schools/{school_id}/classes/{class_id}/children/{child_id} → removeChild
```

**`assignChild` kontrol sırası:**
1. Sınıf aktif mi? (pasifse 422)
2. Öğrenci bu okula kayıtlı mı? (değilse 422)
3. Yaş aralığı: `Carbon::parse($child->birth_date)->age` — `age_min`/`age_max` ihlali → 422 + açıklayıcı mesaj
4. **Tek sınıf kuralı**: `$child->classes()->first()` → başka sınıfa kayıtlıysa 422: _"X adlı öğrenci zaten Y sınıfına kayıtlı. Önce mevcut sınıftan çıkarın."_
5. `$class->children()->attach($child->id)` ile kayıt

**`ChildController::index()` güncellemesi:**
- `?class_id=X` filtresi eklendi: `->when($classId, fn($q) => $q->whereHas('classes', fn($c) => $c->where('classes.id', $classId)))`
- `'classes'` eager load eklendi → `ChildResource` artık listede de sınıf bilgisi döner

### 17.9 Veliler Sekmesi — Tenant Scope Fix (2026-03-17)

`EnrollmentRequestService::parentsForSchool()`:
```php
// ÖNCE (çalışmıyor):
return FamilyProfile::whereHas('schools', ...)...

// SONRA (düzeltildi):
return FamilyProfile::withoutGlobalScope('tenant')
    ->whereHas('schools', fn($q) => $q->where('schools.id', $schoolId))
    ->with([
        'owner',
        'children' => fn($q) => $q->withoutGlobalScope('tenant')->where('school_id', $schoolId),
    ])
    ->paginate($perPage);
```
**Neden**: Veli `FamilyProfile` kayıtları `tenant_id = NULL` — BaseModel tenant scope filtreler → sayfa 0 dönerdi.

### 17.6 Bilinen Bug Referansı (TASKS_FOR_FIX.md)

| Bug ID | Açıklama | Durum |
|--------|----------|-------|
| BUG-010 | `User::schools()` eksik → BaseSchoolController 500 | ✅ Düzeltildi |
| BUG-003 | Meal cross-tenant güvenlik açığı | ✅ Düzeltildi |
| BUG-001 | Global allerjenler index'te görünmüyor | ✅ Düzeltildi |
| BUG-002 | Global besin öğeleri index'te görünmüyor | ✅ Düzeltildi |
| BUG-006 | mealIndex validate() try-catch içinde → 500 | ✅ Düzeltildi |
| BUG-007 | AcademicYearController validate() try-catch → 500 | ✅ Düzeltildi |
| BUG-004 | TenantAllergenController update firstOrFail catch → 500 | ✅ Düzeltildi |
| BUG-005 | TenantMealController ingredientUpdate firstOrFail catch → 500 | ✅ Düzeltildi |
| BUG-011 | assignTeacher hata mesajında iç detay sızıyor | ✅ Düzeltildi |
| BUG-008 | `$request->all()` → `$request->validate()` return değeri kullanılmalı | ✅ Düzeltildi |
| BUG-009 | paginatedResponse `.resource` anti-pattern + `toArray()` → `resolve()` | ✅ Düzeltildi |
| BUG-012 | ClassController/ActivityController nested route positional arg hatası (school_id) | ✅ Düzeltildi |
| BUG-013 | ChildController::show/update/destroy nested route positional arg hatası (school_id) | ✅ Düzeltildi |
| BUG-014 | ChildController::show FamilyProfile tenant scope → NULL parent profile yüklenmiyor | ✅ Düzeltildi |
| BUG-015 | ChildController::index FamilyProfile tenant scope → veli bilgisi listede görünmüyor | ✅ Düzeltildi |
| BUG-016 | ParentActivityClassController::index plain Collection → paginatedResponse items() hatası | ✅ Düzeltildi |
| BUG-017 | Mobil activity-classes endpoint'leri /parent prefix eksikti → 404/403 | ✅ Düzeltildi |
| BUG-018 | Route cache stale → php artisan route:clear + container restart gerekti | ✅ Düzeltildi |

---

## 🌟 18. Etkinlik Sınıfları Modülü (2026-04-02)

### 18.1 Mimari Genel Bakış

```
ActivityClass
├── school_id = null  → Tenant geneli (tüm okullarda görünür)
├── school_id = X     → Okul-specific (sadece o okul)
├── is_school_wide    → Okuldaki tüm sınıflar mı, yoksa belirli sınıflar mı?
└── school_class_ids  → Belirli sınıflar (activity_class_school_class_assignments)

ActivityClassEnrollment  ← plain Model (NOT BaseModel)
└── Neden plain Model: Parent kullanıcıların tenant_id=NULL, BaseModel scope bozar

ActivityClassInvoice  ← Ücretli kayıtta otomatik oluşur (is_paid=true ise)
```

### 18.2 TenantActivityClassController — Kritik Mimari

```php
// Extends BaseController (NOT BaseSchoolController) — school_id URL param'ı YOK
class TenantActivityClassController extends BaseController

// store(): school_id opsiyonel
$validated = $request->validate([
    'school_id' => 'nullable|integer|exists:schools,id',
    ...
]);
ActivityClass::create(array_merge($validated, [
    'tenant_id' => $this->user()->tenant_id,
    'school_id' => $validated['school_id'] ?? null,  // null = tenant-wide
]));

// index(): ?school_id filtresi — null ise tenant-wide + school-specific birlikte döner
if ($schoolId = request('school_id')) {
    $query->where(fn($q) => $q->where('school_id', $schoolId)->orWhereNull('school_id'));
}

// authorizeOwnership(): school nested route değil, tenant_id kontrolü
if ($activityClass->tenant_id !== $this->user()->tenant_id) {
    return $this->errorResponse('Bu etkinlik sınıfına erişim yetkiniz yok.', 403);
}
```

### 18.3 ParentActivityClassController — Tenant-Wide Etkinlik Keşfi

```php
// index(): çocukların okul + tenant'ı üzerinden hem school-specific hem tenant-wide etkinlikleri bulur
$schoolIds = Child::withoutGlobalScope('tenant')
    ->where('family_profile_id', $familyProfile->id)
    ->whereNotNull('school_id')->pluck('school_id')->unique()->filter();

$tenantIds = School::whereIn('id', $schoolIds)->pluck('tenant_id')->unique()->filter();

ActivityClass::withoutGlobalScope('tenant')
    ->where('is_active', true)
    ->where(function ($q) use ($schoolIds, $tenantIds) {
        $q->whereIn('school_id', $schoolIds)
          ->orWhere(fn($q2) => $q2->whereNull('school_id')->whereIn('tenant_id', $tenantIds));
    });

// enroll(): school_id=null etkinlikte okul kontrolü atlanır, tenant kontrolü yapılır
if ($activityClass->school_id !== null && $child->school_id !== $activityClass->school_id) {
    return $this->errorResponse('Çocuğunuz bu etkinlik sınıfının okuluna kayıtlı değil.', 422);
}
if ($activityClass->school_id === null) {
    $childSchool = School::find($child->school_id);
    if (!$childSchool || $childSchool->tenant_id !== $activityClass->tenant_id) {
        return $this->errorResponse('Bu etkinlik sınıfına erişim yetkiniz yok.', 422);
    }
}
```

### 18.4 paginatedResponse — plain Collection Bug Fix

**Sorun:** `paginatedResponse(collect($result), $data)` → `collect()` plain Collection döndürür, `items()` metodu YOK → `Collection::items does not exist` hatası.

**Çözüm:** Paginator'ın `getCollection()` → map → `setCollection()` döngüsü:
```php
$result = $data->getCollection()->map(function ($ac) use ($enrolledMap) {
    return array_merge($this->formatActivityClass($ac), [
        'enrolled_child_ids' => $enrolledMap->get($ac->id, collect())->values(),
    ]);
});
$data->setCollection($result);

return response()->json([
    'success' => true,
    'data' => $data->items(),
    'meta' => [
        'current_page' => $data->currentPage(),
        'last_page' => $data->lastPage(),
        'per_page' => $data->perPage(),
        'total' => $data->total(),
    ],
]);
```

**Kural:** Paginator üzerinde map yapıp özel alanlar ekleyeceksen `$data->map()` KULLANMA (plain Collection döner). `getCollection()->map()` + `setCollection()` kullan.

### 18.5 MySQL 64-Char FK İsim Limiti (KRİTİK)

MySQL FK constraint ismi maksimum **64 karakter** olabilir. Uzun tablo isimlerinde Laravel'in otomatik oluşturduğu FK isimleri bu limiti aşar → `SQLSTATE[42000]: Identifier name '...' is too long`.

**Etkilenen tablolar ve çözüm:**
```php
// activity_class_school_class_assignments — uzun tablo adı:
$table->foreign('activity_class_id', 'acsc_activity_class_fk')->references('id')->on('activity_classes');
$table->foreign('school_class_id', 'acsc_school_class_fk')->references('id')->on('classes');
$table->unique(['activity_class_id', 'school_class_id'], 'acsc_unique');

// activity_class_teachers:
$table->unique(['activity_class_id', 'teacher_profile_id'], 'act_unique');

// activity_class_enrollments:
$table->unique(['activity_class_id', 'child_id'], 'ace_unique_enrollment');
```

**Kural:** Yeni pivot/junction tablo migration'ında FK/unique constraint isimlerini explicit kısa isimle yaz, özellikle tablo adı 25+ karakter olduğunda.

### 18.6 Galeri — Private Storage + Signed URL

Etkinlik sınıfı galeri fotoğrafları private storage'da saklanır, signed URL ile serve edilir:

```php
// Kaydetme:
$path = $request->file('image')->store("activity-classes/{$activityClass->id}/gallery", 'local');

// Signed URL üretme (2 saatlik):
URL::signedRoute('activity-class-gallery.serve', ['galleryItem' => $item->id], now()->addHours(2))

// Route (auth header gerektirmez — signed middleware yeterli):
Route::get('/activity-class-gallery/{galleryItem}/serve', [ActivityClassGalleryController::class, 'serve'])
    ->name('activity-class-gallery.serve')
    ->middleware('signed');
```

### 18.6 Etkinlik Fatura Sistemi (2026-03-27)

**Yeni alanlar — `activities` tablosu:**
- `start_time` / `end_time`: `TIME` nullable — etkinlik saati
- `cancellation_allowed`: boolean default false — kayıt iptali açık mı
- `cancellation_deadline`: DATETIME nullable — son iptal tarihi (null ise etkinlik başlamadan iptal edilebilir)

**Yeni alan — `activity_enrollments` tablosu:**
- `invoice_id`: nullable FK → `invoices.id` (nullOnDelete)

**`ActivityInvoiceService`** (`app/Services/ActivityInvoiceService.php`) — ActivityClassInvoiceService ile aynı pattern:
- `createForEnrollment(enrollment, activity, userId)` → `invoices` tablosuna `module=activity`, `type=activity`, `payable_type=ActivityEnrollment::class` ile kayıt + item + `enrollment.invoice_id` günceller
- `createRefund(invoice, reason)` → iade faturası (`invoice_type=refund`, `status=paid`) + orijinali `refunded` yapar
- `handleEnrollmentCancellation(enrollment, reason)` → paid → iade, pending/overdue → iptal
- `handleActivityPaidToFree(activity)` → tüm kayıtlı enrollments için toplu işlem; `{refunded_count, cancelled_count}` döner

**`ParentActivityController::enroll()`** → `is_paid && price > 0` ise `ActivityInvoiceService::createForEnrollment()` çağırır

**`ParentActivityController::unenroll()`** → İptal politikası kontrolü:
1. `cancellation_allowed = false` → 422
2. `cancellation_deadline` varsa geçmişse → 422
3. Deadline yoksa etkinlik başlamış mı kontrol (start_date + start_time)
4. Fatura varsa `handleEnrollmentCancellation()` çağırır → iade/iptal

**`ActivityController::update()`** → `wasPaid && becomingFree` ise `handleActivityPaidToFree()` çağırır (toplu fatura işleme)

**Tenant frontend `/activities`:** Form'a `start_time`, `end_time`, `cancellation_allowed`, `cancellation_deadline` (datetime-local) alanları eklendi. İptal seçenekleri sadece `is_enrollment_required=true` iken görünür.

**Fatura modülü entegrasyonu:** `module='activity'` olarak ana `invoices` tablosuna yazılır → `InvoiceService::listForTenant()` filtrelenebilir. `by_module.activity` stats'a eklenmesi gerekebilir.

### 18.7 Etkinlik Detay Sayfası — Tenant Frontend (2026-04-11)

`/activities/[id]/page.tsx` — 3 sekmeli detay sayfası:
- **Detaylar sekmesi**: etkinlik bilgileri (açıklama, tarihler, fiyat, sınıflar, materyaller), katılımcı sayısı
- **Katılımcılar sekmesi**: `GET /schools/{school_id}/activities/{id}/enrollments` → tablo (veli adı + kayıt tarihi)
- **Galeri sekmesi**: `GET /schools/{school_id}/activities/{id}/gallery` → grid; `POST` upload (FormData); `DELETE /gallery/{galleryItem}` sil; hover'da X butonu
- Sayfa, okul listesini fetch edip hangi okula ait olduğunu bulur (school_id önce bilinmediği için)
- Etkinlik listesine "Detay" butonu eklendi (ExternalLink ikonu, `router.push('/activities/{id}')`)

**Tenant ActivityController'a eklenen:**
- `enrollmentIndex(int $school_id, Activity $activity)` → katılımcılar (familyProfile.owner eager load, `owner_name` birleştirilmiş)
- Route: `GET /api/schools/{school_id}/activities/{activity}/enrollments`

### 18.8 Etkinlik Materyalleri (2026-04-11)

`activities.materials` → JSON dizi (`string[]`), ör: `["Kalem","Defter","Makas"]`.

- **Migration:** `2026_03_26_120129_add_materials_to_activities_table.php` — `$table->json('materials')->nullable()`
- **Model:** `Activity::$fillable` + `casts()` → `'materials' => 'array'`
- **Requests:** `StoreActivityRequest` + `UpdateActivityRequest` → `'materials' => ['nullable','array'], 'materials.*' => ['string','max:255']`
- **ActivityResource:** `'materials' => $this->materials ?? []` — her zaman döner (boş dizi varsayılan)
- **ParentActivityController::show():** `$canSeeExtras = !is_enrollment_required || $isEnrolled` → `materials` yalnızca bu koşulda response'a eklenir (liste içeriği gizlenir, galeri ile birlikte)
- **Frontend tenant form:** Tek input + "Ekle" butonu (Enter da çalışır) → liste halinde gösterilir, X ile silinir. `payload.materials = form.materials.length > 0 ? form.materials : null`
- **Mobil detay ekranı:** `showGallery` koşulunun arkasında → kayıtlıysa `checkmark-circle-outline` ikonlu liste; kayıtlı değilse "Materyaller Kilitli" notice (galeri ile ortak kilit mesajı)

### 18.9 Route Cache Sorunu

Yeni route ekledikten sonra Laravel route cache'i eski kalabilir → 404 döner.

**Çözüm:**
```bash
docker compose -f dockerfiles/docker-compose.yml exec app php artisan route:clear
docker compose -f dockerfiles/docker-compose.yml restart app
```

**Kural:** API 404 dönüyorsa ve route doğruysa → önce `route:clear` + `container restart` dene.

---

> 📝 **Not:** Bu dosya proje geliştikçe güncellenmelidir. Her yeni modül, migration veya mimari değişiklikte bu dosyanın güncellenmesi önerilir.
