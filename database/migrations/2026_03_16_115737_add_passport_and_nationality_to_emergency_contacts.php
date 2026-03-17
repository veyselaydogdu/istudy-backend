<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emergency_contacts', function (Blueprint $table) {
            $table->string('passport_number', 50)->nullable()->after('identity_number');
            $table->unsignedBigInteger('nationality_country_id')->nullable()->after('passport_number');
            $table->string('phone_country_code', 10)->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('emergency_contacts', function (Blueprint $table) {
            $table->dropColumn(['passport_number', 'nationality_country_id', 'phone_country_code']);
        });
    }
};
