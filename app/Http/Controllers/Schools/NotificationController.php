<?php

namespace App\Http\Controllers\Schools;

use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Bildirim Controller
 *
 * Gelişmiş bildirim sistemi: oluşturma, listeleme, okundu işaretleme, tercihler.
 */
class NotificationController extends BaseSchoolController
{
    public function __construct(
        protected NotificationService $service
    ) {
        parent::__construct();
    }

    /**
     * Tüm bildirimlerimi listele
     */
    public function index(): JsonResponse
    {
        try {
            $notifications = $this->service->allForUser($this->user()->id);

            return $this->paginatedResponse(
                NotificationResource::collection($notifications)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Bildirimler listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Bildirimler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okunmamış bildirimlerimi listele
     */
    public function unread(): JsonResponse
    {
        try {
            $notifications = $this->service->unreadForUser($this->user()->id);

            return $this->paginatedResponse(
                NotificationResource::collection($notifications)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Okunmamış bildirimler hatası: ' . $e->getMessage());

            return $this->errorResponse('Bildirimler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okunmamış bildirim sayısı
     */
    public function unreadCount(): JsonResponse
    {
        try {
            $count = $this->service->unreadCount($this->user()->id);

            return $this->successResponse(['count' => $count]);
        } catch (\Throwable $e) {
            Log::error('Bildirim sayısı hatası: ' . $e->getMessage());

            return $this->errorResponse('Bildirim sayısı alınırken bir hata oluştu.', 500);
        }
    }

    /**
     * Bildirim oluştur ve gönder
     */
    public function store(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'school_id' => 'required|exists:schools,id',
                'class_id' => 'nullable|exists:classes,id',
                'type' => 'required|string|in:event,activity,material,attendance,meal,homework,announcement,general',
                'title' => 'required|string|max:255',
                'body' => 'required|string',
                'action_type' => 'nullable|string',
                'action_id' => 'nullable|integer',
                'priority' => 'nullable|string|in:low,normal,high,urgent',
                'target_roles' => 'nullable|array',
                'target_user_ids' => 'nullable|array',
                'scheduled_at' => 'nullable|date|after:now',
            ]);

            $data = $request->all();
            $data['created_by'] = $this->user()->id;

            $notification = $this->service->createAndDispatch($data);

            DB::commit();

            return $this->successResponse(
                new NotificationResource($notification),
                'Bildirim başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Bildirim oluşturma hatası: ' . $e->getMessage());

            return $this->errorResponse('Bildirim oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Bildirimi okundu olarak işaretle
     */
    public function markAsRead(int $notificationId): JsonResponse
    {
        try {
            $this->service->markAsRead($notificationId, $this->user()->id);

            return $this->successResponse(null, 'Bildirim okundu olarak işaretlendi.');
        } catch (\Throwable $e) {
            Log::error('Bildirim okundu işaretleme hatası: ' . $e->getMessage());

            return $this->errorResponse('İşlem sırasında bir hata oluştu.', 500);
        }
    }

    /**
     * Tüm bildirimleri okundu olarak işaretle
     */
    public function markAllAsRead(): JsonResponse
    {
        try {
            $this->service->markAllAsRead($this->user()->id);

            return $this->successResponse(null, 'Tüm bildirimler okundu olarak işaretlendi.');
        } catch (\Throwable $e) {
            Log::error('Tüm bildirimler okundu işaretleme hatası: ' . $e->getMessage());

            return $this->errorResponse('İşlem sırasında bir hata oluştu.', 500);
        }
    }

    /**
     * Bildirim tercihlerimi getir
     */
    public function preferences(): JsonResponse
    {
        try {
            $preferences = $this->service->getPreferences($this->user()->id);

            return $this->successResponse($preferences);
        } catch (\Throwable $e) {
            Log::error('Bildirim tercihleri hatası: ' . $e->getMessage());

            return $this->errorResponse('Tercihler getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Bildirim tercihlerimi güncelle
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'preferences' => 'required|array',
                'preferences.*.push_enabled' => 'boolean',
                'preferences.*.email_enabled' => 'boolean',
                'preferences.*.sms_enabled' => 'boolean',
            ]);

            $this->service->updatePreferences($this->user()->id, $request->preferences);

            return $this->successResponse(null, 'Bildirim tercihleri güncellendi.');
        } catch (\Throwable $e) {
            Log::error('Bildirim tercihleri güncelleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Tercihler güncellenirken bir hata oluştu.', 500);
        }
    }
}
