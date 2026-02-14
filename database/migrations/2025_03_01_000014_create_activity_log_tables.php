<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | Gelişmiş Activity Log Tablosu
    |--------------------------------------------------------------------------
    |
    | Tüm model CRUD işlemlerini merkezi bir tabloda kaydeder.
    |
    | Performans Stratejileri:
    | ───────────────────────
    | 1. Composite Index → (model_type, model_id) ve (user_id, created_at)
    | 2. Compressed JSON → old/new_values sadece değişen alanları içerir
    | 3. Partitioning → MySQL'de tarih bazlı partition (ek SQL gerekebilir)
    | 4. Batch Insert → Queue üzerinden toplu insert
    | 5. Retention Policy → Eski kayıtlar arşivlenip silinir
    |
    | MongoDB Geçiş Hazırlığı:
    | ─────────────────────────
    | - Tablo yapısı document-friendly (embedded JSON)
    | - İlişki yok (foreign key yok) → collection olarak taşınabilir
    | - Connection üzerinden yönetilir → sadece config değişir
    |
    | Ayrı DB'de çalışır: config/database.php → 'audit' connection
    */

    /**
     * Bu migration'ın hangi connection üzerinde çalışacağını belirle.
     * config/audit.php'deki connection ayarını kullanır.
     */
    protected function getConnectionName(): ?string
    {
        return config('audit.connection', 'audit');
    }

    public function up(): void
    {
        $connection = $this->getConnectionName();

        // ──────────────────────────
        // 1. MERKEZİ ACTIVITY LOG
        // ──────────────────────────
        Schema::connection($connection)->create('activity_logs', function (Blueprint $table) {
            $table->id();

            // İşlemi yapan kullanıcı
            $table->unsignedBigInteger('user_id')->nullable()->comment('İşlemi yapan kullanıcı');
            $table->string('user_name', 100)->nullable()->comment('Kullanıcı adı (denormalize, performans)');
            $table->string('user_email')->nullable()->comment('Kullanıcı e-posta (denormalize)');

            // Etkilenen kayıt
            $table->string('model_type', 150)->comment('Model sınıfı: App\\Models\\School\\School');
            $table->string('model_label', 100)->comment('Model adı okunabilir: School, User, Invoice');
            $table->unsignedBigInteger('model_id')->comment('Etkilenen kaydın ID\'si');

            // İşlem bilgisi
            $table->string('action', 20)->comment('created, updated, deleted, restored, force_deleted');
            $table->text('description')->nullable()->comment('İnsan okunabilir açıklama');

            // Değişiklik verisi
            $table->json('old_values')->nullable()->comment('Güncellenmeden önceki değerler (sadece değişenler)');
            $table->json('new_values')->nullable()->comment('Güncellendikten sonraki değerler (sadece değişenler)');
            $table->json('changed_fields')->nullable()->comment('Değişen alan isimleri listesi');

            // Bağlam bilgisi
            $table->unsignedBigInteger('tenant_id')->nullable()->comment('Multi-tenant izolasyonu');
            $table->unsignedBigInteger('school_id')->nullable()->comment('Okul bazlı filtreleme');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('url')->nullable()->comment('İsteğin geldiği URL');
            $table->string('method', 10)->nullable()->comment('HTTP metodu: GET, POST, PUT, DELETE');

            // Zaman bilgisi
            $table->timestamp('created_at')->useCurrent()->comment('Log kaydı tarihi');

            // ─── İndeksler ───
            // Ana sorgular için composite indeksler
            $table->index(['model_type', 'model_id'], 'idx_activity_model');
            $table->index(['user_id', 'created_at'], 'idx_activity_user_date');
            $table->index('action', 'idx_activity_action');
            $table->index('created_at', 'idx_activity_created');
            $table->index('tenant_id', 'idx_activity_tenant');
            $table->index('school_id', 'idx_activity_school');

            // Composite: model bazlı zaman sorgulama
            $table->index(['model_type', 'created_at'], 'idx_activity_model_date');
        });

        // ──────────────────────────
        // 2. LOG ARŞİV TABLOSU
        // ──────────────────────────
        // Saklama süresi dolan loglar buraya taşınır.
        // Yapısı activity_logs ile aynıdır.
        Schema::connection($connection)->create('activity_logs_archive', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->comment('activity_logs tablosundaki orijinal ID');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name', 100)->nullable();
            $table->string('user_email')->nullable();
            $table->string('model_type', 150);
            $table->string('model_label', 100);
            $table->unsignedBigInteger('model_id');
            $table->string('action', 20);
            $table->text('description')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('changed_fields')->nullable();
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('url')->nullable();
            $table->string('method', 10)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('archived_at')->useCurrent()->comment('Arşivlenme tarihi');

            $table->index(['model_type', 'model_id'], 'idx_archive_model');
            $table->index('created_at', 'idx_archive_created');
            $table->index('archived_at', 'idx_archive_archived');
        });

        // ──────────────────────────
        // 3. LOG ÖZETLERİ (PERFORMANS)
        // ──────────────────────────
        // Günlük özet sayıları. Dashboard ve raporlar için.
        Schema::connection($connection)->create('activity_log_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('log_date')->comment('Özet tarihi');
            $table->string('model_type', 150);
            $table->string('action', 20);
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->unsignedInteger('count')->default(0)->comment('İşlem sayısı');
            $table->timestamps();

            $table->unique(['log_date', 'model_type', 'action', 'tenant_id'], 'unique_daily_summary');
            $table->index('log_date', 'idx_summary_date');
        });
    }

    public function down(): void
    {
        $connection = $this->getConnectionName();

        Schema::connection($connection)->dropIfExists('activity_log_summaries');
        Schema::connection($connection)->dropIfExists('activity_logs_archive');
        Schema::connection($connection)->dropIfExists('activity_logs');
    }
};
