<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_educations', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('description');
        });

        Schema::table('teacher_courses', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('certificate_file');
        });

        DB::statement("ALTER TABLE teacher_credential_tenant_approvals
            MODIFY COLUMN credential_type ENUM('certificate','course','education') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE teacher_credential_tenant_approvals
            MODIFY COLUMN credential_type ENUM('certificate','course') NOT NULL");

        Schema::table('teacher_courses', function (Blueprint $table) {
            $table->dropColumn('file_path');
        });

        Schema::table('teacher_educations', function (Blueprint $table) {
            $table->dropColumn('file_path');
        });
    }
};
