<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Etkinlikler ve yemekler artık akademik yıla bağımsız.
     * academic_year_id alanları nullable yapılıyor.
     */
    public function up(): void
    {
        // activities.academic_year_id → nullable
        Schema::table('activities', function (Blueprint $table) {
            $table->unsignedBigInteger('academic_year_id')->nullable()->change();
        });

        // meals.academic_year_id → nullable
        Schema::table('meals', function (Blueprint $table) {
            $table->unsignedBigInteger('academic_year_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->unsignedBigInteger('academic_year_id')->nullable(false)->change();
        });

        Schema::table('meals', function (Blueprint $table) {
            $table->unsignedBigInteger('academic_year_id')->nullable(false)->change();
        });
    }
};
