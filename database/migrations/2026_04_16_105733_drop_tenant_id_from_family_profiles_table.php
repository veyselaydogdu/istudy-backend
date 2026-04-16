<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Aileler tenant-agnostic olduğundan family_profiles.tenant_id kaldırılıyor.
     * Bir aile birden fazla tenant okuluna çocuk kaydedebilir.
     */
    public function up(): void
    {
        Schema::table('family_profiles', function (Blueprint $table) {
            $table->dropForeign('family_profiles_tenant_id_foreign');
            $table->dropIndex('family_profiles_tenant_id_index');
            $table->dropColumn('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('family_profiles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->constrained()->restrictOnDelete();
            $table->index('tenant_id');
        });
    }
};
