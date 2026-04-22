<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_post_reactions', function (Blueprint $table) {
            // FK için index ekle, sonra unique kaldır
            $table->index('post_id', 'spr_post_id_index');
        });

        Schema::table('social_post_reactions', function (Blueprint $table) {
            $table->dropUnique('social_post_reactions_post_id_user_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('social_post_reactions', function (Blueprint $table) {
            $table->unique(['post_id', 'user_id']);
            $table->dropIndex('spr_post_id_index');
        });
    }
};
