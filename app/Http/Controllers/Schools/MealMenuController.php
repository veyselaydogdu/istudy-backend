<?php

namespace App\Http\Controllers\Schools;

use App\Http\Resources\MealMenuScheduleResource;
use App\Models\Academic\SchoolClass;
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
            Log::error('Yemek menüsü listeleme hatası: '.$e->getMessage());

            return $this->errorResponse('Menü listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Günlük menü getir
     */
    public function daily(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|string',
            'date' => 'required|date',
            'class_id' => 'nullable|string',
        ]);

        try {
            $menu = $this->service->getMenuForDate(
                $this->school->id,
                $request->date,
                $this->resolveClassId($request->class_id)
            );

            return $this->successResponse(
                MealMenuScheduleResource::collection($menu),
                'Günlük menü getirildi.'
            );
        } catch (\Throwable $e) {
            Log::error('Günlük menü hatası: '.$e->getMessage());

            return $this->errorResponse('Menü getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Haftalık menü getir
     */
    public function weekly(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|string',
            'start_date' => 'required|date',
            'class_id' => 'nullable|string',
        ]);

        try {
            $menu = $this->service->getWeeklyMenu(
                $this->school->id,
                $request->start_date,
                $this->resolveClassId($request->class_id)
            );

            return $this->successResponse($menu, 'Haftalık menü getirildi.');
        } catch (\Throwable $e) {
            Log::error('Haftalık menü hatası: '.$e->getMessage());

            return $this->errorResponse('Menü getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Aylık menü getir
     */
    public function monthly(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|string',
            'year' => 'required|integer|min:2020',
            'month' => 'required|integer|min:1|max:12',
            'class_id' => 'nullable|string',
        ]);

        try {
            $menu = $this->service->getMonthlyMenu(
                $this->school->id,
                $request->year,
                $request->month,
                $this->resolveClassId($request->class_id)
            );

            // Return flat array (frontend filters by menu_date client-side)
            return $this->successResponse(
                MealMenuScheduleResource::collection($menu->flatten()->values()),
                'Aylık menü getirildi.'
            );
        } catch (\Throwable $e) {
            Log::error('Aylık menü hatası: '.$e->getMessage());

            return $this->errorResponse('Menü getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Menü ekle
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|string',
            'class_id' => 'nullable|string',
            'meal_id' => 'required|exists:meals,id',
            'menu_date' => 'required|date',
            'schedule_type' => 'required|in:daily,weekly,monthly',
        ]);

        DB::beginTransaction();
        try {
            $data = $request->only(['meal_id', 'menu_date', 'schedule_type']);
            $data['school_id'] = $this->school->id;
            $data['class_id'] = $this->resolveClassId($request->class_id);
            $data['created_by'] = $this->user()->id;

            $schedule = $this->service->create($data);
            $schedule->load('meal.ingredients.allergens');

            DB::commit();

            return $this->successResponse(
                new MealMenuScheduleResource($schedule),
                'Menü başarıyla eklendi.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Menü ekleme hatası: '.$e->getMessage());

            return $this->errorResponse('Menü eklenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Toplu menü oluştur (haftalık/aylık)
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'schedules' => 'required|array|min:1',
            'schedules.*.school_id' => 'required|string',
            'schedules.*.class_id' => 'nullable|string',
            'schedules.*.meal_id' => 'required|exists:meals,id',
            'schedules.*.menu_date' => 'required|date',
            'schedules.*.schedule_type' => 'required|in:daily,weekly,monthly',
        ]);

        DB::beginTransaction();
        try {
            $resolvedSchoolId = $this->school->id;

            $schedules = array_map(function ($schedule) use ($resolvedSchoolId) {
                $schedule['school_id'] = $resolvedSchoolId;
                $schedule['class_id'] = $this->resolveClassId($schedule['class_id'] ?? null);
                $schedule['created_by'] = $this->user()->id;

                return $schedule;
            }, $request->schedules);

            $created = $this->service->createBulkSchedule($schedules);

            DB::commit();

            return $this->successResponse(
                MealMenuScheduleResource::collection($created),
                count($created).' menü başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Toplu menü oluşturma hatası: '.$e->getMessage());

            return $this->errorResponse('Menüler oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * ULID veya integer class_id'yi integer PK'ya çözümler.
     */
    private function resolveClassId(?string $rawClassId): ?int
    {
        if (! $rawClassId) {
            return null;
        }

        if (is_numeric($rawClassId)) {
            return (int) $rawClassId;
        }

        return SchoolClass::where('ulid', $rawClassId)->value('id');
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
            Log::error('Menü silme hatası: '.$e->getMessage());

            return $this->errorResponse('Menü silinirken bir hata oluştu.', 500);
        }
    }
}
