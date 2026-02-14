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
    | Bu dosya Gelişmiş Özellikler modülünü içerir.
    | 1. Veli Okul Kayıt Talebi (school_enrollment_requests)
    | 2. Yetkili Alıcı (authorized_pickups)
    | 3. Dinamik Rapor Şablonları (report_templates, report_template_inputs, report_input_values)
    | 4. Özel Okul/Sınıf Rolleri (school_roles, school_role_permissions, school_user_roles)
    | 5. Gelişmiş Bildirim Sistemi (system_notifications, notification_user, notification_preferences)
    | 6. Ödev Yönetimi (homework, homework_class_assignments, homework_completions)
    | 7. Etkinlik/Aktivite Ödeme Takibi (event_payments, activity_payments)
    | 8. Yemek Menü Takvimi (meal_menu_schedules)
    | 9. Çocuk Fiyatlandırma Ayarları (child_pricing_settings)
    | 10. Duyurular (announcements)
    | 11. Mevcut tablolara eklenen alanlar (schools, children, events, activities)
    |--------------------------------------------------------------------------
    */

    public function up(): void
    {
        /*
        |------------------------------------------------------------------
        | 1. Mevcut Tablo Güncellemeleri
        |------------------------------------------------------------------
        */

        // Schools tablosuna yeni alanlar ekle
        Schema::table('schools', function (Blueprint $table) {
            $table->string('registration_code', 20)->unique()->nullable()->after('code')
                  ->comment('Velilerin okul araması için benzersiz kayıt kodu');
            $table->text('description')->nullable()->after('name')
                  ->comment('Okul açıklaması');
            $table->string('website')->nullable()->after('email')
                  ->comment('Okul web sitesi');
        });

        // Children tablosuna yeni alanlar ekle
        Schema::table('children', function (Blueprint $table) {
            $table->string('blood_type', 5)->nullable()->after('gender')
                  ->comment('Kan grubu: A+, A-, B+, B-, AB+, AB-, 0+, 0-');
            $table->date('enrollment_date')->nullable()->after('profile_photo')
                  ->comment('Okula kayıt tarihi');
            $table->string('status', 20)->default('active')->after('enrollment_date')
                  ->comment('Durum: active, inactive, graduated, transferred');
            $table->text('special_notes')->nullable()->after('status')
                  ->comment('Özel notlar');
        });

        // Events tablosuna ödeme ile ilgili alanlar ekle
        Schema::table('events', function (Blueprint $table) {
            $table->decimal('fee', 10, 2)->default(0)->after('location')
                  ->comment('Etkinlik ücreti');
            $table->string('currency', 3)->default('USD')->after('fee')
                  ->comment('Para birimi');
            $table->boolean('payment_required')->default(false)->after('currency')
                  ->comment('Ödeme gerekli mi?');
        });

        // Activities tablosuna ödeme ile ilgili alanlar ekle
        Schema::table('activities', function (Blueprint $table) {
            $table->decimal('fee', 10, 2)->default(0)->after('description')
                  ->comment('Aktivite ücreti');
            $table->string('currency', 3)->default('USD')->after('fee')
                  ->comment('Para birimi');
            $table->boolean('payment_required')->default(false)->after('currency')
                  ->comment('Ödeme gerekli mi?');
        });

        /*
        |------------------------------------------------------------------
        | 2. Veli Okul Kayıt Talebi
        |------------------------------------------------------------------
        */
        Schema::create('school_enrollment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade')
                  ->comment('Kayıt talebi yapılan okul');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')
                  ->comment('Kayıt talebi yapan veli (user)');
            $table->foreignId('family_profile_id')->nullable()->constrained('family_profiles')->onDelete('set null')
                  ->comment('İlişkili aile profili');
            $table->string('status', 20)->default('pending')
                  ->comment('pending, approved, rejected');
            $table->text('message')->nullable()
                  ->comment('Velinin mesajı');
            $table->text('rejection_reason')->nullable()
                  ->comment('Red sebebi');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null')
                  ->comment('İnceleyen yönetici');
            $table->timestamp('reviewed_at')->nullable()
                  ->comment('İnceleme tarihi');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'status']);
            $table->index(['user_id', 'status']);
        });

        /*
        |------------------------------------------------------------------
        | 3. Yetkili Alıcı (Authorized Pickup)
        |------------------------------------------------------------------
        */
        Schema::create('authorized_pickups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade')
                  ->comment('İlgili çocuk');
            $table->foreignId('family_profile_id')->constrained('family_profiles')->onDelete('cascade')
                  ->comment('İlgili aile profili');
            $table->string('first_name', 100)->comment('Ad');
            $table->string('last_name', 100)->comment('Soyad');
            $table->string('phone', 20)->comment('Telefon (zorunlu)');
            $table->string('relation', 50)->comment('Yakınlık derecesi (amca, yenge, komşu vb.)');
            $table->string('address', 500)->comment('Adres (zorunlu)');
            $table->string('id_number', 20)->nullable()->comment('Kimlik numarası');
            $table->string('photo')->nullable()->comment('Fotoğraf');
            $table->boolean('is_active')->default(true)->comment('Aktif mi?');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['child_id', 'is_active']);
            $table->index('family_profile_id');
        });

        /*
        |------------------------------------------------------------------
        | 4. Dinamik Rapor Şablonları
        |------------------------------------------------------------------
        */
        Schema::create('report_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade')
                  ->comment('Şablona sahip okul');
            $table->string('name', 200)->comment('Şablon adı');
            $table->text('description')->nullable()->comment('Açıklama');
            $table->string('frequency', 20)->default('daily')
                  ->comment('daily, weekly, monthly');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'is_active']);
        });

        Schema::create('report_template_inputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_template_id')->constrained('report_templates')->onDelete('cascade')
                  ->comment('Bağlı olduğu şablon');
            $table->string('label', 200)->comment('Input etiketi (Mood, Yemek, Uyku Süresi vb.)');
            $table->string('input_type', 30)->default('text')
                  ->comment('text, number, select, rating, boolean, textarea');
            $table->json('options')->nullable()
                  ->comment('Select tipi için seçenekler JSON');
            $table->boolean('is_required')->default(false);
            $table->integer('sort_order')->default(0);
            $table->string('default_value', 500)->nullable()->comment('Varsayılan değer');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('report_template_id');
        });

        Schema::create('report_input_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_child_report_id')->constrained('daily_child_reports')->onDelete('cascade')
                  ->comment('Bağlı olduğu günlük rapor');
            $table->foreignId('report_template_input_id')->constrained('report_template_inputs')->onDelete('cascade')
                  ->comment('Bağlı olduğu input tanımı');
            $table->text('value')->nullable()->comment('Doldurulan değer');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['daily_child_report_id', 'report_template_input_id'], 'report_value_unique');
        });

        // daily_child_reports tablosuna report_template_id ekle
        Schema::table('daily_child_reports', function (Blueprint $table) {
            $table->foreignId('report_template_id')->nullable()->after('class_id')
                  ->constrained('report_templates')->onDelete('set null')
                  ->comment('Kullanılan rapor şablonu');
        });

        /*
        |------------------------------------------------------------------
        | 5. Özel Okul/Sınıf Rolleri
        |------------------------------------------------------------------
        */
        Schema::create('school_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade')
                  ->comment('Okulun rolü');
            $table->foreignId('class_id')->nullable()->constrained('classes')->onDelete('cascade')
                  ->comment('Null ise okul geneli, dolu ise sınıfa özel');
            $table->string('name', 100)->comment('Rol adı (Müdür Yardımcısı, Beslenme Sorumlusu vb.)');
            $table->string('slug', 100)->nullable()->comment('URL-friendly isim');
            $table->text('description')->nullable()->comment('Rol açıklaması');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'is_active']);
            $table->index('class_id');
        });

        Schema::create('school_role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_role_id')->constrained('school_roles')->onDelete('cascade')
                  ->comment('Bağlı olduğu rol');
            $table->string('permission', 100)
                  ->comment('İzin anahtarı: manage_meals, view_reports, manage_attendance vb.');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['school_role_id', 'permission']);
        });

        Schema::create('school_user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')
                  ->comment('Rol atanan kullanıcı');
            $table->foreignId('school_role_id')->constrained('school_roles')->onDelete('cascade')
                  ->comment('Atanan rol');
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade')
                  ->comment('Hangi okula ait atama');
            $table->foreignId('class_id')->nullable()->constrained('classes')->onDelete('cascade')
                  ->comment('Null ise okul geneli, dolu ise sınıf bazlı');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['user_id', 'school_role_id', 'school_id', 'class_id'], 'user_school_role_unique');
        });

        /*
        |------------------------------------------------------------------
        | 6. Gelişmiş Bildirim Sistemi
        |------------------------------------------------------------------
        */
        Schema::create('system_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained('schools')->onDelete('cascade')
                  ->comment('İlgili okul');
            $table->foreignId('class_id')->nullable()->constrained('classes')->onDelete('cascade')
                  ->comment('İlgili sınıf');
            $table->string('type', 50)
                  ->comment('event, activity, material, attendance, meal, homework, announcement, general');
            $table->string('title', 255)->comment('Bildirim başlığı');
            $table->text('body')->comment('Bildirim içeriği');
            $table->string('action_type', 100)->nullable()
                  ->comment('Polymorphic model tipi');
            $table->unsignedBigInteger('action_id')->nullable()
                  ->comment('Polymorphic model ID');
            $table->string('priority', 10)->default('normal')
                  ->comment('low, normal, high, urgent');
            $table->json('target_roles')->nullable()
                  ->comment('Hedef roller (JSON array)');
            $table->json('target_user_ids')->nullable()
                  ->comment('Hedef kullanıcı IDleri (JSON array)');
            $table->timestamp('scheduled_at')->nullable()
                  ->comment('Zamanlanmış gönderim tarihi');
            $table->timestamp('sent_at')->nullable()
                  ->comment('Gönderim tarihi');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'type']);
            $table->index('scheduled_at');
            $table->index('sent_at');
        });

        // Bildirim-Kullanıcı pivot tablosu (okundu/okunmadı)
        Schema::create('notification_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('system_notifications')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->boolean('is_pushed')->default(false)
                  ->comment('Push notification gönderildi mi?');
            $table->timestamps();

            $table->unique(['notification_id', 'user_id']);
            $table->index(['user_id', 'is_read']);
        });

        // Bildirim Tercihleri
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('notification_type', 50)
                  ->comment('Bildirim türü (event, material, attendance vb.)');
            $table->boolean('push_enabled')->default(true);
            $table->boolean('email_enabled')->default(false);
            $table->boolean('sms_enabled')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'notification_type']);
        });

        /*
        |------------------------------------------------------------------
        | 7. Ödev Yönetimi
        |------------------------------------------------------------------
        */
        Schema::create('homework', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->onDelete('set null');
            $table->string('title', 255)->comment('Ödev başlığı');
            $table->text('description')->nullable()->comment('Açıklama');
            $table->string('type', 30)->default('homework')
                  ->comment('homework, after_school_activity');
            $table->date('assigned_date')->comment('Atama tarihi');
            $table->date('due_date')->comment('Teslim tarihi');
            $table->string('priority', 10)->default('normal')
                  ->comment('low, normal, high');
            $table->json('attachments')->nullable()
                  ->comment('Ek dosyalar (JSON)');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'type']);
            $table->index('due_date');
        });

        // Ödev-Sınıf Ataması
        Schema::create('homework_class_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('homework_id')->constrained('homework')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['homework_id', 'class_id']);
        });

        // Ödev Tamamlama Durumu
        Schema::create('homework_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('homework_id')->constrained('homework')->onDelete('cascade');
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('marked_by')->nullable()->constrained('users')->onDelete('set null')
                  ->comment('İşaretleyen öğretmen');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['homework_id', 'child_id']);
        });

        /*
        |------------------------------------------------------------------
        | 8. Etkinlik/Aktivite Ödeme Takibi
        |------------------------------------------------------------------
        */
        Schema::create('event_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->foreignId('family_profile_id')->constrained('family_profiles')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('status', 20)->default('pending')
                  ->comment('pending, paid, refunded, cancelled');
            $table->string('payment_provider', 50)->nullable()
                  ->comment('Ödeme sağlayıcı (stripe, paypal vb.)');
            $table->string('provider_payment_id', 100)->nullable()
                  ->comment('Ödeme sağlayıcı işlem ID');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['event_id', 'status']);
            $table->index('family_profile_id');
        });

        Schema::create('activity_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->foreignId('family_profile_id')->constrained('family_profiles')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('status', 20)->default('pending')
                  ->comment('pending, paid, refunded, cancelled');
            $table->string('payment_provider', 50)->nullable();
            $table->string('provider_payment_id', 100)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['activity_id', 'status']);
            $table->index('family_profile_id');
        });

        /*
        |------------------------------------------------------------------
        | 9. Yemek Menü Takvimi
        |------------------------------------------------------------------
        */
        Schema::create('meal_menu_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignId('class_id')->nullable()->constrained('classes')->onDelete('cascade')
                  ->comment('Null ise okul geneli, dolu ise sınıfa özel');
            $table->foreignId('meal_id')->constrained('meals')->onDelete('cascade');
            $table->date('menu_date')->comment('Menü tarihi');
            $table->string('schedule_type', 20)->default('daily')
                  ->comment('daily, weekly, monthly');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['school_id', 'menu_date']);
            $table->index(['class_id', 'menu_date']);
        });

        /*
        |------------------------------------------------------------------
        | 10. Çocuk Fiyatlandırma Ayarları
        |------------------------------------------------------------------
        */
        Schema::create('child_pricing_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained('schools')->onDelete('cascade')
                  ->comment('Null ise platform geneli, dolu ise okula özel');
            $table->integer('child_order')->comment('Kaçıncı çocuk (1, 2, 3...)');
            $table->decimal('price', 10, 2)->comment('Ücret');
            $table->decimal('discount_percentage', 5, 2)->default(0)
                  ->comment('İndirim yüzdesi');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['school_id', 'child_order']);
        });

        /*
        |------------------------------------------------------------------
        | 11. Duyurular
        |------------------------------------------------------------------
        */
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignId('class_id')->nullable()->constrained('classes')->onDelete('cascade')
                  ->comment('Null ise okul geneli, dolu ise sınıfa özel');
            $table->string('title', 255)->comment('Duyuru başlığı');
            $table->text('body')->comment('Duyuru içeriği');
            $table->string('type', 20)->default('general')
                  ->comment('general, urgent, event, homework');
            $table->boolean('is_pinned')->default(false)
                  ->comment('Sabitlenmiş duyuru');
            $table->timestamp('publish_at')->nullable()
                  ->comment('Yayın tarihi (zamanlanmış)');
            $table->timestamp('expire_at')->nullable()
                  ->comment('Bitiş tarihi');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'type']);
            $table->index('class_id');
            $table->index('publish_at');
        });

        /*
        |------------------------------------------------------------------
        | 12. Event/Activity Pivotlarına Ödeme Alanları Ekle
        |------------------------------------------------------------------
        */
        Schema::table('child_event_participations', function (Blueprint $table) {
            $table->string('status', 20)->default('registered')->after('event_id')
                  ->comment('registered, attended, absent, cancelled');
            $table->boolean('payment_required')->default(false)->after('status');
            $table->boolean('payment_completed')->default(false)->after('payment_required');
        });

        Schema::table('child_activity_enrollments', function (Blueprint $table) {
            $table->string('status', 20)->default('enrolled')->after('activity_id')
                  ->comment('enrolled, active, completed, withdrawn');
            $table->timestamp('enrolled_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        // Pivot tablo alanlarını kaldır
        Schema::table('child_activity_enrollments', function (Blueprint $table) {
            $table->dropColumn(['status', 'enrolled_at']);
        });

        Schema::table('child_event_participations', function (Blueprint $table) {
            $table->dropColumn(['status', 'payment_required', 'payment_completed']);
        });

        // Yeni tabloları kaldır
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('child_pricing_settings');
        Schema::dropIfExists('meal_menu_schedules');
        Schema::dropIfExists('activity_payments');
        Schema::dropIfExists('event_payments');
        Schema::dropIfExists('homework_completions');
        Schema::dropIfExists('homework_class_assignments');
        Schema::dropIfExists('homework');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notification_user');
        Schema::dropIfExists('system_notifications');
        Schema::dropIfExists('school_user_roles');
        Schema::dropIfExists('school_role_permissions');
        Schema::dropIfExists('school_roles');

        // daily_child_reports'tan report_template_id kaldır
        Schema::table('daily_child_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('report_template_id');
        });

        Schema::dropIfExists('report_input_values');
        Schema::dropIfExists('report_template_inputs');
        Schema::dropIfExists('report_templates');
        Schema::dropIfExists('authorized_pickups');
        Schema::dropIfExists('school_enrollment_requests');

        // Mevcut tablolardan eklenen alanları kaldır
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['fee', 'currency', 'payment_required']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['fee', 'currency', 'payment_required']);
        });

        Schema::table('children', function (Blueprint $table) {
            $table->dropColumn(['blood_type', 'enrollment_date', 'status', 'special_notes']);
        });

        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['registration_code', 'description', 'website']);
        });
    }
};
