<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Admin Dashboard Controller
 *
 * Süper Admin'in tüm sistemi izleyebileceği merkezi dashboard.
 * Tüm istatistikler, gelir raporları, büyüme trendleri ve aktivite logları.
 */
class AdminDashboardController extends BaseController
{
    public function __construct(
        protected AdminDashboardService $service
    ) {}

    /**
     * Genel sistem istatistikleri
     * Kullanıcı, tenant, okul, çocuk, abonelik, paket sayıları
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = $this->service->getSystemStats();

            return $this->successResponse($stats, 'Sistem istatistikleri getirildi.');
        } catch (\Throwable $e) {
            Log::error('Admin dashboard stats hatası: '.$e->getMessage());

            return $this->errorResponse('İstatistikler getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Gelir raporu (yıllık/aylık)
     */
    public function revenue(Request $request): JsonResponse
    {
        $request->validate([
            'year' => 'nullable|integer|min:2020|max:'.(now()->year + 1),
            'month' => 'nullable|integer|min:1|max:12',
        ]);

        try {
            $year = $request->integer('year', now()->year);
            $month = $request->filled('month') ? $request->integer('month') : null;

            $report = $this->service->getRevenueReport($year, $month);

            return $this->successResponse($report, 'Gelir raporu getirildi.');
        } catch (\Throwable $e) {
            Log::error('Admin gelir raporu hatası: '.$e->getMessage());

            return $this->errorResponse('Gelir raporu getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Büyüme trendi — son 12 ay
     */
    public function growth(): JsonResponse
    {
        try {
            $trend = $this->service->getGrowthTrend();

            return $this->successResponse($trend, 'Büyüme trendi getirildi.');
        } catch (\Throwable $e) {
            Log::error('Admin büyüme trendi hatası: '.$e->getMessage());

            return $this->errorResponse('Büyüme trendi getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * En aktif okullar
     */
    public function topSchools(Request $request): JsonResponse
    {
        try {
            $limit = $request->input('limit', 10);
            $schools = $this->service->getTopSchools($limit);

            return $this->successResponse($schools, 'En aktif okullar getirildi.');
        } catch (\Throwable $e) {
            Log::error('Admin top schools hatası: '.$e->getMessage());

            return $this->errorResponse('En aktif okullar getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Paket dağılımı
     */
    public function packageDistribution(): JsonResponse
    {
        try {
            $distribution = $this->service->getPackageDistribution();

            return $this->successResponse($distribution, 'Paket dağılımı getirildi.');
        } catch (\Throwable $e) {
            Log::error('Admin paket dağılımı hatası: '.$e->getMessage());

            return $this->errorResponse('Paket dağılımı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Son aktiviteler (audit log)
     */
    public function recentActivities(Request $request): JsonResponse
    {
        try {
            $limit = $request->input('limit', 50);
            $activities = $this->service->getRecentActivities($limit);

            return $this->successResponse($activities, 'Son aktiviteler getirildi.');
        } catch (\Throwable $e) {
            Log::error('Admin recent activities hatası: '.$e->getMessage());

            return $this->errorResponse('Son aktiviteler getirilirken bir hata oluştu.', 500);
        }
    }
}
