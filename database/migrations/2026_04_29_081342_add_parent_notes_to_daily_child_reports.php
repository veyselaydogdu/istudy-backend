<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_child_reports', function (Blueprint $table) {
            $table->text('parent_notes')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('daily_child_reports', function (Blueprint $table) {
            $table->dropColumn('parent_notes');
        });
    }
};
