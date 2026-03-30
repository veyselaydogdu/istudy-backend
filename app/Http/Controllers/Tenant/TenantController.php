<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Requests\Tenant\UpdateTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant\Tenant;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TenantController extends BaseTenantController
{
    public function __construct(protected TenantService $service) {}

    /**
     * Kiracı listele
     */
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Tenant::class);

            $data = $this->service->getAll(request()->all());

            return $this->paginatedResponse($data);

        } catch (\Throwable $e) {
            Log::error('TenantController::index Error', [
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
     * Kiracı detayını getir
     */
    public function show(Tenant $tenant): JsonResponse
    {
        try {
            $this->authorize('view', $tenant);

            return $this->successResponse(
                TenantResource::make($tenant->load(['owner']))
            );

        } catch (\Throwable $e) {
            Log::error('TenantController::show Error', [
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
     * Kiracı güncelle
     */
    public function update(UpdateTenantRequest $request, Tenant $tenant): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('update', $tenant);

            $updatedTenant = $this->service->update($tenant, $request->validated());

            DB::commit();

            return $this->successResponse(
                TenantResource::make($updatedTenant),
                'Tenant updated successfully'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantController::update Error', [
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
     * Kiracı sil
     */
    public function destroy(Tenant $tenant): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('delete', $tenant);

            $this->service->delete($tenant);

            DB::commit();

            return $this->successResponse(null, 'Tenant deleted successfully');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantController::destroy Error', [
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
