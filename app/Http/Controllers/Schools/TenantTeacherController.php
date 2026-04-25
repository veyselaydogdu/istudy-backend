<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Teacher\UpdateTeacherRequest;
use App\Models\School\School;
use App\Models\School\TeacherCredentialTenantApproval;
use App\Models\School\TeacherProfile;
use App\Models\School\TeacherRoleType;
use App\Models\School\TeacherTenantMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

/**
 * Tenant düzeyinde öğretmen yönetimi.
 * Öğretmenler okula bağımlı değil; tenant'a aittir.
 * Okul/sınıf ataması ayrı endpoint'ler üzerinden yapılır.
 */
class TenantTeacherController extends BaseController
{
    // ──────────────────────────────────────────────────────────────
    // ÖĞRETMEN CRUD
    // ──────────────────────────────────────────────────────────────

    /**
     * Tenant'ın tüm öğretmenlerini listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $query = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->with(['teacherProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('user', 'schools', 'country')])
                ->when($request->search, function ($q) use ($request) {
                    $q->whereHas('teacherProfile.user', fn ($u) => $u->where('name', 'like', "%{$request->search}%")
                        ->orWhere('surname', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%"));
                })
                ->when($request->school_id, fn ($q) => $q->whereHas('teacherProfile.schools', fn ($s) => $s->where('school_id', $request->school_id)))
                ->orderBy('created_at', 'desc');

            $memberships = $query->paginate($request->per_page ?? 15);

            return $this->paginatedResponse($memberships->through(fn ($m) => array_merge(
                $this->formatTeacher($m->teacherProfile),
                [
                    'membership_id' => $m->id,
                    'membership_status' => $m->status,
                ]
            )));
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::index Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmenler yüklenemedi.', 500);
        }
    }

    /**
     * Öğretmenler doğrudan oluşturulamaz.
     * Tenant davet gönderir (invite) veya öğretmenin katılma talebini onaylar (approveJoinRequest).
     */
    public function store(): JsonResponse
    {
        return $this->errorResponse(
            'Öğretmenler sisteme doğrudan eklenemez. Davet gönderin veya katılma talebini onaylayın.',
            405
        );
    }

    /**
     * Öğretmen detayı — tam profil (eğitim, sertifika, kurs, beceri, blog)
     */
    public function show(int $id): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;
            $teacher = TeacherProfile::withoutGlobalScope('tenant')->with([
                'user',
                'schools',
                'country',
                'classes.school',
                'educations.country',
                'certificates',
                'courses',
                'skills',
            ])
                ->where('id', $id)
                ->whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId)->whereIn('status', ['active', 'inactive']))
                ->firstOrFail();

            $membership = $teacher->memberships()->where('tenant_id', $tenantId)->first();

            $blogPosts = \App\Models\School\TeacherBlogPost::where('teacher_profile_id', $id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'description' => $p->description,
                    'likes_count' => $p->likes_count ?? 0,
                    'comments_count' => $p->comments_count ?? 0,
                    'published_at' => $p->published_at?->toDateString(),
                    'created_at' => $p->created_at?->toDateString(),
                ]);

            return $this->successResponse(array_merge(
                $this->formatTeacher($teacher, detailed: true),
                [
                    'membership_id' => $membership?->id,
                    'membership_status' => $membership?->status,
                    'educations' => $this->credentialsWithApprovalStatus('education', $teacher->educations, $tenantId)
                        ->map(fn ($e) => [
                            'id' => $e->id,
                            'institution' => $e->institution,
                            'degree' => $e->degree,
                            'field_of_study' => $e->field_of_study,
                            'start_date' => $e->start_date?->toDateString(),
                            'end_date' => $e->end_date?->toDateString(),
                            'is_current' => (bool) $e->is_current,
                            'country' => $e->country ? ['id' => $e->country->id, 'name' => $e->country->name] : null,
                            'description' => $e->description,
                            'approval_status' => $e->_approval_status,
                            'rejection_reason' => $e->_rejection_reason,
                            'document_url' => $e->file_path ? URL::temporarySignedRoute('tenant.credential.document', now()->addMinutes(60), ['type' => 'educations', 'id' => $e->id]) : null,
                        ]),
                    'certificates' => $this->credentialsWithApprovalStatus('certificate', $teacher->certificates, $tenantId)
                        ->map(fn ($c) => [
                            'id' => $c->id,
                            'name' => $c->name,
                            'issuing_organization' => $c->issuing_organization,
                            'issue_date' => $c->issue_date?->toDateString(),
                            'expiry_date' => $c->expiry_date?->toDateString(),
                            'credential_url' => $c->credential_url,
                            'description' => $c->description,
                            'approval_status' => $c->_approval_status,
                            'rejection_reason' => $c->_rejection_reason,
                            'document_url' => $c->file_path ? URL::temporarySignedRoute('tenant.credential.document', now()->addMinutes(60), ['type' => 'certificates', 'id' => $c->id]) : null,
                        ]),
                    'courses' => $this->credentialsWithApprovalStatus('course', $teacher->courses, $tenantId)
                        ->map(fn ($c) => [
                            'id' => $c->id,
                            'title' => $c->title,
                            'type' => $c->type,
                            'provider' => $c->provider,
                            'start_date' => $c->start_date?->toDateString(),
                            'end_date' => $c->end_date?->toDateString(),
                            'duration_hours' => $c->duration_hours,
                            'location' => $c->location,
                            'is_online' => (bool) $c->is_online,
                            'description' => $c->description,
                            'approval_status' => $c->_approval_status,
                            'rejection_reason' => $c->_rejection_reason,
                            'document_url' => $c->file_path ? URL::temporarySignedRoute('tenant.credential.document', now()->addMinutes(60), ['type' => 'courses', 'id' => $c->id]) : null,
                        ]),
                    'skills' => $teacher->skills->map(fn ($s) => [
                        'id' => $s->id,
                        'name' => $s->name,
                        'level' => $s->level,
                        'category' => $s->category,
                        'proficiency' => $s->proficiency,
                    ]),
                    'blog_posts' => $blogPosts,
                ]
            ));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::show Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmen yüklenemedi.', 500);
        }
    }

    /**
     * Öğretmen profil bilgileri tenant tarafından güncellenemez.
     * Öğretmen kendi profilini günceller (/teacher/profile).
     */
    public function update(UpdateTeacherRequest $request, int $id): JsonResponse
    {
        return $this->errorResponse(
            'Öğretmen profili yalnızca öğretmen tarafından güncellenebilir.',
            405
        );
    }

    /** @deprecated */
    private function _update_disabled(UpdateTeacherRequest $request, int $id): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;
            $teacher = TeacherProfile::where('id', $id)
                ->whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId))
                ->firstOrFail();

            $teacher->update([
                'title' => $request->title ?? $teacher->title,
                'specialization' => $request->specialization ?? $teacher->specialization,
                'bio' => $request->bio ?? $teacher->bio,
                'experience_years' => $request->experience_years ?? $teacher->experience_years,
                'employment_type' => $request->employment_type ?? $teacher->employment_type,
                'hire_date' => $request->hire_date ?? $teacher->hire_date,
                'linkedin_url' => $request->linkedin_url ?? $teacher->linkedin_url,
                'website_url' => $request->website_url ?? $teacher->website_url,
                'phone_country_code' => $request->has('phone_country_code') ? $request->phone_country_code : $teacher->phone_country_code,
                'whatsapp_number' => $request->has('whatsapp_number') ? $request->whatsapp_number : $teacher->whatsapp_number,
                'whatsapp_country_code' => $request->has('whatsapp_country_code') ? $request->whatsapp_country_code : $teacher->whatsapp_country_code,
                'country_id' => $request->has('country_id') ? $request->country_id : $teacher->country_id,
                'identity_number' => $request->has('identity_number') ? $request->identity_number : $teacher->identity_number,
                'passport_number' => $request->has('passport_number') ? $request->passport_number : $teacher->passport_number,
                'updated_by' => $this->user()->id,
            ]);

            if ($request->phone) {
                $teacher->user->update(['phone' => $request->phone]);
            }

            $teacher->load('user', 'schools', 'country');

            return $this->successResponse($this->formatTeacher($teacher), 'Öğretmen güncellendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::update Error: '.$e->getMessage());

            return $this->errorResponse('Güncelleme başarısız.', 500);
        }
    }

    /**
     * Öğretmeni sil (soft delete)
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;
            $teacher = TeacherProfile::where('id', $id)
                ->whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId))
                ->firstOrFail();

            $teacher->delete();

            return $this->successResponse(null, 'Öğretmen silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::destroy Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // OKUL ATAMA
    // ──────────────────────────────────────────────────────────────

    /**
     * Öğretmenin okul atamalarını listele
     */
    public function schoolAssignments(int $id): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;
            $teacher = TeacherProfile::where('id', $id)
                ->whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId))
                ->firstOrFail();

            $schools = $teacher->schools()->get()->map(function ($s) {
                $roleType = $s->pivot->teacher_role_type_id
                    ? TeacherRoleType::find($s->pivot->teacher_role_type_id)
                    : null;

                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'employment_type' => $s->pivot->employment_type,
                    'teacher_role_type_id' => $s->pivot->teacher_role_type_id,
                    'role_type' => $roleType ? ['id' => $roleType->id, 'name' => $roleType->name] : null,
                    'start_date' => $s->pivot->start_date,
                    'end_date' => $s->pivot->end_date,
                    'is_active' => (bool) $s->pivot->is_active,
                ];
            });

            return $this->successResponse($schools);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::schoolAssignments Error: '.$e->getMessage());

            return $this->errorResponse('Okul atamaları yüklenemedi.', 500);
        }
    }

    /**
     * Öğretmeni okula ata — devre dışı.
     * Öğretmenler okula sadece davet/kabul akışı üzerinden katılabilir.
     */
    public function assignToSchool(Request $request, int $id): JsonResponse
    {
        return $this->errorResponse('Öğretmenler okula doğrudan atanamaz. Davet gönderin veya katılma talebini onaylayın.', 405);
    }

    /** @deprecated */
    private function _assignToSchool_disabled(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'teacher_role_type_id' => ['nullable', 'exists:teacher_role_types,id'],
            'employment_type' => ['nullable', 'in:full_time,part_time,contract,intern,volunteer'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        try {
            $tenantId = $this->user()->tenant_id;
            $teacher = TeacherProfile::where('id', $id)
                ->whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId))
                ->firstOrFail();

            $school = School::findOrFail($request->school_id);

            if ($school->tenant_id !== $this->user()->tenant_id) {
                return $this->errorResponse('Bu okula erişim yetkiniz yok.', 403);
            }

            $teacher->schools()->syncWithoutDetaching([
                $request->school_id => [
                    'employment_type' => $request->employment_type ?? 'full_time',
                    'teacher_role_type_id' => $request->teacher_role_type_id ?? null,
                    'start_date' => $request->start_date,
                    'end_date' => $request->end_date,
                    'is_active' => true,
                ],
            ]);

            return $this->successResponse(null, 'Öğretmen okula atandı.', 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Kayıt bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::assignToSchool Error: '.$e->getMessage());

            return $this->errorResponse('Atama başarısız.', 500);
        }
    }

    /**
     * Öğretmeni okuldan çıkar — devre dışı.
     * Öğretmen çıkarmak için removeMembership kullanın.
     */
    public function removeFromSchool(int $id, int $schoolId): JsonResponse
    {
        return $this->errorResponse('Bu işlem için üyelik kaldırma endpoint\'ini kullanın.', 405);
    }

    /** @deprecated */
    private function _removeFromSchool_disabled(int $id, int $schoolId): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;
            $teacher = TeacherProfile::where('id', $id)
                ->whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId))
                ->firstOrFail();

            $teacher->schools()->detach($schoolId);

            return $this->successResponse(null, 'Öğretmen okuldan çıkarıldı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::removeFromSchool Error: '.$e->getMessage());

            return $this->errorResponse('İşlem başarısız.', 500);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────

    private function formatTeacher(TeacherProfile $t, bool $detailed = false): array
    {
        $base = [
            'id' => $t->id,
            'user_id' => $t->user_id,
            'name' => trim(($t->user?->name ?? '').' '.($t->user?->surname ?? '')),
            'email' => $t->user?->email,
            'phone' => $t->user?->phone,
            'phone_country_code' => $t->phone_country_code,
            'whatsapp_number' => $t->whatsapp_number,
            'whatsapp_country_code' => $t->whatsapp_country_code,
            'nationality_country_id' => $t->country_id,
            'nationality' => $t->country_id && $t->country ? [
                'id' => $t->country->id,
                'name' => $t->country->name,
                'iso2' => $t->country->iso2,
                'flag_emoji' => $t->country->flag_emoji,
            ] : null,
            'identity_number' => $t->identity_number,
            'passport_number' => $t->passport_number,
            'title' => $t->title,
            'specialization' => $t->specialization,
            'employment_type' => $t->employment_type,
            'employment_label' => $t->employment_type_label,
            'experience_years' => $t->experience_years,
            'hire_date' => $t->hire_date?->toDateString(),
            'profile_photo' => $t->profile_photo,
            'school_count' => $t->schools?->count() ?? 0,
            'schools' => $t->schools?->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'is_active' => (bool) $s->pivot->is_active,
                'role_type_name' => $s->pivot->teacher_role_type_id
                    ? TeacherRoleType::find($s->pivot->teacher_role_type_id)?->name
                    : null,
            ]),
        ];

        if ($detailed) {
            $base += [
                'bio' => $t->bio,
                'linkedin_url' => $t->linkedin_url,
                'website_url' => $t->website_url,
                'classes' => $t->classes?->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'school_id' => $c->school_id,
                ]),
            ];
        }

        return $base;
    }

    // ──────────────────────────────────────────────────────────────
    // YENİ: DAVET / KATILMA TALEBİ / AKTİF-PASİF
    // ──────────────────────────────────────────────────────────────

    /**
     * E-posta ile öğretmeni davet et
     */
    public function invite(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $user = User::where('email', $request->email)->first();
            if (! $user) {
                return $this->errorResponse('Bu e-posta adresiyle kayıtlı öğretmen bulunamadı.', 404);
            }

            if (! $user->roles()->where('name', 'teacher')->exists()) {
                return $this->errorResponse('Bu hesap öğretmen hesabı değil.', 422);
            }

            $profile = TeacherProfile::where('user_id', $user->id)->first();
            if (! $profile) {
                return $this->errorResponse('Öğretmen profili bulunamadı.', 404);
            }

            $tenantId = $this->user()->tenant_id;

            $existing = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                ->where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive', 'pending'])
                ->first();

            if ($existing) {
                return $this->errorResponse('Bu öğretmen zaten kurumunuzda mevcut veya bekleyen talebi var.', 422);
            }

            TeacherTenantMembership::create([
                'teacher_profile_id' => $profile->id,
                'tenant_id' => $tenantId,
                'status' => 'pending',
                'invite_type' => 'tenant_invite',
                'invited_by_user_id' => $this->user()->id,
                'notes' => $request->notes,
            ]);

            return $this->successResponse(null, 'Öğretmen davet edildi. Daveti kabul etmesi bekleniyor.');
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::invite Error: '.$e->getMessage());

            return $this->errorResponse('Davet gönderilemedi.', 500);
        }
    }

    /**
     * Öğretmenlerden gelen bekleyen katılma talepleri
     */
    public function joinRequests(): JsonResponse
    {
        try {
            $requests = TeacherTenantMembership::where('tenant_id', $this->user()->tenant_id)
                ->where('status', 'pending')
                ->where('invite_type', 'teacher_request')
                ->with(['teacherProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('user')])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'teacher_profile_id' => $m->teacher_profile_id,
                    'name' => trim(($m->teacherProfile?->user?->name ?? '').' '.($m->teacherProfile?->user?->surname ?? '')),
                    'email' => $m->teacherProfile?->user?->email,
                    'phone' => $m->teacherProfile?->user?->phone,
                    'specialization' => $m->teacherProfile?->specialization,
                    'experience_years' => $m->teacherProfile?->experience_years,
                    'sent_at' => $m->created_at?->toISOString(),
                ]);

            return $this->successResponse($requests, 'Katılma talepleri listelendi.');
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::joinRequests Error: '.$e->getMessage());

            return $this->errorResponse('Talepler yüklenemedi.', 500);
        }
    }

    /**
     * Katılma talebini onayla
     */
    public function approveJoinRequest(int $id): JsonResponse
    {
        try {
            $membership = TeacherTenantMembership::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->where('status', 'pending')
                ->firstOrFail();

            $membership->update(['status' => 'active', 'joined_at' => now()]);

            // Öğretmen okul kodu ile katıldıysa → school_teacher_assignments kaydı oluştur
            if ($membership->school_id) {
                \Illuminate\Support\Facades\DB::table('school_teacher_assignments')->insertOrIgnore([
                    'school_id' => $membership->school_id,
                    'teacher_profile_id' => $membership->teacher_profile_id,
                    'employment_type' => 'full_time',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $this->successResponse(null, 'Talep onaylandı. Öğretmen kurumunuza eklendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Talep bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::approveJoinRequest Error: '.$e->getMessage());

            return $this->errorResponse('Talep onaylanamadı.', 500);
        }
    }

    /**
     * Katılma talebini reddet
     */
    public function rejectJoinRequest(int $id): JsonResponse
    {
        try {
            $membership = TeacherTenantMembership::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->where('status', 'pending')
                ->firstOrFail();

            $membership->update(['status' => 'removed']);

            return $this->successResponse(null, 'Talep reddedildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Talep bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::rejectJoinRequest Error: '.$e->getMessage());

            return $this->errorResponse('Talep reddedilemedi.', 500);
        }
    }

    /**
     * Öğretmeni aktif yap (bu tenant için)
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $membership = TeacherTenantMembership::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $membership->update(['status' => 'active']);

            return $this->successResponse(null, 'Öğretmen aktif edildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::activate Error: '.$e->getMessage());

            return $this->errorResponse('Aktivasyon başarısız.', 500);
        }
    }

    /**
     * Öğretmeni pasif yap — bu tenant için erişimi kısıtla.
     * Öğretmen hesabı kapatılmaz; diğer okullara girişi devam eder.
     */
    public function deactivate(int $id): JsonResponse
    {
        try {
            $membership = TeacherTenantMembership::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->where('status', 'active')
                ->firstOrFail();

            $membership->update(['status' => 'inactive']);

            return $this->successResponse(null, 'Öğretmen bu kurum için pasif yapıldı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Aktif öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::deactivate Error: '.$e->getMessage());

            return $this->errorResponse('İşlem başarısız.', 500);
        }
    }

    /**
     * Öğretmeni okuldan çıkar.
     * Öğretmen hesabı kapatılmaz; sistemde ve diğer okullarda girişi devam eder.
     * Daha sonra aynı okula yeniden katılma talebi gönderebilir.
     */
    public function removeMembership(int $id): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $membership = TeacherTenantMembership::where('id', $id)
                ->where('tenant_id', $tenantId)
                ->firstOrFail();

            $membership->update(['status' => 'removed']);

            // Öğretmeni bu tenant'a ait tüm school_teacher_assignments'lardan çıkar
            $tenantSchoolIds = \App\Models\School\School::where('tenant_id', $tenantId)->pluck('id');
            \Illuminate\Support\Facades\DB::table('school_teacher_assignments')
                ->where('teacher_profile_id', $membership->teacher_profile_id)
                ->whereIn('school_id', $tenantSchoolIds)
                ->delete();

            return $this->successResponse(null, 'Öğretmen okuldan çıkarıldı. Sisteme girişi ve diğer okullardaki üyeliği devam etmektedir.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::removeMembership Error: '.$e->getMessage());

            return $this->errorResponse('İşlem başarısız.', 500);
        }
    }

    /**
     * Okul bazında öğretmen katılma talepleri.
     * Okul bir tenant'a ait olduğundan tenant'ın tüm pending teacher_request'leri döner.
     * GET /schools/{school_id}/teacher-join-requests
     */
    public function schoolJoinRequests(int $school_id): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            // school_id doğrulama BaseSchoolController middleware ile zaten yapılmış olabilir,
            // ek güvence olarak tenant sahipliğini kontrol et
            $school = \App\Models\School\School::where('id', $school_id)
                ->where('tenant_id', $tenantId)
                ->firstOrFail();

            $requests = TeacherTenantMembership::where('tenant_id', $school->tenant_id)
                ->where('school_id', $school->id)
                ->where('status', 'pending')
                ->where('invite_type', 'teacher_request')
                ->with(['teacherProfile' => fn ($q) => $q->withoutGlobalScope('tenant')->with('user')])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'teacher_profile_id' => $m->teacher_profile_id,
                    'name' => trim(($m->teacherProfile?->user?->name ?? '').' '.($m->teacherProfile?->user?->surname ?? '')),
                    'email' => $m->teacherProfile?->user?->email,
                    'phone' => $m->teacherProfile?->user?->phone,
                    'specialization' => $m->teacherProfile?->specialization,
                    'experience_years' => $m->teacherProfile?->experience_years,
                    'sent_at' => $m->created_at?->toISOString(),
                ]);

            return $this->successResponse($requests, 'Öğretmen katılma talepleri listelendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Okul bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::schoolJoinRequests Error: '.$e->getMessage());

            return $this->errorResponse('Talepler yüklenemedi.', 500);
        }
    }

    /**
     * Öğretmen şifresini yenile (tenant admin yapabilir)
     */
    public function resetPassword(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|min:8|confirmed',
        ]);

        try {
            $membership = TeacherTenantMembership::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $userId = $membership->teacherProfile?->user_id;
            if (! $userId) {
                return $this->errorResponse('Öğretmen kullanıcısı bulunamadı.', 404);
            }

            User::where('id', $userId)->update(['password' => Hash::make($request->password)]);

            return $this->successResponse(null, 'Şifre başarıyla güncellendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::resetPassword Error: '.$e->getMessage());

            return $this->errorResponse('Şifre güncellenemedi.', 500);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────

    /**
     * Tüm credential'lara bu tenant'ın onay durumunu ekler (_approval_status, _rejection_reason geçici alanlar).
     * pending = approval kaydı yok, approved/rejected = kayıt var.
     *
     * @param  \Illuminate\Database\Eloquent\Collection  $items
     */
    private function credentialsWithApprovalStatus(string $type, $items, int $tenantId): \Illuminate\Support\Collection
    {
        if ($items->isEmpty()) {
            return collect();
        }

        $approvals = TeacherCredentialTenantApproval::where('credential_type', $type)
            ->whereIn('credential_id', $items->pluck('id'))
            ->where('tenant_id', $tenantId)
            ->get()
            ->keyBy('credential_id');

        return $items->map(function ($item) use ($approvals) {
            $approval = $approvals->get($item->id);
            $item->_approval_status = $approval?->status ?? 'pending';
            $item->_rejection_reason = $approval?->rejection_reason;

            return $item;
        });
    }
}
