<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_classes', function (Blueprint $table) {
            $table->boolean('is_global')->default(false)->after('is_school_wide');
        });
    }

    public function down(): void
    {
        Schema::table('activity_classes', function (Blueprint $table) {
            $table->dropColumn('is_global');
        });
    }
};
