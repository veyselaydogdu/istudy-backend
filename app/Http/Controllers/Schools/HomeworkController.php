<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\Homework\StoreHomeworkRequest;
use App\Http\Requests\Homework\UpdateHomeworkRequest;
use App\Http\Resources\HomeworkResource;
use App\Models\Activity\Homework;
use App\Services\HomeworkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Ödev Controller
 *
 * Ödev ve okul sonrası etkinliklerin yönetimi.
 * Sınıflara atama ve tamamlama durumu takibi.
 */
class HomeworkController extends BaseSchoolController
{
    public function __construct(
        protected HomeworkService $service
    ) {
        parent::__construct();
    }

    /**
     * Ödevleri listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['school_id', 'type', 'class_id', 'due_date_from', 'due_date_to', 'upcoming']);
            $homework = $this->service->list($filters, 15);

            return $this->paginatedResponse(
                HomeworkResource::collection($homework)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Ödevler listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Ödevler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Ödev detayı
     */
    public function show(Homework $homework): JsonResponse
    {
        try {
            return $this->successResponse(
                new HomeworkResource($homework->load(['classes', 'completions.child']))
            );
        } catch (\Throwable $e) {
            Log::error('Ödev detay hatası: ' . $e->getMessage());

            return $this->errorResponse('Ödev detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni ödev oluştur
     */
    public function store(StoreHomeworkRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['created_by'] = $this->user()->id;

            $classIds = $data['class_ids'] ?? [];
            unset($data['class_ids']);

            $homework = $this->service->createAndAssign($data, $classIds);

            DB::commit();

            return $this->successResponse(
                new HomeworkResource($homework),
                'Ödev başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Ödev oluşturma hatası: ' . $e->getMessage());

            return $this->errorResponse('Ödev oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Ödev güncelle
     */
    public function update(UpdateHomeworkRequest $request, Homework $homework): JsonResponse
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['updated_by'] = $this->user()->id;

            $classIds = $data['class_ids'] ?? [];
            unset($data['class_ids']);

            $homework = $this->service->updateAndAssign($homework, $data, $classIds);

            DB::commit();

            return $this->successResponse(
                new HomeworkResource($homework),
                'Ödev başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Ödev güncelleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Ödev güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Ödev sil
     */
    public function destroy(Homework $homework): JsonResponse
    {
        DB::beginTransaction();
        try {
            $homework->completions()->delete();
            $homework->classes()->detach();
            $homework->delete();

            DB::commit();

            return $this->successResponse(null, 'Ödev başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Ödev silme hatası: ' . $e->getMessage());

            return $this->errorResponse('Ödev silinirken bir hata oluştu.', 500);
        }
    }

    /**
     * Ödev tamamlama durumunu işaretle
     */
    public function markCompletion(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'homework_id' => 'required|exists:homework,id',
                'child_id' => 'required|exists:children,id',
                'is_completed' => 'required|boolean',
                'notes' => 'nullable|string|max:500',
            ]);

            $this->service->markCompletion(
                $request->homework_id,
                $request->child_id,
                $request->is_completed,
                $request->notes
            );

            DB::commit();

            return $this->successResponse(null, 'Tamamlama durumu güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Ödev tamamlama hatası: ' . $e->getMessage());

            return $this->errorResponse('Tamamlama durumu güncellenirken bir hata oluştu.', 500);
        }
    }
}
