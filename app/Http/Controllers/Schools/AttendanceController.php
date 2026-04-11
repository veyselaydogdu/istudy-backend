<?php

namespace App\Http\Controllers\Schools;

use App\Models\Academic\SchoolClass;
use App\Models\Activity\Attendance;
use App\Models\Child\Child;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceController extends BaseSchoolController
{
    /**
     * Sınıfın günlük yoklama listesini getir
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => 'required|string',
            'date' => 'required|date',
        ]);

        $classId = $this->resolveClassId($request->class_id);

        // Sınıftaki tüm çocukları getir
        $children = Child::whereHas('classes', function ($q) use ($classId) {
            $q->where('classes.id', $classId);
        })->active()->get();

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
                'status' => $attendance ? $attendance->status : 'present', // Varsayılan: Geldi
                'notes' => $attendance ? $attendance->notes : null,
                'is_recorded' => $attendance ? true : false,
            ];
        });

        return $this->successResponse($result, 'Yoklama listesi getirildi.');
    }

    /**
     * Yoklama kaydet (Tekli veya Toplu)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => 'required|string',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.child_id' => 'required|exists:children,id',
            'attendances.*.status' => 'required|in:present,absent,late,excused',
            'attendances.*.notes' => 'nullable|string',
        ]);

        $classId = $this->resolveClassId($request->class_id);

        DB::beginTransaction();
        try {
            foreach ($request->attendances as $item) {
                Attendance::updateOrCreate(
                    [
                        'child_id' => $item['child_id'],
                        'class_id' => $classId,
                        'attendance_date' => $request->date,
                    ],
                    [
                        'status' => $item['status'],
                        // 'notes' => $item['notes'] ?? null, // Attendance modeline notes eklenebilir
                        'created_by' => $this->user()->id,
                        'updated_by' => $this->user()->id,
                    ]
                );
            }

            DB::commit();

            return $this->successResponse(null, 'Yoklama başarıyla kaydedildi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Yoklama kayıt hatası: '.$e->getMessage());

            return $this->errorResponse('Yoklama kaydedilirken bir hata oluştu.', 500);
        }
    }

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
}
