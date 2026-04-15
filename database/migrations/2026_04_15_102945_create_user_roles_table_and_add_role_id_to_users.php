<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | user_roles — Sabit ID'li rol lookup tablosu
    |--------------------------------------------------------------------------
    | 1  → super_admin
    | 5  → tenant
    | 10 → teacher
    | 15 → parent
    | 20 → student
    |
    | users.role_id doğrudan bu tabloya FK tutar (1 kullanıcı = 1 rol).
    */

    public function up(): void
    {
        // ── 1. user_roles lookup tablosu ─────────────────────────────────────
        Schema::create('user_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name')->unique()->comment('Rol slug: super_admin, tenant, teacher, parent, student');
            $table->string('label')->comment('Görünen ad');
            $table->timestamps();
        });

        // Sabit ID'li roller (migration sırasında eklenir)
        DB::table('user_roles')->insert([
            ['id' => 1,  'name' => 'super_admin', 'label' => 'Super Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5,  'name' => 'tenant',      'label' => 'Tenant',      'created_at' => now(), 'updated_at' => now()],
            ['id' => 10, 'name' => 'teacher',     'label' => 'Öğretmen',    'created_at' => now(), 'updated_at' => now()],
            ['id' => 15, 'name' => 'parent',      'label' => 'Veli',        'created_at' => now(), 'updated_at' => now()],
            ['id' => 20, 'name' => 'student',     'label' => 'Öğrenci',     'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── 2. users.role_id FK ───────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id')->nullable()->after('id')
                ->comment('FK → user_roles.id — kullanıcının ana rolü');

            $table->foreign('role_id')
                ->references('id')
                ->on('user_roles')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });

        Schema::dropIfExists('user_roles');
    }
};
