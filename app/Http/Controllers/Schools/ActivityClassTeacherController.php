<?php

namespace App\Http\Controllers\Schools;

use App\Models\ActivityClass\ActivityClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivityClassTeacherController extends BaseSchoolController
{
    public function store(Request $request, int $school_id, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'teacher_profile_id' => 'required|integer|exists:teacher_profiles,id',
            'role' => 'nullable|string|max:100',
        ]);

        try {
            DB::beginTransaction();

            $activityClass = ActivityClass::where('school_id', $school_id)->findOrFail($activity_class_id);

            if ($activityClass->teachers()->where('teacher_profile_id', $request->teacher_profile_id)->exists()) {
                return $this->errorResponse('Bu öğretmen zaten atanmış.', 422);
            }

            $activityClass->teachers()->attach($request->teacher_profile_id, ['role' => $request->role]);
            $activityClass->load(['teachers.user:id,name,surname']);

            DB::commit();

            return $this->successResponse(
                $activityClass->teachers->map(fn ($t) => [
                    'id' => $t->id,
                    'name' => $t->user->name.' '.$t->user->surname,
                    'role' => $t->pivot->role,
                ]),
                'Öğretmen atandı.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassTeacherController::store', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function destroy(int $school_id, int $activity_class_id, int $teacher_profile_id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $activityClass = ActivityClass::where('school_id', $school_id)->findOrFail($activity_class_id);
            $activityClass->teachers()->detach($teacher_profile_id);

            DB::commit();

            return $this->successResponse(null, 'Öğretmen ataması kaldırıldı.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassTeacherController::destroy', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
