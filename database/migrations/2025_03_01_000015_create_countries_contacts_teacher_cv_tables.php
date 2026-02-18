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
    | Bu migration 3 modülü kapsar:
    |
    | 1. ÜLKELER MODÜlÜ (countries)
    |    - RestCountries API'den çekilen global ülke verileri
    |    - Ülke kodu, para birimi, GSM kodu, dil, bayrak vs.
    |
    | 2. KULLANICI EK İLETİŞİM NUMARALARI (user_contact_numbers)
    |    - WhatsApp, Telegram, Signal vb. ek numara girişi
    |    - Ülke kodu bağlantısı (country_id)
    |
    | 3. ÖĞRETMEN PROFESYonel PROFİLİ
    |    - teacher_educations: Eğitim geçmişi
    |    - teacher_certificates: Sertifikalar (onay gerektirir)
    |    - teacher_courses: Kurs ve seminer katılımları (onay gerektirir)
    |    - teacher_skills: Yetenekler ve uzmanlık alanları
    |    - Onay sistemi: pending → approved / rejected
    */

    public function up(): void
    {
        // ═══════════════════════════════════════════════════════
        // 1. ÜLKELER MODÜLÜ
        // ═══════════════════════════════════════════════════════

        Schema::create('countries', function (Blueprint $table) {
            $table->id();

            // Temel tanımlayıcılar
            $table->string('name');                             // Common name (örn: Turkey)
            $table->string('official_name')->nullable();        // Official name (örn: Republic of Turkey)
            $table->string('native_name')->nullable();          // Yerel isim (örn: Türkiye)
            $table->char('iso2', 2)->unique();                  // ISO 3166-1 alpha-2 (TR)
            $table->char('iso3', 3)->unique();                  // ISO 3166-1 alpha-3 (TUR)
            $table->string('numeric_code', 3)->nullable();      // ISO 3166-1 numeric (792)

            // Telefon / GSM
            $table->string('phone_code', 10)->nullable();       // +90
            $table->string('phone_root', 5)->nullable();        // +9
            $table->json('phone_suffixes')->nullable();          // ["0"]

            // Para birimi
            $table->string('currency_code', 10)->nullable();    // TRY
            $table->string('currency_name', 100)->nullable();   // Turkish lira
            $table->string('currency_symbol', 10)->nullable();  // ₺

            // Coğrafya & Bölge
            $table->string('region', 50)->nullable();           // Asia
            $table->string('subregion', 80)->nullable();        // Western Asia
            $table->string('capital', 100)->nullable();         // Ankara
            $table->json('continents')->nullable();              // ["Europe","Asia"]
            $table->json('timezones')->nullable();               // ["UTC+03:00"]
            $table->decimal('latitude', 10, 7)->nullable();     // 39.0
            $table->decimal('longitude', 10, 7)->nullable();    // 35.0

            // Dil
            $table->json('languages')->nullable();               // {"tur":"Turkish"}

            // Görsel
            $table->string('flag_emoji', 10)->nullable();       // 🇹🇷
            $table->string('flag_png')->nullable();              // https://flagcdn.com/w320/tr.png
            $table->string('flag_svg')->nullable();              // https://flagcdn.com/tr.svg

            // Nüfus & Durum
            $table->unsignedBigInteger('population')->default(0);
            $table->boolean('is_active')->default(true);         // Sistemde kullanılabilir mi?
            $table->unsignedSmallInteger('sort_order')->default(0); // Önem sırasına göre (TR, US vb. üste)

            // İleride eklenecek veriler için
            $table->json('extra_data')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // İndeksler
            $table->index('phone_code');
            $table->index('currency_code');
            $table->index('region');
            $table->index('is_active');
            $table->index('sort_order');
        });

        // ═══════════════════════════════════════════════════════
        // 2. KULLANICI EK İLETİŞİM NUMARALARI
        // ═══════════════════════════════════════════════════════

        Schema::create('user_contact_numbers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('country_id')->nullable()->constrained('countries')->nullOnDelete();

            // İletişim bilgileri
            $table->string('type', 30);                 // whatsapp, telegram, signal, viber, line, other
            $table->string('label', 50)->nullable();    // Kişisel, İş, Ev vb.
            $table->string('phone_code', 10);           // +90
            $table->string('number', 30);               // 5551234567
            $table->string('full_number', 40)->nullable(); // +905551234567 (computed/stored)
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // İndeksler
            $table->index(['user_id', 'type']);
            $table->index('full_number');
        });

        // ═══════════════════════════════════════════════════════
        // 3. ÖĞRETMEN EĞİTİM GEÇMİŞİ
        // ═══════════════════════════════════════════════════════

        Schema::create('teacher_educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->restrictOnDelete();

            // Eğitim bilgileri
            $table->string('institution');               // Üniversite/Okul adı
            $table->string('degree');                    // Lisans, Yüksek Lisans, Doktora vb.
            $table->string('field_of_study');            // Okuduğu bölüm/alan
            $table->date('start_date');
            $table->date('end_date')->nullable();         // Devam ediyorsa null
            $table->boolean('is_current')->default(false);
            $table->decimal('gpa', 4, 2)->nullable();    // Not ortalaması
            $table->text('description')->nullable();     // Ek açıklama
            $table->foreignId('country_id')->nullable()->constrained('countries')->nullOnDelete();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('teacher_profile_id');
        });

        // ═══════════════════════════════════════════════════════
        // 4. ÖĞRETMEN SERTİFİKALARI (Onay gerektirir)
        // ═══════════════════════════════════════════════════════

        Schema::create('teacher_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->restrictOnDelete();

            // Sertifika bilgileri
            $table->string('name');                      // Sertifika adı
            $table->string('issuing_organization');      // Veren kurum
            $table->date('issue_date');                   // Veriliş tarihi
            $table->date('expiry_date')->nullable();     // Son geçerlilik (null = süresiz)
            $table->string('credential_id')->nullable(); // Sertifika numarası
            $table->string('credential_url')->nullable();// Doğrulama linki
            $table->string('file_path')->nullable();     // Yüklenen dosya
            $table->text('description')->nullable();

            // Onay sistemi
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['teacher_profile_id', 'approval_status']);
        });

        // ═══════════════════════════════════════════════════════
        // 5. ÖĞRETMEN KURS & SEMİNER KATILIMI (Onay gerektirir)
        // ═══════════════════════════════════════════════════════

        Schema::create('teacher_courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->restrictOnDelete();

            // Kurs / Seminer bilgileri
            $table->string('title');                     // Kurs/Seminer adı
            $table->enum('type', ['course', 'seminar', 'workshop', 'conference', 'training', 'webinar', 'other'])->default('course');
            $table->string('provider');                  // Düzenleyen kurum/organizasyon
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('duration_hours')->nullable();  // Toplam süre (saat)
            $table->string('location')->nullable();      // Konum (online/fiziksel)
            $table->boolean('is_online')->default(false);
            $table->string('certificate_file')->nullable(); // Katılım belgesi dosyası
            $table->string('certificate_url')->nullable();  // Online doğrulama linki
            $table->text('description')->nullable();

            // Onay sistemi
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['teacher_profile_id', 'approval_status']);
            $table->index('type');
        });

        // ═══════════════════════════════════════════════════════
        // 6. ÖĞRETMEN YETENEKLERİ & UZMANLIK ALANLARI
        // ═══════════════════════════════════════════════════════

        Schema::create('teacher_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->restrictOnDelete();

            $table->string('name');                       // Yetenek adı
            $table->enum('level', ['beginner', 'intermediate', 'advanced', 'expert'])->default('intermediate');
            $table->enum('category', ['language', 'technology', 'pedagogy', 'art', 'sport', 'music', 'science', 'other'])->default('other');
            $table->unsignedTinyInteger('proficiency')->default(50); // 0-100 yetkinlik yüzdesi

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('teacher_profile_id');
            $table->index('category');
        });

        // ═══════════════════════════════════════════════════════
        // TEACHER PROFILE'A YENİ ALANLAR EKLE
        // ═══════════════════════════════════════════════════════

        Schema::table('teacher_profiles', function (Blueprint $table) {
            // Kişisel bilgiler
            $table->string('title', 20)->nullable()->after('school_id');       // Mr, Mrs, Dr, Prof.
            $table->date('date_of_birth')->nullable()->after('title');
            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'])->nullable()->after('date_of_birth');
            $table->string('nationality')->nullable()->after('gender');
            $table->foreignId('country_id')->nullable()->after('nationality');
            $table->string('profile_photo')->nullable()->after('country_id');

            // Profesyonel bilgiler
            $table->string('specialization')->nullable()->after('experience_years'); // Ana uzmanlık alanı
            $table->date('hire_date')->nullable()->after('specialization');          // İşe giriş tarihi
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern', 'volunteer'])->default('full_time')->after('hire_date');

            // Sosyal medya (özgeçmiş linki vb.)
            $table->string('linkedin_url')->nullable()->after('employment_type');
            $table->string('website_url')->nullable()->after('linkedin_url');

            // Profil tamamlanma durumu
            $table->unsignedTinyInteger('profile_completeness')->default(0)->after('website_url'); // 0-100
        });

        // users tablosuna surname alanı ekle (eğer yoksa)
        if (! Schema::hasColumn('users', 'surname')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('surname')->nullable()->after('name');
            });
        }

        // users tablosuna country_id alanı ekle
        if (! Schema::hasColumn('users', 'country_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('country_id')->nullable()->after('phone');
            });
        }
    }

    public function down(): void
    {
        // Tersten sil
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'country_id')) {
                $table->dropColumn('country_id');
            }
            if (Schema::hasColumn('users', 'surname')) {
                $table->dropColumn('surname');
            }
        });

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $columns = [
                'title', 'date_of_birth', 'gender', 'nationality', 'country_id',
                'profile_photo', 'specialization', 'hire_date', 'employment_type',
                'linkedin_url', 'website_url', 'profile_completeness',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('teacher_profiles', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::dropIfExists('teacher_skills');
        Schema::dropIfExists('teacher_courses');
        Schema::dropIfExists('teacher_certificates');
        Schema::dropIfExists('teacher_educations');
        Schema::dropIfExists('user_contact_numbers');
        Schema::dropIfExists('countries');
    }
};
