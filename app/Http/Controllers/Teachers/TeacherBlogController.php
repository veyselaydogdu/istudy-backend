<?php

namespace App\Http\Controllers\Teachers;

use App\Models\School\TeacherBlogPost;
use App\Traits\HandlesMediaStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
                $post->update(['image' => $this->storePrivate($request->file('image'), "teachers/{$profile->id}/blogs/{$post->id}")]);
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
                $this->deletePrivate($post->image);
                $data['image'] = $this->storePrivate($request->file('image'), "teachers/{$profile->id}/blogs/{$post->id}");
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
     * Blog görselini sun (auth:sanctum + signed ile erişilir)
     */
    public function serveImage(int $id): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\Response
    {
        $post = TeacherBlogPost::findOrFail($id);

        if (! $post->image) {
            abort(404);
        }

        return $this->servePrivate($post->image);
    }

    private function formatPost(TeacherBlogPost $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'description' => $post->description,
            'image_url' => $post->image
                ? $this->privateSignedUrl('teacher.blog.image', ['id' => $post->id], 120)
                : null,
            'is_published' => $post->is_published,
            'published_at' => $post->published_at?->toISOString(),
            'likes_count' => $post->likes_count ?? $post->likes()->count(),
            'comments_count' => $post->comments_count ?? $post->comments()->count(),
            'created_at' => $post->created_at?->toISOString(),
        ];
    }
}
