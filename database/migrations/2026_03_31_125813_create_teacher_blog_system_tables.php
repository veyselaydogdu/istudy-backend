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
        // Blog yazıları
        Schema::create('teacher_blog_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image', 500)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Beğeniler
        Schema::create('teacher_blog_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_post_id')->constrained('teacher_blog_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->unique(['blog_post_id', 'user_id']);
        });

        // Yorumlar (iç içe reply desteği)
        Schema::create('teacher_blog_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_post_id')->constrained('teacher_blog_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parent_comment_id')->nullable()->constrained('teacher_blog_comments')->nullOnDelete();
            $table->text('quoted_content')->nullable();
            $table->text('content');
            $table->timestamps();
            $table->softDeletes();
        });

        // Öğretmen takip
        Schema::create('teacher_follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->unique(['teacher_profile_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_follows');
        Schema::dropIfExists('teacher_blog_comments');
        Schema::dropIfExists('teacher_blog_likes');
        Schema::dropIfExists('teacher_blog_posts');
    }
};
