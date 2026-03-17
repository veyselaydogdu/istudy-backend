<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Teacher\StoreTeacherRequest;
use App\Http\Requests\Teacher\UpdateTeacherRequest;
use App\Models\School\School;
use App\Models\School\TeacherProfile;
use App\Models\School\TeacherRoleType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

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

            $query = TeacherProfile::with('user', 'schools', 'country')
                ->where('tenant_id', $tenantId)
                ->when($request->search, function ($q) use ($request) {
                    $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$request->search}%")
                        ->orWhere('surname', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%"));
                })
                ->when($request->school_id, fn ($q) => $q->whereHas('schools', fn ($s) => $s->where('school_id', $request->school_id)))
                ->orderBy('created_at', 'desc');

            $teachers = $query->paginate($request->per_page ?? 15);

            return $this->paginatedResponse($teachers->through(fn ($t) => $this->formatTeacher($t)));
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::index Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmenler yüklenemedi.', 500);
        }
    }

    /**
     * Yeni öğretmen oluştur (User + TeacherProfile)
     */
    public function store(StoreTeacherRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $tenantId = $this->user()->tenant_id;

            $user = User::create([
                'name' => $request->name,
                'surname' => $request->surname,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password ?? str()->random(12)),
                'tenant_id' => $tenantId,
            ]);

            $user->roles()->attach(
                DB::table('roles')->where('name', 'teacher')->value('id')
            );

            $teacher = TeacherProfile::create([
                'user_id' => $user->id,
                'tenant_id' => $tenantId,
                'title' => $request->title,
                'specialization' => $request->specialization,
                'bio' => $request->bio,
                'experience_years' => $request->experience_years ?? 0,
                'employment_type' => $request->employment_type ?? 'full_time',
                'hire_date' => $request->hire_date,
                'linkedin_url' => $request->linkedin_url,
                'website_url' => $request->website_url,
                'phone_country_code' => $request->phone_country_code,
                'whatsapp_number' => $request->whatsapp_number,
                'whatsapp_country_code' => $request->whatsapp_country_code,
                'country_id' => $request->country_id,
                'identity_number' => $request->identity_number,
                'passport_number' => $request->passport_number,
                'created_by' => $this->user()->id,
            ]);

            $teacher->load('user', 'schools', 'country');

            DB::commit();

            return $this->successResponse($this->formatTeacher($teacher), 'Öğretmen oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('TenantTeacherController::store Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmen oluşturulamadı: '.$e->getMessage(), 500);
        }
    }

    /**
     * Öğretmen detayı
     */
    public function show(int $id): JsonResponse
    {
        try {
            $teacher = TeacherProfile::with('user', 'schools', 'country', 'classes.school')
                ->where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            return $this->successResponse($this->formatTeacher($teacher, detailed: true));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TenantTeacherController::show Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmen yüklenemedi.', 500);
        }
    }

    /**
     * Öğretmen profil bilgilerini güncelle
     */
    public function update(UpdateTeacherRequest $request, int $id): JsonResponse
    {
        try {
            $teacher = TeacherProfile::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
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
            $teacher = TeacherProfile::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
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
            $teacher = TeacherProfile::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
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
     * Öğretmeni okula ata
     */
    public function assignToSchool(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'teacher_role_type_id' => ['nullable', 'exists:teacher_role_types,id'],
            'employment_type' => ['nullable', 'in:full_time,part_time,contract,intern,volunteer'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        try {
            $teacher = TeacherProfile::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
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
     * Öğretmeni okuldan çıkar
     */
    public function removeFromSchool(int $id, int $schoolId): JsonResponse
    {
        try {
            $teacher = TeacherProfile::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
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
}
