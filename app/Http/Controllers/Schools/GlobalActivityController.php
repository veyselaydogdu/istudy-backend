<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\ActivityResource;
use App\Models\Activity\Activity;
use App\Models\Activity\ActivityEnrollment;
use App\Models\Activity\ActivityGalleryItem;
use App\Services\ActivityInvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/**
 * Tenant tarafından oluşturulan global etkinlikler.
 * is_global = true, school_id = NULL — tüm tenant ve veliler görebilir.
 */
class GlobalActivityController extends BaseController
{
    public function index(): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $query = Activity::withoutGlobalScope('tenant')
                ->where('is_global', true)
                ->where('tenant_id', $tenantId)
                ->withCount('enrollments')
                ->with(['classes:id,name'])
                ->latest('start_date');

            if (request()->filled('status')) {
                match (request('status')) {
                    'active' => $query->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString())),
                    'ended' => $query->whereNotNull('end_date')->where('end_date', '<', now()->toDateString()),
                    default => null,
                };
            }

            if (request()->filled('search')) {
                $query->where('name', 'like', '%'.request('search').'%');
            }

            $data = $query->paginate(request()->integer('per_page', 15));

            return $this->paginatedResponse(ActivityResource::collection($data));
        } catch (\Throwable $e) {
            Log::error('GlobalActivityController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse('Etkinlikler yüklenemedi.', 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_paid' => 'boolean',
            'is_enrollment_required' => 'boolean',
            'cancellation_allowed' => 'boolean',
            'cancellation_deadline' => 'nullable|date',
            'price' => 'nullable|numeric|min:0|required_if:is_paid,true',
            'capacity' => 'nullable|integer|min:1',
            'address' => 'nullable|string|max:500',
            'start_date' => 'nullable|date',
            'start_time' => 'nullable|string|max:5',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'end_time' => 'nullable|string|max:5',
            'materials' => 'nullable|array',
            'materials.*' => 'string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $activity = Activity::create(array_merge($validated, [
                'is_global' => true,
                'school_id' => null,
                'tenant_id' => $this->user()->tenant_id,
                'created_by' => $this->user()->id,
            ]));

            DB::commit();

            return $this->successResponse(
                ActivityResource::make($activity),
                'Global etkinlik başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('GlobalActivityController::store', ['message' => $e->getMessage()]);

            return $this->errorResponse('Etkinlik oluşturulamadı.', 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $activity = $this->findOwned($id);
            $activity->load(['classes:id,name', 'gallery']);
            $activity->loadCount('enrollments');

            return $this->successResponse(ActivityResource::make($activity));
        } catch (\Throwable $e) {
            Log::error('GlobalActivityController::show', ['message' => $e->getMessage()]);

            return $this->errorResponse('Etkinlik bulunamadı.', 404);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_paid' => 'boolean',
            'is_enrollment_required' => 'boolean',
            'cancellation_allowed' => 'boolean',
            'cancellation_deadline' => 'nullable|date',
            'price' => 'nullable|numeric|min:0',
            'capacity' => 'nullable|integer|min:1',
            'address' => 'nullable|string|max:500',
            'start_date' => 'nullable|date',
            'start_time' => 'nullable|string|max:5',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'end_time' => 'nullable|string|max:5',
            'materials' => 'nullable|array',
            'materials.*' => 'string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $activity = $this->findOwned($id);

            $wasPaid = (bool) $activity->is_paid;
            $becomingFree = $wasPaid && array_key_exists('is_paid', $validated) && ! $validated['is_paid'];

            $activity->update(array_merge($validated, ['updated_by' => $this->user()->id]));

            if ($becomingFree) {
                (new ActivityInvoiceService)->handleActivityPaidToFree($activity);
            }

            DB::commit();

            return $this->successResponse(ActivityResource::make($activity), 'Etkinlik güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('GlobalActivityController::update', ['message' => $e->getMessage()]);

            return $this->errorResponse('Etkinlik güncellenemedi.', 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $activity = $this->findOwned($id);
            $invoiceService = new ActivityInvoiceService;

            ActivityEnrollment::where('activity_id', $activity->id)
                ->whereNotNull('invoice_id')
                ->get()
                ->each(fn ($e) => $invoiceService->handleEnrollmentCancellation($e, "Etkinlik silindi: {$activity->name}"));

            $activity->delete();

            DB::commit();

            return $this->successResponse(null, 'Etkinlik silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('GlobalActivityController::destroy', ['message' => $e->getMessage()]);

            return $this->errorResponse('Etkinlik silinemedi.', 500);
        }
    }

    // ── Katılımcılar ──────────────────────────────────────────────────────────

    public function enrollmentIndex(int $id): JsonResponse
    {
        try {
            $activity = $this->findOwned($id);

            $enrollments = ActivityEnrollment::where('activity_id', $activity->id)
                ->with([
                    'familyProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('owner'),
                    'child' => fn ($q) => $q->withoutGlobalScope('tenant')->select('id', 'first_name', 'last_name'),
                ])
                ->orderBy('enrolled_at')
                ->get();

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
            return $this->errorResponse('Kayıtlar yüklenemedi.', 500);
        }
    }

    // ── Galeri ────────────────────────────────────────────────────────────────

    public function galleryIndex(int $id): JsonResponse
    {
        try {
            $activity = $this->findOwned($id);
            $items = $activity->gallery()->get()->map(fn ($item) => $this->formatGalleryItem($item));

            return $this->successResponse($items);
        } catch (\Throwable $e) {
            return $this->errorResponse('Galeri yüklenemedi.', 500);
        }
    }

    public function galleryStore(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:51200|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,mkv,webm,pdf,doc,docx,xls,xlsx,ppt,pptx,txt',
            'caption' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        try {
            $activity = $this->findOwned($id);
            $file = $request->file('file');
            $mime = $file->getMimeType();
            $fileType = match (true) {
                str_starts_with($mime, 'image/') => 'image',
                str_starts_with($mime, 'video/') => 'video',
                default => 'document',
            };

            $tenantId = $this->user()->tenant_id;
            $path = $file->store("tenants/{$tenantId}/global-activities/{$activity->id}/gallery", 'local');

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
            return $this->errorResponse('Dosya yüklenemedi.', 500);
        }
    }

    public function galleryDestroy(int $id, ActivityGalleryItem $galleryItem): JsonResponse
    {
        try {
            $this->findOwned($id);
            Storage::disk('local')->delete($galleryItem->file_path);
            $galleryItem->delete();

            return $this->successResponse(null, 'Dosya silindi.');
        } catch (\Throwable $e) {
            return $this->errorResponse('Dosya silinemedi.', 500);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findOwned(int $id): Activity
    {
        $activity = Activity::withoutGlobalScope('tenant')
            ->where('is_global', true)
            ->findOrFail($id);

        if ($activity->tenant_id !== $this->user()->tenant_id) {
            abort(403, 'Bu etkinliğe erişim yetkiniz yok.');
        }

        return $activity;
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
