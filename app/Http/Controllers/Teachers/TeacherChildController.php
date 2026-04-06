<?php

namespace App\Http\Controllers\Teachers;

use App\Models\Academic\SchoolClass;
use App\Models\Child\Child;
use App\Models\Child\ChildMedicationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * TeacherChildController — Öğrenci Detayları
 *
 * Öğretmenin öğrenci sağlık, aile ve ilaç bilgilerine erişimi.
 * C-4: Yalnızca öğretmenin atandığı sınıflardaki çocuklar için erişim sağlanır.
 */
class TeacherChildController extends BaseTeacherController
{
    /**
     * Öğretmenin atandığı bir sınıfta kayıtlı çocuk olup olmadığını doğrular.
     * C-4 güvenlik kontrolü.
     */
    private function isChildInTeacherClass(int $teacherProfileId, int $childId): bool
    {
        return SchoolClass::whereHas(
            'teachers',
            fn ($q) => $q->where('teacher_profile_id', $teacherProfileId)
        )->whereHas(
            'children',
            fn ($q) => $q->where('children.id', $childId)
        )->exists();
    }

    /**
     * Öğrenci tam detayını döner
     */
    public function show(int $childId): JsonResponse
    {
        $profile = $this->teacherProfile();
        if ($profile instanceof JsonResponse) {
            return $profile;
        }

        // C-4: Öğretmen yalnızca kendi sınıfındaki çocuğun detayına erişebilir
        if (! $this->isChildInTeacherClass($profile->id, $childId)) {
            return $this->errorResponse('Bu öğrenciye erişim yetkiniz yok.', 403);
        }

        try {
            $child = Child::with([
                'allergens' => fn ($q) => $q->withoutGlobalScope('tenant'),
                'medications' => fn ($q) => $q->withoutGlobalScope('tenant'),
                'conditions' => fn ($q) => $q->withoutGlobalScope('tenant'),
                'familyProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('owner'),
                'authorizedPickups' => fn ($q) => $q->active(),
                'school:id,name',
                'classes:id,name',
            ])->findOrFail($childId);

            $result = [
                'id' => $child->id,
                'first_name' => $child->first_name,
                'last_name' => $child->last_name,
                'full_name' => $child->full_name,
                'birth_date' => $child->birth_date?->format('Y-m-d'),
                'gender' => $child->gender,
                'blood_type' => $child->blood_type,
                'profile_photo' => $child->profile_photo,
                'status' => $child->status,
                'special_notes' => $child->special_notes,
                'school' => $child->school,
                'classes' => $child->classes->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
                'allergens' => $child->allergens->map(fn ($a) => ['id' => $a->id, 'name' => $a->name]),
                'medications' => $child->medications->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'dose' => $m->pivot->dose,
                    'usage_time' => $m->pivot->usage_time,
                    'usage_days' => $m->pivot->usage_days,
                    'custom_name' => $m->pivot->custom_name,
                ]),
                'conditions' => $child->conditions->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
                'family_profile' => $child->familyProfile ? [
                    'id' => $child->familyProfile->id,
                    'owner' => $child->familyProfile->owner ? [
                        'id' => $child->familyProfile->owner->id,
                        'name' => $child->familyProfile->owner->name,
                        'surname' => $child->familyProfile->owner->surname,
                        'phone' => $child->familyProfile->owner->phone,
                        'email' => $child->familyProfile->owner->email,
                    ] : null,
                ] : null,
                'authorized_pickups' => $child->authorizedPickups->map(fn ($p) => [
                    'id' => $p->id,
                    'full_name' => $p->full_name,
                    'phone' => $p->phone,
                    'relation' => $p->relation,
                    'photo' => $p->photo,
                ]),
            ];

            return $this->successResponse($result, 'Öğrenci detayı getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherChildController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Öğrenci bulunamadı.', 404);
        }
    }

    /**
     * Bugün verilmesi gereken ilaçlar ve verildi mi bilgisi
     */
    public function todayMedications(int $childId): JsonResponse
    {
        $profile = $this->teacherProfile();
        if ($profile instanceof JsonResponse) {
            return $profile;
        }

        // C-4: Öğretmen yalnızca kendi sınıfındaki çocuğun ilaç bilgilerine erişebilir
        if (! $this->isChildInTeacherClass($profile->id, $childId)) {
            return $this->errorResponse('Bu öğrenciye erişim yetkiniz yok.', 403);
        }

        try {
            $child = Child::with([
                'medications' => fn ($q) => $q->withoutGlobalScope('tenant'),
            ])->findOrFail($childId);

            $today = Carbon::today();
            $dayOfWeek = strtolower($today->format('l')); // monday, tuesday, ...

            // Bugünkü medication logları
            $givenToday = ChildMedicationLog::where('child_id', $childId)
                ->whereDate('given_at', $today)
                ->get()
                ->keyBy('medication_id');

            $medications = $child->medications->map(function ($medication) use ($dayOfWeek, $givenToday) {
                $usageDays = $medication->pivot->usage_days;

                // Bugün verilmesi gerekiyor mu? (usage_days JSON/array kontrolü)
                $isScheduledToday = true;
                if (! empty($usageDays)) {
                    $days = is_string($usageDays) ? json_decode($usageDays, true) : $usageDays;
                    $isScheduledToday = in_array($dayOfWeek, (array) $days);
                }

                $log = $givenToday->get($medication->id);

                return [
                    'medication_id' => $medication->id,
                    'name' => $medication->name,
                    'custom_name' => $medication->pivot->custom_name,
                    'dose' => $medication->pivot->dose,
                    'usage_time' => $medication->pivot->usage_time,
                    'usage_days' => $medication->pivot->usage_days,
                    'is_scheduled_today' => $isScheduledToday,
                    'is_given_today' => (bool) $log,
                    'given_at' => $log?->given_at?->toISOString(),
                    'given_by' => $log?->givenBy?->name,
                ];
            });

            return $this->successResponse($medications, 'Bugünkü ilaçlar getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherChildController::todayMedications Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('İlaç bilgileri alınamadı.', 500);
        }
    }
}
