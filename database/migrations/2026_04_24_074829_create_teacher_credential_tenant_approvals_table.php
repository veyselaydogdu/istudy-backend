<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_credential_tenant_approvals', function (Blueprint $table) {
            $table->id();
            $table->enum('credential_type', ['certificate', 'course']);
            $table->unsignedBigInteger('credential_id');
            $table->unsignedBigInteger('tenant_id');
            $table->enum('status', ['approved', 'rejected']);
            $table->unsignedBigInteger('reviewed_by');
            $table->timestamp('reviewed_at');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->unique(['credential_type', 'credential_id', 'tenant_id'], 'tcta_unique_credential_tenant');
            $table->index(['credential_type', 'credential_id'], 'tcta_credential_idx');
            $table->index('tenant_id', 'tcta_tenant_idx');

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_credential_tenant_approvals');
    }
};
