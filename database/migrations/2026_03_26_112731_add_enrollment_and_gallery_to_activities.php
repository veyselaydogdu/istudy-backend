<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Etkinliklere katılım zorunluluğu alanı
        Schema::table('activities', function (Blueprint $table) {
            $table->boolean('is_enrollment_required')->default(false)->after('is_paid');
        });

        // 2. Veli etkinlik katılım tablosu
        Schema::create('activity_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->cascadeOnDelete();
            $table->foreignId('family_profile_id')->constrained('family_profiles')->cascadeOnDelete();
            $table->foreignId('enrolled_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('enrolled_at')->useCurrent();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['activity_id', 'family_profile_id'], 'ae_activity_family_unique');
            $table->index(['activity_id'], 'ae_activity_idx');
            $table->index(['family_profile_id'], 'ae_family_idx');
        });

        // 3. Etkinlik galeri tablosu (resim, video, döküman)
        Schema::create('activity_gallery', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->string('file_type')->default('image'); // image | video | document
            $table->string('caption')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['activity_id', 'sort_order'], 'ag_activity_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_gallery');
        Schema::dropIfExists('activity_enrollments');

        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('is_enrollment_required');
        });
    }
};
