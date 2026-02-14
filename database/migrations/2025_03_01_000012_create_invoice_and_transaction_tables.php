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
    | Fatura ve Ödeme Transaction sistemi.
    |
    | invoices       → Düzenlenen faturalar (B2B tenant ödeme veya B2C veli ödeme)
    | invoice_items  → Fatura kalemleri (paket, çocuk kaydı vb.)
    | transactions   → Sanal POS ödeme işlemleri
    |                   status: 0=Bekliyor, 1=Başarılı, 2=Başarısız
    |                   Her deneme için ayrı transaction oluşur.
    |                   order_id (transaction_id) benzersizdir.
    |                   Sanal POS response bilgileri JSON olarak saklanır.
    */

    public function up(): void
    {
        // ──────────────────────────
        // 1. FATURALAR (INVOICES)
        // ──────────────────────────
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique()->comment('Fatura numarası: INV-2026-000001');
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete()->comment('B2B faturası ise tenant');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete()->comment('Faturayı ödeyen kullanıcı');
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete()->comment('İlgili okul (veli ödemesi için)');

            $table->string('type')->default('subscription')->comment('subscription, enrollment, manual, other');
            $table->string('status')->default('draft')->comment('draft, pending, paid, cancelled, refunded');

            $table->decimal('subtotal', 12, 2)->default(0)->comment('Ara toplam');
            $table->decimal('tax_rate', 5, 2)->default(0)->comment('KDV oranı (%)');
            $table->decimal('tax_amount', 12, 2)->default(0)->comment('KDV tutarı');
            $table->decimal('discount_amount', 12, 2)->default(0)->comment('İndirim tutarı');
            $table->decimal('total_amount', 12, 2)->default(0)->comment('Genel toplam');
            $table->string('currency', 3)->default('TRY');

            $table->text('notes')->nullable()->comment('Fatura notu');
            $table->date('issue_date')->comment('Düzenleme tarihi');
            $table->date('due_date')->nullable()->comment('Son ödeme tarihi');
            $table->timestamp('paid_at')->nullable()->comment('Ödeme tarihi');

            // Polimorfik: tenant_subscription veya family_subscription vs.
            $table->string('payable_type')->nullable()->comment('İlişkili model sınıfı');
            $table->unsignedBigInteger('payable_id')->nullable()->comment('İlişkili model ID');

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['school_id']);
            $table->index(['payable_type', 'payable_id']);
        });

        Schema::create('invoices_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // ──────────────────────────
        // 2. FATURA KALEMLERİ
        // ──────────────────────────
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description')->comment('Kalem açıklaması');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);

            // Polimorfik: package, child, family_subscription vb.
            $table->string('item_type')->nullable()->comment('Kalem türü: package, child_enrollment, activity vb.');
            $table->unsignedBigInteger('item_id')->nullable()->comment('İlgili kayıt ID');

            $table->timestamps();

            $table->index('invoice_id');
        });

        // ──────────────────────────
        // 3. ÖDEME İŞLEMLERİ (TRANSACTIONS)
        // ──────────────────────────
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('order_id')->unique()->comment('Benzersiz sipariş/transaction ID — sanal POS a gönderilir');
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete()->comment('Ödemeyi yapan kullanıcı');
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete()->comment('Veli ödemesinde okul bilgisi');

            $table->decimal('amount', 12, 2)->comment('Ödeme tutarı');
            $table->string('currency', 3)->default('TRY');

            // Durum: 0=Bekliyor, 1=Başarılı, 2=Başarısız
            $table->tinyInteger('status')->default(0)->comment('0=Bekliyor, 1=Başarılı, 2=Başarısız');

            // Sanal POS bilgileri
            $table->string('payment_gateway')->default('virtual_pos')->comment('iyzico, paytr, param vb.');
            $table->string('hash')->nullable()->comment('Sanal POS için oluşturulan hash');
            $table->string('bank_name')->nullable()->comment('Kullanılan banka adı');
            $table->string('card_last_four', 4)->nullable()->comment('Kart son 4 hanesi');
            $table->string('card_type')->nullable()->comment('Visa, Mastercard, Troy vb.');
            $table->integer('installment')->default(1)->comment('Taksit sayısı');

            // Sanal POS response (tüm response JSON olarak saklanır)
            $table->json('gateway_request')->nullable()->comment('POS a gönderilen istek');
            $table->json('gateway_response')->nullable()->comment('POS tan dönen cevap');
            $table->string('gateway_transaction_id')->nullable()->comment('POS tarafındaki transaction ID');
            $table->text('error_message')->nullable()->comment('Hata mesajı (başarısız ise)');
            $table->string('error_code')->nullable()->comment('Hata kodu');

            // IP ve güvenlik
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();

            $table->timestamp('completed_at')->nullable()->comment('İşlem tamamlanma zamanı');

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['invoice_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['tenant_id']);
            $table->index(['school_id']);
            $table->index('status');
            $table->index('created_at');
        });

        Schema::create('transactions_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions_histories');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices_histories');
        Schema::dropIfExists('invoices');
    }
};
