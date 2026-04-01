<?php

namespace App\Http\Controllers\Teachers;

use App\Models\School\TeacherBlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * TeacherBlogController — Öğretmen Blog Yönetimi
 */
class TeacherBlogController extends BaseTeacherController
{
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

            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store("teacher-blogs/{$profile->id}", 'local');
            }

            $post = TeacherBlogPost::create([
                'teacher_profile_id' => $profile->id,
                'title' => $request->title,
                'description' => $request->description,
                'image' => $imagePath,
                'published_at' => $request->published_at,
            ]);

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
                if ($post->image) {
                    Storage::disk('local')->delete($post->image);
                }
                $data['image'] = $request->file('image')->store("teacher-blogs/{$profile->id}", 'local');
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
     * Blog görselini sun (imzalı URL ile erişilir)
     */
    public function serveImage(int $id): Response
    {
        $post = TeacherBlogPost::findOrFail($id);

        abort_unless($post->image && Storage::disk('local')->exists($post->image), 404);

        return Storage::disk('local')->response($post->image);
    }

    private function formatPost(TeacherBlogPost $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'description' => $post->description,
            'image_url' => $post->image
                ? \Illuminate\Support\Facades\URL::signedRoute('teacher.blog.image', ['id' => $post->id], now()->addHours(2))
                : null,
            'is_published' => $post->is_published,
            'published_at' => $post->published_at?->toISOString(),
            'likes_count' => $post->likes_count ?? $post->likes()->count(),
            'comments_count' => $post->comments_count ?? $post->comments()->count(),
            'created_at' => $post->created_at?->toISOString(),
        ];
    }
}
