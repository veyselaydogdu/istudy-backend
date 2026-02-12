<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\School\StoreSchoolRequest;
use App\Http\Requests\School\UpdateSchoolRequest;
use App\Http\Resources\SchoolResource;
use App\Models\School\School;
use App\Services\SchoolService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchoolController extends BaseSchoolController
{
    public function __construct(protected SchoolService $service) {}

    /**
     * Okulları listele
     */
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', School::class);

            $data = $this->service->getAll(request()->all());

            return $this->paginatedResponse($data);

        } catch (\Throwable $e) {
            Log::error('SchoolController::index Error', [
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
     * Yeni okul oluştur
     */
    public function store(StoreSchoolRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', School::class);

            $school = $this->service->create($request->validated());

            DB::commit();

            return $this->successResponse(
                SchoolResource::make($school),
                'Okul başarıyla oluşturuldu.',
                201
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SchoolController::store Error', [
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
     * Okul detayını getir
     */
    public function show(School $school): JsonResponse
    {
        try {
            $this->authorize('view', $school);

            return $this->successResponse(
                SchoolResource::make($school->load('academicYears'))
            );

        } catch (\Throwable $e) {
            Log::error('SchoolController::show Error', [
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
     * Okul güncelle
     */
    public function update(UpdateSchoolRequest $request, School $school): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('update', $school);

            $updatedSchool = $this->service->update($school, $request->validated());

            DB::commit();

            return $this->successResponse(
                SchoolResource::make($updatedSchool),
                'Okul başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SchoolController::update Error', [
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
     * Okul sil
     */
    public function destroy(School $school): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('delete', $school);

            $this->service->delete($school);

            DB::commit();

            return $this->successResponse(null, 'Okul başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SchoolController::destroy Error', [
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
