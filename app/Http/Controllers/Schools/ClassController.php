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
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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

            return $this->paginatedResponse(SchoolClassResource::collection($data));

        } catch (\Throwable $e) {
            Log::error('ClassController::index Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            return $this->errorResponse('Bir hata oluştu.', 500);
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

            // Logo yükle
            if ($request->hasFile('logo')) {
                $schoolId = $data['school_id'];
                $path = $request->file('logo')->store("class-logos/{$schoolId}", 'local');
                $data['logo'] = $path;
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
            Log::error('ClassController::store Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Bir hata oluştu.', 500);
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
            Log::error('ClassController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Bir hata oluştu.', 500);
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

            // Yeni logo yükle
            if ($request->hasFile('logo')) {
                if ($class->logo) {
                    Storage::disk('local')->delete($class->logo);
                }
                $path = $request->file('logo')->store("class-logos/{$class->school_id}", 'local');
                $data['logo'] = $path;
                // Logo yüklenince ikonı temizle
                $data['icon'] = null;
            }

            // İkon seçildiyse logoyu temizle
            if ($request->filled('icon') && ! $request->hasFile('logo')) {
                if ($class->logo) {
                    Storage::disk('local')->delete($class->logo);
                }
                $data['logo'] = null;
            }

            $updatedClass = $this->service->update($class, $data);

            DB::commit();

            return $this->successResponse(
                SchoolClassResource::make($updatedClass),
                'Sınıf başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassController::update Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Bir hata oluştu.', 500);
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

            // Logo varsa sil
            if ($class->logo) {
                Storage::disk('local')->delete($class->logo);
            }

            $this->service->delete($class);

            DB::commit();

            return $this->successResponse(null, 'Sınıf başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassController::destroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Bir hata oluştu.', 500);
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

    /**
     * Sınıf logosunu sun (imzalı URL ile erişilir)
     */
    public function serveLogo(SchoolClass $class): BinaryFileResponse|JsonResponse
    {
        if (! $class->logo || ! Storage::disk('local')->exists($class->logo)) {
            return $this->errorResponse('Logo bulunamadı.', 404);
        }

        return Storage::disk('local')->response($class->logo);
    }
}
