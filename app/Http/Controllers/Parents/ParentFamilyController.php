<?php

namespace App\Http\Controllers\Parents;

use App\Http\Requests\Parent\StoreEmergencyContactRequest;
use App\Models\Base\AppSetting;
use App\Models\Child\Child;
use App\Models\Child\EmergencyContact;
use App\Models\Child\FamilyMember;
use App\Models\Child\FamilyProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ParentFamilyController extends BaseParentController
{
    // =========================================================================
    // AİLE LİSTESİ & OLUŞTURMA
    // =========================================================================

    /**
     * Auth user'ın erişebildiği tüm aile profillerini döndürür.
     */
    public function index(): JsonResponse
    {
        try {
            $userId = $this->user()->id;

            // Sahip olunan aileler
            $ownedFamilies = FamilyProfile::withoutGlobalScope('tenant')
                ->where('owner_user_id', $userId)
                ->with(['members' => fn ($q) => $q->withoutGlobalScope('tenant')->with('user')])
                ->get()
                ->map(fn ($f) => $this->formatFamily($f, 'super_parent'));

            // Co-parent olarak kabul edilmiş aileler
            $memberRecords = FamilyMember::withoutGlobalScope('tenant')
                ->where('user_id', $userId)
                ->where('invitation_status', 'accepted')
                ->where('is_active', true)
                ->pluck('family_profile_id');

            $coParentFamilies = FamilyProfile::withoutGlobalScope('tenant')
                ->whereIn('id', $memberRecords)
                ->whereNot('owner_user_id', $userId)
                ->with(['members' => fn ($q) => $q->withoutGlobalScope('tenant')->with('user')])
                ->get()
                ->map(fn ($f) => $this->formatFamily($f, 'co_parent'));

            return $this->successResponse(
                array_values(array_merge($ownedFamilies->all(), $coParentFamilies->all())),
                'Aileler listelendi.'
            );
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Yeni aile profili oluşturur. Oluşturan kullanıcı otomatik olarak super_parent olur.
     */
    public function createFamily(Request $request): JsonResponse
    {
        $data = $request->validate([
            'family_name' => ['required', 'string', 'max:100'],
        ]);

        try {
            $result = DB::transaction(function () use ($data) {
                $userId = $this->user()->id;

                $familyProfile = FamilyProfile::withoutGlobalScope('tenant')->create([
                    'ulid' => (string) Str::ulid(),
                    'owner_user_id' => $userId,
                    'family_name' => $data['family_name'],
                    'created_by' => $userId,
                ]);

                FamilyMember::withoutGlobalScope('tenant')->create([
                    'family_profile_id' => $familyProfile->id,
                    'user_id' => $userId,
                    'relation_type' => 'owner',
                    'role' => 'super_parent',
                    'is_active' => true,
                    'invitation_status' => 'accepted',
                    'accepted_at' => now(),
                    'created_by' => $userId,
                ]);

                return $familyProfile;
            });

            return $this->successResponse([
                'id' => $result->ulid,
                'family_name' => $result->family_name,
            ], 'Aile profili oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ParentFamilyController::createFamily Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Belirli bir aile profilini döndürür.
     */
    public function show(string $ulid): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            return $this->successResponse([
                'id' => $family->ulid,
                'family_name' => $family->family_name,
            ], 'Aile profili.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Aile adını günceller (yalnızca super_parent yapabilir).
     */
    public function updateFamilyName(Request $request, string $ulid): JsonResponse
    {
        $data = $request->validate([
            'family_name' => ['required', 'string', 'max:100'],
        ]);

        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            if (! $this->isSuperParentOf($family)) {
                return $this->errorResponse('Aile adını değiştirme yetkisi yalnızca ana velidedir.', 403);
            }

            $family->update([
                'family_name' => $data['family_name'],
                'updated_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'family_name' => $family->family_name,
            ], 'Aile adı güncellendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::updateFamilyName Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    // =========================================================================
    // AİLE ÜYELERİ
    // =========================================================================

    /**
     * Belirli ailenin tüm çocuklarını listeler.
     * Üye eklerken çocuk selectbox'ı doldurmak için kullanılır.
     */
    public function familyChildren(string $ulid): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $children = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $family->id)
                ->get(['id', 'first_name', 'last_name', 'birth_date', 'gender'])
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'full_name' => $c->first_name.' '.$c->last_name,
                    'birth_date' => $c->birth_date,
                    'gender' => $c->gender,
                ]);

            return $this->successResponse($children, 'Aile çocukları listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::familyChildren Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Belirli ailenin üyelerini listeler (beklemede olanlar dahil).
     */
    public function members(string $ulid): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $members = FamilyMember::withoutGlobalScope('tenant')
                ->where('family_profile_id', $family->id)
                ->with(['user', 'restrictedChildren:id,first_name,last_name'])
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
                    'invitation_status' => $member->invitation_status,
                    'invitation_security_code' => $member->invitation_status === 'pending'
                        ? $member->invitation_security_code
                        : null,
                    'accepted_at' => $member->accepted_at,
                    'permissions' => $member->role !== 'super_parent' ? $member->permissions : null,
                    'available_permissions' => $member->role !== 'super_parent'
                        ? FamilyMember::availablePermissions()
                        : null,
                    'restricted_children' => $member->role !== 'super_parent'
                        ? $member->restrictedChildren->map(fn ($c) => [
                            'id' => $c->id,
                            'full_name' => $c->first_name.' '.$c->last_name,
                        ])
                        : null,
                ]);

            return $this->successResponse($members, 'Aile üyeleri listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::members Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Belirli aileye yeni üye davet eder (e-posta ile).
     * Davet edilen kişi kabul edene kadar invitation_status='pending' kalır.
     * Opsiyonel child_ids ile davet anında çocuk kısıtlaması atanabilir.
     */
    public function addMember(Request $request, string $ulid): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'relation_type' => ['nullable', 'string', 'max:50'],
            'child_ids' => ['nullable', 'array'],
            'child_ids.*' => ['integer'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(FamilyMember::availablePermissions())],
        ]);

        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            if (! $this->isSuperParentOf($family)) {
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

            $existing = FamilyMember::withoutGlobalScope('tenant')
                ->where('family_profile_id', $family->id)
                ->where('user_id', $targetUser->id)
                ->first();

            if ($existing) {
                if ($existing->invitation_status === 'pending') {
                    return $this->errorResponse('Bu kullanıcıya zaten bekleyen bir davet gönderilmiş.', 409);
                }

                return $this->errorResponse('Bu kullanıcı zaten aile üyesi.', 409);
            }

            $securityCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $permissions = isset($data['permissions'])
                ? array_values(array_unique($data['permissions']))
                : null;

            $member = FamilyMember::withoutGlobalScope('tenant')->create([
                'family_profile_id' => $family->id,
                'user_id' => $targetUser->id,
                'relation_type' => $data['relation_type'] ?? 'co_parent',
                'role' => 'co_parent',
                'is_active' => false,
                'invitation_status' => 'pending',
                'invitation_security_code' => $securityCode,
                'invited_by_user_id' => $this->user()->id,
                'accepted_at' => null,
                'permissions' => $permissions,
                'created_by' => $this->user()->id,
            ]);

            // Çocuk ataması yapıldıysa kaydet
            if (! empty($data['child_ids'])) {
                $validChildIds = Child::withoutGlobalScope('tenant')
                    ->where('family_profile_id', $family->id)
                    ->whereIn('id', $data['child_ids'])
                    ->pluck('id');

                if ($validChildIds->isNotEmpty()) {
                    $now = now();
                    $rows = $validChildIds->map(fn ($childId) => [
                        'family_member_id' => $member->id,
                        'child_id' => $childId,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])->values()->all();

                    DB::table('family_member_children')->insert($rows);
                }
            }

            return $this->successResponse(null, 'Davet gönderildi. Kullanıcı kabul ettiğinde aileye dahil olacak.', 201);
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
    public function removeMember(string $ulid, int $userId): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $targetMember = FamilyMember::withoutGlobalScope('tenant')
                ->where('family_profile_id', $family->id)
                ->where('user_id', $userId)
                ->first();

            if (! $targetMember) {
                return $this->errorResponse('Aile üyesi bulunamadı.', 404);
            }

            if ($targetMember->role === 'super_parent') {
                return $this->errorResponse('Ana veli aileden kaldırılamaz.', 403);
            }

            $isSuperParent = $this->isSuperParentOf($family);
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

    // =========================================================================
    // DAVET AKIŞI
    // =========================================================================

    /**
     * Auth user'a gelen bekleyen davetleri listeler.
     */
    public function myInvitations(): JsonResponse
    {
        try {
            $userId = $this->user()->id;

            $members = FamilyMember::withoutGlobalScope('tenant')
                ->where('user_id', $userId)
                ->where('invitation_status', 'pending')
                ->with(['familyProfile', 'invitedBy'])
                ->get();

            $invitations = [];

            foreach ($members as $member) {
                $assignedChildIds = DB::table('family_member_children')
                    ->where('family_member_id', $member->id)
                    ->pluck('child_id');

                $children = [];

                if ($assignedChildIds->isNotEmpty()) {
                    $childModels = Child::withoutGlobalScope('tenant')
                        ->whereIn('id', $assignedChildIds)
                        ->get(['id', 'first_name', 'last_name', 'birth_date']);

                    foreach ($childModels as $c) {
                        $firstTwo = mb_substr($c->first_name, 0, 2);
                        $lastTwo = mb_substr($c->last_name, 0, 2);
                        $children[] = [
                            'id' => $c->id,
                            'masked_name' => $firstTwo.'. '.$lastTwo.'.',
                            'birth_year' => $c->birth_date ? date('Y', strtotime($c->birth_date)) : null,
                        ];
                    }
                }

                $invitations[] = [
                    'id' => $member->id,
                    'family' => $member->familyProfile ? [
                        'id' => $member->familyProfile->ulid,
                        'family_name' => $member->familyProfile->family_name,
                    ] : null,
                    'invited_by' => $member->invitedBy ? [
                        'name' => $member->invitedBy->name,
                        'surname' => $member->invitedBy->surname,
                        'email' => $member->invitedBy->email,
                    ] : null,
                    'relation_type' => $member->relation_type,
                    'children' => $children,
                    'created_at' => $member->created_at,
                ];
            }

            return $this->successResponse($invitations, 'Bekleyen davetler listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::myInvitations Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Aile davetini kabul eder.
     */
    public function acceptInvitation(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'security_code' => ['required', 'string', 'size:6'],
        ]);

        try {
            $userId = $this->user()->id;

            $member = FamilyMember::withoutGlobalScope('tenant')
                ->where('id', $id)
                ->where('user_id', $userId)
                ->where('invitation_status', 'pending')
                ->first();

            if (! $member) {
                return $this->errorResponse('Davet bulunamadı.', 404);
            }

            if ($member->invitation_security_code !== $data['security_code']) {
                return $this->errorResponse('Güvenlik kodu hatalı. Lütfen tekrar deneyin.', 422);
            }

            $member->update([
                'invitation_status' => 'accepted',
                'invitation_security_code' => null,
                'is_active' => true,
                'accepted_at' => now(),
                'updated_by' => $userId,
            ]);

            return $this->successResponse(null, 'Davet kabul edildi. Aileye dahil oldunuz.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::acceptInvitation Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Aile davetini reddeder.
     */
    public function rejectInvitation(int $id): JsonResponse
    {
        try {
            $userId = $this->user()->id;

            $member = FamilyMember::withoutGlobalScope('tenant')
                ->where('id', $id)
                ->where('user_id', $userId)
                ->where('invitation_status', 'pending')
                ->first();

            if (! $member) {
                return $this->errorResponse('Davet bulunamadı.', 404);
            }

            $member->delete();

            return $this->successResponse(null, 'Davet reddedildi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::rejectInvitation Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    // =========================================================================
    // ACİL DURUM KİŞİLERİ
    // =========================================================================

    /**
     * Belirli ailenin acil durum kişilerini listeler.
     */
    public function emergencyContacts(string $ulid): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $contacts = EmergencyContact::withoutGlobalScope('tenant')
                ->where('family_profile_id', $family->id)
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
     * Belirli aileye acil durum kişisi ekler.
     * Co-parent acil durum kişisi ekleyemez (sadece görüntüleyici).
     */
    public function storeEmergencyContact(StoreEmergencyContactRequest $request, string $ulid): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            if (! $this->isSuperParentOf($family)) {
                return $this->errorResponse('Acil durum kişisi ekleme yetkisi sadece ana velidedir.', 403);
            }

            $maxContacts = (int) AppSetting::getByKey('max_emergency_contacts', 5);

            $currentCount = EmergencyContact::withoutGlobalScope('tenant')
                ->where('family_profile_id', $family->id)
                ->count();

            if ($currentCount >= $maxContacts) {
                return $this->errorResponse("En fazla {$maxContacts} acil durum kişisi eklenebilir.", 422);
            }

            $data = $request->validated();
            $data['family_profile_id'] = $family->id;
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
     * Co-parent acil durum kişisi düzenleyemez.
     */
    public function updateEmergencyContact(StoreEmergencyContactRequest $request, string $ulid, int $contact): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if ($family && ! $this->isSuperParentOf($family)) {
                return $this->errorResponse('Acil durum kişisi düzenleme yetkisi sadece ana velidedir.', 403);
            }

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $contactModel = EmergencyContact::withoutGlobalScope('tenant')
                ->where('id', $contact)
                ->where('family_profile_id', $family->id)
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
     * Co-parent acil durum kişisi silemez.
     */
    public function destroyEmergencyContact(string $ulid, int $contact): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if ($family && ! $this->isSuperParentOf($family)) {
                return $this->errorResponse('Acil durum kişisi silme yetkisi sadece ana velidedir.', 403);
            }

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $contactModel = EmergencyContact::withoutGlobalScope('tenant')
                ->where('id', $contact)
                ->where('family_profile_id', $family->id)
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

    // =========================================================================
    // ÇOCUK ATAMASI
    // =========================================================================

    /**
     * Bir co-parent üyenin izinlerini günceller.
     * Sadece super_parent yapabilir. Geçerli izinler: FamilyMember::availablePermissions()
     *
     * PUT /parent/families/{ulid}/members/{memberId}/permissions
     */
    public function updateMemberPermissions(Request $request, string $ulid, int $memberId): JsonResponse
    {
        $data = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::in(FamilyMember::availablePermissions())],
        ]);

        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            if (! $this->isSuperParentOf($family)) {
                return $this->errorResponse('İzin güncelleme yetkisi sadece ana velidedir.', 403);
            }

            $member = FamilyMember::withoutGlobalScope('tenant')
                ->where('id', $memberId)
                ->where('family_profile_id', $family->id)
                ->first();

            if (! $member) {
                return $this->errorResponse('Aile üyesi bulunamadı.', 404);
            }

            if ($member->role === 'super_parent') {
                return $this->errorResponse('Ana velinin izinleri değiştirilemez.', 422);
            }

            $member->update([
                'permissions' => array_values(array_unique($data['permissions'])),
                'updated_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'member_id' => $member->id,
                'permissions' => $member->permissions,
                'available_permissions' => FamilyMember::availablePermissions(),
            ], 'İzinler güncellendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::updateMemberPermissions Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Bir co-parent üyenin erişebileceği çocukları atar.
     * Sadece super_parent yapabilir. Boş liste = tüm aile çocuklarına erişim.
     */
    public function assignMemberChildren(Request $request, string $ulid, int $memberId): JsonResponse
    {
        $data = $request->validate([
            'child_ids' => ['present', 'array'],
            'child_ids.*' => ['integer'],
        ]);

        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            if (! $this->isSuperParentOf($family)) {
                return $this->errorResponse('Çocuk ataması sadece ana veli tarafından yapılabilir.', 403);
            }

            $member = FamilyMember::withoutGlobalScope('tenant')
                ->where('id', $memberId)
                ->where('family_profile_id', $family->id)
                ->first();

            if (! $member) {
                return $this->errorResponse('Aile üyesi bulunamadı.', 404);
            }

            if ($member->role === 'super_parent') {
                return $this->errorResponse('Ana veliye çocuk kısıtlaması uygulanamaz.', 422);
            }

            // Yalnızca bu aileye ait geçerli çocuk ID'lerini al
            $validChildIds = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $family->id)
                ->whereIn('id', $data['child_ids'])
                ->pluck('id');

            DB::table('family_member_children')
                ->where('family_member_id', $member->id)
                ->delete();

            if ($validChildIds->isNotEmpty()) {
                $now = now();
                $rows = $validChildIds->map(fn ($childId) => [
                    'family_member_id' => $member->id,
                    'child_id' => $childId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->values()->all();

                DB::table('family_member_children')->insert($rows);
            }

            $message = $validChildIds->isEmpty()
                ? 'Çocuk kısıtlaması kaldırıldı. Üye tüm aile çocuklarına erişebilir.'
                : 'Çocuk ataması güncellendi.';

            return $this->successResponse([
                'assigned_child_ids' => $validChildIds->values(),
            ], $message);
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::assignMemberChildren Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Bir aile üyesine atanmış çocukları listeler.
     */
    public function memberChildren(string $ulid, int $memberId): JsonResponse
    {
        try {
            $family = $this->resolveFamily($ulid);

            if (! $family) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $member = FamilyMember::withoutGlobalScope('tenant')
                ->where('id', $memberId)
                ->where('family_profile_id', $family->id)
                ->first();

            if (! $member) {
                return $this->errorResponse('Aile üyesi bulunamadı.', 404);
            }

            $assignedChildIds = DB::table('family_member_children')
                ->where('family_member_id', $member->id)
                ->pluck('child_id');

            $children = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $family->id)
                ->whereIn('id', $assignedChildIds)
                ->get(['id', 'first_name', 'last_name', 'birth_date', 'gender']);

            return $this->successResponse([
                'is_restricted' => $assignedChildIds->isNotEmpty(),
                'children' => $children->map(fn ($c) => [
                    'id' => $c->id,
                    'full_name' => $c->first_name.' '.$c->last_name,
                    'birth_date' => $c->birth_date,
                    'gender' => $c->gender,
                ]),
            ], 'Atanmış çocuklar listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentFamilyController::memberChildren Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    // =========================================================================
    // YARDIMCI METODLAR
    // =========================================================================

    /**
     * ULID ile aile profilini çözer ve auth user'ın erişim iznini doğrular.
     * Owner veya kabul edilmiş co_parent ise döndürür, aksi hâlde null.
     */
    private function resolveFamily(string $ulid): ?FamilyProfile
    {
        $userId = $this->user()->id;

        $family = FamilyProfile::withoutGlobalScope('tenant')
            ->where('ulid', $ulid)
            ->first();

        if (! $family) {
            return null;
        }

        if ($family->owner_user_id === $userId) {
            return $family;
        }

        $member = FamilyMember::withoutGlobalScope('tenant')
            ->where('family_profile_id', $family->id)
            ->where('user_id', $userId)
            ->where('invitation_status', 'accepted')
            ->where('is_active', true)
            ->first();

        return $member ? $family : null;
    }

    /**
     * Auth user'ın belirli ailede super_parent olup olmadığını kontrol eder.
     */
    private function isSuperParentOf(FamilyProfile $family): bool
    {
        if ($family->owner_user_id === $this->user()->id) {
            return true;
        }

        $member = FamilyMember::withoutGlobalScope('tenant')
            ->where('family_profile_id', $family->id)
            ->where('user_id', $this->user()->id)
            ->where('role', 'super_parent')
            ->first();

        return $member !== null;
    }

    /**
     * FamilyProfile'ı listeleme için formatlar.
     */
    private function formatFamily(FamilyProfile $family, string $myRole): array
    {
        $memberCount = $family->members
            ? $family->members->where('invitation_status', 'accepted')->count()
            : 0;

        $pendingCount = $family->members
            ? $family->members->where('invitation_status', 'pending')->count()
            : 0;

        return [
            'id' => $family->ulid,
            'family_name' => $family->family_name,
            'my_role' => $myRole,
            'member_count' => $memberCount,
            'pending_invitations_count' => $pendingCount,
        ];
    }
}
