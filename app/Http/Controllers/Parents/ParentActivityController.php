<?php

namespace App\Http\Controllers\Parents;

use App\Models\Activity\Activity;
use App\Models\Activity\ActivityEnrollment;
use App\Models\Activity\ActivityGalleryItem;
use App\Models\Child\Child;
use App\Services\ActivityInvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class ParentActivityController extends BaseParentController
{
    /**
     * Aile çocuklarının okul(larına) ait etkinlikleri listele.
     * is_enrollment_required = true ve veli kayıtlı değilse is_enrolled = false döner.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $schoolIds = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->whereNotNull('school_id')
                ->pluck('school_id')
                ->unique()
                ->filter();

            if ($schoolIds->isEmpty()) {
                return $this->successResponse([]);
            }

            $query = Activity::withoutGlobalScope('tenant')
                ->where(function ($q) use ($schoolIds) {
                    $q->whereIn('school_id', $schoolIds)
                        ->orWhere('is_global', true);
                })
                ->with(['school:id,name,tenant_id', 'school.tenant:id,name', 'classes:id,name', 'tenant:id,name'])
                ->withCount('enrollments')
                ->orderByDesc('start_date');

            if ($request->filled('search')) {
                $query->where('name', 'like', '%'.$request->search.'%');
            }

            $data = $query->paginate($request->integer('per_page', 20));

            // Her etkinlik için velinin hangi çocuklarının kayıtlı olduğunu ekle
            $enrollmentsByActivity = ActivityEnrollment::where('family_profile_id', $familyProfile->id)
                ->whereIn('activity_id', $data->pluck('id'))
                ->select('activity_id', 'child_id')
                ->get()
                ->groupBy('activity_id')
                ->map(fn ($rows) => $rows->pluck('child_id')->filter()->values()->toArray());

            $data->getCollection()->transform(function ($activity) use ($enrollmentsByActivity) {
                $activity->enrolled_child_ids = $enrollmentsByActivity->get($activity->id, []);

                return $activity;
            });

            return $this->paginatedResponse(
                \App\Http\Resources\ActivityResource::collection($data)
            );
        } catch (\Throwable $e) {
            Log::error('ParentActivityController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Etkinlik detayı.
     * is_enrollment_required = true ve kayıt yoksa 403 döner.
     */
    public function show(Request $request, Activity $activity): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            // Etkinlik velinin çocuklarının okuluna mı ait?
            $schoolIds = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->whereNotNull('school_id')
                ->pluck('school_id')
                ->unique();

            if (! $activity->is_global && ! $schoolIds->contains($activity->school_id)) {
                return $this->errorResponse('Bu etkinliğe erişim yetkiniz yok.', 403);
            }

            // Ailenin bu etkinliğe kayıtlı çocuk ID'leri
            $enrolledChildIds = ActivityEnrollment::where('activity_id', $activity->id)
                ->where('family_profile_id', $familyProfile->id)
                ->pluck('child_id')
                ->filter()
                ->values()
                ->toArray();

            $isEnrolled = count($enrolledChildIds) > 0;

            $activity->load(['school:id,name,tenant_id', 'school.tenant:id,name', 'classes:id,name', 'tenant:id,name']);
            $activity->enrolled_child_ids = $enrolledChildIds;

            $canSeeExtras = ! $activity->is_enrollment_required || $isEnrolled;

            // Katılımcı sayısı yalnızca kayıtlıysa görünür
            $enrollmentsCount = $canSeeExtras ? ActivityEnrollment::where('activity_id', $activity->id)->count() : null;

            // Materyaller her zaman görünür
            $materials = $activity->materials ?? [];

            // Galeri ve katılımcı listesi yalnızca kayıtlıysa görünür
            $participants = [];
            $galleryItems = collect([]);

            if ($canSeeExtras) {
                $activity->load('gallery');
                $galleryItems = $activity->gallery->map(fn ($item) => $this->formatGalleryItem($item));

                // Katılımcılar: enrollment'a bağlı child kaydından doğrudan al
                $participants = ActivityEnrollment::where('activity_id', $activity->id)
                    ->with(['child' => fn ($q) => $q->withoutGlobalScope('tenant')
                        ->select('id', 'first_name', 'last_name'),
                    ])
                    ->orderBy('enrolled_at')
                    ->get()
                    ->filter(fn ($e) => $e->child !== null)
                    ->map(fn ($e) => [
                        'name' => $e->child->first_name.' '.mb_substr($e->child->last_name ?? '', 0, 1, 'UTF-8').'.',
                    ])
                    ->values()
                    ->toArray();
            }

            $activityData = \App\Http\Resources\ActivityResource::make($activity)->resolve();

            return $this->successResponse(array_merge($activityData, [
                'enrolled_child_ids' => $enrolledChildIds,
                'enrollments_count' => $enrollmentsCount,
                'gallery' => $galleryItems,
                'materials' => $materials,
                'participants' => $participants,
            ]));
        } catch (\Throwable $e) {
            Log::error('ParentActivityController::show', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Etkinliğe katıl — çocuk bazlıdır, ücretli etkinlikte fatura oluşturulur.
     */
    public function enroll(Request $request, Activity $activity): JsonResponse
    {
        $data = $request->validate([
            'child_id' => ['required', 'integer'],
        ]);

        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            // Çocuk bu aileye mi ait ve etkinliğin okuluna kayıtlı mı?
            $child = Child::withoutGlobalScope('tenant')
                ->where('id', $data['child_id'])
                ->where('family_profile_id', $familyProfile->id)
                ->first();

            if (! $child) {
                return $this->errorResponse('Çocuk bulunamadı veya bu aileye ait değil.', 404);
            }

            if (! $activity->is_global && $child->school_id !== $activity->school_id) {
                return $this->errorResponse('Bu çocuk etkinliğin okuluna kayıtlı değil.', 403);
            }

            // Etkinlik belirli sınıflara özel ise çocuğun sınıfı kontrolü (global etkinliklerde yok)
            $activity->loadMissing('classes');
            if (! $activity->is_global && $activity->classes->isNotEmpty()) {
                $childClassIds = $child->classes()->pluck('classes.id')->toArray();
                $activityClassIds = $activity->classes->pluck('id')->toArray();
                $eligible = count(array_intersect($childClassIds, $activityClassIds)) > 0;

                if (! $eligible) {
                    return $this->errorResponse('Bu çocuk etkinliğe uygun sınıfta değil.', 403);
                }
            }

            $already = ActivityEnrollment::where('activity_id', $activity->id)
                ->where('child_id', $child->id)
                ->exists();

            if ($already) {
                return $this->errorResponse('Bu çocuk etkinliğe zaten kayıtlı.', 422);
            }

            // Kapasite kontrolü
            if ($activity->capacity !== null) {
                $enrollmentCount = ActivityEnrollment::where('activity_id', $activity->id)->count();
                if ($enrollmentCount >= $activity->capacity) {
                    return $this->errorResponse('Bu etkinliğin kontenjanı dolmuştur.', 422);
                }
            }

            DB::beginTransaction();

            $enrollment = ActivityEnrollment::create([
                'activity_id' => $activity->id,
                'family_profile_id' => $familyProfile->id,
                'child_id' => $child->id,
                'enrolled_by_user_id' => $this->user()->id,
                'enrolled_at' => now(),
            ]);

            // Ücretli etkinlikte fatura oluştur
            if ($activity->is_paid && $activity->price > 0) {
                $activity->loadMissing('school');
                (new ActivityInvoiceService)->createForEnrollment($enrollment, $activity, $this->user()->id);
            }

            DB::commit();

            return $this->successResponse(null, 'Etkinliğe başarıyla katıldınız.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ParentActivityController::enroll', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Etkinlikten ayrıl — çocuk bazlıdır, iptal politikası kontrolü yapılır.
     */
    public function unenroll(Request $request, Activity $activity): JsonResponse
    {
        $childId = $request->input('child_id');

        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $query = ActivityEnrollment::where('activity_id', $activity->id)
                ->where('family_profile_id', $familyProfile->id);

            if ($childId) {
                $query->where('child_id', $childId);
            }

            $enrollment = $query->first();

            if (! $enrollment) {
                return $this->errorResponse('Bu etkinliğe kayıtlı değilsiniz.', 422);
            }

            // ── İptal politikası kontrolü ────────────────────────────────────────
            if (! $activity->cancellation_allowed) {
                return $this->errorResponse('Bu etkinliğin kaydı iptal edilemez.', 422);
            }

            $now = now();

            if ($activity->cancellation_deadline) {
                if ($now->gt($activity->cancellation_deadline)) {
                    return $this->errorResponse(
                        'Kayıt iptal süresi dolmuştur. Son iptal tarihi: '
                        .$activity->cancellation_deadline->format('d.m.Y H:i'),
                        422
                    );
                }
            } else {
                // Deadline yok — etkinlik başlamadan önce iptal edilebilir
                if ($activity->start_date) {
                    $startDt = $activity->start_date->copy()->startOfDay();
                    if ($activity->start_time) {
                        [$h, $m] = explode(':', $activity->start_time);
                        $startDt->setTime((int) $h, (int) $m);
                    }
                    if ($now->gte($startDt)) {
                        return $this->errorResponse('Etkinlik başladığı için kaydınızı iptal edemezsiniz.', 422);
                    }
                }
            }

            DB::beginTransaction();

            // Ücretli ise fatura işle (iade veya iptal)
            if ($activity->is_paid && $enrollment->invoice_id) {
                (new ActivityInvoiceService)->handleEnrollmentCancellation($enrollment, 'Kayıt iptali (veli)');
            }

            $enrollment->delete();

            DB::commit();

            return $this->successResponse(null, 'Etkinlik kaydınız iptal edildi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ParentActivityController::unenroll', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Etkinlik galerisi — is_enrollment_required ise kayıt kontrolü yapılır.
     */
    public function gallery(Activity $activity): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $schoolIds = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->whereNotNull('school_id')
                ->pluck('school_id')
                ->unique();

            if (! $activity->is_global && ! $schoolIds->contains($activity->school_id)) {
                return $this->errorResponse('Bu etkinliğe erişim yetkiniz yok.', 403);
            }

            if ($activity->is_enrollment_required) {
                $isEnrolled = ActivityEnrollment::where('activity_id', $activity->id)
                    ->where('family_profile_id', $familyProfile->id)
                    ->exists();

                if (! $isEnrolled) {
                    return $this->errorResponse('Galeriyi görüntülemek için etkinliğe kayıtlı olmalısınız.', 403);
                }
            }

            $items = $activity->gallery()->get()->map(fn ($item) => $this->formatGalleryItem($item));

            return $this->successResponse($items);
        } catch (\Throwable $e) {
            Log::error('ParentActivityController::gallery', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Galeri dosyasını signed URL ile sun.
     */
    public function serveGalleryItem(ActivityGalleryItem $galleryItem)
    {
        abort_unless(Storage::disk('local')->exists($galleryItem->file_path), 404);

        return Storage::disk('local')->response(
            $galleryItem->file_path,
            $galleryItem->original_name,
            ['Content-Type' => $galleryItem->mime_type]
        );
    }

    private function formatGalleryItem(ActivityGalleryItem $item): array
    {
        return [
            'id' => $item->id,
            'file_type' => $item->file_type,
            'mime_type' => $item->mime_type,
            'file_size' => $item->file_size,
            'original_name' => $item->original_name,
            'caption' => $item->caption,
            'sort_order' => $item->sort_order,
            'url' => URL::signedRoute('parent.activity-gallery.serve', ['galleryItem' => $item->id], now()->addHours(2)),
            'created_at' => $item->created_at,
        ];
    }
}
