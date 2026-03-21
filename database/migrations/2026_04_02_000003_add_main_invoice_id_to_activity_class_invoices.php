<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_class_invoices', function (Blueprint $table) {
            // Ana fatura tablosuna bağlantı — birleşik görünüm için
            $table->foreignId('main_invoice_id')->nullable()->after('id')
                ->constrained('invoices')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('activity_class_invoices', function (Blueprint $table) {
            $table->dropForeign(['main_invoice_id']);
            $table->dropColumn('main_invoice_id');
        });
    }
};
