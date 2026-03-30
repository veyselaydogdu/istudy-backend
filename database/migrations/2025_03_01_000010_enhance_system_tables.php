<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | Türkçe Açıklama
    |--------------------------------------------------------------------------
    | Bu migration kapsamlı sistem geliştirmesini içerir:
    |
    | 1. Veli Okul Kayıt Talebi Sistemi (school_enrollment_requests)
    | 2. Yetkili Alıcılar Sistemi (authorized_pickups)
    | 3. Dinamik Rapor Şablon Sistemi (report_templates, report_template_inputs, report_input_values)
    | 4. Okul/Sınıf Bazlı Özel Rol Sistemi (school_roles, school_role_permissions, school_user_roles)
    | 5. Gelişmiş Bildirim Sistemi (system_notifications, notification_preferences)
    | 6. Ödev Sistemi (homework, homework_class_assignments)
    | 7. Etkinlik Ödeme Takibi (event_payments)
    | 8. Mevcut Tabloları Geliştirme:
    |    - meals: class_id, menu_date eklendi
    |    - classes: description, age_group eklendi
    |    - class_teacher_assignments: role eklendi
    |    - child_material_trackings: is_provided, provided_at, notes eklendi
    |    - family_members: phone, address, is_emergency_contact eklendi
    |    - children: blood_type, enrollment_date, status eklendi
    |    - schools: registration_code (unique) eklendi
    |    - activities: class_id, activity_type, start_date, end_date eklendi
    |    - events: class_id, event_type, location, start_time, end_time, max_participants eklendi
    |    - materials: class_id, due_date, quantity eklendi
    |    - daily_child_reports: class_id eklendi
    |    - attendances: check_in_time, check_out_time, notes eklendi
    */

    public function up(): void
    {
        // ══════════════════════════════════════════════════════════════
        // 1️⃣ VELİ OKUL KAYIT TALEBİ SİSTEMİ
        // ══════════════════════════════════════════════════════════════

        // Veliler okul kayıt kodu ile okulu arayıp kayıt talebi gönderir,
        // okul yöneticisi onaylar veya reddeder.
        Schema::create('school_enrollment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete()->comment('Talepte bulunan veli');
            $table->foreignId('family_profile_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('status')->default('pending')->comment('pending, approved, rejected');
            $table->text('message')->nullable()->comment('Velinin mesajı');
            $table->text('rejection_reason')->nullable()->comment('Red sebebi');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete()->comment('Onaylayan/Reddeden yetkili');
            $table->timestamp('reviewed_at')->nullable();

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->unique(['school_id', 'user_id', 'deleted_at'], 'unique_enrollment_request');
        });

        Schema::create('school_enrollment_requests_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════
        // 2️⃣ YETKİLİ ALICILAR SİSTEMİ (Authorized Pickups)
        // ══════════════════════════════════════════════════════════════

        // Ebeveyn dışında çocuğu okuldan alabilecek kişiler
        Schema::create('authorized_pickups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->restrictOnDelete();
            $table->foreignId('family_profile_id')->constrained()->restrictOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone');
            $table->string('relation')->comment('Yakınlık derecesi: Teyze, Amca, Komşu vb.');
            $table->text('address')->nullable();
            $table->string('id_number')->nullable()->comment('TC/Kimlik No');
            $table->string('photo')->nullable()->comment('Fotoğraf URL');
            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['child_id', 'is_active']);
        });

        Schema::create('authorized_pickups_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════
        // 3️⃣ DİNAMİK RAPOR ŞABLON SİSTEMİ
        // ══════════════════════════════════════════════════════════════

        // Okullar kendi rapor şablonlarını oluşturur,
        // öğretmenler bu şablondaki inputları doldurur.

        // Rapor Şablonları (örn: "Günlük Değerlendirme", "Haftalık Gelişim")
        Schema::create('report_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->string('name')->comment('Rapor şablonu adı');
            $table->text('description')->nullable();
            $table->string('frequency')->default('daily')->comment('daily, weekly, monthly');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'is_active']);
        });

        Schema::create('report_templates_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Rapor Şablon Inputları (örn: "Ruh Hali", "İştah Durumu", "Uyku Süresi")
        Schema::create('report_template_inputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_template_id')->constrained()->restrictOnDelete();
            $table->string('label')->comment('Input etiketi: Ruh Hali, İştah Durumu vb.');
            $table->string('input_type')->default('text')->comment('text, number, select, rating, boolean, textarea');
            $table->json('options')->nullable()->comment('Select type için seçenekler JSON: ["Çok İyi","İyi","Orta","Kötü"]');
            $table->boolean('is_required')->default(false);
            $table->integer('sort_order')->default(0);
            $table->string('default_value')->nullable();

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('report_template_inputs_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Rapor Input Değerleri (Öğretmenlerin doldurduğu veriler)
        Schema::create('report_input_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_child_report_id')->constrained('daily_child_reports')->restrictOnDelete();
            $table->foreignId('report_template_input_id')->constrained('report_template_inputs')->restrictOnDelete();
            $table->text('value')->nullable()->comment('Doldurulan değer');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['daily_child_report_id', 'report_template_input_id'], 'unique_report_input_value');
        });

        Schema::create('report_input_values_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════
        // 4️⃣ OKUL/SINIF BAZLI ÖZEL ROL SİSTEMİ
        // ══════════════════════════════════════════════════════════════

        // Okul yöneticileri kendi okullarına özel roller oluşturabilir
        // ve bu rollere yetkiler atayabilir.
        Schema::create('school_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->restrictOnDelete()
                  ->comment('null ise okul geneli, dolu ise sınıfa özel rol');
            $table->string('name')->comment('Rol adı: Müdür Yardımcısı, Beslenme Sorumlusu vb.');
            $table->string('slug')->comment('Benzersiz teknik ad');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['school_id', 'slug', 'deleted_at'], 'unique_school_role_slug');
            $table->index(['school_id', 'is_active']);
        });

        Schema::create('school_roles_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Okul rolü izinleri
        Schema::create('school_role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_role_id')->constrained('school_roles')->cascadeOnDelete();
            $table->string('permission')->comment('İzin anahtarı: manage_meals, view_reports, manage_attendance vb.');

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['school_role_id', 'permission'], 'unique_role_permission');
        });

        Schema::create('school_role_permissions_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Kullanıcı-Okul Rol Atamaları
        Schema::create('school_user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('school_role_id')->constrained('school_roles')->restrictOnDelete();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->restrictOnDelete()
                  ->comment('Sınıf bazlı atama ise dolu');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'school_role_id', 'class_id', 'deleted_at'], 'unique_user_school_role');
            $table->index(['school_id', 'user_id']);
        });

        Schema::create('school_user_roles_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════
        // 5️⃣ GELİŞMİŞ BİLDİRİM SİSTEMİ
        // ══════════════════════════════════════════════════════════════

        Schema::create('system_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->restrictOnDelete();
            $table->string('type')->comment('event, activity, material, attendance, meal, homework, enrollment, announcement, payment');
            $table->string('title');
            $table->text('body');
            $table->string('action_type')->nullable()->comment('Model tipi: App\\Models\\Activity\\Event vb.');
            $table->unsignedBigInteger('action_id')->nullable()->comment('İlgili kaydın ID si');
            $table->string('priority')->default('normal')->comment('low, normal, high, urgent');
            $table->json('target_roles')->nullable()->comment('Hedef roller: ["parent","teacher"]');
            $table->json('target_user_ids')->nullable()->comment('Belirli kullanıcıların ID listesi');
            $table->timestamp('scheduled_at')->nullable()->comment('Zamanlanmış bildirim tarihi');
            $table->timestamp('sent_at')->nullable()->comment('Gönderilme tarihi');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'type']);
            $table->index(['type', 'sent_at']);
            $table->index('scheduled_at');
        });

        Schema::create('system_notifications_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Kullanıcı Bildirim Durumları
        Schema::create('notification_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('system_notifications')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->boolean('is_pushed')->default(false)->comment('Push notification gönderildi mi?');
            $table->timestamps();

            $table->unique(['notification_id', 'user_id']);
            $table->index(['user_id', 'is_read']);
        });

        // Bildirim Tercihleri
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('notification_type')->comment('event, material, homework, attendance vb.');
            $table->boolean('push_enabled')->default(true);
            $table->boolean('email_enabled')->default(false);
            $table->boolean('sms_enabled')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'notification_type']);
        });

        // ══════════════════════════════════════════════════════════════
        // 6️⃣ ÖDEV SİSTEMİ
        // ══════════════════════════════════════════════════════════════

        Schema::create('homework', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('homework')->comment('homework, after_school_activity');
            $table->date('assigned_date');
            $table->date('due_date')->nullable();
            $table->string('priority')->default('normal')->comment('low, normal, high');
            $table->json('attachments')->nullable()->comment('Ek dosya URL listesi');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'due_date']);
        });

        Schema::create('homework_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Ödev-Sınıf Ataması
        Schema::create('homework_class_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('homework_id')->constrained('homework')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['homework_id', 'class_id']);
        });

        // Ödev Tamamlama Durumu (Çocuk bazlı)
        Schema::create('homework_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('homework_id')->constrained('homework')->restrictOnDelete();
            $table->foreignId('child_id')->constrained('children')->restrictOnDelete();
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('marked_by')->nullable()->constrained('users')->restrictOnDelete();

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['homework_id', 'child_id']);
        });

        Schema::create('homework_completions_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════
        // 7️⃣ ETKİNLİK ÖDEME TAKİBİ
        // ══════════════════════════════════════════════════════════════

        Schema::create('event_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->restrictOnDelete();
            $table->foreignId('child_id')->constrained('children')->restrictOnDelete();
            $table->foreignId('family_profile_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('USD');
            $table->string('status')->default('pending')->comment('pending, paid, failed, refunded');
            $table->string('payment_provider')->nullable()->comment('stripe, iyzico vb.');
            $table->string('provider_payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['event_id', 'status']);
            $table->unique(['event_id', 'child_id'], 'unique_event_child_payment');
        });

        Schema::create('event_payments_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // Aktivite Ödemeleri (Ücretli aktiviteler için)
        Schema::create('activity_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->restrictOnDelete();
            $table->foreignId('child_id')->constrained('children')->restrictOnDelete();
            $table->foreignId('family_profile_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('USD');
            $table->string('status')->default('pending')->comment('pending, paid, failed, refunded');
            $table->string('payment_provider')->nullable();
            $table->string('provider_payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['activity_id', 'status']);
            $table->unique(['activity_id', 'child_id'], 'unique_activity_child_payment');
        });

        Schema::create('activity_payments_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════
        // 8️⃣ YEMEK MENÜSÜ GELİŞTİRMESİ — Malzeme-Alerjen İlişkisi
        // ══════════════════════════════════════════════════════════════

        // Yemek malzemesi-alerjen ilişkisi (malzeme alerjen içeriyorsa)
        Schema::create('food_ingredient_allergens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('food_ingredients')->cascadeOnDelete();
            $table->foreignId('allergen_id')->constrained('allergens')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['ingredient_id', 'allergen_id']);
        });

        // Günlük Yemek Menüsü — Sınıfa özel yemek ataması
        Schema::create('meal_menu_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->restrictOnDelete()
                  ->comment('null ise okul geneli, dolu ise sınıfa özel');
            $table->foreignId('meal_id')->constrained('meals')->restrictOnDelete();
            $table->date('menu_date')->comment('Menü tarihi');
            $table->string('schedule_type')->default('daily')->comment('daily, weekly, monthly');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'menu_date']);
            $table->index(['class_id', 'menu_date']);
        });

        Schema::create('meal_menu_schedules_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════
        // 9️⃣ MEVCUT TABLOLARI GELİŞTİRME
        // ══════════════════════════════════════════════════════════════

        // --- SCHOOLS: registration_code ekleniyor ---
        Schema::table('schools', function (Blueprint $table) {
            if (!Schema::hasColumn('schools', 'registration_code')) {
                $table->string('registration_code')->nullable()->unique()->after('code')
                      ->comment('Velilerin okulu bulmak için kullanacağı kayıt kodu');
            }
            if (!Schema::hasColumn('schools', 'description')) {
                $table->text('description')->nullable()->after('name')->comment('Okul açıklaması');
            }
            if (!Schema::hasColumn('schools', 'website')) {
                $table->string('website')->nullable()->after('email')->comment('Web sitesi');
            }
        });

        // --- CLASSES: Sınıf profili genişletmesi ---
        Schema::table('classes', function (Blueprint $table) {
            if (!Schema::hasColumn('classes', 'description')) {
                $table->text('description')->nullable()->after('name')->comment('Sınıf açıklaması');
            }
            if (!Schema::hasColumn('classes', 'age_group')) {
                $table->string('age_group')->nullable()->after('description')->comment('Yaş grubu: 3-4, 4-5, 5-6');
            }
        });

        // --- CLASS_TEACHER_ASSIGNMENTS: Öğretmen rolü ekleniyor ---
        // Not: Bu tablo henüz mevcut migration'da yok, oluşturulması gerekiyor
        if (!Schema::hasTable('class_teacher_assignments')) {
            Schema::create('class_teacher_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
                $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->restrictOnDelete();
                $table->string('role')->default('assistant_teacher')
                      ->comment('head_teacher, assistant_teacher, substitute_teacher');
                $table->timestamps();

                $table->unique(['class_id', 'teacher_profile_id']);
            });
        } else {
            Schema::table('class_teacher_assignments', function (Blueprint $table) {
                if (!Schema::hasColumn('class_teacher_assignments', 'role')) {
                    $table->string('role')->default('assistant_teacher')
                          ->comment('head_teacher, assistant_teacher, substitute_teacher')
                          ->after('teacher_profile_id');
                }
            });
        }

        // --- CHILDREN: Ek alanlar ---
        Schema::table('children', function (Blueprint $table) {
            if (!Schema::hasColumn('children', 'blood_type')) {
                $table->string('blood_type')->nullable()->after('gender')->comment('Kan grubu');
            }
            if (!Schema::hasColumn('children', 'enrollment_date')) {
                $table->date('enrollment_date')->nullable()->after('profile_photo')->comment('Kayıt tarihi');
            }
            if (!Schema::hasColumn('children', 'status')) {
                $table->string('status')->default('active')->after('enrollment_date')
                      ->comment('active, inactive, graduated, withdrawn');
            }
            if (!Schema::hasColumn('children', 'special_notes')) {
                $table->text('special_notes')->nullable()->after('status')
                      ->comment('Özel notlar: diyet, davranış vb.');
            }
        });

        // --- FAMILY_MEMBERS: İletişim bilgileri zorunluluğu ---
        Schema::table('family_members', function (Blueprint $table) {
            if (!Schema::hasColumn('family_members', 'first_name')) {
                $table->string('first_name')->nullable()->after('relation_type')->comment('Ad');
            }
            if (!Schema::hasColumn('family_members', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name')->comment('Soyad');
            }
            if (!Schema::hasColumn('family_members', 'phone')) {
                $table->string('phone')->nullable()->after('last_name')->comment('Telefon numarası');
            }
            if (!Schema::hasColumn('family_members', 'email')) {
                $table->string('email')->nullable()->after('phone')->comment('E-posta');
            }
            if (!Schema::hasColumn('family_members', 'address')) {
                $table->text('address')->nullable()->after('email')->comment('Adres');
            }
            if (!Schema::hasColumn('family_members', 'is_emergency_contact')) {
                $table->boolean('is_emergency_contact')->default(false)->after('address')
                      ->comment('Acil durumda aranacak mı?');
            }
            if (!Schema::hasColumn('family_members', 'is_primary')) {
                $table->boolean('is_primary')->default(false)->after('is_emergency_contact')
                      ->comment('Birincil iletişim mi? (Anne/Baba)');
            }
        });

        // --- CHILD_MATERIAL_TRACKINGS: Temin durumu ---
        Schema::table('child_material_trackings', function (Blueprint $table) {
            if (!Schema::hasColumn('child_material_trackings', 'is_provided')) {
                $table->boolean('is_provided')->default(false)->after('material_id')
                      ->comment('Materyal temin edildi mi?');
            }
            if (!Schema::hasColumn('child_material_trackings', 'provided_at')) {
                $table->timestamp('provided_at')->nullable()->after('is_provided')
                      ->comment('Temin edilme tarihi');
            }
            if (!Schema::hasColumn('child_material_trackings', 'notes')) {
                $table->text('notes')->nullable()->after('provided_at')
                      ->comment('Not');
            }
        });

        // --- ACTIVITIES: Genişletme ---
        Schema::table('activities', function (Blueprint $table) {
            if (!Schema::hasColumn('activities', 'class_id')) {
                $table->foreignId('class_id')->nullable()->after('school_id')
                      ->constrained('classes')->restrictOnDelete()
                      ->comment('null ise okul geneli, dolu ise sınıfa özel');
            }
            if (!Schema::hasColumn('activities', 'activity_type')) {
                $table->string('activity_type')->default('general')->after('name')
                      ->comment('general, workshop, trip, sports, art');
            }
            if (!Schema::hasColumn('activities', 'start_date')) {
                $table->dateTime('start_date')->nullable()->after('price')
                      ->comment('Başlangıç tarihi');
            }
            if (!Schema::hasColumn('activities', 'end_date')) {
                $table->dateTime('end_date')->nullable()->after('start_date')
                      ->comment('Bitiş tarihi');
            }
            if (!Schema::hasColumn('activities', 'location')) {
                $table->string('location')->nullable()->after('end_date')
                      ->comment('Mekan/Konum');
            }
            if (!Schema::hasColumn('activities', 'max_participants')) {
                $table->integer('max_participants')->nullable()->after('location')
                      ->comment('Maksimum katılımcı');
            }
            if (!Schema::hasColumn('activities', 'status')) {
                $table->string('status')->default('upcoming')->after('max_participants')
                      ->comment('upcoming, ongoing, completed, cancelled');
            }
        });

        // --- EVENTS: Genişletme ---
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'class_id')) {
                $table->foreignId('class_id')->nullable()->after('school_id')
                      ->constrained('classes')->restrictOnDelete()
                      ->comment('null ise okul geneli, dolu ise sınıfa özel');
            }
            if (!Schema::hasColumn('events', 'event_type')) {
                $table->string('event_type')->default('general')->after('title')
                      ->comment('general, celebration, meeting, trip, sports_day, graduation');
            }
            if (!Schema::hasColumn('events', 'location')) {
                $table->string('location')->nullable()->after('price')
                      ->comment('Mekan');
            }
            if (!Schema::hasColumn('events', 'start_time')) {
                $table->time('start_time')->nullable()->after('location')
                      ->comment('Başlangıç saati');
            }
            if (!Schema::hasColumn('events', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time')
                      ->comment('Bitiş saati');
            }
            if (!Schema::hasColumn('events', 'max_participants')) {
                $table->integer('max_participants')->nullable()->after('end_time')
                      ->comment('Maksimum katılımcı');
            }
            if (!Schema::hasColumn('events', 'status')) {
                $table->string('status')->default('upcoming')->after('max_participants')
                      ->comment('upcoming, ongoing, completed, cancelled');
            }
            if (!Schema::hasColumn('events', 'currency')) {
                $table->string('currency')->default('USD')->after('price');
            }
        });

        // --- MATERIALS: Genişletme ---
        Schema::table('materials', function (Blueprint $table) {
            if (!Schema::hasColumn('materials', 'class_id')) {
                $table->foreignId('class_id')->nullable()->after('school_id')
                      ->constrained('classes')->restrictOnDelete()
                      ->comment('null ise okul geneli, dolu ise sınıfa özel');
            }
            if (!Schema::hasColumn('materials', 'due_date')) {
                $table->date('due_date')->nullable()->after('description')
                      ->comment('Son teslim tarihi');
            }
            if (!Schema::hasColumn('materials', 'quantity')) {
                $table->integer('quantity')->default(1)->after('due_date')
                      ->comment('Gereken adet');
            }
            if (!Schema::hasColumn('materials', 'category')) {
                $table->string('category')->nullable()->after('quantity')
                      ->comment('Kategori: kırtasiye, giyim, temizlik vb.');
            }
        });

        // --- DAILY_CHILD_REPORTS: Sınıf ve şablon ilişkisi ---
        Schema::table('daily_child_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('daily_child_reports', 'class_id')) {
                $table->foreignId('class_id')->nullable()->after('child_id')
                      ->constrained('classes')->restrictOnDelete();
            }
            if (!Schema::hasColumn('daily_child_reports', 'report_template_id')) {
                $table->foreignId('report_template_id')->nullable()->after('class_id')
                      ->constrained('report_templates')->restrictOnDelete()
                      ->comment('Kullanılan rapor şablonu');
            }
        });

        // --- ATTENDANCES: Giriş/çıkış saati ---
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'check_in_time')) {
                $table->time('check_in_time')->nullable()->after('status')
                      ->comment('Okula geliş saati');
            }
            if (!Schema::hasColumn('attendances', 'check_out_time')) {
                $table->time('check_out_time')->nullable()->after('check_in_time')
                      ->comment('Okuldan ayrılma saati');
            }
            if (!Schema::hasColumn('attendances', 'notes')) {
                $table->text('notes')->nullable()->after('check_out_time')
                      ->comment('Yoklama notu');
            }
            if (!Schema::hasColumn('attendances', 'picked_up_by')) {
                $table->foreignId('picked_up_by')->nullable()->after('notes')
                      ->constrained('authorized_pickups')->nullOnDelete()
                      ->comment('Çocuğu alan yetkili kişi');
            }
        });

        // --- MEALS: Menü detayları ---
        Schema::table('meals', function (Blueprint $table) {
            if (!Schema::hasColumn('meals', 'description')) {
                $table->text('description')->nullable()->after('name')
                      ->comment('Yemek açıklaması');
            }
            if (!Schema::hasColumn('meals', 'image')) {
                $table->string('image')->nullable()->after('meal_type')
                      ->comment('Yemek görseli URL');
            }
            if (!Schema::hasColumn('meals', 'calories')) {
                $table->integer('calories')->nullable()->after('image')
                      ->comment('Kalori miktarı');
            }
        });

        // --- CHILD_ACTIVITY_ENROLLMENTS: Durum ekleme ---
        Schema::table('child_activity_enrollments', function (Blueprint $table) {
            if (!Schema::hasColumn('child_activity_enrollments', 'status')) {
                $table->string('status')->default('enrolled')->after('activity_id')
                      ->comment('enrolled, completed, withdrawn');
            }
            if (!Schema::hasColumn('child_activity_enrollments', 'enrolled_at')) {
                $table->timestamp('enrolled_at')->nullable()->after('status');
            }
        });

        // --- CHILD_EVENT_PARTICIPATIONS: Durum ekleme ---
        Schema::table('child_event_participations', function (Blueprint $table) {
            if (!Schema::hasColumn('child_event_participations', 'status')) {
                $table->string('status')->default('registered')->after('event_id')
                      ->comment('registered, attended, absent, cancelled');
            }
            if (!Schema::hasColumn('child_event_participations', 'payment_required')) {
                $table->boolean('payment_required')->default(false)->after('status');
            }
            if (!Schema::hasColumn('child_event_participations', 'payment_completed')) {
                $table->boolean('payment_completed')->default(false)->after('payment_required');
            }
        });

        // ══════════════════════════════════════════════════════════════
        // 🔟 ÇOCUK FİYATLANDIRMA AYAR TABLOSU
        // ══════════════════════════════════════════════════════════════

        // Çocuk sayısına göre indirim ayarları (admin tarafından yönetilir)
        Schema::create('child_pricing_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained()->restrictOnDelete()
                  ->comment('null ise platform geneli');
            $table->integer('child_order')->comment('Kaçıncı çocuk: 1, 2, 3...');
            $table->decimal('price', 10, 2)->comment('Bu sıradaki çocuğun fiyatı (USD)');
            $table->decimal('discount_percentage', 5, 2)->default(0)
                  ->comment('İndirim yüzdesi');
            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['school_id', 'child_order', 'deleted_at'], 'unique_child_pricing');
        });

        Schema::create('child_pricing_settings_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════
        // 1️⃣1️⃣ DUYURU SİSTEMİ
        // ══════════════════════════════════════════════════════════════

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->restrictOnDelete()
                  ->comment('null ise okul geneli, dolu ise sınıfa özel');
            $table->string('title');
            $table->text('body');
            $table->string('type')->default('general')->comment('general, urgent, reminder');
            $table->boolean('is_pinned')->default(false)->comment('Sabit duyuru mu?');
            $table->timestamp('publish_at')->nullable()->comment('Yayınlanma tarihi');
            $table->timestamp('expire_at')->nullable()->comment('Bitiş tarihi');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'type']);
        });

        Schema::create('announcements_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // History tabloları (ters sırada)
        Schema::dropIfExists('announcements_histories');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('child_pricing_settings_histories');
        Schema::dropIfExists('child_pricing_settings');

        // Mevcut tablo değişikliklerinin geri alınması
        Schema::table('child_event_participations', function (Blueprint $table) {
            $table->dropColumn(['status', 'payment_required', 'payment_completed']);
        });
        Schema::table('child_activity_enrollments', function (Blueprint $table) {
            $table->dropColumn(['status', 'enrolled_at']);
        });
        Schema::table('meals', function (Blueprint $table) {
            $table->dropColumn(['description', 'image', 'calories']);
        });
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['picked_up_by']);
            $table->dropColumn(['check_in_time', 'check_out_time', 'notes', 'picked_up_by']);
        });
        Schema::table('daily_child_reports', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropForeign(['report_template_id']);
            $table->dropColumn(['class_id', 'report_template_id']);
        });
        Schema::table('materials', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropColumn(['class_id', 'due_date', 'quantity', 'category']);
        });
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropColumn(['class_id', 'event_type', 'location', 'start_time', 'end_time', 'max_participants', 'status', 'currency']);
        });
        Schema::table('activities', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropColumn(['class_id', 'activity_type', 'start_date', 'end_date', 'location', 'max_participants', 'status']);
        });
        Schema::table('child_material_trackings', function (Blueprint $table) {
            $table->dropColumn(['is_provided', 'provided_at', 'notes']);
        });
        Schema::table('family_members', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'phone', 'email', 'address', 'is_emergency_contact', 'is_primary']);
        });
        Schema::table('children', function (Blueprint $table) {
            $table->dropColumn(['blood_type', 'enrollment_date', 'status', 'special_notes']);
        });
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['description', 'age_group']);
        });
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['registration_code', 'description', 'website']);
        });

        // Yeni tablolar
        Schema::dropIfExists('activity_payments_histories');
        Schema::dropIfExists('activity_payments');
        Schema::dropIfExists('event_payments_histories');
        Schema::dropIfExists('event_payments');
        Schema::dropIfExists('meal_menu_schedules_histories');
        Schema::dropIfExists('meal_menu_schedules');
        Schema::dropIfExists('food_ingredient_allergens');
        Schema::dropIfExists('homework_completions_histories');
        Schema::dropIfExists('homework_completions');
        Schema::dropIfExists('homework_class_assignments');
        Schema::dropIfExists('homework_histories');
        Schema::dropIfExists('homework');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notification_user');
        Schema::dropIfExists('system_notifications_histories');
        Schema::dropIfExists('system_notifications');
        Schema::dropIfExists('school_user_roles_histories');
        Schema::dropIfExists('school_user_roles');
        Schema::dropIfExists('school_role_permissions_histories');
        Schema::dropIfExists('school_role_permissions');
        Schema::dropIfExists('school_roles_histories');
        Schema::dropIfExists('school_roles');
        Schema::dropIfExists('report_input_values_histories');
        Schema::dropIfExists('report_input_values');
        Schema::dropIfExists('report_template_inputs_histories');
        Schema::dropIfExists('report_template_inputs');
        Schema::dropIfExists('report_templates_histories');
        Schema::dropIfExists('report_templates');
        Schema::dropIfExists('authorized_pickups_histories');
        Schema::dropIfExists('authorized_pickups');
        Schema::dropIfExists('school_enrollment_requests_histories');
        Schema::dropIfExists('school_enrollment_requests');
    }
};
