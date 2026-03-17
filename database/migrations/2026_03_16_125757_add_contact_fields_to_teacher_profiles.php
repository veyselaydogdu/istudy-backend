<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->string('phone_country_code', 10)->nullable()->after('country_id');
            $table->string('whatsapp_number', 30)->nullable()->after('phone_country_code');
            $table->string('whatsapp_country_code', 10)->nullable()->after('whatsapp_number');
            $table->string('identity_number', 50)->nullable()->after('whatsapp_country_code');
            $table->string('passport_number', 50)->nullable()->after('identity_number');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn(['phone_country_code', 'whatsapp_number', 'whatsapp_country_code', 'identity_number', 'passport_number']);
        });
    }
};
