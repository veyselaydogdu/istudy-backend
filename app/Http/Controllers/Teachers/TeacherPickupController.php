<?php

namespace App\Http\Controllers\Teachers;

use App\Models\Academic\SchoolClass;
use App\Models\Child\AuthorizedPickup;
use App\Models\Child\ChildPickupLog;
use App\Traits\HandlesMediaStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * TeacherPickupController — Teslim Takibi
 *
 * Öğretmenin çocuk teslim loglarını ve yetkili alıcı bilgilerini yönetir.
 * C-3 / C-7: Yalnızca öğretmenin atandığı sınıflardaki çocuklar için işlem yapılabilir.
 */
class TeacherPickupController extends BaseTeacherController
{
    use HandlesMediaStorage;

    /**
     * Teslim log fotoğrafını auth:sanctum + signed URL ile sunar.
     * Öğretmen kendi sınıfındaki çocuğa ait log'a erişebilir.
     */
    public function servePickupPhoto(ChildPickupLog $log): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\Response
    {
        if (! $log->picked_by_photo) {
            abort(404);
        }

        return $this->servePrivate($log->picked_by_photo);
    }

    /**
     * Öğretmenin atandığı bir sınıfta kayıtlı çocuk olup olmadığını doğrular.
     * C-3 / C-7 güvenlik kontrolü.
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
     * Çocuğun yetkili alıcı listesini döner (velinin tanımladığı)
     */
    public function authorizedPickups(int $childId): JsonResponse
    {
        $profile = $this->teacherProfile();
        if ($profile instanceof JsonResponse) {
            return $profile;
        }

        // C-7: Öğretmen yalnızca kendi sınıfındaki çocuğun yetkili alıcılarını görebilir
        if (! $this->isChildInTeacherClass($profile->id, $childId)) {
            return $this->errorResponse('Bu öğrenciye erişim yetkiniz yok.', 403);
        }

        try {
            $pickups = AuthorizedPickup::where('child_id', $childId)
                ->active()
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'full_name' => $p->full_name,
                    'first_name' => $p->first_name,
                    'last_name' => $p->last_name,
                    'phone' => $p->phone,
                    'relation' => $p->relation,
                    'photo' => $p->photo,
                    'id_number' => $p->id_number,
                ]);

            return $this->successResponse($pickups, 'Yetkili alıcılar getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherPickupController::authorizedPickups Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Yetkili alıcılar alınamadı.', 500);
        }
    }

    /**
     * Teslim kaydı oluştur (fotoğraf ile)
     */
    public function recordPickup(int $childId, Request $request): JsonResponse
    {
        $request->validate([
            'picked_by_name' => ['required', 'string', 'max:255'],
            'picked_by_photo' => ['nullable', 'image', 'max:5120'],
            'authorized_pickup_id' => ['nullable', 'integer', 'exists:authorized_pickups,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $profile = $this->teacherProfile();
        if ($profile instanceof JsonResponse) {
            return $profile;
        }

        // C-3: Öğretmen yalnızca kendi sınıfındaki çocuğu teslim edebilir
        if (! $this->isChildInTeacherClass($profile->id, $childId)) {
            return $this->errorResponse('Bu öğrenciye erişim yetkiniz yok.', 403);
        }

        try {
            $photoPath = null;

            if ($request->hasFile('picked_by_photo')) {
                $photoPath = $this->storePrivate(
                    $request->file('picked_by_photo'),
                    "teachers/{$profile->id}/pickups/{$childId}"
                );
            }

            $log = ChildPickupLog::create([
                'child_id' => $childId,
                'authorized_pickup_id' => $request->authorized_pickup_id,
                'picked_by_name' => $request->picked_by_name,
                'picked_by_photo' => $photoPath,
                'picked_at' => now(),
                'notes' => $request->notes,
                'created_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'id' => $log->id,
                'child_id' => $log->child_id,
                'picked_by_name' => $log->picked_by_name,
                'picked_by_photo_url' => $photoPath
                    ? $this->privateSignedUrl('teacher.pickup.photo', ['log' => $log->id], 60)
                    : null,
                'picked_at' => $log->picked_at->toISOString(),
            ], 'Teslim kaydı oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('TeacherPickupController::recordPickup Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Teslim kaydı oluşturulamadı.', 500);
        }
    }

    /**
     * Çocuğun geçmiş teslim loglarını döner
     */
    public function pickupLogs(int $childId): JsonResponse
    {
        $profile = $this->teacherProfile();
        if ($profile instanceof JsonResponse) {
            return $profile;
        }

        // C-3: Öğretmen yalnızca kendi sınıfındaki çocuğun teslim loglarını görebilir
        if (! $this->isChildInTeacherClass($profile->id, $childId)) {
            return $this->errorResponse('Bu öğrenciye erişim yetkiniz yok.', 403);
        }

        try {
            $logs = ChildPickupLog::with(['authorizedPickup', 'createdBy:id,name,surname'])
                ->where('child_id', $childId)
                ->orderByDesc('picked_at')
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'picked_by_name' => $log->picked_by_name,
                    'picked_by_photo_url' => $log->picked_by_photo
                        ? $this->privateSignedUrl('teacher.pickup.photo', ['log' => $log->id], 60)
                        : null,
                    'picked_at' => $log->picked_at->toISOString(),
                    'notes' => $log->notes,
                    'authorized_pickup' => $log->authorizedPickup ? [
                        'id' => $log->authorizedPickup->id,
                        'full_name' => $log->authorizedPickup->full_name,
                        'relation' => $log->authorizedPickup->relation,
                    ] : null,
                    'recorded_by' => $log->createdBy ? $log->createdBy->name.' '.$log->createdBy->surname : null,
                ]);

            return $this->successResponse($logs, 'Teslim logları getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherPickupController::pickupLogs Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Teslim logları alınamadı.', 500);
        }
    }
}
