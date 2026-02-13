<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | B2B Paket Sistemi Tabloları
    |--------------------------------------------------------------------------
    | Admin'in müşterilere sattığı platform paketleri.
    | Sınıf limiti, öğrenci limiti ve fiyatlandırma içerir.
    */

    public function up(): void
    {
        // ─── Paketler ──────────────────────────────────────────
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');                          // Başlangıç, Profesyonel, Kurumsal
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('max_schools')->default(1)
                ->comment('0 = sınırsız');
            $table->unsignedSmallInteger('max_classes_per_school')->default(5)
                ->comment('0 = sınırsız');
            $table->unsignedInteger('max_students')->default(50)
                ->comment('Tenant genelinde toplam öğrenci limiti. 0 = sınırsız');
            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->decimal('yearly_price', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('features')->nullable()
                ->comment('Ekstra özellikler: {reports: true, notifications: true, ...}');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('packages_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ─── Tenant Abonelikleri ───────────────────────────────
        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('package_id')->constrained('packages')->restrictOnDelete();
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->decimal('price', 10, 2);
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['trial', 'active', 'cancelled', 'expired', 'suspended'])
                ->default('active');
            $table->boolean('auto_renew')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('tenant_subscriptions_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ─── Tenant Ödemeleri ──────────────────────────────────
        Schema::create('tenant_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_subscription_id')
                ->constrained('tenant_subscriptions')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 5)->default('TRY');
            $table->string('payment_method')->nullable()
                ->comment('credit_card, bank_transfer, iyzico, stripe');
            $table->string('payment_gateway')->nullable();
            $table->string('transaction_id')->nullable()->unique();
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])
                ->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->json('gateway_response')->nullable()
                ->comment('Ödeme geçidi ham yanıtı');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_subscription_id');
        });

        Schema::create('tenant_payments_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_payments_histories');
        Schema::dropIfExists('tenant_payments');
        Schema::dropIfExists('tenant_subscriptions_histories');
        Schema::dropIfExists('tenant_subscriptions');
        Schema::dropIfExists('packages_histories');
        Schema::dropIfExists('packages');
    }
};
