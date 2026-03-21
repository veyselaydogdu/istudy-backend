<?php

namespace App\Http\Controllers\Parents;

use App\Models\ActivityClass\ActivityClass;
use App\Models\ActivityClass\ActivityClassEnrollment;
use App\Models\ActivityClass\ActivityClassInvoice;
use App\Models\Child\Child;
use App\Models\School\School;
use App\Services\ActivityClassInvoiceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class ParentActivityClassController extends BaseParentController
{
    /**
     * Aile çocuklarının okul(larına) ait etkinlik sınıflarını listele
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

            // Çocukların okullarının tenant_id'lerini bul
            $tenantIds = School::whereIn('id', $schoolIds)->pluck('tenant_id')->unique()->filter();

            $query = ActivityClass::withoutGlobalScope('tenant')
                ->where('is_active', true)
                ->where(function ($q) use ($schoolIds, $tenantIds) {
                    // Okul bazlı etkinlikler
                    $q->whereIn('school_id', $schoolIds)
                        // VEYA tenant geneli (school_id null) olan etkinlikler
                        ->orWhere(function ($q2) use ($tenantIds) {
                            $q2->whereNull('school_id')->whereIn('tenant_id', $tenantIds);
                        });
                })
                ->with(['schoolClasses:id,name', 'teachers.user:id,name,surname'])
                ->withCount(['activeEnrollments']);

            $data = $query->latest()->paginate(request('per_page', 20));

            $familyChildIds = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->pluck('id');

            $enrolledMap = ActivityClassEnrollment::whereIn('activity_class_id', $data->pluck('id'))
                ->whereIn('child_id', $familyChildIds)
                ->where('status', 'active')
                ->get(['activity_class_id', 'child_id'])
                ->groupBy('activity_class_id')
                ->map(fn ($g) => $g->pluck('child_id'));

            $result = $data->getCollection()->map(function ($ac) use ($enrolledMap) {
                return array_merge($this->formatActivityClass($ac), [
                    'enrolled_child_ids' => $enrolledMap->get($ac->id, collect())->values(),
                ]);
            });

            $data->setCollection($result);

            return response()->json([
                'success' => true,
                'message' => 'Veriler başarıyla listelendi.',
                'data' => $data->items(),
                'meta' => [
                    'current_page' => $data->currentPage(),
                    'last_page' => $data->lastPage(),
                    'per_page' => $data->perPage(),
                    'total' => $data->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('ParentActivityClassController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function show(int $activity_class_id): JsonResponse
    {
        try {
            $activityClass = ActivityClass::withoutGlobalScope('tenant')
                ->with(['schoolClasses:id,name', 'teachers.user:id,name,surname', 'materials'])
                ->findOrFail($activity_class_id);

            return $this->successResponse($this->formatActivityClass($activityClass));
        } catch (\Throwable $e) {
            Log::error('ParentActivityClassController::show', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Veli çocuğunu etkinlik sınıfına kaydeder
     */
    public function enroll(Request $request, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'child_id' => 'required|integer|exists:children,id',
        ]);

        try {
            DB::beginTransaction();

            $familyProfile = $this->getFamilyProfile();
            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $child = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->findOrFail($request->child_id);

            $activityClass = ActivityClass::withoutGlobalScope('tenant')
                ->where('is_active', true)
                ->findOrFail($activity_class_id);

            // Okul kontrolü: etkinlik belirli bir okula aitse çocuğun o okulda kayıtlı olması gerekir.
            // Tenant geneli etkinlikte (school_id null) okul kontrolü yapılmaz, tenant eşleşmesi yeterlidir.
            if ($activityClass->school_id !== null && $child->school_id !== $activityClass->school_id) {
                return $this->errorResponse('Çocuğunuz bu etkinlik sınıfının okuluna kayıtlı değil.', 422);
            }

            // Tenant geneli etkinlikte çocuğun herhangi bir okula kayıtlı olması gerekir
            if ($activityClass->school_id === null) {
                $childSchool = School::find($child->school_id);
                if (! $childSchool || $childSchool->tenant_id !== $activityClass->tenant_id) {
                    return $this->errorResponse('Bu etkinlik sınıfına erişim yetkiniz yok.', 422);
                }
            }

            // Duplicate check
            if (ActivityClassEnrollment::where('activity_class_id', $activityClass->id)->where('child_id', $child->id)->whereNull('deleted_at')->exists()) {
                return $this->errorResponse("{$child->full_name} zaten bu etkinlik sınıfına kayıtlı.", 422);
            }

            // Daha önce iptal edilmiş (soft-deleted) kayıt varsa unique constraint çakışmasını önlemek için sil
            ActivityClassEnrollment::withTrashed()
                ->where('activity_class_id', $activityClass->id)
                ->where('child_id', $child->id)
                ->whereNotNull('deleted_at')
                ->forceDelete();

            // Age check
            if ($activityClass->age_min !== null || $activityClass->age_max !== null) {
                $age = Carbon::parse($child->birth_date)->age;
                if ($activityClass->age_min !== null && $age < $activityClass->age_min) {
                    return $this->errorResponse("Bu etkinlik için minimum yaş sınırı {$activityClass->age_min}'dir.", 422);
                }
                if ($activityClass->age_max !== null && $age > $activityClass->age_max) {
                    return $this->errorResponse("Bu etkinlik için maksimum yaş sınırı {$activityClass->age_max}'dir.", 422);
                }
            }

            // Capacity check
            if ($activityClass->capacity !== null) {
                $count = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)->where('status', 'active')->count();
                if ($count >= $activityClass->capacity) {
                    return $this->errorResponse('Etkinlik sınıfının kapasitesi dolu.', 422);
                }
            }

            $enrollment = ActivityClassEnrollment::create([
                'activity_class_id' => $activityClass->id,
                'child_id' => $child->id,
                'family_profile_id' => $familyProfile->id,
                'status' => 'active',
                'enrolled_by' => 'parent',
                'enrolled_by_user_id' => $this->user()->id,
                'enrolled_at' => now(),
            ]);

            // Generate invoice if paid
            if ($activityClass->is_paid) {
                $invoiceNumber = 'INV-AC-'.strtoupper(substr(uniqid(), -8));
                ActivityClassInvoice::create([
                    'activity_class_enrollment_id' => $enrollment->id,
                    'activity_class_id' => $activityClass->id,
                    'child_id' => $child->id,
                    'family_profile_id' => $familyProfile->id,
                    'invoice_number' => $invoiceNumber,
                    'amount' => $activityClass->price,
                    'currency' => $activityClass->currency,
                    'status' => 'pending',
                    'payment_required' => $activityClass->invoice_required,
                    'created_by' => $this->user()->id,
                ]);
            }

            DB::commit();

            return $this->successResponse(
                ['enrollment_id' => $enrollment->id, 'is_paid' => $activityClass->is_paid],
                "{$child->full_name} etkinlik sınıfına kaydedildi.",
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ParentActivityClassController::enroll', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function unenroll(Request $request, int $activity_class_id, int $child_id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $familyProfile = $this->getFamilyProfile();
            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $child = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->findOrFail($child_id);

            $enrollment = ActivityClassEnrollment::where('activity_class_id', $activity_class_id)
                ->where('child_id', $child->id)
                ->firstOrFail();

            $billingResult = (new ActivityClassInvoiceService)->handleEnrollmentCancellation(
                $enrollment->id,
                $request->input('refund_reason')
            );

            $enrollment->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            $enrollment->delete();

            DB::commit();

            return $this->successResponse(
                ['refunded' => $billingResult['refunded']],
                $billingResult['refunded'] ? 'Kayıt iptal edildi ve iade faturası oluşturuldu.' : 'Kayıt iptal edildi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ParentActivityClassController::unenroll', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function myEnrollments(): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();
            if (! $familyProfile) {
                return $this->successResponse([]);
            }

            $childIds = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->pluck('id');

            $enrollments = ActivityClassEnrollment::whereIn('child_id', $childIds)
                ->where('status', 'active')
                ->with(['activityClass' => fn ($q) => $q->withoutGlobalScope('tenant'), 'child:id,first_name,last_name', 'invoice'])
                ->get();

            $data = $enrollments->map(function ($enrollment) {
                $ac = $enrollment->activityClass;

                return [
                    'enrollment_id' => $enrollment->id,
                    'activity_class' => $ac ? $this->formatActivityClass($ac) : null,
                    'child' => $enrollment->child ? ['id' => $enrollment->child->id, 'name' => $enrollment->child->full_name] : null,
                    'enrolled_at' => $enrollment->enrolled_at,
                    'invoice' => $enrollment->invoice ? [
                        'id' => $enrollment->invoice->id,
                        'invoice_number' => $enrollment->invoice->invoice_number,
                        'amount' => $enrollment->invoice->amount,
                        'currency' => $enrollment->invoice->currency,
                        'status' => $enrollment->invoice->status,
                        'due_date' => $enrollment->invoice->due_date,
                        'payment_required' => $enrollment->invoice->payment_required,
                    ] : null,
                ];
            });

            return $this->successResponse($data);
        } catch (\Throwable $e) {
            Log::error('ParentActivityClassController::myEnrollments', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function gallery(int $activity_class_id): JsonResponse
    {
        try {
            $activityClass = ActivityClass::withoutGlobalScope('tenant')
                ->findOrFail($activity_class_id);

            $items = $activityClass->gallery()->get()->map(fn ($item) => [
                'id' => $item->id,
                'caption' => $item->caption,
                'url' => URL::signedRoute('activity-class-gallery.serve', ['galleryItem' => $item->id], now()->addHours(2)),
                'sort_order' => $item->sort_order,
                'created_at' => $item->created_at,
            ]);

            return $this->successResponse($items);
        } catch (\Throwable $e) {
            Log::error('ParentActivityClassController::gallery', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    private function formatActivityClass(ActivityClass $ac): array
    {
        return [
            'id' => $ac->id,
            'name' => $ac->name,
            'description' => $ac->description,
            'language' => $ac->language,
            'age_min' => $ac->age_min,
            'age_max' => $ac->age_max,
            'capacity' => $ac->capacity,
            'active_enrollments_count' => $ac->active_enrollments_count ?? $ac->activeEnrollments()->count(),
            'is_school_wide' => $ac->is_school_wide,
            'is_paid' => $ac->is_paid,
            'price' => $ac->price,
            'currency' => $ac->currency,
            'invoice_required' => $ac->invoice_required,
            'start_date' => $ac->start_date,
            'end_date' => $ac->end_date,
            'schedule' => $ac->schedule,
            'location' => $ac->location,
            'notes' => $ac->notes,
            'school_classes' => $ac->relationLoaded('schoolClasses') ? $ac->schoolClasses->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]) : null,
            'teachers' => $ac->relationLoaded('teachers') ? $ac->teachers->map(fn ($t) => ['id' => $t->id, 'name' => $t->user->name.' '.$t->user->surname, 'role' => $t->pivot->role ?? null]) : null,
            'materials' => $ac->relationLoaded('materials') ? $ac->materials : null,
        ];
    }
}
