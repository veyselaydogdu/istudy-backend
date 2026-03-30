<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // activities tablosuna capacity ve address ekleniyor
        Schema::table('activities', function (Blueprint $table) {
            $table->unsignedInteger('capacity')->nullable()
                ->comment('Kontenjan — null = sınırsız')->after('end_time');
            $table->string('address')->nullable()
                ->comment('Etkinlik adresi — null = belirtilmemiş')->after('capacity');
        });

        // activity_classes tablosuna address ekleniyor (capacity zaten mevcut)
        Schema::table('activity_classes', function (Blueprint $table) {
            $table->string('address')->nullable()
                ->comment('Etkinlik sınıfı adresi — null = belirtilmemiş')->after('location');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['capacity', 'address']);
        });

        Schema::table('activity_classes', function (Blueprint $table) {
            $table->dropColumn('address');
        });
    }
};
