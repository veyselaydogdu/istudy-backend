<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Requests\Subscription\StoreSubscriptionRequest;
use App\Http\Requests\Subscription\UpdateSubscriptionRequest;
use App\Http\Resources\SubscriptionResource;
use App\Models\Billing\FamilySubscription;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends BaseTenantController
{
    public function __construct(protected SubscriptionService $service) {}

    /**
     * Abonelikleri listele
     */
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', FamilySubscription::class);

            $data = $this->service->getAll(request()->all());

            return $this->paginatedResponse($data);

        } catch (\Throwable $e) {
            Log::error('SubscriptionController::index Error', [
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
     * Yeni abonelik oluştur
     */
    public function store(StoreSubscriptionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', FamilySubscription::class);

            $subscription = $this->service->create($request->validated());

            DB::commit();

            return $this->successResponse(
                SubscriptionResource::make($subscription),
                'Abonelik başarıyla oluşturuldu.',
                201
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SubscriptionController::store Error', [
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
     * Abonelik detayını getir
     */
    public function show(FamilySubscription $subscription): JsonResponse
    {
        try {
            $this->authorize('view', $subscription);

            return $this->successResponse(
                SubscriptionResource::make($subscription->load(['family', 'plan', 'payments']))
            );

        } catch (\Throwable $e) {
            Log::error('SubscriptionController::show Error', [
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
     * Abonelik güncelle
     */
    public function update(UpdateSubscriptionRequest $request, FamilySubscription $subscription): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('update', $subscription);

            $updatedSubscription = $this->service->update($subscription, $request->validated());

            DB::commit();

            return $this->successResponse(
                SubscriptionResource::make($updatedSubscription),
                'Abonelik başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SubscriptionController::update Error', [
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
     * Abonelik sil
     */
    public function destroy(FamilySubscription $subscription): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('delete', $subscription);

            $this->service->delete($subscription);

            DB::commit();

            return $this->successResponse(null, 'Abonelik başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SubscriptionController::destroy Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
