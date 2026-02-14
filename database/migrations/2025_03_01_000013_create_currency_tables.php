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
    | Para birimi ve döviz kuru yönetimi.
    |
    | currencies     → Desteklenen para birimleri (USD, EUR, TRY, GBP vb.)
    | exchange_rates → Döviz kurları (baz para birimine göre)
    |
    | Sistem bir "baz para birimi" (base currency) belirler.
    | Diğer tüm para birimleri bu baz birime göre kur ile hesaplanır.
    | Kurlar, cron job ile otomatik güncellenir (API entegrasyonu).
    */

    public function up(): void
    {
        // ──────────────────────────
        // 1. PARA BİRİMLERİ
        // ──────────────────────────
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 3)->unique()->comment('ISO 4217 para birimi kodu: USD, EUR, TRY');
            $table->string('name')->comment('Para birimi adı: US Dollar');
            $table->string('name_tr')->nullable()->comment('Türkçe adı: Amerikan Doları');
            $table->string('symbol', 10)->comment('Sembol: $, €, ₺');
            $table->string('symbol_position', 10)->default('before')->comment('Sembol konumu: before veya after');
            $table->string('thousands_separator', 1)->default(',');
            $table->string('decimal_separator', 1)->default('.');
            $table->tinyInteger('decimal_places')->default(2)->comment('Ondalık hane sayısı');

            $table->boolean('is_active')->default(true)->comment('Aktif mi?');
            $table->boolean('is_base')->default(false)->comment('Baz para birimi mi?');
            $table->integer('sort_order')->default(0)->comment('Sıralama');

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('is_active');
            $table->index('is_base');
        });

        // ──────────────────────────
        // 2. DÖVİZ KURLARI
        // ──────────────────────────
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('currency_id')->constrained()->cascadeOnDelete()->comment('Hedef para birimi');
            $table->string('base_currency', 3)->default('USD')->comment('Baz para birimi kodu');
            $table->decimal('rate', 18, 8)->comment('1 baz birim = ? hedef birim');
            $table->decimal('buy_rate', 18, 8)->nullable()->comment('Alış kuru');
            $table->decimal('sell_rate', 18, 8)->nullable()->comment('Satış kuru');

            $table->string('source')->default('manual')->comment('Kaydın kaynağı: api, manual, seed');
            $table->timestamp('fetched_at')->nullable()->comment('API\'den çekildiği zaman');
            $table->date('rate_date')->comment('Kurun geçerli olduğu tarih');

            $table->timestamps();

            $table->index(['currency_id', 'rate_date']);
            $table->index(['base_currency', 'rate_date']);
            $table->unique(['currency_id', 'base_currency', 'rate_date'], 'unique_rate_per_day');
        });

        // ──────────────────────────
        // 3. KUR GÜNCELLEMELERİ LOG
        // ──────────────────────────
        Schema::create('exchange_rate_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source')->comment('API kaynağı: exchangerate-api, openexchangerates, manual');
            $table->string('base_currency', 3);
            $table->integer('rates_count')->default(0)->comment('Güncellenen kur sayısı');
            $table->string('status')->default('success')->comment('success, failed, partial');
            $table->text('error_message')->nullable();
            $table->json('raw_response')->nullable()->comment('API\'den gelen ham yanıt');
            $table->integer('duration_ms')->nullable()->comment('İşlem süresi (ms)');
            $table->timestamp('fetched_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rate_logs');
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('currencies');
    }
};
