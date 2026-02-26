<?php

namespace App\Http\Controllers\Schools;

use App\Http\Resources\AcademicYearResource;
use App\Models\Academic\AcademicYear;
use App\Services\AcademicYearService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Eğitim Yılı Controller
 *
 * Okulların eğitim yılı yönetimi:
 * - Yeni eğitim yılı oluşturma
 * - Sınıfları eğitim yılına bağlama
 * - Yeni eğitim yılına geçiş (sınıf kopyalama)
 * - Eğitim yılı kapatma
 */
class AcademicYearController extends BaseSchoolController
{
    public function __construct(
        protected AcademicYearService $service
    ) {
        parent::__construct();
    }

    /**
     * Okula ait eğitim yıllarını listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $schoolId = $request->input('school_id');

            if (! $schoolId) {
                return $this->errorResponse('Okul ID gereklidir.', 422);
            }

            $years = $this->service->listForSchool($schoolId);

            return $this->paginatedResponse(
                AcademicYearResource::collection($years)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Eğitim yılları listeleme hatası: '.$e->getMessage());

            return $this->errorResponse('Eğitim yılları listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okulun güncel (aktif) eğitim yılını getir
     */
    public function current(Request $request): JsonResponse
    {
        try {
            $schoolId = $request->input('school_id');

            if (! $schoolId) {
                return $this->errorResponse('Okul ID gereklidir.', 422);
            }

            $year = $this->service->getCurrentYear($schoolId);

            if (! $year) {
                return $this->errorResponse('Aktif eğitim yılı bulunamadı.', 404);
            }

            return $this->successResponse(
                new AcademicYearResource($year),
                'Güncel eğitim yılı getirildi.'
            );
        } catch (\Throwable $e) {
            Log::error('Güncel eğitim yılı hatası: '.$e->getMessage());

            return $this->errorResponse('Güncel eğitim yılı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Eğitim yılı detayı (istatistiklerle)
     */
    public function show(AcademicYear $academicYear): JsonResponse
    {
        try {
            $stats = $this->service->getStats($academicYear);

            return $this->successResponse([
                'academic_year' => new AcademicYearResource($academicYear->load('classes')),
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            Log::error('Eğitim yılı detay hatası: '.$e->getMessage());

            return $this->errorResponse('Eğitim yılı detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni eğitim yılı oluştur
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'description' => 'nullable|string|max:500',
            'is_current' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            $data = $request->all();
            $data['is_active'] = true;
            $data['created_by'] = $this->user()->id;

            $year = $this->service->createYear($data);

            DB::commit();

            return $this->successResponse(
                new AcademicYearResource($year),
                'Eğitim yılı başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim yılı oluşturma hatası: '.$e->getMessage());

            return $this->errorResponse('Eğitim yılı oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Eğitim yılı güncelle
     */
    public function update(Request $request, AcademicYear $academicYear): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'name' => 'sometimes|string|max:100',
                'start_date' => 'sometimes|date',
                'end_date' => 'sometimes|date',
                'description' => 'nullable|string|max:500',
                'is_current' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            $data = $request->all();
            $data['updated_by'] = $this->user()->id;

            $year = $this->service->updateYear($academicYear, $data);

            DB::commit();

            return $this->successResponse(
                new AcademicYearResource($year),
                'Eğitim yılı başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim yılı güncelleme hatası: '.$e->getMessage());

            return $this->errorResponse('Eğitim yılı güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Eğitim yılını aktif/güncel olarak ayarla
     */
    public function setCurrent(AcademicYear $academicYear): JsonResponse
    {
        DB::beginTransaction();
        try {
            $year = $this->service->setAsCurrent($academicYear);

            DB::commit();

            return $this->successResponse(
                new AcademicYearResource($year),
                'Eğitim yılı güncel olarak ayarlandı.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim yılı aktif yapma hatası: '.$e->getMessage());

            return $this->errorResponse('İşlem sırasında bir hata oluştu.', 500);
        }
    }

    /**
     * Eğitim yılını kapat
     */
    public function close(AcademicYear $academicYear): JsonResponse
    {
        DB::beginTransaction();
        try {
            $year = $this->service->closeYear($academicYear);

            DB::commit();

            return $this->successResponse(
                new AcademicYearResource($year),
                'Eğitim yılı kapatıldı.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim yılı kapatma hatası: '.$e->getMessage());

            return $this->errorResponse('İşlem sırasında bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni eğitim yılına geçiş
     * Mevcut yılı kapatır, yeni yılı açar, opsiyonel sınıf kopyalama
     */
    public function transition(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'description' => 'nullable|string|max:500',
            'copy_classes' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            $newYearData = $request->only(['name', 'start_date', 'end_date', 'description']);
            $newYearData['created_by'] = $this->user()->id;

            $newYear = $this->service->transition(
                $request->school_id,
                $newYearData,
                $request->boolean('copy_classes', false)
            );

            DB::commit();

            return $this->successResponse(
                new AcademicYearResource($newYear),
                'Yeni eğitim yılına başarıyla geçiş yapıldı.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim yılı geçiş hatası: '.$e->getMessage());

            return $this->errorResponse('Geçiş sırasında bir hata oluştu.', 500);
        }
    }

    /**
     * Eğitim yılına sınıf ekle
     */
    public function addClass(Request $request, AcademicYear $academicYear): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'name' => 'required|string|max:100',
                'color' => 'nullable|string|max:20',
                'logo' => 'nullable|string',
                'capacity' => 'nullable|integer|min:1|max:100',
            ]);

            $classData = $request->all();
            $classData['created_by'] = $this->user()->id;

            $class = $this->service->addClass($academicYear, $classData);

            DB::commit();

            return $this->successResponse(
                $class,
                'Sınıf başarıyla eklendi.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Sınıf ekleme hatası: '.$e->getMessage());

            return $this->errorResponse('Sınıf eklenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Eğitim yılından sınıf kaldır
     */
    public function removeClass(AcademicYear $academicYear, int $classId): JsonResponse
    {
        DB::beginTransaction();
        try {
            $this->service->removeClass($academicYear, $classId);

            DB::commit();

            return $this->successResponse(null, 'Sınıf başarıyla kaldırıldı.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Sınıf kaldırma hatası: '.$e->getMessage());

            return $this->errorResponse('Sınıf kaldırılırken bir hata oluştu.', 500);
        }
    }

    /**
     * Eğitim yılı sil
     */
    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        DB::beginTransaction();
        try {
            if ($academicYear->is_current) {
                DB::rollBack();

                return $this->errorResponse('Aktif eğitim yılı silinemez. Önce başka bir yılı aktif yapın.', 422);
            }

            $academicYear->classes()->delete();
            $academicYear->delete();

            DB::commit();

            return $this->successResponse(null, 'Eğitim yılı başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim yılı silme hatası: '.$e->getMessage());

            return $this->errorResponse('Eğitim yılı silinirken bir hata oluştu.', 500);
        }
    }
}
