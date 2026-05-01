<?php

namespace App\Http\Controllers\Teachers;

use App\Models\School\TeacherBlogComment;
use App\Models\School\TeacherBlogPost;
use App\Traits\HandlesMediaStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * TeacherBlogController — Öğretmen Blog Yönetimi
 */
class TeacherBlogController extends BaseTeacherController
{
    use HandlesMediaStorage;

    /**
     * Öğretmenin kendi blog yazıları
     */
    public function index(): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $posts = TeacherBlogPost::where('teacher_profile_id', $profile->id)
                ->withCount(['likes', 'comments'])
                ->latest()
                ->paginate(15);

            return $this->paginatedResponse($posts->through(fn ($p) => $this->formatPost($p)));
        } catch (\Throwable $e) {
            Log::error('TeacherBlogController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse('Blog yazıları alınamadı.', 500);
        }
    }

    /**
     * Yeni blog yazısı oluştur
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|file|image|max:5120',
            'published_at' => 'nullable|date',
        ]);

        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $post = TeacherBlogPost::create([
                'teacher_profile_id' => $profile->id,
                'title' => $request->title,
                'description' => $request->description,
                'image' => null,
                'published_at' => $request->published_at,
            ]);

            if ($request->hasFile('image')) {
                $post->update(['image' => $this->storePublic($request->file('image'), "teachers/{$profile->id}/blogs/{$post->id}")]);
            }

            return $this->successResponse($this->formatPost($post), 'Blog yazısı oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('TeacherBlogController::store', ['message' => $e->getMessage()]);

            return $this->errorResponse('Blog yazısı oluşturulamadı.', 500);
        }
    }

    /**
     * Blog yazısını güncelle
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|file|image|max:5120',
            'published_at' => 'nullable|date',
        ]);

        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $post = TeacherBlogPost::where('teacher_profile_id', $profile->id)->findOrFail($id);

            $data = $request->only(['title', 'description', 'published_at']);

            if ($request->hasFile('image')) {
                $this->deletePublic($post->image);
                $data['image'] = $this->storePublic($request->file('image'), "teachers/{$profile->id}/blogs/{$post->id}");
            }

            $post->update($data);

            return $this->successResponse($this->formatPost($post->fresh()), 'Blog yazısı güncellendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Blog yazısı bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TeacherBlogController::update', ['message' => $e->getMessage()]);

            return $this->errorResponse('Blog yazısı güncellenemedi.', 500);
        }
    }

    /**
     * Blog yazısını sil (soft delete)
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $post = TeacherBlogPost::where('teacher_profile_id', $profile->id)->findOrFail($id);
            $post->delete();

            return $this->successResponse(null, 'Blog yazısı silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Blog yazısı bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TeacherBlogController::destroy', ['message' => $e->getMessage()]);

            return $this->errorResponse('Blog yazısı silinemedi.', 500);
        }
    }

    /**
     * Tek blog yazısı detayı
     */
    public function show(int $id): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $post = TeacherBlogPost::where('teacher_profile_id', $profile->id)
                ->withCount(['likes', 'comments'])
                ->findOrFail($id);

            return $this->successResponse($this->formatPost($post));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Blog yazısı bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TeacherBlogController::show', ['message' => $e->getMessage()]);

            return $this->errorResponse('Blog yazısı alınamadı.', 500);
        }
    }

    /**
     * Kendi blog yazısına yorum ekle
     */
    public function addComment(int $id, Request $request): JsonResponse
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

            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $post = TeacherBlogPost::where('teacher_profile_id', $profile->id)->findOrFail($id);

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
            Log::error('TeacherBlogController::addComment', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yorum eklenemedi.', 500);
        }
    }

    /**
     * Blog yazısının yorumları (kendi yazıları için)
     */
    public function comments(int $id): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $post = TeacherBlogPost::where('teacher_profile_id', $profile->id)->findOrFail($id);

            $comments = TeacherBlogComment::where('blog_post_id', $post->id)
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
            Log::error('TeacherBlogController::comments', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yorumlar alınamadı.', 500);
        }
    }

    /**
     * Kendi blog yazısından yorum sil (herhangi bir kullanıcının yorumunu silebilir)
     */
    public function deleteComment(int $id, int $commentId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            TeacherBlogPost::where('teacher_profile_id', $profile->id)->findOrFail($id);

            $comment = TeacherBlogComment::where('id', $commentId)
                ->where('blog_post_id', $id)
                ->firstOrFail();

            // Cascade: parent silinirse yanıtları da soft-delete
            if (is_null($comment->parent_comment_id)) {
                $comment->replies()->update(['deleted_at' => now()]);
            }
            $comment->delete();

            return $this->successResponse(null, 'Yorum silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Yorum bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TeacherBlogController::deleteComment', ['message' => $e->getMessage()]);

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

    private function formatPost(TeacherBlogPost $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'description' => $post->description,
            'image_url' => $post->image
                ? Storage::disk('public')->url($post->image)
                : null,
            'is_published' => $post->is_published,
            'published_at' => $post->published_at?->toISOString(),
            'likes_count' => $post->likes_count ?? $post->likes()->count(),
            'comments_count' => $post->comments_count ?? $post->comments()->count(),
            'created_at' => $post->created_at?->toISOString(),
        ];
    }
}
