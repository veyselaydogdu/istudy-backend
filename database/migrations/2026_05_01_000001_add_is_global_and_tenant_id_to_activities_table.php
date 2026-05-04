<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->boolean('is_global')->default(false)->after('school_id');
            $table->unsignedBigInteger('tenant_id')->nullable()->after('is_global');
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn(['is_global', 'tenant_id']);
        });
    }
};
