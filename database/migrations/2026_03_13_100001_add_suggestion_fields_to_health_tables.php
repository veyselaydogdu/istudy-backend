<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('allergens', function (Blueprint $table) {
            $table->enum('status', ['approved', 'pending', 'rejected'])->default('approved')->after('risk_level');
            $table->foreignId('suggested_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('status');
        });

        Schema::table('medical_conditions', function (Blueprint $table) {
            $table->enum('status', ['approved', 'pending', 'rejected'])->default('approved')->after('description');
            $table->foreignId('suggested_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('status');
        });

        Schema::table('medications', function (Blueprint $table) {
            $table->enum('status', ['approved', 'pending', 'rejected'])->default('approved')->after('usage_notes');
            $table->foreignId('suggested_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('allergens', function (Blueprint $table) {
            $table->dropForeign(['suggested_by_user_id']);
            $table->dropColumn(['status', 'suggested_by_user_id']);
        });

        Schema::table('medical_conditions', function (Blueprint $table) {
            $table->dropForeign(['suggested_by_user_id']);
            $table->dropColumn(['status', 'suggested_by_user_id']);
        });

        Schema::table('medications', function (Blueprint $table) {
            $table->dropForeign(['suggested_by_user_id']);
            $table->dropColumn(['status', 'suggested_by_user_id']);
        });
    }
};
