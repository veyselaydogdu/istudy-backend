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
    | Bu dosya Öğretmen, Aile ve Çocuk profillerini içerir.
    | Teacher Profiles: Kullanıcı ile okul arasındaki eğitmen ilişkisi.
    | Children: Kuruma kayıtlı öğrenciler.
    | Family Profiles: Bir veya daha fazla çocuğun bağlı olduğu aile ünitesi.
    */

    public function up(): void
    {
        // 1. TEACHER_PROFILES
        Schema::create('teacher_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->text('bio')->nullable();
            $table->text('education_summary')->nullable();
            $table->integer('experience_years')->default(0);
            $table->json('languages')->nullable();
            $table->json('certifications')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'school_id']);
        });

        Schema::create('teacher_profiles_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 2. FAMILY_PROFILES
        Schema::create('family_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete(); // Aile reisi
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('family_name')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
        });

        Schema::create('family_profiles_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 3. FAMILY_MEMBERS (Aileye bağlı diğer üyeler - Anne, Baba, Teyze vb.)
        Schema::create('family_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('relation_type'); // Father, Mother, Guardian, Aunt

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('family_members_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 4. CHILDREN
        Schema::create('children', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            // academic_year_id can represent enrollment year or current assigned academic year default
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();

            $table->string('first_name');
            $table->string('last_name');
            $table->date('birth_date');
            $table->string('gender')->nullable();
            $table->string('profile_photo')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'academic_year_id']);
            $table->index('family_profile_id');
        });

        Schema::create('children_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('children_histories');
        Schema::dropIfExists('children');
        Schema::dropIfExists('family_members_histories');
        Schema::dropIfExists('family_members');
        Schema::dropIfExists('family_profiles_histories');
        Schema::dropIfExists('family_profiles');
        Schema::dropIfExists('teacher_profiles_histories');
        Schema::dropIfExists('teacher_profiles');
    }
};
