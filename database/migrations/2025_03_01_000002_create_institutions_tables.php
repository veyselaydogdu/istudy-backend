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
    | Bu dosya Kiracılar (Müşteriler), Okullar ve Akademik Yılları içerir.
    | Tenants: Sistemi kiralayan ana kurum.
    | Schools: Tenanta bağlı şubeler/okullar.
    | Academic Years: Okulların eğitim dönemleri.
    */

    public function up(): void
    {
        // 1. TENANTS
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('Kurum Adı');
            $table->foreignId('owner_user_id')->constrained('users')->restrictOnDelete()->comment('Kurum Sahibi');
            $table->string('country')->default('TR')->comment('Ülke');
            $table->string('currency')->default('TRY')->comment('Para Birimi');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('tenants_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // 2. SCHOOLS
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->restrictOnDelete();
            $table->string('name')->comment('Okul Adı');
            $table->string('code')->unique()->comment('Okul Kodu');
            $table->text('address')->nullable()->comment('Adres');
            $table->string('phone')->nullable()->comment('İletişim');
            $table->string('email')->nullable()->comment('E-posta');
            $table->string('logo')->nullable()->comment('Logo URL');
            $table->string('timezone')->default('Europe/Istanbul')->comment('Zaman Dilimi');
            $table->boolean('is_active')->default(true)->comment('Aktiflik Durumu');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
        });

        Schema::create('schools_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // 3. ACADEMIC_YEARS
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->string('name')->comment('Okul Yılı Adı (2025-2026)');
            $table->date('start_date')->comment('Başlangıç Tarihi');
            $table->date('end_date')->comment('Bitiş Tarihi');
            $table->boolean('is_active')->default(true)->comment('Aktif Dönem mi?');

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('school_id');
        });

        Schema::create('academic_years_histories', function (Blueprint $table) {
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
        Schema::dropIfExists('academic_years_histories');
        Schema::dropIfExists('academic_years');
        Schema::dropIfExists('schools_histories');
        Schema::dropIfExists('schools');
        Schema::dropIfExists('tenants_histories');
        Schema::dropIfExists('tenants');
    }
};
