<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Modül ayrımı: hangi sistemden geldiği (subscription, activity_class, manual, vb.)
            $table->string('module')->default('subscription')->after('type')
                ->comment('subscription, activity_class, manual, event, activity');

            // İade desteği — credit note mantığı
            $table->enum('invoice_type', ['invoice', 'refund'])->default('invoice')->after('module');
            $table->foreignId('original_invoice_id')->nullable()->after('invoice_type')
                ->constrained('invoices')->nullOnDelete();
            $table->text('refund_reason')->nullable()->after('original_invoice_id');

            // refunded status ekle
            $table->string('status')->default('draft')->change();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['original_invoice_id']);
            $table->dropColumn(['module', 'invoice_type', 'original_invoice_id', 'refund_reason']);
        });
    }
};
