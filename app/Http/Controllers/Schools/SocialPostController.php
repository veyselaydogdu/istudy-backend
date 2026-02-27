<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Social\StoreSocialCommentRequest;
use App\Http\Requests\Social\StoreSocialPostRequest;
use App\Http\Requests\Social\UpdateSocialPostRequest;
use App\Http\Resources\Social\SocialPostCommentResource;
use App\Http\Resources\Social\SocialPostResource;
use App\Models\School\School;
use App\Models\Social\SocialPost;
use App\Models\Social\SocialPostComment;
use App\Services\SocialPostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SocialPostController extends BaseController
{
    public function __construct(protected SocialPostService $service) {}

    /**
     * Okul erişimini doğrula.
     * BaseSchoolController'dan farklı olarak ebeveynleri de destekler.
     */
    protected function validateSchoolAccess(int $schoolId): void
    {
        $user = $this->user();
        $isParent = $user->roles()->where('name', 'parent')->exists();

        if ($isParent) {
            // Ebeveyn: çocuklarından birinin kayıtlı olduğu okul olmalı
            $childSchoolIds = $user->familyProfiles()
                ->with('children')
                ->get()
                ->flatMap(fn ($fp) => $fp->children->pluck('school_id'))
                ->unique();

            if (! $childSchoolIds->contains($schoolId)) {
                abort(403, 'Bu okula erişim yetkiniz yok.');
            }
        } else {
            // Diğer kullanıcılar: tenant üzerinden erişim
            $hasAccess = $user->schools()->where('schools.id', $schoolId)->exists();

            if (! $hasAccess) {
                abort(403, 'Bu okula erişim yetkiniz yok.');
            }
        }
    }

    /**
     * Postları listele
     */
    public function index(Request $request, int $school_id): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);
            $this->authorize('viewAny', SocialPost::class);

            $paginator = $this->service->getPostsForUser($this->user(), $school_id, $request->all());

            $resourceClass = SocialPostResource::class;
            $data = collect($paginator->items())->map(fn ($item) => (new $resourceClass($item))->resolve($request));

            return response()->json([
                'success' => true,
                'message' => 'Veriler başarıyla listelendi.',
                'data' => $data,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error('SocialPostController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Yeni post oluştur
     */
    public function store(StoreSocialPostRequest $request, int $school_id): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);
            $this->authorize('create', SocialPost::class);

            DB::beginTransaction();

            $school = School::findOrFail($school_id);

            $data = array_merge($request->validated(), [
                'tenant_id' => $school->tenant_id,
                'school_id' => $school_id,
                'author_id' => $this->user()->id,
                'published_at' => $request->published_at ?? now(),
            ]);

            $classIds = $request->class_ids ?? [];
            $mediaFiles = $request->file('media') ?? [];

            $post = $this->service->createPost($data, $classIds, $mediaFiles);

            DB::commit();

            return $this->successResponse(
                SocialPostResource::make($post)->resolve($request),
                'Paylaşım başarıyla oluşturuldu.',
                201
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SocialPostController::store Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Post detayını getir
     */
    public function show(int $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);
            $this->authorize('view', $socialPost);

            $socialPost->load(['author', 'media', 'classes', 'reactions']);

            return $this->successResponse(
                SocialPostResource::make($socialPost)->resolve(request())
            );

        } catch (\Throwable $e) {
            Log::error('SocialPostController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Post güncelle
     */
    public function update(UpdateSocialPostRequest $request, int $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);
            $this->authorize('update', $socialPost);

            DB::beginTransaction();

            $classIds = $request->class_ids ?? [];
            $data = $request->validated();

            $updated = $this->service->updatePost($socialPost, $data, $classIds);

            DB::commit();

            return $this->successResponse(
                SocialPostResource::make($updated)->resolve($request),
                'Paylaşım başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SocialPostController::update Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Post sil
     */
    public function destroy(int $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);
            $this->authorize('delete', $socialPost);

            DB::beginTransaction();

            $this->service->deletePost($socialPost);

            DB::commit();

            return $this->successResponse(null, 'Paylaşım başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SocialPostController::destroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Tepki ekle / kaldır
     */
    public function react(Request $request, int $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);
            $this->authorize('react', $socialPost);

            $request->validate([
                'type' => ['required', 'in:like,heart,clap'],
            ]);

            $this->service->toggleReaction($socialPost, $this->user(), $request->type);

            $socialPost->loadCount('reactions');

            return $this->successResponse([
                'reactions_count' => $socialPost->reactions_count,
            ], 'Tepki güncellendi.');

        } catch (\Throwable $e) {
            Log::error('SocialPostController::react Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Yorumları listele
     */
    public function comments(Request $request, int $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);
            $this->authorize('view', $socialPost);

            $comments = $socialPost->comments()
                ->with(['user', 'replies.user'])
                ->whereNull('parent_id')
                ->latest()
                ->get();

            return $this->successResponse(
                SocialPostCommentResource::collection($comments)->resolve($request)
            );

        } catch (\Throwable $e) {
            Log::error('SocialPostController::comments Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Yorum ekle
     */
    public function comment(StoreSocialCommentRequest $request, int $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);
            $this->authorize('comment', $socialPost);

            $comment = $this->service->addComment($socialPost, $this->user(), $request->validated());
            $comment->load('user');

            return $this->successResponse(
                SocialPostCommentResource::make($comment)->resolve($request),
                'Yorum başarıyla eklendi.',
                201
            );

        } catch (\Throwable $e) {
            Log::error('SocialPostController::comment Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Yorum sil
     */
    public function deleteComment(int $school_id, SocialPost $socialPost, SocialPostComment $comment): JsonResponse
    {
        try {
            $this->validateSchoolAccess($school_id);

            // Yorum sahibi veya post sahibi veya admin silebilir
            $user = $this->user();
            $canDelete = $comment->user_id === $user->id
                || $socialPost->author_id === $user->id
                || $user->roles()->whereIn('name', ['tenant_owner', 'school_admin'])->exists();

            if (! $canDelete) {
                return $this->errorResponse('Bu yorumu silme yetkiniz yok.', 403);
            }

            $this->service->deleteComment($comment);

            return $this->successResponse(null, 'Yorum başarıyla silindi.');

        } catch (\Throwable $e) {
            Log::error('SocialPostController::deleteComment Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
