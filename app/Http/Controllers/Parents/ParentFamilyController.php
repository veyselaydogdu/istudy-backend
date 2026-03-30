<?php

namespace App\Http\Controllers\Parents;

use App\Http\Requests\Parent\StoreEmergencyContactRequest;
use App\Models\Base\AppSetting;
use App\Models\Child\EmergencyContact;
use App\Models\Child\FamilyMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ParentFamilyController extends BaseParentController
{
    /**
     * Aile üyelerini listeler.
     */
    public function members(): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $members = $familyProfile->members()
                ->withoutGlobalScope('tenant')
                ->with('user')
                ->get()
                ->map(fn ($member) => [
                    'id' => $member->id,
                    'user_id' => $member->user_id,
                    'user' => $member->user ? [
                        'id' => $member->user->id,
                        'name' => $member->user->name,
                        'surname' => $member->user->surname,
                        'email' => $member->user->email,
                        'phone' => $member->user->phone,
                    ] : null,
                    'relation_type' => $member->relation_type,
                    'role' => $member->role,
                    'is_active' => $member->is_active,
                    'accepted_at' => $member->accepted_at,
                ]);

            return $this->successResponse($members, 'Aile üyeleri listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::members Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Aileye yeni üye ekler (e-posta ile).
     * Hedef kullanıcı sisteme kayıtlı olmalıdır.
     */
    public function addMember(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'relation_type' => ['nullable', 'string', 'max:50'],
        ]);

        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            // Sadece super_parent yeni üye ekleyebilir
            $currentMember = FamilyMember::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->where('user_id', $this->user()->id)
                ->first();

            if (! $currentMember || $currentMember->role !== 'super_parent') {
                return $this->errorResponse('Aileye üye ekleme yetkisi sadece ana velidedir.', 403);
            }

            $targetUser = User::where('email', $data['email'])->first();

            if (! $targetUser) {
                return $this->errorResponse(
                    'Bu e-posta adresine kayıtlı bir kullanıcı bulunamadı. Kullanıcı önce uygulamaya kayıt olmalıdır.',
                    404
                );
            }

            if ($targetUser->id === $this->user()->id) {
                return $this->errorResponse('Kendinizi aile üyesi olarak ekleyemezsiniz.', 422);
            }

            // Zaten üye mi?
            $existing = FamilyMember::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->where('user_id', $targetUser->id)
                ->first();

            if ($existing) {
                return $this->errorResponse('Bu kullanıcı zaten aile üyesi.', 409);
            }

            FamilyMember::withoutGlobalScope('tenant')->create([
                'family_profile_id' => $familyProfile->id,
                'user_id' => $targetUser->id,
                'relation_type' => $data['relation_type'] ?? null,
                'role' => 'co_parent',
                'is_active' => true,
                'invited_by_user_id' => $this->user()->id,
                'accepted_at' => now(),
                'created_by' => $this->user()->id,
            ]);

            return $this->successResponse(null, 'Aile üyesi başarıyla eklendi.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::addMember Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Aile üyesini kaldırır.
     * Super parent hiçbir zaman kaldırılamaz.
     * Sadece super_parent başkasını kaldırabilir; co_parent yalnızca kendini kaldırabilir.
     */
    public function removeMember(int $userId): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $targetMember = FamilyMember::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->where('user_id', $userId)
                ->first();

            if (! $targetMember) {
                return $this->errorResponse('Aile üyesi bulunamadı.', 404);
            }

            if ($targetMember->role === 'super_parent') {
                return $this->errorResponse('Ana veli aileden kaldırılamaz.', 403);
            }

            $currentMember = FamilyMember::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->where('user_id', $this->user()->id)
                ->first();

            $isSuperParent = $currentMember && $currentMember->role === 'super_parent';
            $isRemovingSelf = $userId === $this->user()->id;

            if (! $isSuperParent && ! $isRemovingSelf) {
                return $this->errorResponse('Bu işlem için yetkiniz yok.', 403);
            }

            $targetMember->delete();

            return $this->successResponse(null, 'Aile üyesi kaldırıldı.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::removeMember Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Acil durum kişilerini listeler.
     */
    public function emergencyContacts(): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $contacts = EmergencyContact::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->with('nationality')
                ->orderBy('sort_order')
                ->get();

            return $this->successResponse($contacts, 'Acil durum kişileri listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::emergencyContacts Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Acil durum kişisi ekler. Limit app_settings'ten okunur.
     */
    public function storeEmergencyContact(StoreEmergencyContactRequest $request): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $maxContacts = (int) AppSetting::getByKey('max_emergency_contacts', 5);

            $currentCount = EmergencyContact::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->count();

            if ($currentCount >= $maxContacts) {
                return $this->errorResponse("En fazla {$maxContacts} acil durum kişisi eklenebilir.", 422);
            }

            $data = $request->validated();
            $data['family_profile_id'] = $familyProfile->id;
            $data['created_by'] = $this->user()->id;

            $contact = EmergencyContact::withoutGlobalScope('tenant')->create($data);

            return $this->successResponse($contact, 'Acil durum kişisi eklendi.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::storeEmergencyContact Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Acil durum kişisini günceller.
     */
    public function updateEmergencyContact(StoreEmergencyContactRequest $request, int $contact): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            $contactModel = EmergencyContact::withoutGlobalScope('tenant')
                ->where('id', $contact)
                ->where('family_profile_id', $familyProfile?->id)
                ->first();

            if (! $contactModel) {
                return $this->errorResponse('Acil durum kişisi bulunamadı.', 404);
            }

            $data = $request->validated();
            $data['updated_by'] = $this->user()->id;
            $contactModel->update($data);

            return $this->successResponse($contactModel, 'Acil durum kişisi güncellendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::updateEmergencyContact Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Acil durum kişisini siler.
     */
    public function destroyEmergencyContact(int $contact): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            $contactModel = EmergencyContact::withoutGlobalScope('tenant')
                ->where('id', $contact)
                ->where('family_profile_id', $familyProfile?->id)
                ->first();

            if (! $contactModel) {
                return $this->errorResponse('Acil durum kişisi bulunamadı.', 404);
            }

            $contactModel->delete();

            return $this->successResponse(null, 'Acil durum kişisi silindi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::destroyEmergencyContact Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
