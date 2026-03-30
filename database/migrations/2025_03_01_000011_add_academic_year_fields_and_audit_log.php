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
    | Bu migration eğitim yılları tablosuna yeni alanlar ekler:
    | - is_current: Okulun şu anki aktif eğitim yılını belirler (her okulda sadece 1 tane olabilir)
    | - description: Eğitim yılı açıklaması
    |
    | Ayrıca admin paneli için gerekli olan audit_log tablosunu oluşturur.
    */

    public function up(): void
    {
        // 1. ACADEMIC_YEARS tablosuna yeni alanlar ekle
        Schema::table('academic_years', function (Blueprint $table) {
            $table->boolean('is_current')->default(false)
                ->after('is_active')
                ->comment('Okulun güncel eğitim yılı mı? (Her okulda 1 tane olabilir)');
            $table->text('description')->nullable()
                ->after('name')
                ->comment('Eğitim yılı açıklaması');

            // is_current indeksi
            $table->index(['school_id', 'is_current']);
        });

        // 2. AUDIT LOG tablosu (Admin paneli için)
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 100)->comment('Yapılan işlem: create, update, delete, login, logout vb.');
            $table->string('model_type')->nullable()->comment('Etkilenen model sınıfı');
            $table->unsignedBigInteger('model_id')->nullable()->comment('Etkilenen kaydın ID\'si');
            $table->json('old_values')->nullable()->comment('Eski değerler (update/delete)');
            $table->json('new_values')->nullable()->comment('Yeni değerler (create/update)');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->text('description')->nullable()->comment('İşlem açıklaması');
            $table->timestamps();

            $table->index(['model_type', 'model_id']);
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');

        Schema::table('academic_years', function (Blueprint $table) {
            $table->dropIndex(['school_id', 'is_current']);
            $table->dropColumn(['is_current', 'description']);
        });
    }
};
