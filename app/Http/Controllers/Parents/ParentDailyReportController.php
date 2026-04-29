<?php

namespace App\Http\Controllers\Parents;

use App\Models\Activity\Attendance;
use App\Models\Activity\DailyChildReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ParentDailyReportController extends BaseParentController
{
    /**
     * Son 30 günün rapor + devamsızlık özetini döner.
     */
    public function index(string $child): JsonResponse
    {
        $childModel = $this->findOwnedChild($child);

        if (! $childModel) {
            return $this->errorResponse('Çocuk bulunamadı.', 404);
        }

        try {
            $today = now()->toDateString();
            $from = now()->subDays(29)->toDateString();

            $reports = DailyChildReport::withoutGlobalScope('tenant')
                ->where('child_id', $childModel->id)
                ->whereBetween('report_date', [$from, $today])
                ->orderByDesc('report_date')
                ->get()
                ->keyBy(fn ($r) => $r->report_date->toDateString());

            $attendances = Attendance::where('child_id', $childModel->id)
                ->whereBetween('attendance_date', [$from, $today])
                ->orderByDesc('attendance_date')
                ->get()
                ->keyBy(fn ($a) => $a->attendance_date->toDateString());

            $days = [];
            for ($i = 0; $i < 30; $i++) {
                $dateStr = now()->subDays($i)->toDateString();
                $report = $reports->get($dateStr);
                $attendance = $attendances->get($dateStr);

                $days[] = [
                    'date' => $dateStr,
                    'is_today' => $dateStr === $today,
                    'attendance_status' => $attendance?->status,
                    'has_report' => (bool) $report,
                    'mood' => $report?->mood,
                    'appetite' => $report?->appetite,
                    'parent_notes' => $report?->parent_notes,
                    'can_edit' => $dateStr === $today
                        && in_array($attendance?->status, ['present', 'late'], true),
                ];
            }

            return $this->successResponse($days, 'Raporlar listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentDailyReportController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Raporlar alınamadı.', 500);
        }
    }

    /**
     * Belirli bir günün rapor + devamsızlık detayı.
     */
    public function show(string $child, string $date): JsonResponse
    {
        $childModel = $this->findOwnedChild($child);

        if (! $childModel) {
            return $this->errorResponse('Çocuk bulunamadı.', 404);
        }

        try {
            $today = now()->toDateString();

            $report = DailyChildReport::withoutGlobalScope('tenant')
                ->where('child_id', $childModel->id)
                ->whereDate('report_date', $date)
                ->first();

            $attendance = Attendance::where('child_id', $childModel->id)
                ->whereDate('attendance_date', $date)
                ->first();

            $canEdit = $date === $today
                && in_array($attendance?->status, ['present', 'late'], true);

            return $this->successResponse([
                'date' => $date,
                'is_today' => $date === $today,
                'attendance_status' => $attendance?->status,
                'has_report' => (bool) $report,
                'mood' => $report?->mood,
                'appetite' => $report?->appetite,
                'notes' => $report?->notes,
                'parent_notes' => $report?->parent_notes,
                'can_edit' => $canEdit,
            ], 'Rapor detayı getirildi.');
        } catch (\Throwable $e) {
            Log::error('ParentDailyReportController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Rapor alınamadı.', 500);
        }
    }

    /**
     * Veli notunu ekler / günceller.
     * Kural: YALNIZCA bugün ve çocuk okuldaysa (present / late).
     */
    public function update(Request $request, string $child, string $date): JsonResponse
    {
        $request->validate([
            'parent_notes' => ['required', 'string', 'max:1000'],
        ]);

        $childModel = $this->findOwnedChild($child);

        if (! $childModel) {
            return $this->errorResponse('Çocuk bulunamadı.', 404);
        }

        $today = now()->toDateString();

        if ($date !== $today) {
            return $this->errorResponse('Geçmiş günlere ait raporlar düzenlenemez.', 422);
        }

        $attendance = Attendance::where('child_id', $childModel->id)
            ->whereDate('attendance_date', $today)
            ->first();

        if (! $attendance) {
            return $this->errorResponse('Bu gün için devamsızlık kaydı bulunamadı.', 422);
        }

        if (! in_array($attendance->status, ['present', 'late'], true)) {
            return $this->errorResponse('Devamsız veya mazeretli günlere ait raporlar düzenlenemez.', 422);
        }

        try {
            $report = DailyChildReport::withoutGlobalScope('tenant')
                ->where('child_id', $childModel->id)
                ->whereDate('report_date', $today)
                ->first();

            if (! $report) {
                return $this->errorResponse('Bu gün için öğretmen raporu henüz girilmemiş.', 404);
            }

            $report->update([
                'parent_notes' => $request->parent_notes,
                'updated_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'parent_notes' => $report->parent_notes,
            ], 'Notunuz kaydedildi.');
        } catch (\Throwable $e) {
            Log::error('ParentDailyReportController::update Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Not kaydedilemedi.', 500);
        }
    }
}
