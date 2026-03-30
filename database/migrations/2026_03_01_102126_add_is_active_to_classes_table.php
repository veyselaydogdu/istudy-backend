<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sınıflara aktif/pasif durumu ekle.
     * Pasif sınıfa öğrenci kaydı yapılamaz.
     */
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('capacity')
                ->comment('Pasif sınıfa öğrenci kaydı yapılamaz.');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
