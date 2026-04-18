<?php

namespace App\Http\Controllers\Schools;

use App\Models\Child\Child;
use App\Models\Health\Allergen;
use App\Models\Health\MedicalCondition;
use App\Models\Health\Medication;
use App\Models\School\School;
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

                // Yeni okulun tenant_id'sini al ve pending sağlık önerilerini bu tenant'a ilet
                $school = School::find($schoolId);
                if ($school?->tenant_id) {
                    $this->propagatePendingHealthItems($child, $school->tenant_id);
                }
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

    /**
     * Çocuğun pending sağlık önerilerini yeni okul tenant'ına iletir.
     *
     * Kural: pending allerjen/hastalık/ilaçlar için;
     *  - tenant_id NULL ise → yeni tenant_id'ye güncelle
     *  - tenant_id farklı bir tenant ise → yeni tenant için kopya pending kayıt oluştur
     *  - tenant_id zaten aynı ise → dokunma
     */
    private function propagatePendingHealthItems(Child $child, int $newTenantId): void
    {
        try {
            // Çocuğun allerjenlerini al (pending olanlar)
            $allergenIds = DB::table('child_allergens')
                ->where('child_id', $child->id)
                ->pluck('allergen_id');

            if ($allergenIds->isNotEmpty()) {
                $pendingAllergens = Allergen::withoutGlobalScopes()
                    ->whereIn('id', $allergenIds)
                    ->where('status', 'pending')
                    ->get();

                foreach ($pendingAllergens as $allergen) {
                    if ($allergen->tenant_id === null) {
                        $allergen->update(['tenant_id' => $newTenantId]);
                    } elseif ($allergen->tenant_id !== $newTenantId) {
                        // Yeni tenant için kopya oluştur ve çocuğa bağla
                        $existing = Allergen::withoutGlobalScopes()
                            ->where('name', $allergen->name)
                            ->where('tenant_id', $newTenantId)
                            ->where('status', 'pending')
                            ->first();

                        if (! $existing) {
                            $newAllergen = Allergen::withoutGlobalScopes()->create([
                                'name' => $allergen->name,
                                'description' => $allergen->description,
                                'risk_level' => $allergen->risk_level ?? 'medium',
                                'tenant_id' => $newTenantId,
                                'status' => 'pending',
                                'suggested_by_user_id' => $allergen->suggested_by_user_id,
                                'created_by' => $allergen->created_by,
                            ]);

                            DB::table('child_allergens')->insert([
                                'child_id' => $child->id,
                                'allergen_id' => $newAllergen->id,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }

            // Çocuğun tıbbi durumlarını al (pending olanlar)
            $conditionIds = DB::table('child_conditions')
                ->where('child_id', $child->id)
                ->pluck('medical_condition_id');

            if ($conditionIds->isNotEmpty()) {
                $pendingConditions = MedicalCondition::withoutGlobalScopes()
                    ->whereIn('id', $conditionIds)
                    ->where('status', 'pending')
                    ->get();

                foreach ($pendingConditions as $condition) {
                    if ($condition->tenant_id === null) {
                        $condition->update(['tenant_id' => $newTenantId]);
                    } elseif ($condition->tenant_id !== $newTenantId) {
                        $existing = MedicalCondition::withoutGlobalScopes()
                            ->where('name', $condition->name)
                            ->where('tenant_id', $newTenantId)
                            ->where('status', 'pending')
                            ->first();

                        if (! $existing) {
                            $newCondition = MedicalCondition::withoutGlobalScopes()->create([
                                'name' => $condition->name,
                                'description' => $condition->description,
                                'tenant_id' => $newTenantId,
                                'status' => 'pending',
                                'suggested_by_user_id' => $condition->suggested_by_user_id,
                                'created_by' => $condition->created_by,
                            ]);

                            DB::table('child_conditions')->insert([
                                'child_id' => $child->id,
                                'medical_condition_id' => $newCondition->id,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }

            // Çocuğun ilaçlarını al (pending olanlar)
            $medicationRows = DB::table('child_medications')
                ->where('child_id', $child->id)
                ->whereNotNull('medication_id')
                ->get();

            foreach ($medicationRows as $row) {
                $medication = Medication::withoutGlobalScopes()
                    ->where('id', $row->medication_id)
                    ->where('status', 'pending')
                    ->first();

                if (! $medication) {
                    continue;
                }

                if ($medication->tenant_id === null) {
                    $medication->update(['tenant_id' => $newTenantId]);
                } elseif ($medication->tenant_id !== $newTenantId) {
                    $existing = Medication::withoutGlobalScopes()
                        ->where('name', $medication->name)
                        ->where('tenant_id', $newTenantId)
                        ->where('status', 'pending')
                        ->first();

                    if (! $existing) {
                        $newMedication = Medication::withoutGlobalScopes()->create([
                            'name' => $medication->name,
                            'tenant_id' => $newTenantId,
                            'status' => 'pending',
                            'suggested_by_user_id' => $medication->suggested_by_user_id,
                            'created_by' => $medication->created_by,
                        ]);

                        DB::table('child_medications')->insert([
                            'child_id' => $child->id,
                            'medication_id' => $newMedication->id,
                            'custom_name' => $row->custom_name,
                            'dose' => $row->dose,
                            'usage_time' => $row->usage_time,
                            'usage_days' => $row->usage_days,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('ChildEnrollmentRequestController::propagatePendingHealthItems Error', [
                'child_id' => $child->id,
                'tenant_id' => $newTenantId,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
