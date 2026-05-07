<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('cover_image')->nullable()->after('is_global');
        });

        Schema::table('activity_classes', function (Blueprint $table) {
            $table->string('cover_image')->nullable()->after('is_global');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('cover_image');
        });

        Schema::table('activity_classes', function (Blueprint $table) {
            $table->dropColumn('cover_image');
        });
    }
};
