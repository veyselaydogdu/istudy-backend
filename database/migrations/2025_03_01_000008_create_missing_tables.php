<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | Türkçe Açıklama
    |--------------------------------------------------------------------------
    | Bu dosya eksik olan tabloları ve sütunları ekler.
    | 1. users tablosuna tenant_id sütunu
    | 2. class_teacher_assignments pivot tablosu
    */

    public function up(): void
    {
        // 1. Users tablosuna tenant_id eklenmesi
        if (! Schema::hasColumn('users', 'tenant_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('tenant_id')->nullable()->after('locale')
                    ->constrained()->nullOnDelete()
                    ->comment('Kullanıcının bağlı olduğu tenant');
            });
        }

        // 2. Öğretmen-Sınıf atamaları pivot tablosu
        Schema::create('class_teacher_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['class_id', 'teacher_profile_id']);
            $table->index('class_id');
            $table->index('teacher_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_teacher_assignments');

        if (Schema::hasColumn('users', 'tenant_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropConstrainedForeignId('tenant_id');
            });
        }
    }
};
