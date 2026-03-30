<?php

namespace App\Http\Controllers\Schools;

use App\Models\Child\ChildFieldChangeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChildFieldChangeRequestController extends BaseSchoolController
{
    public function index(Request $request, int $schoolId): JsonResponse
    {
        try {
            $status = $request->query('status', 'pending');

            $query = ChildFieldChangeRequest::with([
                'child' => fn ($q) => $q->withoutGlobalScope('tenant')->select('id', 'first_name', 'last_name', 'birth_date'),
                'requestedBy',
            ])->where('school_id', $schoolId);

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            $requests = $query->latest()->paginate($request->integer('per_page', 20));

            return $this->paginatedResponse(
                $requests->getCollection()->map(fn ($r) => [
                    'id' => $r->id,
                    'status' => $r->status,
                    'field_name' => $r->field_name,
                    'field_label' => $r->fieldLabel(),
                    'old_value' => $r->old_value,
                    'new_value' => $r->new_value,
                    'rejection_reason' => $r->rejection_reason,
                    'reviewed_at' => $r->reviewed_at,
                    'created_at' => $r->created_at,
                    'child' => $r->child ? [
                        'id' => $r->child->id,
                        'full_name' => trim($r->child->first_name.' '.($r->child->last_name ?? '')),
                        'current_birth_date' => $r->child->birth_date?->format('Y-m-d'),
                    ] : null,
                    'requested_by' => $r->requestedBy?->name,
                ])->values(),
                $requests
            );
        } catch (\Throwable $e) {
            Log::error('ChildFieldChangeRequestController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function approve(int $schoolId, int $id): JsonResponse
    {
        try {
            $changeRequest = ChildFieldChangeRequest::where('school_id', $schoolId)
                ->where('id', $id)
                ->firstOrFail();

            if (! $changeRequest->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            $child = $changeRequest->child()->withoutGlobalScope('tenant')->first();

            if ($child) {
                $child->update([$changeRequest->field_name => $changeRequest->new_value]);
            }

            $changeRequest->update([
                'status' => 'approved',
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);

            return $this->successResponse(null, 'Talep onaylandı ve bilgi güncellendi.');
        } catch (\Throwable $e) {
            Log::error('ChildFieldChangeRequestController::approve', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function reject(Request $request, int $schoolId, int $id): JsonResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        try {
            $changeRequest = ChildFieldChangeRequest::where('school_id', $schoolId)
                ->where('id', $id)
                ->firstOrFail();

            if (! $changeRequest->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            $changeRequest->update([
                'status' => 'rejected',
                'rejection_reason' => $data['rejection_reason'],
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);

            return $this->successResponse(null, 'Talep reddedildi.');
        } catch (\Throwable $e) {
            Log::error('ChildFieldChangeRequestController::reject', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
