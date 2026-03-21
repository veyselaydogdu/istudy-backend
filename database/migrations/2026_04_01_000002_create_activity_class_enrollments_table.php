<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_class_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_class_id')->constrained('activity_classes')->cascadeOnDelete();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('family_profile_id')->nullable()->constrained('family_profiles')->nullOnDelete();
            $table->enum('status', ['pending', 'active', 'cancelled'])->default('active');
            $table->enum('enrolled_by', ['tenant', 'parent'])->default('tenant');
            $table->foreignId('enrolled_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['activity_class_id', 'child_id'], 'ace_unique_enrollment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_class_enrollments');
    }
};
