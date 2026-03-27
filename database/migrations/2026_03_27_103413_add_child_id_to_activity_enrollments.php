<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_enrollments', function (Blueprint $table) {
            // Katılım artık aile bazlı değil, çocuk bazlıdır
            $table->unsignedBigInteger('child_id')->nullable()->after('family_profile_id');
            $table->foreign('child_id', 'ae_child_fk')->references('id')->on('children')->nullOnDelete();
            $table->index(['child_id'], 'ae_child_idx');

            // Eski unique: (activity, family) → Yeni unique: (activity, child)
            $table->dropUnique('ae_activity_family_unique');
            $table->unique(['activity_id', 'child_id'], 'ae_activity_child_unique');
        });
    }

    public function down(): void
    {
        Schema::table('activity_enrollments', function (Blueprint $table) {
            $table->dropUnique('ae_activity_child_unique');
            $table->dropIndex('ae_child_idx');
            $table->dropForeign('ae_child_fk');
            $table->dropColumn('child_id');
            $table->unique(['activity_id', 'family_profile_id'], 'ae_activity_family_unique');
        });
    }
};
