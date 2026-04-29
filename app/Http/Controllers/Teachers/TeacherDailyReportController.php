<?php

namespace App\Http\Controllers\Teachers;

use App\Models\Activity\Attendance;
use App\Models\Activity\DailyChildReport;
use App\Models\Activity\ReportInputValue;
use App\Models\Activity\ReportTemplate;
use App\Models\Child\Child;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TeacherDailyReportController extends BaseTeacherController
{
    /**
     * Öğretmenin sınıfındaki öğrencilerin o günkü rapor durumunu listele
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
            'date' => 'required|date',
            'class_id' => 'nullable|exists:classes,id', // Opsiyonel, sınıf filtresi
        ]);

        // Sınıfı veya öğretmenin bağlı olduğu sınıfları al
        // (Şimdilik basitçe okul altındaki aktif çocukları alıyoruz, ileride class_teacher_assignments ile filtrelemeli)
        $query = Child::where('school_id', $request->school_id)->active();

        if ($request->class_id) {
            $query->whereHas('classes', function ($q) use ($request) {
                $q->where('classes.id', $request->class_id);
            });
        }

        $children = $query->with(['dailyReports' => function ($q) use ($request) {
            $q->where('report_date', $request->date);
        }])->get();

        $summary = $children->map(function ($child) {
            $report = $child->dailyReports->first();

            return [
                'child_id' => $child->id,
                'child_name' => $child->full_name,
                'photo' => $child->profile_photo,
                'has_report' => (bool) $report,
                'mood' => $report?->mood,
            ];
        });

        return $this->successResponse($summary, 'Günlük rapor özeti listelendi.');
    }

    /**
     * Tekil öğrenci rapor detayı ve şablonunu getir
     * Route: /teacher/daily-reports/{childId}/{date}?school_id=1
     */
    public function show(int $childId, string $date, Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
        ]);

        // Aktif rapor şablonunu bul
        $template = ReportTemplate::where('school_id', $request->school_id)
            ->where('is_active', true)
            ->with(['inputs' => function ($q) {
                $q->orderBy('sort_order');
            }])
            ->orderBy('sort_order')
            ->first();

        if (! $template) {
            return $this->errorResponse('Bu okul için tanımlı aktif bir rapor şablonu bulunamadı.', 404);
        }

        // Çocuğun o günkü raporunu bul
        $report = DailyChildReport::with('inputValues')
            ->where('child_id', $childId)
            ->where('report_date', $date)
            ->first();

        // Input değerlerini key-value map'e dönüştür
        $filledValues = [];
        if ($report) {
            foreach ($report->inputValues as $value) {
                // Not: Value JSON string olabilir, front-end bunu parse etmeli
                // Veya burada decode edebiliriz. Value sütunu text olduğu için decode deniyoruz.
                $val = $value->value;
                $decoded = json_decode($val, true);
                $filledValues[$value->report_template_input_id] = (json_last_error() === JSON_ERROR_NONE) ? $decoded : $val;
            }
        }

        return $this->successResponse([
            'child_id' => $childId,
            'date' => $date,
            'template' => $template, // Şablon (inputs, types, options)
            'report_id' => $report?->id,
            'mood' => $report?->mood,
            'appetite' => $report?->appetite,
            'notes' => $report?->notes,
            'values' => (object) $filledValues, // Boş dizi [] yerine obje {} dönsün
        ], 'Rapor şablonu ve mevcut veriler getirildi.');
    }

    /**
     * Tekil Rapor Kaydet
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'child_id' => 'required|exists:children,id',
            'class_id' => 'required|exists:classes,id',
            'school_id' => 'required|exists:schools,id',
            'report_template_id' => 'nullable|exists:report_templates,id',
            'date' => 'required|date',
            'mood' => 'nullable|string',
            'appetite' => 'nullable|string',
            'notes' => 'nullable|string',
            'values' => 'nullable|array',
        ]);

        if ($request->date !== now()->toDateString()) {
            return $this->errorResponse('Rapor yalnızca bugün için kaydedilebilir.', 422);
        }

        $attendance = Attendance::where('child_id', $request->child_id)
            ->where('class_id', $request->class_id)
            ->whereDate('attendance_date', $request->date)
            ->first();

        if (! $attendance) {
            return $this->errorResponse('Bu öğrenci için devamsızlık kaydı girilmemiş.', 422);
        }

        if (in_array($attendance->status, ['absent', 'excused'], true)) {
            return $this->errorResponse('Devamsız veya mazeretli öğrenci için rapor düzenlenemez.', 422);
        }

        DB::beginTransaction();
        try {
            $report = DailyChildReport::updateOrCreate(
                [
                    'child_id' => $request->child_id,
                    'report_date' => $request->date,
                ],
                [
                    'teacher_id' => $this->user()->id,
                    'report_template_id' => $request->report_template_id,
                    'mood' => $request->mood,
                    'appetite' => $request->appetite,
                    'notes' => $request->notes,
                    'created_by' => $this->user()->id,
                    'updated_by' => $this->user()->id,
                ]
            );

            if ($request->has('values')) {
                foreach ($request->values as $inputId => $value) {
                    // Value array gelirse json_encode yap
                    $finalValue = is_array($value) ? json_encode($value) : $value;

                    ReportInputValue::updateOrCreate(
                        [
                            'daily_child_report_id' => $report->id,
                            'report_template_input_id' => $inputId,
                        ],
                        [
                            'value' => $finalValue,
                            'created_by' => $this->user()->id,
                            'updated_by' => $this->user()->id,
                        ]
                    );
                }
            }

            DB::commit();

            return $this->successResponse(null, 'Rapor başarıyla kaydedildi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rapor kayıt hatası: '.$e->getMessage());

            return $this->errorResponse('Kayıt sırasında hata oluştu.', 500);
        }
    }

    /**
     * Toplu Kayıt
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'child_ids' => 'required|array',
            'child_ids.*' => 'exists:children,id',
            'class_id' => 'required|exists:classes,id',
            'school_id' => 'required|exists:schools,id',
            'report_template_id' => 'nullable|exists:report_templates,id',
            'date' => 'required|date',
            'mood' => 'nullable|string',
            'values' => 'nullable|array',
        ]);

        if ($request->date !== now()->toDateString()) {
            return $this->errorResponse('Rapor yalnızca bugün için kaydedilebilir.', 422);
        }

        // Devamsız veya kayıtsız öğrencileri filtrele
        $attendances = Attendance::whereIn('child_id', $request->child_ids)
            ->where('class_id', $request->class_id)
            ->whereDate('attendance_date', $request->date)
            ->whereIn('status', ['present', 'late'])
            ->pluck('child_id')
            ->toArray();

        $eligibleChildIds = array_intersect($request->child_ids, $attendances);

        if (empty($eligibleChildIds)) {
            return $this->errorResponse('Rapor düzenlenebilecek öğrenci bulunamadı.', 422);
        }

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($eligibleChildIds as $childId) {
                // Raporu bul veya oluştur
                $report = DailyChildReport::firstOrCreate(
                    ['child_id' => $childId, 'report_date' => $request->date],
                    [
                        'teacher_id' => $this->user()->id,
                        'report_template_id' => $request->report_template_id,
                        'created_by' => $this->user()->id,
                        'updated_by' => $this->user()->id, // Create anında updated_by da set edelim
                    ]
                );

                // Gelen alanları güncelle
                if ($request->has('mood')) {
                    $report->mood = $request->mood;
                }
                if ($request->has('appetite')) {
                    $report->appetite = $request->appetite;
                }
                if ($request->has('notes')) {
                    $report->notes = $request->notes;
                }
                $report->updated_by = $this->user()->id;
                $report->save();

                // Dinamik değerler
                if ($request->has('values')) {
                    foreach ($request->values as $inputId => $value) {
                        $finalValue = is_array($value) ? json_encode($value) : $value;
                        ReportInputValue::updateOrCreate(
                            [
                                'daily_child_report_id' => $report->id,
                                'report_template_input_id' => $inputId,
                            ],
                            [
                                'value' => $finalValue,
                                'updated_by' => $this->user()->id,
                                'created_by' => $this->user()->id, // updateOrCreate için create durumunda gerekli
                            ]
                        );
                    }
                }
                $count++;
            }

            DB::commit();

            return $this->successResponse(null, "$count öğrenci için rapor güncellendi.");
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Toplu rapor hatası: '.$e->getMessage());

            return $this->errorResponse('Toplu işlem hatası.', 500);
        }
    }
}
