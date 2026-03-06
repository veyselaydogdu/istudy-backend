<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\SchoolClass\StoreSchoolClassRequest;
use App\Http\Requests\SchoolClass\UpdateSchoolClassRequest;
use App\Http\Resources\SchoolClassResource;
use App\Models\Academic\SchoolClass;
use App\Services\ClassService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ClassController extends BaseSchoolController
{
    protected ClassService $service;

    public function __construct(ClassService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    /**
     * Sınıfları listele
     */
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', SchoolClass::class);

            $data = $this->service->getAll(request()->all());

            return $this->paginatedResponse($data);

        } catch (\Throwable $e) {
            Log::error('ClassController::index Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() ?: 400
            );
        }
    }

    /**
     * Yeni sınıf oluştur
     */
    public function store(StoreSchoolClassRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', SchoolClass::class);

            $data = $request->validated();
            $data['created_by'] = $this->user()->id;
            if (! isset($data['school_id']) && request()->has('school_id')) {
                $data['school_id'] = request('school_id');
            }
            $class = $this->service->create($data);

            DB::commit();

            return $this->successResponse(
                SchoolClassResource::make($class),
                'Sınıf başarıyla oluşturuldu.',
                201
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassController::store Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() ?: 400
            );
        }
    }

    /**
     * Sınıf detayını getir
     */
    public function show(int $school_id, SchoolClass $class): JsonResponse
    {
        try {
            $this->authorize('view', $class);

            return $this->successResponse(
                SchoolClassResource::make($class->load(['academicYear', 'teachers']))
            );

        } catch (\Throwable $e) {
            Log::error('ClassController::show Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() ?: 400
            );
        }
    }

    /**
     * Sınıf güncelle
     */
    public function update(UpdateSchoolClassRequest $request, int $school_id, SchoolClass $class): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('update', $class);

            $data = $request->validated();
            $data['updated_by'] = $this->user()->id;
            $updatedClass = $this->service->update($class, $data);

            DB::commit();

            return $this->successResponse(
                SchoolClassResource::make($updatedClass),
                'Sınıf başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassController::update Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() ?: 400
            );
        }
    }

    /**
     * Sınıf sil
     */
    public function destroy(int $school_id, SchoolClass $class): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('delete', $class);

            $this->service->delete($class);

            DB::commit();

            return $this->successResponse(null, 'Sınıf başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassController::destroy Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() ?: 400
            );
        }
    }

    /**
     * Sınıf aktif/pasif durumunu değiştir
     */
    public function toggleStatus(int $school_id, SchoolClass $class): JsonResponse
    {
        try {
            $class->update([
                'is_active' => ! $class->is_active,
                'updated_by' => $this->user()->id,
            ]);

            $status = $class->is_active ? 'aktif' : 'pasif';

            return $this->successResponse(
                SchoolClassResource::make($class),
                "Sınıf {$status} yapıldı."
            );
        } catch (\Throwable $e) {
            Log::error('ClassController::toggleStatus Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Durum değiştirme başarısız.', 500);
        }
    }
}
