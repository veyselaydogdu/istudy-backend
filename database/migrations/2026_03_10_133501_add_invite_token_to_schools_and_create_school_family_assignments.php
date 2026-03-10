<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 1. schools tablosuna invite_token ekle (davet linki için UUID)
     * 2. school_family_assignments tablosu oluştur (Veli-Okul M2M)
     */
    public function up(): void
    {
        // 1. schools: invite_token (link tabanlı davet için benzersiz UUID)
        Schema::table('schools', function (Blueprint $table) {
            $table->string('invite_token', 64)->nullable()->unique()->after('registration_code');
        });

        // 2. school_family_assignments: Onaylanan velilerin okul ataması
        Schema::create('school_family_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('family_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('enrollment_request_id')
                ->nullable()
                ->constrained('school_enrollment_requests')
                ->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->useCurrent();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['school_id', 'family_profile_id', 'deleted_at'], 'unique_school_family');
            $table->index(['school_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_family_assignments');

        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('invite_token');
        });
    }
};
