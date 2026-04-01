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
        Schema::create('teacher_tenant_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->enum('status', ['pending', 'active', 'inactive', 'removed'])->default('pending');
            $table->enum('invite_type', ['teacher_request', 'tenant_invite'])->default('teacher_request');
            $table->foreignId('invited_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['teacher_profile_id', 'tenant_id']);
        });

        // Mevcut teacher_profiles.tenant_id kayıtlarını membership olarak aktar
        \DB::table('teacher_profiles')->whereNotNull('tenant_id')->orderBy('id')->each(function ($tp) {
            \DB::table('teacher_tenant_memberships')->insertOrIgnore([
                'teacher_profile_id' => $tp->id,
                'tenant_id' => $tp->tenant_id,
                'status' => 'active',
                'invite_type' => 'teacher_request',
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_tenant_memberships');
    }
};
