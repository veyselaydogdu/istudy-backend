<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\Activity\StoreActivityRequest;
use App\Http\Requests\Activity\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity\Activity;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivityController extends BaseSchoolController
{
    public function __construct(protected ActivityService $service) {}

    /**
     * Aktiviteleri listele
     */
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Activity::class);

            $data = $this->service->getAll(request()->all());

            return $this->paginatedResponse($data);

        } catch (\Throwable $e) {
            Log::error('ActivityController::index Error', [
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
     * Yeni aktivite oluştur
     */
    public function store(StoreActivityRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('create', Activity::class);

            $activity = $this->service->create($request->validated());

            if ($request->has('class_ids')) {
                $activity->classes()->sync($request->class_ids ?? []);
            }

            DB::commit();

            return $this->successResponse(
                ActivityResource::make($activity->load(['classes'])),
                'Aktivite başarıyla oluşturuldu.',
                201
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityController::store Error', [
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
     * Aktivite detayını getir
     */
    public function show(int $school_id, Activity $activity): JsonResponse
    {
        try {
            $this->authorize('view', $activity);

            return $this->successResponse(
                ActivityResource::make($activity->load(['children', 'classes']))
            );

        } catch (\Throwable $e) {
            Log::error('ActivityController::show Error', [
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
     * Aktivite güncelle
     */
    public function update(UpdateActivityRequest $request, int $school_id, Activity $activity): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('update', $activity);

            $updatedActivity = $this->service->update($activity, $request->validated());

            if ($request->has('class_ids')) {
                $updatedActivity->classes()->sync($request->class_ids ?? []);
            }

            DB::commit();

            return $this->successResponse(
                ActivityResource::make($updatedActivity->load(['classes'])),
                'Aktivite başarıyla güncellendi.'
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityController::update Error', [
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
     * Aktivite sil
     */
    public function destroy(int $school_id, Activity $activity): JsonResponse
    {
        try {
            DB::beginTransaction();
            $this->authorize('delete', $activity);

            $this->service->delete($activity);

            DB::commit();

            return $this->successResponse(null, 'Aktivite başarıyla silindi.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityController::destroy Error', [
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
