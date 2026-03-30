<?php

namespace App\Http\Controllers\Schools;

use App\Models\ActivityClass\ActivityClass;
use App\Models\ActivityClass\ActivityClassEnrollment;
use App\Models\ActivityClass\ActivityClassInvoice;
use App\Models\Child\Child;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivityClassEnrollmentController extends BaseSchoolController
{
    public function index(int $school_id, int $activity_class_id): JsonResponse
    {
        try {
            $activityClass = ActivityClass::where('school_id', $school_id)->findOrFail($activity_class_id);

            $enrollments = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
                ->with(['child', 'invoice'])
                ->latest()
                ->paginate(request('per_page', 20));

            return $this->paginatedResponse(\App\Http\Resources\ActivityClass\ActivityClassEnrollmentResource::collection($enrollments));
        } catch (\Throwable $e) {
            Log::error('ActivityClassEnrollmentController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function store(Request $request, int $school_id, int $activity_class_id): JsonResponse
    {
        $request->validate([
            'child_id' => 'required|integer|exists:children,id',
            'notes' => 'nullable|string',
            'generate_invoice' => 'boolean',
            'invoice_required' => 'boolean',
            'due_date' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            $activityClass = ActivityClass::where('school_id', $school_id)->findOrFail($activity_class_id);
            $child = Child::where('school_id', $school_id)->findOrFail($request->child_id);

            // Duplicate check
            $existing = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
                ->where('child_id', $child->id)
                ->whereNull('deleted_at')
                ->first();

            if ($existing) {
                return $this->errorResponse("{$child->full_name} zaten bu etkinlik sınıfına kayıtlı.", 422);
            }

            // Age check
            if ($activityClass->age_min !== null || $activityClass->age_max !== null) {
                $age = Carbon::parse($child->birth_date)->age;

                if ($activityClass->age_min !== null && $age < $activityClass->age_min) {
                    return $this->errorResponse("{$child->full_name} bu etkinlik için minimum yaş sınırının ({$activityClass->age_min}) altındadır.", 422);
                }

                if ($activityClass->age_max !== null && $age > $activityClass->age_max) {
                    return $this->errorResponse("{$child->full_name} bu etkinlik için maksimum yaş sınırını ({$activityClass->age_max}) aşmaktadır.", 422);
                }
            }

            // Capacity check
            if ($activityClass->capacity !== null) {
                $enrolledCount = ActivityClassEnrollment::where('activity_class_id', $activityClass->id)
                    ->where('status', 'active')
                    ->count();

                if ($enrolledCount >= $activityClass->capacity) {
                    return $this->errorResponse('Etkinlik sınıfının kapasitesi dolu.', 422);
                }
            }

            $enrollment = ActivityClassEnrollment::create([
                'activity_class_id' => $activityClass->id,
                'child_id' => $child->id,
                'family_profile_id' => $child->family_profile_id,
                'status' => 'active',
                'enrolled_by' => 'tenant',
                'enrolled_by_user_id' => $this->user()->id,
                'enrolled_at' => now(),
                'notes' => $request->notes,
            ]);

            // Generate invoice if paid activity
            if ($activityClass->is_paid && $request->boolean('generate_invoice', true)) {
                $this->createInvoice($enrollment, $activityClass, $request);
            }

            $enrollment->load(['child', 'invoice']);

            DB::commit();

            return $this->successResponse(
                \App\Http\Resources\ActivityClass\ActivityClassEnrollmentResource::make($enrollment),
                "{$child->full_name} etkinlik sınıfına kaydedildi.",
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassEnrollmentController::store', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function destroy(int $school_id, int $activity_class_id, int $enrollment_id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $enrollment = ActivityClassEnrollment::where('activity_class_id', $activity_class_id)
                ->findOrFail($enrollment_id);

            $enrollment->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            $enrollment->delete();

            DB::commit();

            return $this->successResponse(null, 'Kayıt iptal edildi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ActivityClassEnrollmentController::destroy', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    private function createInvoice(ActivityClassEnrollment $enrollment, ActivityClass $activityClass, Request $request): void
    {
        $invoiceNumber = 'INV-AC-'.strtoupper(substr(uniqid(), -8));

        ActivityClassInvoice::create([
            'activity_class_enrollment_id' => $enrollment->id,
            'activity_class_id' => $activityClass->id,
            'child_id' => $enrollment->child_id,
            'family_profile_id' => $enrollment->family_profile_id,
            'invoice_number' => $invoiceNumber,
            'amount' => $activityClass->price,
            'currency' => $activityClass->currency,
            'status' => 'pending',
            'payment_required' => $request->boolean('invoice_required', $activityClass->invoice_required),
            'due_date' => $request->due_date,
            'created_by' => $this->user()->id,
        ]);
    }
}
