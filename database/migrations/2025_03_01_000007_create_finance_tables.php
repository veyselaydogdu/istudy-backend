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
    | Bu dosya Ödeme ve Abonelik sistemini içerir.
    | Subscription Plans: SaaS veya okul ücret planları.
    | Family Subscriptions: Ailenin satın aldığı plan.
    | Payments: Yapılan ödemeler.
    | Revenue Shares: Platform kesintileri veya gelir paylaşımları.
    */

    public function up(): void
    {
        // 1. SUBSCRIPTION_PLANS
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('billing_cycle'); // monthly, yearly
            $table->decimal('base_price', 10, 2);

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('subscription_plans_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // 2. PLAN_TIER_PRICING (Fiyatlandırma kural tablosu olarak düşünülmüştür)
        Schema::create('plan_tier_pricing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->integer('child_order')->default(1); // 1. çocuk, 2. çocuk vb.
            $table->decimal('price', 10, 2);

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('plan_tier_pricing_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // 3. FAMILY_SUBSCRIPTIONS
        Schema::create('family_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_profile_id')->constrained()->restrictOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('status')->default('active'); // active, cancelled, expired

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('family_profile_id');
        });

        Schema::create('family_subscriptions_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // 4. PAYMENTS
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_subscription_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('TRY');
            $table->string('payment_provider'); // strip, iyzico
            $table->string('provider_payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('status'); // pending, success, failed

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('payments_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        // 5. REVENUE_SHARES
        Schema::create('revenue_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->restrictOnDelete();
            $table->foreignId('school_id')->constrained('schools')->restrictOnDelete();
            $table->decimal('percentage', 5, 2); // % Komisyon
            $table->decimal('amount', 10, 2); // Net tutar

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('revenue_shares_histories', function (Blueprint $table) {
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
        Schema::dropIfExists('revenue_shares_histories');
        Schema::dropIfExists('revenue_shares');
        Schema::dropIfExists('payments_histories');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('family_subscriptions_histories');
        Schema::dropIfExists('family_subscriptions');
        Schema::dropIfExists('plan_tier_pricing_histories');
        Schema::dropIfExists('plan_tier_pricing');
        Schema::dropIfExists('subscription_plans_histories');
        Schema::dropIfExists('subscription_plans');
    }
};
