<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->json('materials')->nullable()->after('end_date')
                ->comment('Etkinliğe getirilmesi gereken materyaller — JSON dizi, ör: ["Kalem","Defter"]');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('materials');
        });
    }
};
