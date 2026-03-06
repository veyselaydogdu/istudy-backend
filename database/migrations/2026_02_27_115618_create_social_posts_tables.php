<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kısmi çalışmadan kalan tabloları temizle
        Schema::dropIfExists('social_post_comments');
        Schema::dropIfExists('social_post_reactions');
        Schema::dropIfExists('social_post_class_tags');
        Schema::dropIfExists('social_post_media');
        Schema::dropIfExists('social_posts');

        // ─── social_posts ──────────────────────────────────────────────
        Schema::create('social_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->enum('visibility', ['school', 'class'])->default('school');
            $table->longText('content')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'visibility']);
            $table->index(['tenant_id', 'school_id']);
        });

        // ─── social_post_media ─────────────────────────────────────────
        Schema::create('social_post_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('social_posts')->cascadeOnDelete();
            $table->enum('type', ['image', 'video', 'file']);
            $table->string('disk', 50)->default('public');
            $table->string('path', 500);
            $table->string('thumbnail_path', 500)->nullable();
            $table->string('original_name', 255);
            $table->unsignedBigInteger('file_size');
            $table->string('mime_type', 100);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['post_id', 'sort_order']);
        });

        // ─── social_post_class_tags (pivot) ────────────────────────────
        Schema::create('social_post_class_tags', function (Blueprint $table) {
            $table->foreignId('post_id')->constrained('social_posts')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['post_id', 'class_id']);
        });

        // ─── social_post_reactions ─────────────────────────────────────
        Schema::create('social_post_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('social_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['like', 'heart', 'clap'])->default('like');
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
        });

        // ─── social_post_comments ──────────────────────────────────────
        Schema::create('social_post_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('social_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('social_post_comments')->cascadeOnDelete();
            $table->text('content');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_post_comments');
        Schema::dropIfExists('social_post_reactions');
        Schema::dropIfExists('social_post_class_tags');
        Schema::dropIfExists('social_post_media');
        Schema::dropIfExists('social_posts');
    }
};
