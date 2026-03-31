<?php

namespace App\Http\Controllers\Teachers;

use App\Models\Child\ChildMedicationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * TeacherMedicationController — İlaç Takibi
 *
 * Öğretmenin öğrencilere ilaç verme kayıtlarını yönetir.
 */
class TeacherMedicationController extends BaseTeacherController
{
    /**
     * İlaç verildi olarak işaretle
     */
    public function markGiven(Request $request): JsonResponse
    {
        $request->validate([
            'child_id' => ['required', 'integer', 'exists:children,id'],
            'medication_id' => ['nullable', 'integer', 'exists:medications,id'],
            'custom_medication_name' => ['nullable', 'string', 'max:255'],
            'dose' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $log = ChildMedicationLog::create([
                'child_id' => $request->child_id,
                'medication_id' => $request->medication_id,
                'custom_medication_name' => $request->custom_medication_name,
                'dose' => $request->dose,
                'given_by_user_id' => $this->user()->id,
                'given_at' => now(),
                'note' => $request->note,
            ]);

            return $this->successResponse([
                'id' => $log->id,
                'child_id' => $log->child_id,
                'medication_id' => $log->medication_id,
                'given_at' => $log->given_at->toISOString(),
            ], 'İlaç verildi olarak kaydedildi.', 201);
        } catch (\Throwable $e) {
            Log::error('TeacherMedicationController::markGiven Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('İlaç kaydı oluşturulamadı.', 500);
        }
    }

    /**
     * Belirli bir çocuğun bugün verilmiş ilaçlarını listeler
     */
    public function givenLogs(int $childId): JsonResponse
    {
        try {
            $logs = ChildMedicationLog::with(['medication:id,name', 'givenBy:id,name,surname'])
                ->where('child_id', $childId)
                ->whereDate('given_at', Carbon::today())
                ->orderByDesc('given_at')
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'medication_id' => $log->medication_id,
                    'medication_name' => $log->medication?->name ?? $log->custom_medication_name,
                    'custom_medication_name' => $log->custom_medication_name,
                    'dose' => $log->dose,
                    'given_at' => $log->given_at->toISOString(),
                    'given_by' => $log->givenBy ? $log->givenBy->name.' '.$log->givenBy->surname : null,
                    'note' => $log->note,
                ]);

            return $this->successResponse($logs, 'İlaç logları getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherMedicationController::givenLogs Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('İlaç logları alınamadı.', 500);
        }
    }
}
