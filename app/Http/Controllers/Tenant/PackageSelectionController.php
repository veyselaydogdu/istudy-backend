<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Resources\PackageResource;
use App\Http\Resources\TenantSubscriptionResource;
use App\Services\PackageService;
use App\Services\TenantSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Müşterinin paket seçimi ve abonelik yönetimi
 */
class PackageSelectionController extends BaseTenantController
{
    public function __construct(
        protected PackageService $packageService,
        protected TenantSubscriptionService $subscriptionService
    ) {}

    /**
     * Aktif paketleri listele (müşteri görünümü)
     */
    public function availablePackages(): JsonResponse
    {
        try {
            $packages = $this->packageService->getActivePackages();

            return $this->successResponse(
                PackageResource::collection($packages),
                'Mevcut paketler listelendi.'
            );
        } catch (Throwable $e) {
            Log::error('PackageSelectionController::availablePackages Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Paket satın al / Abonelik oluştur
     */
    public function subscribe(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $request->validate([
                'package_id' => 'required|exists:packages,id',
                'billing_cycle' => 'required|in:monthly,yearly',
                'payment_method' => 'nullable|string|in:credit_card,bank_transfer',
                'auto_renew' => 'nullable|boolean',
            ]);

            $tenant = $this->tenant();

            $result = $this->subscriptionService->subscribe($tenant, $request->all());

            DB::commit();

            return $this->successResponse([
                'subscription' => TenantSubscriptionResource::make($result['subscription']),
                'payment' => $result['payment'],
            ], 'Abonelik başarıyla oluşturuldu.', 201);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PackageSelectionController::subscribe Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $code = $e->getCode() ?: 400;

            return $this->errorResponse($e->getMessage(), $code);
        }
    }

    /**
     * Mevcut abonelik bilgileri
     */
    public function currentSubscription(): JsonResponse
    {
        try {
            $tenant = $this->tenant();
            $subscription = $this->subscriptionService->getCurrentSubscription($tenant);

            if (! $subscription) {
                return $this->successResponse(null, 'Aktif abonelik bulunmuyor.');
            }

            return $this->successResponse(
                TenantSubscriptionResource::make($subscription),
                'Aktif abonelik bilgileri.'
            );
        } catch (Throwable $e) {
            Log::error('PackageSelectionController::currentSubscription Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Abonelik geçmişi
     */
    public function subscriptionHistory(): JsonResponse
    {
        try {
            $tenant = $this->tenant();
            $history = $this->subscriptionService->getSubscriptionHistory($tenant);

            return $this->paginatedResponse(
                TenantSubscriptionResource::collection($history)
            );
        } catch (Throwable $e) {
            Log::error('PackageSelectionController::subscriptionHistory Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Kullanım raporu (limit durumları)
     */
    public function usageReport(): JsonResponse
    {
        try {
            $tenant = $this->tenant();
            $report = $this->subscriptionService->getUsageReport($tenant);

            return $this->successResponse($report, 'Kullanım raporu.');
        } catch (Throwable $e) {
            Log::error('PackageSelectionController::usageReport Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Aboneliği iptal et
     */
    public function cancelSubscription(): JsonResponse
    {
        try {
            DB::beginTransaction();

            $tenant = $this->tenant();
            $this->subscriptionService->cancelExistingSubscription($tenant);

            DB::commit();

            return $this->successResponse(null, 'Abonelik iptal edildi.');
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PackageSelectionController::cancelSubscription Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }
}
