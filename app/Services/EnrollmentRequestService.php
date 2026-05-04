<?php

namespace App\Services;

use App\Models\Child\FamilyProfile;
use App\Models\School\School;
use App\Models\School\SchoolEnrollmentRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Veli Okul Kayıt Talebi Servisi
 *
 * Velilerin kayıt kodu veya davet linki ile okul bulma ve
 * kayıt talebi gönderme/onaylama/reddetme işlemleri.
 */
class EnrollmentRequestService extends BaseService
{
    protected function model(): string
    {
        return SchoolEnrollmentRequest::class;
    }

    /**
     * Kayıt kodu ile okul ara
     */
    public function searchByRegistrationCode(string $code): ?School
    {
        return School::findByRegistrationCode($code);
    }

    /**
     * Davet tokeni ile okul bul (link tabanlı davet)
     */
    public function findSchoolByInviteToken(string $token): ?School
    {
        return School::findByInviteToken($token);
    }

    /**
     * Anonim veli kayıt talebi oluştur (user hesabı gerekmez)
     *
     * code veya invite_token ile okul tespit edilir.
     * Aynı okula aynı email ile pending/approved talep varsa engellenir.
     */
    public function createPublicRequest(array $data): Model
    {
        // Okul tespiti
        $school = null;
        if (! empty($data['registration_code'])) {
            $school = $this->searchByRegistrationCode($data['registration_code']);
        } elseif (! empty($data['invite_token'])) {
            $school = $this->findSchoolByInviteToken($data['invite_token']);
        }

        if (! $school) {
            throw new \Exception('Geçersiz davet kodu veya link. Lütfen tekrar kontrol edin.');
        }

        // Email bazlı mükerrer talep kontrolü
        $existing = SchoolEnrollmentRequest::where('school_id', $school->id)
            ->where('parent_email', $data['parent_email'])
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            $msg = $existing->status === 'approved'
                ? 'Bu okula zaten kayıtlısınız.'
                : 'Bu okula bekleyen bir kayıt talebiniz zaten mevcut.';
            throw new \Exception($msg);
        }

        return $this->create([
            'school_id' => $school->id,
            'parent_name' => $data['parent_name'],
            'parent_surname' => $data['parent_surname'],
            'parent_email' => $data['parent_email'],
            'parent_phone' => $data['parent_phone'] ?? null,
            'invite_token' => $data['invite_token'] ?? null,
            'message' => $data['message'] ?? null,
            'status' => 'pending',
            'created_by' => 0, // anonim — sistem kaydı
        ]);
    }

    /**
     * Kayıt talebi oluştur (kimlik doğrulamalı veli)
     */
    public function createRequest(array $data): Model
    {
        // Aynı okula mükerrer talep kontrolü (user_id bazlı)
        $existing = SchoolEnrollmentRequest::where('school_id', $data['school_id'])
            ->where('user_id', $data['user_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            throw new \Exception('Bu okula zaten bir kayıt talebiniz mevcut veya onaylanmış.');
        }

        return $this->create($data);
    }

    /**
     * Talebi onayla:
     * 1. Veli için User + FamilyProfile oluştur (yoksa)
     * 2. school_family_assignments kaydı oluştur
     * 3. Talebi approved yap
     */
    public function approveRequest(SchoolEnrollmentRequest $request, int $reviewerId): SchoolEnrollmentRequest
    {
        $tenantId = $request->school->tenant_id;

        // 1. User bul ya da oluştur
        $user = null;
        if ($request->user_id) {
            $user = User::find($request->user_id);
        }

        if (! $user && $request->parent_email) {
            $user = User::where('email', $request->parent_email)->first();
        }

        if (! $user) {
            $user = User::create([
                'name' => $request->parent_name ?? 'Veli',
                'surname' => $request->parent_surname,
                'email' => $request->parent_email,
                'phone' => $request->parent_phone,
                'password' => Hash::make(\Illuminate\Support\Str::random(16)),
                'tenant_id' => $tenantId,
            ]);

            // Parent rolü ata
            $parentRoleId = DB::table('roles')->where('name', 'parent')->value('id');
            if ($parentRoleId) {
                $user->roles()->attach($parentRoleId);
            }
        }

        // 2. FamilyProfile bul ya da oluştur (withoutGlobalScope: parent tenant_id null olabilir)
        $familyProfile = FamilyProfile::withoutGlobalScope('tenant')->where('owner_user_id', $user->id)->first();

        if (! $familyProfile) {
            $familyProfile = FamilyProfile::create([
                'owner_user_id' => $user->id,
                'family_name' => trim(($request->parent_surname ?? '').' Ailesi') ?: 'Aile',
                'created_by' => $reviewerId,
            ]);
        }

        // 3. school_family_assignments kaydı oluştur (duplicate önle)
        $alreadyAssigned = DB::table('school_family_assignments')
            ->where('school_id', $request->school_id)
            ->where('family_profile_id', $familyProfile->id)
            ->whereNull('deleted_at')
            ->exists();

        if (! $alreadyAssigned) {
            DB::table('school_family_assignments')->insert([
                'school_id' => $request->school_id,
                'family_profile_id' => $familyProfile->id,
                'enrollment_request_id' => $request->id,
                'is_active' => true,
                'joined_at' => now(),
                'created_by' => $reviewerId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 4. Talebi güncelle
        $request->update([
            'user_id' => $user->id,
            'family_profile_id' => $familyProfile->id,
        ]);
        $request->approve($reviewerId);

        return $request->fresh();
    }

    /**
     * Talebi reddet
     */
    public function rejectRequest(SchoolEnrollmentRequest $request, int $reviewerId, string $reason): SchoolEnrollmentRequest
    {
        $request->reject($reviewerId, $reason);

        return $request->fresh();
    }

    /**
     * Okula ait bekleyen talepleri listele
     */
    public function pendingForSchool(int $schoolId)
    {
        return SchoolEnrollmentRequest::where('school_id', $schoolId)
            ->pending()
            ->with(['user', 'familyProfile'])
            ->latest()
            ->paginate(15);
    }

    /**
     * Okula ait talepleri listele (?status filtresi ile)
     */
    public function listForSchool(int $schoolId, ?string $status = null, int $perPage = 15)
    {
        return SchoolEnrollmentRequest::where('school_id', $schoolId)
            ->when($status, fn ($q) => $q->where('status', $status))
            ->with(['user', 'familyProfile', 'reviewer'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Okula kayıtlı velileri ve çocuklarını listele
     */
    public function parentsForSchool(int $schoolId, int $perPage = 15)
    {
        return FamilyProfile::withoutGlobalScope('tenant')
            ->whereHas('schools', fn ($q) => $q->where('schools.id', $schoolId))
            ->with([
                'owner',
                'children' => fn ($q) => $q->withoutGlobalScope('tenant')
                    ->where('school_id', $schoolId)
                    ->with(['allergens', 'conditions', 'medications']),
            ])
            ->paginate($perPage);
    }

    /**
     * Filtreleme (genel liste için)
     */
    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
    }
}
