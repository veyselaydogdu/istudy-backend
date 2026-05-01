<?php

namespace App\Http\Controllers\Parents;

use App\Models\School\TeacherBlogComment;
use App\Models\School\TeacherBlogLike;
use App\Models\School\TeacherBlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * ParentTeacherBlogController — Veli tarafından blog beğeni, yorum ve alıntı işlemleri
 */
class ParentTeacherBlogController extends BaseParentController
{
    /**
     * Blog yazısını beğen
     */
    public function like(int $blogPostId): JsonResponse
    {
        try {
            $post = TeacherBlogPost::published()->findOrFail($blogPostId);
            $userId = $this->user()->id;

            $already = TeacherBlogLike::where('blog_post_id', $post->id)
                ->where('user_id', $userId)
                ->exists();

            if ($already) {
                return $this->errorResponse('Bu yazıyı zaten beğendiniz.', 422);
            }

            TeacherBlogLike::create([
                'blog_post_id' => $post->id,
                'user_id' => $userId,
            ]);

            return $this->successResponse(
                ['likes_count' => $post->likes()->count()],
                'Blog yazısı beğenildi.'
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Blog yazısı bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ParentTeacherBlogController::like', ['message' => $e->getMessage()]);

            return $this->errorResponse('Beğeni işlemi başarısız.', 500);
        }
    }

    /**
     * Blog yazısı beğenisini geri al
     */
    public function unlike(int $blogPostId): JsonResponse
    {
        try {
            $userId = $this->user()->id;

            $like = TeacherBlogLike::where('blog_post_id', $blogPostId)
                ->where('user_id', $userId)
                ->firstOrFail();

            $like->delete();

            $count = TeacherBlogLike::where('blog_post_id', $blogPostId)->count();

            return $this->successResponse(['likes_count' => $count], 'Beğeni geri alındı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Beğeni kaydı bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ParentTeacherBlogController::unlike', ['message' => $e->getMessage()]);

            return $this->errorResponse('Beğeni geri alma başarısız.', 500);
        }
    }

    /**
     * Blog yazısının yorumları (thread yapısında)
     */
    public function comments(int $blogPostId): JsonResponse
    {
        try {
            TeacherBlogPost::published()->findOrFail($blogPostId);

            $comments = TeacherBlogComment::where('blog_post_id', $blogPostId)
                ->whereNull('parent_comment_id')
                ->with([
                    'user:id,name,surname',
                    'replies' => fn ($q) => $q->with('user:id,name,surname')->latest(),
                ])
                ->latest()
                ->paginate(20);

            return $this->paginatedResponse(
                $comments->through(fn ($c) => $this->formatComment($c, true))
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Blog yazısı bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ParentTeacherBlogController::comments', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yorumlar alınamadı.', 500);
        }
    }

    /**
     * Blog yazısına yorum ekle (yeni yorum, yanıt veya alıntılı yanıt)
     */
    public function addComment(int $blogPostId, Request $request): JsonResponse
    {
        $request->validate([
            'content' => 'required|string|max:2000',
            'parent_comment_id' => 'nullable|integer|exists:teacher_blog_comments,id',
            'quoted_content' => 'nullable|string|max:500',
        ]);

        try {
            $userId = $this->user()->id;

            $recentComment = TeacherBlogComment::where('user_id', $userId)
                ->where('created_at', '>=', now()->subSeconds(60))
                ->latest()
                ->first();

            if ($recentComment) {
                $waitSeconds = (int) now()->diffInSeconds($recentComment->created_at->addSeconds(60), false);

                return $this->errorResponse(
                    "Çok sık yorum yapıyorsunuz. {$waitSeconds} saniye bekleyin.",
                    429
                );
            }

            $post = TeacherBlogPost::published()->findOrFail($blogPostId);

            // Eğer parent_comment_id verilmişse aynı post'a ait olmalı
            if ($request->parent_comment_id) {
                $parentComment = TeacherBlogComment::where('id', $request->parent_comment_id)
                    ->where('blog_post_id', $post->id)
                    ->first();

                if (! $parentComment) {
                    return $this->errorResponse('Yanıtlanacak yorum bulunamadı.', 404);
                }
            }

            $comment = TeacherBlogComment::create([
                'blog_post_id' => $post->id,
                'user_id' => $userId,
                'parent_comment_id' => $request->parent_comment_id,
                'quoted_content' => $request->quoted_content,
                'content' => $request->content,
            ]);

            $comment->load('user:id,name,surname');

            return $this->successResponse(
                $this->formatComment($comment),
                'Yorum eklendi.',
                201
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Blog yazısı bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ParentTeacherBlogController::addComment', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yorum eklenemedi.', 500);
        }
    }

    /**
     * Kendi yorumunu sil
     */
    public function deleteComment(int $blogPostId, int $commentId): JsonResponse
    {
        try {
            $comment = TeacherBlogComment::where('id', $commentId)
                ->where('blog_post_id', $blogPostId)
                ->where('user_id', $this->user()->id)
                ->firstOrFail();

            $comment->delete();

            return $this->successResponse(null, 'Yorum silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Yorum bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ParentTeacherBlogController::deleteComment', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yorum silinemedi.', 500);
        }
    }

    private function formatComment(TeacherBlogComment $comment, bool $withReplies = false): array
    {
        $data = [
            'id' => $comment->id,
            'content' => $comment->content,
            'quoted_content' => $comment->quoted_content,
            'parent_comment_id' => $comment->parent_comment_id,
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name.' '.$comment->user->surname,
            ] : null,
            'created_at' => $comment->created_at?->toISOString(),
        ];

        if ($withReplies && $comment->relationLoaded('replies')) {
            $data['replies'] = $comment->replies->map(fn ($r) => $this->formatComment($r))->values();
        }

        return $data;
    }
}
