<?php

namespace App\Http\Controllers\Schools;

use App\Models\ActivityClass\ActivityClass;
use App\Models\ActivityClass\ActivityClassMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ActivityClassMaterialController extends BaseSchoolController
{
    public function store(Request $request, int $school_id, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'nullable|string|max:100',
            'is_required' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        try {
            $activityClass = ActivityClass::where('school_id', $school_id)->findOrFail($activity_class_id);

            $material = $activityClass->materials()->create($request->only(['name', 'description', 'quantity', 'is_required', 'sort_order']));

            return $this->successResponse($material, 'Materyal eklendi.', 201);
        } catch (\Throwable $e) {
            Log::error('ActivityClassMaterialController::store', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function update(Request $request, int $school_id, int $activity_class_id, ActivityClassMaterial $material): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'nullable|string|max:100',
            'is_required' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        try {
            $material->update($request->only(['name', 'description', 'quantity', 'is_required', 'sort_order']));

            return $this->successResponse($material, 'Materyal güncellendi.');
        } catch (\Throwable $e) {
            Log::error('ActivityClassMaterialController::update', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function destroy(int $school_id, int $activity_class_id, ActivityClassMaterial $material): JsonResponse
    {
        try {
            $material->delete();

            return $this->successResponse(null, 'Materyal silindi.');
        } catch (\Throwable $e) {
            Log::error('ActivityClassMaterialController::destroy', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
