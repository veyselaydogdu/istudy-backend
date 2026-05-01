<?php

namespace App\Http\Controllers\Parents;

use App\Models\School\TeacherBlogPost;
use App\Models\School\TeacherFollow;
use App\Models\School\TeacherProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * ParentTeacherController — Veli tarafından öğretmen profil görüntüleme, takip ve akış
 */
class ParentTeacherController extends BaseParentController
{
    /**
     * Öğretmen profilini görüntüle
     */
    public function show(int $teacherProfileId): JsonResponse
    {
        try {
            $profile = TeacherProfile::with([
                'user:id,name,surname',
                'country:id,name',
                'educations',
                'approvedCertificates',
                'approvedCourses',
                'skills',
            ])
                ->withCount(['blogPosts' => fn ($q) => $q->published(), 'followers'])
                ->findOrFail($teacherProfileId);

            $userId = $this->user()->id;
            $isFollowing = TeacherFollow::where('teacher_profile_id', $teacherProfileId)
                ->where('user_id', $userId)
                ->exists();

            return $this->successResponse([
                'id' => $profile->id,
                'name' => $profile->user->name.' '.$profile->user->surname,
                'title' => $profile->title,
                'specialization' => $profile->specialization,
                'bio' => $profile->bio,
                'experience_years' => $profile->experience_years,
                'profile_photo' => $profile->profile_photo,
                'country' => $profile->country?->name,
                'linkedin_url' => $profile->linkedin_url,
                'website_url' => $profile->website_url,
                'languages' => $profile->languages,
                'educations' => $profile->educations,
                'certificates' => $profile->approvedCertificates,
                'courses' => $profile->approvedCourses,
                'skills' => $profile->skills,
                'blog_posts_count' => $profile->blog_posts_count,
                'followers_count' => $profile->followers_count,
                'is_following' => $isFollowing,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen profili bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ParentTeacherController::show', ['message' => $e->getMessage()]);

            return $this->errorResponse('Öğretmen profili alınamadı.', 500);
        }
    }

    /**
     * Öğretmeni takip et
     */
    public function follow(int $teacherProfileId): JsonResponse
    {
        try {
            $profile = TeacherProfile::findOrFail($teacherProfileId);
            $userId = $this->user()->id;

            $already = TeacherFollow::where('teacher_profile_id', $profile->id)
                ->where('user_id', $userId)
                ->exists();

            if ($already) {
                return $this->errorResponse('Bu öğretmeni zaten takip ediyorsunuz.', 422);
            }

            TeacherFollow::create([
                'teacher_profile_id' => $profile->id,
                'user_id' => $userId,
            ]);

            return $this->successResponse(null, 'Öğretmen takip edildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen profili bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ParentTeacherController::follow', ['message' => $e->getMessage()]);

            return $this->errorResponse('Takip işlemi başarısız.', 500);
        }
    }

    /**
     * Öğretmen takibini bırak
     */
    public function unfollow(int $teacherProfileId): JsonResponse
    {
        try {
            $userId = $this->user()->id;

            $follow = TeacherFollow::where('teacher_profile_id', $teacherProfileId)
                ->where('user_id', $userId)
                ->firstOrFail();

            $follow->delete();

            return $this->successResponse(null, 'Takip bırakıldı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Takip kaydı bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ParentTeacherController::unfollow', ['message' => $e->getMessage()]);

            return $this->errorResponse('Takip bırakma başarısız.', 500);
        }
    }

    /**
     * Takip edilen veya çocuğun sınıfında atanmış öğretmenlerin blog yazıları (akış)
     */
    public function teacherFeed(): JsonResponse
    {
        try {
            $userId = $this->user()->id;

            $followedTeacherIds = TeacherFollow::where('user_id', $userId)
                ->pluck('teacher_profile_id');

            // Çocukların sınıflarındaki öğretmenleri de ekle
            $familyProfiles = $this->getFamilyProfiles();
            $childIds = $this->collectAccessibleChildIds($familyProfiles);

            $classTeacherIds = collect();
            if ($childIds->isNotEmpty()) {
                $classIds = \Illuminate\Support\Facades\DB::table('child_class_assignments')
                    ->whereIn('child_id', $childIds)
                    ->pluck('class_id');

                if ($classIds->isNotEmpty()) {
                    $classTeacherIds = \Illuminate\Support\Facades\DB::table('class_teacher_assignments')
                        ->whereIn('class_id', $classIds)
                        ->pluck('teacher_profile_id');
                }
            }

            $allTeacherIds = $followedTeacherIds->merge($classTeacherIds)->unique()->values();

            if ($allTeacherIds->isEmpty()) {
                return $this->paginatedResponse(
                    (new \Illuminate\Pagination\LengthAwarePaginator([], 0, 15))->setPath(request()->url())
                );
            }

            $posts = TeacherBlogPost::published()
                ->whereIn('teacher_profile_id', $allTeacherIds)
                ->with(['teacher.user:id,name,surname'])
                ->withCount(['likes', 'comments' => fn ($q) => $q->whereNull('parent_comment_id')])
                ->latest('published_at')
                ->paginate(15);

            $likedPostIds = \App\Models\School\TeacherBlogLike::where('user_id', $userId)
                ->whereIn('blog_post_id', $posts->pluck('id'))
                ->pluck('blog_post_id')
                ->flip();

            return $this->paginatedResponse(
                $posts->through(fn ($p) => $this->formatPost($p, $likedPostIds->has($p->id)))
            );
        } catch (\Throwable $e) {
            Log::error('ParentTeacherController::teacherFeed', ['message' => $e->getMessage()]);

            return $this->errorResponse('Öğretmen akışı alınamadı.', 500);
        }
    }

    /**
     * Belirli bir öğretmenin blog yazıları
     */
    public function teacherPosts(int $teacherProfileId): JsonResponse
    {
        try {
            $userId = $this->user()->id;

            $posts = TeacherBlogPost::published()
                ->where('teacher_profile_id', $teacherProfileId)
                ->with(['teacher.user:id,name,surname'])
                ->withCount(['likes', 'comments' => fn ($q) => $q->whereNull('parent_comment_id')])
                ->latest('published_at')
                ->paginate(15);

            $likedPostIds = \App\Models\School\TeacherBlogLike::where('user_id', $userId)
                ->whereIn('blog_post_id', $posts->pluck('id'))
                ->pluck('blog_post_id')
                ->flip();

            return $this->paginatedResponse(
                $posts->through(fn ($p) => $this->formatPost($p, $likedPostIds->has($p->id)))
            );
        } catch (\Throwable $e) {
            Log::error('ParentTeacherController::teacherPosts', ['message' => $e->getMessage()]);

            return $this->errorResponse('Blog yazıları alınamadı.', 500);
        }
    }

    private function formatPost(TeacherBlogPost $post, bool $isLiked = false): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'description' => $post->description,
            'image_url' => $post->image
                ? \Illuminate\Support\Facades\Storage::disk('public')->url($post->image)
                : null,
            'teacher' => $post->teacher ? [
                'id' => $post->teacher->id,
                'name' => $post->teacher->user->name.' '.$post->teacher->user->surname,
                'title' => $post->teacher->title,
            ] : null,
            'likes_count' => $post->likes_count ?? 0,
            'comments_count' => $post->comments_count ?? 0,
            'is_liked' => $isLiked,
            'published_at' => $post->published_at?->toISOString(),
            'created_at' => $post->created_at?->toISOString(),
        ];
    }
}
