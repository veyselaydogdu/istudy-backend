<?php

namespace App\Http\Controllers\Schools;

use App\Models\Child\Child;
use App\Models\School\SchoolChildEnrollmentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Tenant admin: çocuk okul kayıt taleplerini listele / onayla / reddet.
 *
 * C-6: BaseSchoolController'dan türetilerek school_id tenant sahipliği otomatik doğrulanır.
 */
class ChildEnrollmentRequestController extends BaseSchoolController
{
    /**
     * Okuldaki çocuk kayıt taleplerini listele.
     * GET /schools/{school_id}/child-enrollment-requests?status=pending
     *
     * C-6: BaseSchoolController middleware'i schoolId'nin auth user tenant'ına ait olduğunu doğrular.
     */
    public function index(Request $request, int $schoolId): JsonResponse
    {
        try {
            $status = $request->query('status', 'pending');

            $query = SchoolChildEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('school_id', $schoolId)
                ->with([
                    'child' => fn ($q) => $q->withoutGlobalScope('tenant')
                        ->with(['allergens', 'conditions', 'medications', 'nationality']),
                    'requestedBy',
                    'familyProfile.owner',
                ]);

            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            $requests = $query->orderByDesc('created_at')->paginate(20);

            $data = $requests->through(function ($req) {
                $child = $req->child;
                $user = $req->requestedBy;

                return [
                    'id' => $req->id,
                    'status' => $req->status,
                    'rejection_reason' => $req->rejection_reason,
                    'created_at' => $req->created_at,
                    'reviewed_at' => $req->reviewed_at,
                    'parent' => $user ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'surname' => $user->surname,
                        'email' => $user->email,
                        'phone' => $user->phone,
                    ] : null,
                    'child' => $child ? [
                        'id' => $child->id,
                        'first_name' => $child->first_name,
                        'last_name' => $child->last_name,
                        'full_name' => $child->first_name.' '.$child->last_name,
                        'birth_date' => $child->birth_date,
                        'gender' => $child->gender,
                        'blood_type' => $child->blood_type,
                        'identity_number' => $child->identity_number,
                        'passport_number' => $child->passport_number,
                        'parent_notes' => $child->parent_notes,
                        'special_notes' => $child->special_notes,
                        'languages' => $child->languages,
                        'nationality' => $child->nationality ? [
                            'name' => $child->nationality->name,
                            'flag_emoji' => $child->nationality->flag_emoji,
                        ] : null,
                        'allergens' => $child->allergens->map(fn ($a) => [
                            'id' => $a->id,
                            'name' => $a->name,
                            'status' => $a->status,
                        ]),
                        'conditions' => $child->conditions->map(fn ($c) => [
                            'id' => $c->id,
                            'name' => $c->name,
                            'status' => $c->status,
                        ]),
                        'medications' => $child->medications->map(fn ($m) => [
                            'id' => $m->id,
                            'name' => $m->name,
                        ]),
                    ] : null,
                ];
            });

            return $this->paginatedResponse($data);
        } catch (\Throwable $e) {
            Log::error('ChildEnrollmentRequestController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Talepler listelenirken hata oluştu.', 500);
        }
    }

    /**
     * Çocuk kayıt talebini onayla.
     * PATCH /schools/{school_id}/child-enrollment-requests/{id}/approve
     */
    public function approve(int $schoolId, int $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $req = SchoolChildEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('school_id', $schoolId)
                ->findOrFail($id);

            if (! $req->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            // Çocuğun başka bir okula kayıtlı olup olmadığını kontrol et
            $child = Child::withoutGlobalScope('tenant')->find($req->child_id);
            if ($child && $child->school_id && $child->school_id !== $schoolId) {
                return $this->errorResponse('Bu çocuk zaten başka bir okula kayıtlı.', 422);
            }

            $req->update([
                'status' => 'approved',
                'reviewed_by' => $this->user()->id,
                'reviewed_at' => now(),
            ]);

            // Çocuğun school_id'sini güncelle
            if ($child) {
                $child->update(['school_id' => $schoolId]);
            }

            DB::commit();

            return $this->successResponse(['id' => $req->id, 'status' => 'approved'], 'Talep onaylandı. Çocuk okula kayıt edildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            DB::rollBack();

            return $this->errorResponse('Talep bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ChildEnrollmentRequestController::approve Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Onaylama sırasında hata oluştu.', 500);
        }
    }

    /**
     * Çocuk kayıt talebini reddet.
     * PATCH /schools/{school_id}/child-enrollment-requests/{id}/reject
     */
    public function reject(Request $request, int $schoolId, int $id): JsonResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        DB::beginTransaction();
        try {
            $req = SchoolChildEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('school_id', $schoolId)
                ->findOrFail($id);

            if (! $req->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            $req->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'reviewed_by' => $this->user()->id,
                'reviewed_at' => now(),
            ]);

            DB::commit();

            return $this->successResponse(['id' => $req->id, 'status' => 'rejected'], 'Talep reddedildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            DB::rollBack();

            return $this->errorResponse('Talep bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ChildEnrollmentRequestController::reject Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Red işlemi sırasında hata oluştu.', 500);
        }
    }
}
