<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->unsignedTinyInteger('age_min')->nullable()->after('capacity');
            $table->unsignedTinyInteger('age_max')->nullable()->after('age_min');
            $table->string('language', 10)->nullable()->after('age_max');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['age_min', 'age_max', 'language']);
        });
    }
};
