<?php

namespace App\Http\Controllers\Schools;

use App\Http\Resources\MealMenuScheduleResource;
use App\Services\MealMenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Yemek Menü Takvimi Controller
 *
 * Günlük, haftalık ve aylık yemek menüsü planlama.
 * Sınıfa özel veya okul geneli menü ayarlama.
 */
class MealMenuController extends BaseSchoolController
{
    public function __construct(
        protected MealMenuService $service
    ) {
        parent::__construct();
    }

    /**
     * Menü listele (filtreleme ile)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['school_id', 'class_id', 'menu_date', 'schedule_type', 'date_from', 'date_to']);
            $schedules = $this->service->list($filters, 30);

            return $this->paginatedResponse(
                MealMenuScheduleResource::collection($schedules)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Yemek menüsü listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Menü listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Günlük menü getir
     */
    public function daily(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'school_id' => 'required|exists:schools,id',
                'date' => 'required|date',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $menu = $this->service->getMenuForDate(
                $request->school_id,
                $request->date,
                $request->class_id
            );

            return $this->successResponse(
                MealMenuScheduleResource::collection($menu),
                'Günlük menü getirildi.'
            );
        } catch (\Throwable $e) {
            Log::error('Günlük menü hatası: ' . $e->getMessage());

            return $this->errorResponse('Menü getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Haftalık menü getir
     */
    public function weekly(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'school_id' => 'required|exists:schools,id',
                'start_date' => 'required|date',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $menu = $this->service->getWeeklyMenu(
                $request->school_id,
                $request->start_date,
                $request->class_id
            );

            return $this->successResponse($menu, 'Haftalık menü getirildi.');
        } catch (\Throwable $e) {
            Log::error('Haftalık menü hatası: ' . $e->getMessage());

            return $this->errorResponse('Menü getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Aylık menü getir
     */
    public function monthly(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'school_id' => 'required|exists:schools,id',
                'year' => 'required|integer|min:2020',
                'month' => 'required|integer|min:1|max:12',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $menu = $this->service->getMonthlyMenu(
                $request->school_id,
                $request->year,
                $request->month,
                $request->class_id
            );

            return $this->successResponse($menu, 'Aylık menü getirildi.');
        } catch (\Throwable $e) {
            Log::error('Aylık menü hatası: ' . $e->getMessage());

            return $this->errorResponse('Menü getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Menü ekle
     */
    public function store(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'school_id' => 'required|exists:schools,id',
                'class_id' => 'nullable|exists:classes,id',
                'meal_id' => 'required|exists:meals,id',
                'menu_date' => 'required|date',
                'schedule_type' => 'required|in:daily,weekly,monthly',
            ]);

            $data = $request->all();
            $data['created_by'] = $this->user()->id;

            $schedule = $this->service->create($data);

            DB::commit();

            return $this->successResponse(
                new MealMenuScheduleResource($schedule),
                'Menü başarıyla eklendi.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Menü ekleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Menü eklenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Toplu menü oluştur (haftalık/aylık)
     */
    public function bulkStore(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'schedules' => 'required|array|min:1',
                'schedules.*.school_id' => 'required|exists:schools,id',
                'schedules.*.class_id' => 'nullable|exists:classes,id',
                'schedules.*.meal_id' => 'required|exists:meals,id',
                'schedules.*.menu_date' => 'required|date',
                'schedules.*.schedule_type' => 'required|in:daily,weekly,monthly',
            ]);

            $schedules = array_map(function ($schedule) {
                $schedule['created_by'] = $this->user()->id;

                return $schedule;
            }, $request->schedules);

            $created = $this->service->createBulkSchedule($schedules);

            DB::commit();

            return $this->successResponse(
                MealMenuScheduleResource::collection($created),
                count($created) . ' menü başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Toplu menü oluşturma hatası: ' . $e->getMessage());

            return $this->errorResponse('Menüler oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Menü sil
     */
    public function destroy(int $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $schedule = \App\Models\Health\MealMenuSchedule::findOrFail($id);
            $schedule->delete();

            DB::commit();

            return $this->successResponse(null, 'Menü başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Menü silme hatası: ' . $e->getMessage());

            return $this->errorResponse('Menü silinirken bir hata oluştu.', 500);
        }
    }
}
