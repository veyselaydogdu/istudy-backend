<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Social\StoreSocialCommentRequest;
use App\Http\Requests\Social\StoreSocialPostRequest;
use App\Http\Requests\Social\UpdateSocialPostRequest;
use App\Http\Resources\Social\SocialPostCommentResource;
use App\Http\Resources\Social\SocialPostResource;
use App\Models\Academic\SchoolClass;
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
     * ULID veya integer school_id'yi integer PK'ya çözümle.
     * Aynı zamanda okul bazlı erişim kontrolü yapar (tenant veya ebeveyn).
     */
    protected function resolveSchoolId(string|int $schoolParam): int
    {
        $user = $this->user();
        $isParent = $user->isParent();

        if ($isParent) {
            $query = is_numeric($schoolParam)
                ? School::where('id', (int) $schoolParam)
                : School::where('ulid', $schoolParam);

            $school = $query->first();

            if (! $school) {
                abort(404);
            }

            $childSchoolIds = $user->familyProfiles()
                ->with('children')
                ->get()
                ->flatMap(fn ($fp) => $fp->children->pluck('school_id'))
                ->unique();

            if (! $childSchoolIds->contains($school->id)) {
                abort(403, 'Bu okula erişim yetkiniz yok.');
            }

            return $school->id;
        }

        $query = School::where('tenant_id', $user->tenant_id);

        if (is_numeric($schoolParam)) {
            $query->where('id', (int) $schoolParam);
        } else {
            $query->where('ulid', $schoolParam);
        }

        $school = $query->first();

        if (! $school) {
            abort(403, 'Bu okula erişim yetkiniz yok.');
        }

        return $school->id;
    }

    /**
     * ULID veya integer class_ids dizisini integer PK dizisine çözümle.
     *
     * @param  array<string|int>  $classIds
     * @return array<int>
     */
    protected function resolveClassIds(array $classIds): array
    {
        if (empty($classIds)) {
            return [];
        }

        $ulidIds = array_filter($classIds, fn ($v) => ! is_numeric($v));
        $intIds = array_filter($classIds, fn ($v) => is_numeric($v));

        $resolved = array_map('intval', $intIds);

        if (! empty($ulidIds)) {
            $fromUlid = SchoolClass::whereIn('ulid', $ulidIds)->pluck('id')->all();
            $resolved = array_merge($resolved, $fromUlid);
        }

        return array_values(array_unique($resolved));
    }

    /**
     * Postları listele
     */
    public function index(Request $request, string $school_id): JsonResponse
    {
        try {
            $schoolId = $this->resolveSchoolId($school_id);
            $this->authorize('viewAny', SocialPost::class);

            $paginator = $this->service->getPostsForUser($this->user(), $schoolId, $request->all());

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
    public function store(StoreSocialPostRequest $request, string $school_id): JsonResponse
    {
        try {
            $schoolId = $this->resolveSchoolId($school_id);
            $this->authorize('create', SocialPost::class);

            DB::beginTransaction();

            $school = School::findOrFail($schoolId);

            $data = array_merge($request->validated(), [
                'tenant_id' => $school->tenant_id,
                'school_id' => $schoolId,
                'author_id' => $this->user()->id,
                'published_at' => $request->published_at ?? now(),
            ]);

            $classIds = $this->resolveClassIds($request->class_ids ?? []);
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
    public function show(string $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->resolveSchoolId($school_id);
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
    public function update(UpdateSocialPostRequest $request, string $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->resolveSchoolId($school_id);
            $this->authorize('update', $socialPost);

            DB::beginTransaction();

            $classIds = $this->resolveClassIds($request->class_ids ?? []);
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
    public function destroy(string $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->resolveSchoolId($school_id);
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
    public function react(Request $request, string $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->resolveSchoolId($school_id);
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
    public function comments(Request $request, string $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->resolveSchoolId($school_id);
            $this->authorize('view', $socialPost);

            $comments = $socialPost->comments()
                ->withTrashed()
                ->with(['user', 'replies' => fn ($q) => $q->withTrashed()->with('user')])
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
    public function comment(StoreSocialCommentRequest $request, string $school_id, SocialPost $socialPost): JsonResponse
    {
        try {
            $this->resolveSchoolId($school_id);
            $this->authorize('comment', $socialPost);

            $user = $this->user();

            $recentComment = SocialPostComment::where('user_id', $user->id)
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

            $comment = $this->service->addComment($socialPost, $user, $request->validated());
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
    public function deleteComment(string $school_id, SocialPost $socialPost, SocialPostComment $comment): JsonResponse
    {
        try {
            $this->resolveSchoolId($school_id);

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
