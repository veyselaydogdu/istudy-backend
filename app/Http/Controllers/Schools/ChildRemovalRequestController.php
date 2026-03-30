<?php

namespace App\Http\Controllers\Schools;

use App\Models\Child\ChildRemovalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChildRemovalRequestController extends BaseSchoolController
{
    /**
     * Okula ait çocuk silme taleplerini listele.
     */
    public function index(Request $request, int $schoolId): JsonResponse
    {
        try {
            $status = $request->query('status', 'pending');

            $query = ChildRemovalRequest::with([
                'child' => fn ($q) => $q->withoutGlobalScope('tenant'),
                'familyProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('owner'),
                'requestedBy',
                'reviewer',
            ])
                ->where('school_id', $schoolId);

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            $requests = $query->latest()->paginate($request->integer('per_page', 20));

            return $this->paginatedResponse(
                $requests->getCollection()->map(fn ($r) => [
                    'id' => $r->id,
                    'status' => $r->status,
                    'reason' => $r->reason,
                    'rejection_reason' => $r->rejection_reason,
                    'reviewed_at' => $r->reviewed_at,
                    'created_at' => $r->created_at,
                    'child' => $r->child ? [
                        'id' => $r->child->id,
                        'full_name' => trim($r->child->first_name.' '.($r->child->last_name ?? '')),
                        'birth_date' => $r->child->birth_date,
                        'gender' => $r->child->gender,
                    ] : null,
                    'owner_name' => $r->familyProfile?->owner
                        ? trim($r->familyProfile->owner->name.' '.($r->familyProfile->owner->surname ?? ''))
                        : null,
                    'owner_phone' => $r->familyProfile?->owner?->phone,
                    'owner_email' => $r->familyProfile?->owner?->email,
                    'requested_by' => $r->requestedBy?->name,
                    'reviewer' => $r->reviewer?->name,
                ])->values(),
                $requests
            );
        } catch (\Throwable $e) {
            Log::error('ChildRemovalRequestController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Talebi onayla: çocuğu sınıflardan ve okuldan çıkar, ardından sil.
     */
    public function approve(int $schoolId, int $id): JsonResponse
    {
        try {
            $removalRequest = ChildRemovalRequest::where('school_id', $schoolId)
                ->where('id', $id)
                ->firstOrFail();

            if (! $removalRequest->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            DB::beginTransaction();

            $child = $removalRequest->child()->withoutGlobalScope('tenant')->first();

            if ($child) {
                // Sınıf atamalarını kaldır
                $child->classes()->detach();

                // Okul kaydını kaldır
                $child->update(['school_id' => null]);

                // Çocuğu sil
                $child->delete();
            }

            $removalRequest->update([
                'status' => 'approved',
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);

            DB::commit();

            return $this->successResponse(null, 'Talep onaylandı ve çocuk kaydı silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ChildRemovalRequestController::approve', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Talebi reddet.
     */
    public function reject(Request $request, int $schoolId, int $id): JsonResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        try {
            $removalRequest = ChildRemovalRequest::where('school_id', $schoolId)
                ->where('id', $id)
                ->firstOrFail();

            if (! $removalRequest->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            $removalRequest->update([
                'status' => 'rejected',
                'rejection_reason' => $data['rejection_reason'],
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);

            return $this->successResponse(null, 'Talep reddedildi.');
        } catch (\Throwable $e) {
            Log::error('ChildRemovalRequestController::reject', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
