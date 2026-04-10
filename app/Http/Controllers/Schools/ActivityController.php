<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\Activity\StoreActivityRequest;
use App\Http\Requests\Activity\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity\Activity;
use App\Models\Activity\ActivityEnrollment;
use App\Models\Activity\ActivityGalleryItem;
use App\Services\ActivityInvoiceService;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class ActivityController extends BaseSchoolController
{
    public function __construct(protected ActivityService $service)
    {
        parent::__construct();
    }

    /**
     * Aktiviteleri listele
     */
    public function index(int $school_id): JsonResponse
    {
        try {
            $this->authorize('viewAny', Activity::class);

            $filters = array_merge(request()->all(), ['school_id' => $school_id]);
            $data = $this->service->getAll($filters);
            $data->getCollection()->each->loadMissing('classes');

            return $this->paginatedResponse(ActivityResource::collection($data));

        } catch (\Throwable $e) {
            Log::error('ActivityController::index Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Yeni aktivite oluştur
     */
    public function store(StoreActivityRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', Activity::class);

            $activity = $this->service->create($request->validated());

            if ($request->has('class_ids')) {
                $activity->classes()->sync($request->class_ids ?? []);
            }

            DB::commit();

            return $this->successResponse(
                ActivityResource::make($activity->load(['classes'])),
                'Aktivite başarıyla oluşturuldu.',
                201
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityController::store Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Aktivite detayını getir
     */
    public function show(int $school_id, Activity $activity): JsonResponse
    {
        try {
            $this->authorize('view', $activity);

            return $this->successResponse(
                ActivityResource::make($activity->load(['children', 'classes']))
            );

        } catch (\Throwable $e) {
            Log::error('ActivityController::show Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Aktivite güncelle.
     * is_paid false'a çevrilirse mevcut faturalar iade/iptal edilir.
     */
    public function update(UpdateActivityRequest $request, int $school_id, Activity $activity): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('update', $activity);

            $wasPaid = (bool) $activity->is_paid;
            $validated = $request->validated();
            $becomingFree = $wasPaid && array_key_exists('is_paid', $validated) && ! $validated['is_paid'];

            $updatedActivity = $this->service->update($activity, $validated);

            if ($request->has('class_ids')) {
                $updatedActivity->classes()->sync($request->class_ids ?? []);
            }

            // Ücretli → ücretsiz geçişinde tüm aktif faturaları işle
            if ($becomingFree) {
                (new ActivityInvoiceService)->handleActivityPaidToFree($updatedActivity);
            }

            DB::commit();

            return $this->successResponse(
                ActivityResource::make($updatedActivity->load(['classes'])),
                'Aktivite başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityController::update Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Aktivite sil
     */
    public function destroy(int $school_id, Activity $activity): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('delete', $activity);

            $this->service->delete($activity);

            DB::commit();

            return $this->successResponse(null, 'Aktivite başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityController::destroy Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Silinmiş aktiviteyi geri yükle
     */
    public function restore(int $school_id, int $activityId): JsonResponse
    {
        try {
            $activity = Activity::withTrashed()->findOrFail($activityId);
            $this->authorize('delete', $activity);

            $activity->restore();

            return $this->successResponse(null, 'Aktivite başarıyla geri yüklendi.');
        } catch (\Throwable $e) {
            Log::error('ActivityController::restore Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // ── Katılımcılar ──────────────────────────────────────────────────────────

    public function enrollmentIndex(int $school_id, Activity $activity): JsonResponse
    {
        try {
            $enrollments = ActivityEnrollment::where('activity_id', $activity->id)
                ->with([
                    'familyProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('owner'),
                    'child' => fn ($q) => $q->withoutGlobalScope('tenant')->select('id', 'first_name', 'last_name'),
                ])
                ->orderBy('enrolled_at')
                ->get();

            // Aile bazında grupla — her ailenin kayıtlı çocukları child_id üzerinden gelir
            $grouped = $enrollments
                ->groupBy('family_profile_id')
                ->map(function ($familyEnrollments) {
                    $first = $familyEnrollments->first();

                    return [
                        'id' => $first->id,
                        'family_profile_id' => $first->family_profile_id,
                        'owner_name' => $first->familyProfile?->owner
                            ? trim($first->familyProfile->owner->name.' '.($first->familyProfile->owner->surname ?? ''))
                            : null,
                        'owner_phone' => $first->familyProfile?->owner?->phone,
                        'owner_email' => $first->familyProfile?->owner?->email,
                        'children' => $familyEnrollments
                            ->filter(fn ($e) => $e->child !== null)
                            ->map(fn ($e) => [
                                'id' => $e->child->id,
                                'full_name' => trim($e->child->first_name.' '.($e->child->last_name ?? '')),
                            ])->values(),
                        'enrolled_at' => $first->enrolled_at,
                    ];
                })
                ->values();

            return $this->successResponse($grouped);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    // ── Galeri ────────────────────────────────────────────────────────────────

    public function galleryIndex(int $school_id, Activity $activity): JsonResponse
    {
        try {
            $items = $activity->gallery()->get()->map(fn ($item) => $this->formatGalleryItem($item));

            return $this->successResponse($items);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function galleryStore(Request $request, int $school_id, Activity $activity): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:51200|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,mkv,webm,pdf,doc,docx,xls,xlsx,ppt,pptx,txt',
            'caption' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        try {
            $file = $request->file('file');
            $mime = $file->getMimeType();

            $fileType = match (true) {
                str_starts_with($mime, 'image/') => 'image',
                str_starts_with($mime, 'video/') => 'video',
                default => 'document',
            };

            $tenantId = $this->user()->tenant_id;
            $path = $file->store("tenants/{$tenantId}/activities/{$activity->id}/gallery", 'local');

            $item = $activity->gallery()->create([
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $mime,
                'file_size' => $file->getSize(),
                'file_type' => $fileType,
                'caption' => $request->caption,
                'sort_order' => $request->sort_order ?? 0,
                'uploaded_by' => $this->user()->id,
            ]);

            return $this->successResponse($this->formatGalleryItem($item), 'Dosya yüklendi.', 201);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function galleryDestroy(int $school_id, Activity $activity, ActivityGalleryItem $galleryItem): JsonResponse
    {
        try {
            Storage::disk('local')->delete($galleryItem->file_path);
            $galleryItem->delete();

            return $this->successResponse(null, 'Dosya silindi.');
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function serveGalleryItem(ActivityGalleryItem $galleryItem)
    {
        abort_unless(Storage::disk('local')->exists($galleryItem->file_path), 404);

        return Storage::disk('local')->response(
            $galleryItem->file_path,
            $galleryItem->original_name,
            ['Content-Type' => $galleryItem->mime_type]
        );
    }

    private function formatGalleryItem(ActivityGalleryItem $item): array
    {
        return [
            'id' => $item->id,
            'file_type' => $item->file_type,
            'mime_type' => $item->mime_type,
            'file_size' => $item->file_size,
            'original_name' => $item->original_name,
            'caption' => $item->caption,
            'sort_order' => $item->sort_order,
            'url' => URL::signedRoute('activity-gallery.serve', ['galleryItem' => $item->id], now()->addHours(2)),
            'created_at' => $item->created_at,
        ];
    }
}
