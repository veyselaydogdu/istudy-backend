<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\ActivityLogResource;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Admin Activity Log Controller
 *
 * Süper admin için tüm sistem activity loglarını görüntüleme,
 * filtreleme, istatistik, arşivleme.
 */
class AdminActivityLogController extends BaseController
{
    public function __construct(
        protected ActivityLogService $activityLogService
    ) {}

    /**
     * Activity loglarını listele (kapsamlı filtreleme)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'model_type',
                'model_label',
                'model_id',
                'action',
                'user_id',
                'tenant_id',
                'school_id',
                'date_from',
                'date_to',
                'today',
                'last_days',
                'search',
            ]);

            $perPage = $request->input('per_page', 20);
            $logs = $this->activityLogService->list($filters, (int) $perPage);

            return $this->paginatedResponse(
                ActivityLogResource::collection($logs)
            );
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Tek bir activity log detayı
     */
    public function show(int $id): JsonResponse
    {
        try {
            $log = $this->activityLogService->getDetail($id);

            return $this->successResponse(
                ActivityLogResource::make($log),
                'Activity log detayı.'
            );
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Belirli bir kaydın değişiklik geçmişi
     *
     * GET /api/admin/activity-logs/model/{modelType}/{modelId}
     * Örnek: /api/admin/activity-logs/model/App%5CModels%5CSchool%5CSchool/5
     */
    public function modelHistory(Request $request, string $modelType, int $modelId): JsonResponse
    {
        try {
            // URL'den gelen encoded model type'ı decode et
            $modelType = urldecode($modelType);
            $perPage = $request->input('per_page', 20);

            $logs = $this->activityLogService->getModelHistory($modelType, $modelId, (int) $perPage);

            return $this->paginatedResponse(
                ActivityLogResource::collection($logs)
            );
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::modelHistory Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Bir kaydın belirli bir versiyonunu getir
     *
     * GET /api/admin/activity-logs/version/{modelType}/{modelId}/{logId}
     */
    public function version(string $modelType, int $modelId, int $logId): JsonResponse
    {
        try {
            $modelType = urldecode($modelType);
            $version = $this->activityLogService->getVersionAt($modelType, $modelId, $logId);

            return $this->successResponse($version, 'Kayıt versiyonu.');
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::version Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Belirli bir kullanıcının tüm işlemleri
     */
    public function userActivity(Request $request, int $userId): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 20);
            $logs = $this->activityLogService->getUserActivity($userId, (int) $perPage);

            return $this->paginatedResponse(
                ActivityLogResource::collection($logs)
            );
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::userActivity Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Activity log istatistikleri
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['tenant_id', 'last_days']);
            $stats = $this->activityLogService->getStats($filters);

            return $this->successResponse($stats, 'Activity log istatistikleri.');
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::stats Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Günlük özet (grafikler için)
     */
    public function dailySummary(Request $request): JsonResponse
    {
        try {
            $days = $request->input('days', 30);
            $tenantId = $request->input('tenant_id');

            $summary = $this->activityLogService->getDailySummary(
                (int) $days,
                $tenantId ? (int) $tenantId : null
            );

            return $this->successResponse($summary, 'Günlük activity özeti.');
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::dailySummary Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Mevcut model türlerini listele (filtre dropdown için)
     */
    public function availableModels(): JsonResponse
    {
        try {
            $models = $this->activityLogService->getAvailableModels();

            return $this->successResponse($models, 'Mevcut model türleri.');
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::availableModels Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Eski logları arşivle (manuel trigger)
     */
    public function archive(): JsonResponse
    {
        try {
            $result = $this->activityLogService->archiveOldLogs();

            if ($result['success']) {
                return $this->successResponse($result, 'Arşivleme tamamlandı.');
            }

            return $this->errorResponse('Arşivleme hatası: '.$result['error'], 500);
        } catch (\Throwable $e) {
            Log::error('AdminActivityLogController::archive Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
