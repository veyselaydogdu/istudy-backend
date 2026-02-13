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
    | Bu dosya Sınıflar ve Öğrenci-Sınıf atamalarını içerir.
    | Classes: Okuldaki fiziksel veya mantıksal sınıflar.
    | Child Class Assignments: Hangi çocuğun hangi sınıfta olduğunu belirtir.
    */

    public function up(): void
    {
        // 1. CLASSES
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('color')->nullable();
            $table->string('logo')->nullable();
            $table->integer('capacity')->default(20);

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'academic_year_id']);
        });

        Schema::create('classes_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 2. CHILD_CLASS_ASSIGNMENTS (Pivot)
        Schema::create('child_class_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['child_id', 'class_id']);
            $table->index('class_id');
            $table->index('child_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_class_assignments');
        Schema::dropIfExists('classes_histories');
        Schema::dropIfExists('classes');
    }
};
