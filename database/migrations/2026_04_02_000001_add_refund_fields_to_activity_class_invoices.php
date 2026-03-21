<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_class_invoices', function (Blueprint $table) {
            $table->enum('invoice_type', ['invoice', 'refund'])->default('invoice')->after('invoice_number');
            $table->foreignId('original_invoice_id')->nullable()->after('invoice_type')
                ->constrained('activity_class_invoices')->nullOnDelete();
            $table->text('refund_reason')->nullable()->after('original_invoice_id');
            // Add 'refunded' to status enum
            $table->enum('status', ['pending', 'paid', 'overdue', 'cancelled', 'refunded'])->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('activity_class_invoices', function (Blueprint $table) {
            $table->dropForeign(['original_invoice_id']);
            $table->dropColumn(['invoice_type', 'original_invoice_id', 'refund_reason']);
            $table->enum('status', ['pending', 'paid', 'overdue', 'cancelled'])->default('pending')->change();
        });
    }
};
