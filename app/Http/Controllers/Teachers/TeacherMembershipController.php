<?php

namespace App\Http\Controllers\Teachers;

use App\Models\School\School;
use App\Models\School\TeacherTenantMembership;
use App\Models\Tenant\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * TeacherMembershipController — Öğretmenin Tenant Üyelik Yönetimi
 *
 * Öğretmen tenant'a katılma talebi gönderir, davetleri görür ve kabul/red eder.
 */
class TeacherMembershipController extends BaseTeacherController
{
    /**
     * Öğretmenin aktif/pasif tenant üyelikleri
     */
    public function myTenants(): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $memberships = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                ->whereIn('status', ['active', 'inactive'])
                ->with(['tenant' => fn ($q) => $q->with('schools:id,name,tenant_id')])
                ->get()
                ->map(fn ($m) => [
                    'membership_id' => $m->id,
                    'tenant_id' => $m->tenant_id,
                    'tenant_name' => $m->tenant?->name,
                    'status' => $m->status,
                    'schools' => $m->tenant?->schools->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->values() ?? [],
                    'joined_at' => $m->joined_at?->toISOString(),
                ]);

            return $this->successResponse($memberships, 'Tenant üyelikleri listelendi.');
        } catch (\Throwable $e) {
            Log::error('TeacherMembershipController::myTenants', ['message' => $e->getMessage()]);

            return $this->errorResponse('Üyelikler alınamadı.', 500);
        }
    }

    /**
     * Tenant'tan gelen bekleyen davetler
     */
    public function invitations(): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $invitations = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                ->where('status', 'pending')
                ->where('invite_type', 'tenant_invite')
                ->with('tenant:id,name', 'invitedBy:id,name,surname')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'tenant_id' => $m->tenant_id,
                    'tenant_name' => $m->tenant?->name,
                    'invited_by' => $m->invitedBy ? "{$m->invitedBy->name} {$m->invitedBy->surname}" : null,
                    'notes' => $m->notes,
                    'invited_at' => $m->created_at?->toISOString(),
                ]);

            return $this->successResponse($invitations, 'Davetler listelendi.');
        } catch (\Throwable $e) {
            Log::error('TeacherMembershipController::invitations', ['message' => $e->getMessage()]);

            return $this->errorResponse('Davetler alınamadı.', 500);
        }
    }

    /**
     * Öğretmenin gönderdiği katılma talepleri — okula göre gruplandırılmış, geçmişli.
     *
     * current_status değerleri:
     *   pending  → bekliyor
     *   rejected → istek reddedildi (hiç aktif olmadı)
     *   removed  → aktifti, sonra kaldırıldı
     */
    public function myJoinRequests(): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $memberships = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                ->where('invite_type', 'teacher_request')
                ->whereIn('status', ['pending', 'removed'])
                ->with('tenant:id,name', 'school:id,name')
                ->orderBy('created_at', 'asc')
                ->get();

            $resolveStatus = fn ($m) => match (true) {
                $m->status === 'pending' => 'pending',
                $m->status === 'removed' && $m->joined_at !== null => 'removed',
                default => 'rejected',
            };

            $grouped = $memberships
                ->groupBy(fn ($m) => $m->school_id ? "school_{$m->school_id}" : "tenant_{$m->tenant_id}")
                ->map(function ($items) use ($resolveStatus) {
                    $latest = $items->last();

                    return [
                        'school_id' => $latest->school_id,
                        'school_name' => $latest->school?->name,
                        'tenant_id' => $latest->tenant_id,
                        'tenant_name' => $latest->tenant?->name,
                        'current_status' => $resolveStatus($latest),
                        'pending_id' => $latest->status === 'pending' ? $latest->id : null,
                        'sent_at' => $latest->created_at?->toISOString(),
                        'history' => $items->map(fn ($m) => [
                            'id' => $m->id,
                            'status_type' => $resolveStatus($m),
                            'sent_at' => $m->created_at?->toISOString(),
                            'joined_at' => $m->joined_at?->toISOString(),
                        ])->values(),
                    ];
                })
                ->values();

            return $this->successResponse($grouped, 'Katılma talepleri listelendi.');
        } catch (\Throwable $e) {
            Log::error('TeacherMembershipController::myJoinRequests', ['message' => $e->getMessage()]);

            return $this->errorResponse('Talepler alınamadı.', 500);
        }
    }

    /**
     * Öğretmen katılma talebi gönderir.
     *
     * Desteklenen alanlar (biri zorunlu):
     *   - invite_code: Tenant'ın UUID davet kodu
     *   - registration_code: Okulun 8 haneli kayıt kodu
     *   - school_invite_token: Okulun UUID davet tokeni
     */
    public function sendJoinRequest(Request $request): JsonResponse
    {
        $request->validate([
            'invite_code' => 'nullable|string',
            'registration_code' => 'nullable|string',
            'school_invite_token' => 'nullable|string',
        ]);

        if (! $request->invite_code && ! $request->registration_code && ! $request->school_invite_token) {
            return $this->errorResponse('Davet kodu, kayıt kodu veya davet tokeni gereklidir.', 422);
        }

        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            // Tenant ve okul tespiti
            $tenant = null;
            $resolvedSchool = null;

            if ($request->invite_code) {
                $tenant = Tenant::where('invite_code', $request->invite_code)->first();
            } elseif ($request->registration_code) {
                $resolvedSchool = School::withoutGlobalScope('tenant')
                    ->where('registration_code', strtoupper($request->registration_code))
                    ->where('is_active', true)
                    ->first();
                if ($resolvedSchool) {
                    $tenant = Tenant::find($resolvedSchool->tenant_id);
                }
            } elseif ($request->school_invite_token) {
                $resolvedSchool = School::withoutGlobalScope('tenant')
                    ->where('invite_token', $request->school_invite_token)
                    ->where('is_active', true)
                    ->first();
                if ($resolvedSchool) {
                    $tenant = Tenant::find($resolvedSchool->tenant_id);
                }
            }

            if (! $tenant) {
                return $this->errorResponse('Geçersiz davet kodu veya kayıt kodu. Lütfen okul yönetiminizden doğru kodu alın.', 404);
            }

            $existing = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                ->where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'inactive', 'pending'])
                ->exists();

            if ($existing) {
                return $this->errorResponse('Bu kurumla zaten ilişkiniz mevcut veya bekleyen talebiniz var.', 422);
            }

            // Unique constraint (teacher_profile_id, tenant_id) nedeniyle removed kayıt varsa güncelle, yoksa oluştur
            $removed = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'removed')
                ->latest()
                ->first();

            if ($removed) {
                $removed->update([
                    'school_id' => $resolvedSchool?->id,
                    'status' => 'pending',
                    'invite_type' => 'teacher_request',
                    'joined_at' => null,
                    'invited_by_user_id' => null,
                    'notes' => null,
                ]);
            } else {
                TeacherTenantMembership::create([
                    'teacher_profile_id' => $profile->id,
                    'tenant_id' => $tenant->id,
                    'school_id' => $resolvedSchool?->id,
                    'status' => 'pending',
                    'invite_type' => 'teacher_request',
                ]);
            }

            return $this->successResponse(null, "'{$tenant->name}' kurumuna katılma talebiniz gönderildi.");
        } catch (\Throwable $e) {
            Log::error('TeacherMembershipController::sendJoinRequest', ['message' => $e->getMessage()]);

            return $this->errorResponse('Talep gönderilemedi.', 500);
        }
    }

    /**
     * Tenant davetini kabul et
     */
    public function acceptInvitation(int $id): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $membership = TeacherTenantMembership::where('id', $id)
                ->where('teacher_profile_id', $profile->id)
                ->where('status', 'pending')
                ->where('invite_type', 'tenant_invite')
                ->firstOrFail();

            $membership->update([
                'status' => 'active',
                'joined_at' => now(),
            ]);

            return $this->successResponse(null, 'Davet kabul edildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Davet bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TeacherMembershipController::acceptInvitation', ['message' => $e->getMessage()]);

            return $this->errorResponse('Davet kabul edilemedi.', 500);
        }
    }

    /**
     * Tenant davetini reddet
     */
    public function rejectInvitation(int $id): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $membership = TeacherTenantMembership::where('id', $id)
                ->where('teacher_profile_id', $profile->id)
                ->where('status', 'pending')
                ->where('invite_type', 'tenant_invite')
                ->firstOrFail();

            $membership->update(['status' => 'removed']);

            return $this->successResponse(null, 'Davet reddedildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Davet bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TeacherMembershipController::rejectInvitation', ['message' => $e->getMessage()]);

            return $this->errorResponse('Davet reddedilemedi.', 500);
        }
    }

    /**
     * Katılma talebini iptal et
     */
    public function cancelJoinRequest(int $id): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $membership = TeacherTenantMembership::where('id', $id)
                ->where('teacher_profile_id', $profile->id)
                ->where('status', 'pending')
                ->where('invite_type', 'teacher_request')
                ->firstOrFail();

            $membership->delete();

            return $this->successResponse(null, 'Talep iptal edildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Talep bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('TeacherMembershipController::cancelJoinRequest', ['message' => $e->getMessage()]);

            return $this->errorResponse('Talep iptal edilemedi.', 500);
        }
    }
}
