<?php

namespace App\Http\Controllers\Schools;

use App\Http\Resources\AttendanceResource;
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
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
        ]);

        // Sınıftaki tüm çocukları getir
        $children = Child::whereHas('classes', function ($q) use ($request) {
            $q->where('school_classes.id', $request->class_id);
        })->active()->get();

        // O günkü yoklamaları getir
        $attendances = Attendance::where('class_id', $request->class_id)
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
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.child_id' => 'required|exists:children,id',
            'attendances.*.status' => 'required|in:present,absent,late,excused',
            'attendances.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->attendances as $item) {
                Attendance::updateOrCreate(
                    [
                        'child_id' => $item['child_id'],
                        'class_id' => $request->class_id,
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
            Log::error('Yoklama kayıt hatası: ' . $e->getMessage());
            return $this->errorResponse('Yoklama kaydedilirken bir hata oluştu.', 500);
        }
    }
}
