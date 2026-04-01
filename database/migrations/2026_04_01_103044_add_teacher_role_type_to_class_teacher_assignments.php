<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('class_teacher_assignments', function (Blueprint $table) {
            $table->foreignId('teacher_role_type_id')
                ->nullable()
                ->after('role')
                ->constrained('teacher_role_types')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('class_teacher_assignments', function (Blueprint $table) {
            $table->dropForeign(['teacher_role_type_id']);
            $table->dropColumn('teacher_role_type_id');
        });
    }
};
