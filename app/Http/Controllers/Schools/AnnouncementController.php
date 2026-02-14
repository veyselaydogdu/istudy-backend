<?php

namespace App\Http\Controllers\Schools;

use App\Http\Resources\AnnouncementResource;
use App\Models\School\Announcement;
use App\Services\AnnouncementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Duyuru Controller
 *
 * Okul ve sınıf bazlı duyuru yönetimi.
 */
class AnnouncementController extends BaseSchoolController
{
    public function __construct(
        protected AnnouncementService $service
    ) {
        parent::__construct();
    }

    /**
     * Duyuruları listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['school_id', 'class_id', 'type', 'is_pinned', 'active_only']);
            $announcements = $this->service->list($filters, 15);

            return $this->paginatedResponse(
                AnnouncementResource::collection($announcements)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Duyurular listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Duyurular listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Duyuru detayı
     */
    public function show(Announcement $announcement): JsonResponse
    {
        try {
            return $this->successResponse(new AnnouncementResource($announcement));
        } catch (\Throwable $e) {
            Log::error('Duyuru detay hatası: ' . $e->getMessage());

            return $this->errorResponse('Duyuru detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni duyuru oluştur
     */
    public function store(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'school_id' => 'required|exists:schools,id',
                'class_id' => 'nullable|exists:classes,id',
                'title' => 'required|string|max:255',
                'body' => 'required|string',
                'type' => 'nullable|string|in:general,urgent,event,homework',
                'is_pinned' => 'nullable|boolean',
                'publish_at' => 'nullable|date',
                'expire_at' => 'nullable|date|after:publish_at',
            ]);

            $data = $request->all();
            $data['created_by'] = $this->user()->id;

            $announcement = $this->service->create($data);

            DB::commit();

            return $this->successResponse(
                new AnnouncementResource($announcement),
                'Duyuru başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Duyuru oluşturma hatası: ' . $e->getMessage());

            return $this->errorResponse('Duyuru oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Duyuru güncelle
     */
    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'title' => 'sometimes|string|max:255',
                'body' => 'sometimes|string',
                'type' => 'nullable|string|in:general,urgent,event,homework',
                'is_pinned' => 'nullable|boolean',
                'publish_at' => 'nullable|date',
                'expire_at' => 'nullable|date',
            ]);

            $data = $request->all();
            $data['updated_by'] = $this->user()->id;

            $this->service->update($announcement, $data);

            DB::commit();

            return $this->successResponse(
                new AnnouncementResource($announcement->fresh()),
                'Duyuru başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Duyuru güncelleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Duyuru güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Duyuru sil
     */
    public function destroy(Announcement $announcement): JsonResponse
    {
        DB::beginTransaction();
        try {
            $announcement->delete();

            DB::commit();

            return $this->successResponse(null, 'Duyuru başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Duyuru silme hatası: ' . $e->getMessage());

            return $this->errorResponse('Duyuru silinirken bir hata oluştu.', 500);
        }
    }
}
