<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Veli davet sistemi için school_enrollment_requests tablosunu genişlet:
     * - user_id nullable yapılır (hesabı olmayan veliler de talep gönderebilir)
     * - Veli bilgileri (name, surname, email, phone) eklenir
     * - invite_token: hangi davet linki ile geldiği
     */
    public function up(): void
    {
        Schema::table('school_enrollment_requests', function (Blueprint $table) {
            // user_id nullable yap (hesabı olmayan veliler için)
            $table->foreignId('user_id')->nullable()->change();

            // Veli bilgileri (user yokken doldurulur; onayda User + FamilyProfile oluşturulur)
            $table->string('parent_name')->nullable()->after('family_profile_id');
            $table->string('parent_surname')->nullable()->after('parent_name');
            $table->string('parent_email')->nullable()->after('parent_surname');
            $table->string('parent_phone')->nullable()->after('parent_email');

            // Hangi davet tokeni ile gelindi (link-based invite)
            $table->string('invite_token', 64)->nullable()->after('parent_phone');

            // Email bazlı tekrar kontrol indexi
            $table->index(['school_id', 'parent_email'], 'idx_enrollment_school_email');
        });
    }

    public function down(): void
    {
        Schema::table('school_enrollment_requests', function (Blueprint $table) {
            $table->dropIndex('idx_enrollment_school_email');
            $table->dropColumn(['parent_name', 'parent_surname', 'parent_email', 'parent_phone', 'invite_token']);
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
