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
        // teacher_profiles.tenant_id → nullable
        if (Schema::hasColumn('teacher_profiles', 'tenant_id')) {
            Schema::table('teacher_profiles', function (Blueprint $table) {
                $table->unsignedBigInteger('tenant_id')->nullable()->change();
            });
        }

        // users.is_active kolonu (öğretmen pasifleştirme için)
        if (! Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('tenant_id');
            });
        }

        // tenants.invite_code (öğretmen join request için)
        if (! Schema::hasColumn('tenants', 'invite_code')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('invite_code', 36)->nullable()->unique()->after('id');
            });
            // Mevcut tenant'lara UUID ata
            \DB::table('tenants')->whereNull('invite_code')->orderBy('id')->each(function ($tenant) {
                \DB::table('tenants')->where('id', $tenant->id)->update([
                    'invite_code' => \Illuminate\Support\Str::uuid(),
                ]);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }

        if (Schema::hasColumn('tenants', 'invite_code')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->dropColumn('invite_code');
            });
        }
    }
};
