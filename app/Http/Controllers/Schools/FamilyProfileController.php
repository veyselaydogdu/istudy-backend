<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\FamilyProfile\StoreFamilyProfileRequest;
use App\Http\Requests\FamilyProfile\UpdateFamilyProfileRequest;
use App\Http\Resources\FamilyProfileResource;
use App\Models\Child\FamilyProfile;
use App\Services\FamilyProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FamilyProfileController extends BaseSchoolController
{
    public function __construct(protected FamilyProfileService $service) {}

    /**
     * Aile profillerini listele
     */
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', FamilyProfile::class);

            $data = $this->service->getAll(request()->all());

            return $this->paginatedResponse($data);

        } catch (\Throwable $e) {
            Log::error('FamilyProfileController::index Error', [
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
     * Yeni aile profili oluştur
     */
    public function store(StoreFamilyProfileRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', FamilyProfile::class);

            $profile = $this->service->create($request->validated());

            DB::commit();

            return $this->successResponse(
                FamilyProfileResource::make($profile),
                'Aile profili başarıyla oluşturuldu.',
                201
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('FamilyProfileController::store Error', [
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
     * Aile profili detayını getir
     */
    public function show(FamilyProfile $familyProfile): JsonResponse
    {
        try {
            $this->authorize('view', $familyProfile);

            return $this->successResponse(
                FamilyProfileResource::make($familyProfile->load(['members', 'children', 'subscriptions']))
            );

        } catch (\Throwable $e) {
            Log::error('FamilyProfileController::show Error', [
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
     * Aile profili güncelle
     */
    public function update(UpdateFamilyProfileRequest $request, FamilyProfile $familyProfile): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('update', $familyProfile);

            $updatedProfile = $this->service->update($familyProfile, $request->validated());

            DB::commit();

            return $this->successResponse(
                FamilyProfileResource::make($updatedProfile),
                'Aile profili başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('FamilyProfileController::update Error', [
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
     * Aile profili sil
     */
    public function destroy(FamilyProfile $familyProfile): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('delete', $familyProfile);

            $this->service->delete($familyProfile);

            DB::commit();

            return $this->successResponse(null, 'Aile profili başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('FamilyProfileController::destroy Error', [
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
