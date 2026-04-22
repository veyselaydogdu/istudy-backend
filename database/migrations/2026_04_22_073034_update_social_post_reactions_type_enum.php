<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE social_post_reactions MODIFY COLUMN type ENUM('like','love','care','haha','wow','sad','heart','clap') NOT NULL DEFAULT 'like'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE social_post_reactions MODIFY COLUMN type ENUM('like','heart','clap') NOT NULL DEFAULT 'like'");
    }
};
