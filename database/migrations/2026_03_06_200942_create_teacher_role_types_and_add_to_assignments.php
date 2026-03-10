<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Görev Türleri (Tenant düzeyinde) ────────────────────────────────
        Schema::create('teacher_role_types', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 100);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'sort_order']);
        });

        // ─── school_teacher_assignments'a görev türü FK ───────────────────────
        Schema::table('school_teacher_assignments', function (Blueprint $table): void {
            $table->foreignId('teacher_role_type_id')
                ->nullable()
                ->after('employment_type')
                ->constrained('teacher_role_types')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('school_teacher_assignments', function (Blueprint $table): void {
            $table->dropForeign(['teacher_role_type_id']);
            $table->dropColumn('teacher_role_type_id');
        });

        Schema::dropIfExists('teacher_role_types');
    }
};
