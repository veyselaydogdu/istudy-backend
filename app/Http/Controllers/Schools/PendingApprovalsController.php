<?php

namespace App\Http\Controllers\Schools;

use App\Models\Child\ChildFieldChangeRequest;
use App\Models\Child\ChildRemovalRequest;
use App\Models\School\SchoolChildEnrollmentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Tenant genelinde bekleyen tüm onayları tek noktada toplayan controller.
 */
class PendingApprovalsController extends BaseSchoolController
{
    /**
     * Tenant'a ait tüm okullardaki bekleyen onayları döndürür.
     *
     * @return array{
     *   child_enrollment_requests: array,
     *   child_removal_requests: array,
     *   child_field_change_requests: array,
     *   counts: array,
     * }
     */
    public function index(): JsonResponse
    {
        try {
            $tenantId = Auth::user()->tenant_id;

            $schoolIds = \App\Models\School\School::where('tenant_id', $tenantId)
                ->pluck('id');

            // 1. Öğrenci kayıt talepleri
            $enrollmentRequests = SchoolChildEnrollmentRequest::with([
                'school:id,name',
                'child' => fn ($q) => $q->withoutGlobalScope('tenant')->select('id', 'first_name', 'last_name'),
                'familyProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('owner'),
            ])
                ->whereIn('school_id', $schoolIds)
                ->where('status', 'pending')
                ->latest()
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'type' => 'enrollment',
                    'school_id' => $r->school_id,
                    'school_name' => $r->school?->name,
                    'child_name' => $r->child
                        ? trim($r->child->first_name.' '.($r->child->last_name ?? ''))
                        : null,
                    'owner_name' => $r->familyProfile?->owner
                        ? trim($r->familyProfile->owner->name.' '.($r->familyProfile->owner->surname ?? ''))
                        : null,
                    'created_at' => $r->created_at,
                ]);

            // 2. Çocuk silme talepleri
            $removalRequests = ChildRemovalRequest::with([
                'school:id,name',
                'child' => fn ($q) => $q->withoutGlobalScope('tenant')->select('id', 'first_name', 'last_name'),
                'familyProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('owner'),
            ])
                ->whereIn('school_id', $schoolIds)
                ->where('status', 'pending')
                ->latest()
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'type' => 'removal',
                    'school_id' => $r->school_id,
                    'school_name' => $r->school?->name,
                    'child_name' => $r->child
                        ? trim($r->child->first_name.' '.($r->child->last_name ?? ''))
                        : null,
                    'owner_name' => $r->familyProfile?->owner
                        ? trim($r->familyProfile->owner->name.' '.($r->familyProfile->owner->surname ?? ''))
                        : null,
                    'reason' => $r->reason,
                    'created_at' => $r->created_at,
                ]);

            // 3. Çocuk alan değişiklik talepleri
            $fieldChangeRequests = ChildFieldChangeRequest::with([
                'child' => fn ($q) => $q->withoutGlobalScope('tenant')
                    ->select('id', 'first_name', 'last_name', 'school_id')
                    ->with('school:id,name'),
                'requestedBy',
            ])
                ->whereIn('school_id', $schoolIds)
                ->where('status', 'pending')
                ->latest()
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'type' => 'field_change',
                    'school_id' => $r->school_id,
                    'school_name' => $r->child?->school?->name,
                    'child_name' => $r->child
                        ? trim($r->child->first_name.' '.($r->child->last_name ?? ''))
                        : null,
                    'field_label' => $r->fieldLabel(),
                    'field_name' => $r->field_name,
                    'old_value' => $r->old_value,
                    'new_value' => $r->new_value,
                    'requested_by' => $r->requestedBy?->name,
                    'created_at' => $r->created_at,
                ]);

            return $this->successResponse([
                'child_enrollment_requests' => $enrollmentRequests->values(),
                'child_removal_requests' => $removalRequests->values(),
                'child_field_change_requests' => $fieldChangeRequests->values(),
                'counts' => [
                    'enrollment' => $enrollmentRequests->count(),
                    'removal' => $removalRequests->count(),
                    'field_change' => $fieldChangeRequests->count(),
                    'total' => $enrollmentRequests->count() + $removalRequests->count() + $fieldChangeRequests->count(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('PendingApprovalsController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
