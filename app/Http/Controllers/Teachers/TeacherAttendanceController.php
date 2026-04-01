<?php

namespace App\Http\Controllers\Teachers;

use App\Models\Academic\SchoolClass;
use App\Models\Activity\Attendance;
use App\Models\Child\Child;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * TeacherAttendanceController — Yoklama
 *
 * Öğretmenin sınıf yoklamasını görüntülemesi ve kaydetmesi.
 * Öğretmen yalnızca atandığı sınıfların yoklamasını yönetebilir.
 */
class TeacherAttendanceController extends BaseTeacherController
{
    /**
     * Sınıfın günlük yoklama listesini getir
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'date' => ['required', 'date'],
        ]);

        try {
            $profile = $this->teacherProfile();

            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $classId = (int) $request->class_id;

            // Öğretmenin bu sınıfa atanmış olup olmadığını doğrula
            $isAssigned = SchoolClass::whereHas('teachers', fn ($q) => $q->where('teacher_profile_id', $profile->id))
                ->where('id', $classId)
                ->exists();

            if (! $isAssigned) {
                return $this->errorResponse('Bu sınıfa erişim yetkiniz yok.', 403);
            }

            // Sınıftaki tüm aktif çocukları getir
            $children = Child::whereHas('classes', fn ($q) => $q->where('school_classes.id', $classId))
                ->active()
                ->get();

            // O günkü yoklamaları getir
            $attendances = Attendance::where('class_id', $classId)
                ->where('attendance_date', $request->date)
                ->get()
                ->keyBy('child_id');

            // Çocuk listesi ile yoklamayı birleştir
            $result = $children->map(function ($child) use ($attendances) {
                $attendance = $attendances->get($child->id);

                return [
                    'child_id' => $child->id,
                    'child_name' => $child->full_name,
                    'photo' => $child->profile_photo,
                    'status' => $attendance ? $attendance->status : 'present',
                    'notes' => $attendance ? $attendance->notes : null,
                    'is_recorded' => (bool) $attendance,
                ];
            });

            return $this->successResponse($result, 'Yoklama listesi getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherAttendanceController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yoklama listesi alınamadı.', 500);
        }
    }

    /**
     * Yoklama kaydet (tekli veya toplu)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'date' => ['required', 'date'],
            'attendances' => ['required', 'array'],
            'attendances.*.child_id' => ['required', 'integer', 'exists:children,id'],
            'attendances.*.status' => ['required', 'in:present,absent,late,excused'],
            'attendances.*.notes' => ['nullable', 'string'],
        ]);

        try {
            $profile = $this->teacherProfile();

            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $classId = (int) $request->class_id;

            // Öğretmenin bu sınıfa atanmış olup olmadığını doğrula
            $isAssigned = SchoolClass::whereHas('teachers', fn ($q) => $q->where('teacher_profile_id', $profile->id))
                ->where('id', $classId)
                ->exists();

            if (! $isAssigned) {
                return $this->errorResponse('Bu sınıfa erişim yetkiniz yok.', 403);
            }

            DB::beginTransaction();

            foreach ($request->attendances as $item) {
                Attendance::updateOrCreate(
                    [
                        'child_id' => $item['child_id'],
                        'class_id' => $classId,
                        'attendance_date' => $request->date,
                    ],
                    [
                        'status' => $item['status'],
                        'created_by' => $this->user()->id,
                        'updated_by' => $this->user()->id,
                    ]
                );
            }

            DB::commit();

            return $this->successResponse(null, 'Yoklama başarıyla kaydedildi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TeacherAttendanceController::store Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yoklama kaydedilemedi.', 500);
        }
    }
}
