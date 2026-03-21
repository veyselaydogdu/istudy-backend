<?php

namespace App\Http\Controllers\Schools;

use App\Models\ActivityClass\ActivityClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivityClassController extends BaseSchoolController
{
    public function index(int $school_id): JsonResponse
    {
        try {
            $query = ActivityClass::where('school_id', $school_id)
                ->with(['schoolClasses:id,name', 'teachers.user:id,name,surname'])
                ->withCount(['activeEnrollments']);

            if (request()->boolean('active_only')) {
                $query->where('is_active', true);
            }

            $perPage = request('per_page', 15);
            $data = $query->latest()->paginate($perPage);

            return $this->paginatedResponse(\App\Http\Resources\ActivityClass\ActivityClassResource::collection($data));
        } catch (\Throwable $e) {
            Log::error('ActivityClassController::index', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function store(Request $request, int $school_id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'age_min' => 'nullable|integer|min:0|max:18',
            'age_max' => 'nullable|integer|min:0|max:18|gte:age_min',
            'capacity' => 'nullable|integer|min:1',
            'is_school_wide' => 'boolean',
            'is_active' => 'boolean',
            'is_paid' => 'boolean',
            'price' => 'nullable|numeric|min:0|required_if:is_paid,true',
            'currency' => 'nullable|string|max:3',
            'invoice_required' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'schedule' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'school_class_ids' => 'nullable|array',
            'school_class_ids.*' => 'integer|exists:classes,id',
        ]);

        try {
            DB::beginTransaction();

            $activityClass = ActivityClass::create(array_merge($validated, [
                'tenant_id' => $this->user()->tenant_id,
                'school_id' => $school_id,
            ]));

            if (! ($validated['is_school_wide'] ?? true) && ! empty($validated['school_class_ids'])) {
                $activityClass->schoolClasses()->sync($validated['school_class_ids']);
            }

            $activityClass->load(['schoolClasses:id,name', 'teachers.user:id,name,surname']);

            DB::commit();

            return $this->successResponse(
                \App\Http\Resources\ActivityClass\ActivityClassResource::make($activityClass),
                'Etkinlik sınıfı başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassController::store', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function show(int $school_id, ActivityClass $activityClass): JsonResponse
    {
        try {
            $activityClass->load([
                'schoolClasses:id,name',
                'teachers.user:id,name,surname',
                'materials',
                'gallery',
                'activeEnrollments.child',
            ]);

            return $this->successResponse(\App\Http\Resources\ActivityClass\ActivityClassResource::make($activityClass));
        } catch (\Throwable $e) {
            Log::error('ActivityClassController::show', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function update(Request $request, int $school_id, ActivityClass $activityClass): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'age_min' => 'nullable|integer|min:0|max:18',
            'age_max' => 'nullable|integer|min:0|max:18|gte:age_min',
            'capacity' => 'nullable|integer|min:1',
            'is_school_wide' => 'boolean',
            'is_active' => 'boolean',
            'is_paid' => 'boolean',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'invoice_required' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'schedule' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'school_class_ids' => 'nullable|array',
            'school_class_ids.*' => 'integer|exists:classes,id',
        ]);

        try {
            DB::beginTransaction();

            $activityClass->update($validated);

            if (array_key_exists('school_class_ids', $validated)) {
                if ($validated['is_school_wide'] ?? $activityClass->is_school_wide) {
                    $activityClass->schoolClasses()->detach();
                } else {
                    $activityClass->schoolClasses()->sync($validated['school_class_ids'] ?? []);
                }
            }

            $activityClass->load(['schoolClasses:id,name', 'teachers.user:id,name,surname']);

            DB::commit();

            return $this->successResponse(
                \App\Http\Resources\ActivityClass\ActivityClassResource::make($activityClass),
                'Etkinlik sınıfı güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassController::update', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function destroy(int $school_id, ActivityClass $activityClass): JsonResponse
    {
        try {
            DB::beginTransaction();
            $activityClass->delete();
            DB::commit();

            return $this->successResponse(null, 'Etkinlik sınıfı silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassController::destroy', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
