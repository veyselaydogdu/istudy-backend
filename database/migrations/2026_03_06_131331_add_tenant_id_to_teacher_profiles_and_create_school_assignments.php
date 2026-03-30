<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Öğretmen mimarisi tenant-level'e taşınıyor:
     *  1. teacher_profiles.tenant_id ekleniyor (mevcut kayıtlar school.tenant_id'den backfill edilir)
     *  2. teacher_profiles.school_id nullable yapılıyor
     *  3. school_teacher_assignments pivot tablosu oluşturuluyor
     */
    public function up(): void
    {
        // 1. tenant_id ekle, school_id nullable yap
        Schema::table('teacher_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('teacher_profiles', 'tenant_id')) {
                $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
                $table->index('tenant_id');
            }

            $table->unsignedBigInteger('school_id')->nullable()->change();
        });

        // 2. Mevcut kayıtlar için tenant_id backfill (MySQL only — test DB SQLite boş)
        if (\DB::getDriverName() !== 'sqlite') {
            \DB::statement('
                UPDATE teacher_profiles tp
                JOIN schools s ON s.id = tp.school_id
                SET tp.tenant_id = s.tenant_id
                WHERE tp.tenant_id IS NULL AND tp.school_id IS NOT NULL
            ');
        }

        // 3. school_teacher_assignments pivot tablosu
        if (! Schema::hasTable('school_teacher_assignments')) {
            Schema::create('school_teacher_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->cascadeOnDelete();
                $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern', 'volunteer'])->default('full_time');
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['school_id', 'teacher_profile_id']);
            });

            // Mevcut teacher_profiles.school_id kayıtlarını pivot'a backfill et (MySQL only)
            if (\DB::getDriverName() !== 'sqlite') {
                \DB::statement('
                    INSERT IGNORE INTO school_teacher_assignments (school_id, teacher_profile_id, employment_type, is_active, created_at, updated_at)
                    SELECT school_id, id, employment_type, 1, NOW(), NOW()
                    FROM teacher_profiles
                    WHERE school_id IS NOT NULL
                ');
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('school_teacher_assignments');

        Schema::table('teacher_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('teacher_profiles', 'tenant_id')) {
                $table->dropIndex(['tenant_id']);
                $table->dropColumn('tenant_id');
            }
            $table->unsignedBigInteger('school_id')->nullable(false)->change();
        });
    }
};
