<?php

namespace App\Http\Controllers\Teachers;

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
     * Öğretmenin gönderdiği bekleyen katılma talepleri
     */
    public function myJoinRequests(): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $requests = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                ->where('status', 'pending')
                ->where('invite_type', 'teacher_request')
                ->with('tenant:id,name')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'tenant_id' => $m->tenant_id,
                    'tenant_name' => $m->tenant?->name,
                    'sent_at' => $m->created_at?->toISOString(),
                ]);

            return $this->successResponse($requests, 'Katılma talepleri listelendi.');
        } catch (\Throwable $e) {
            Log::error('TeacherMembershipController::myJoinRequests', ['message' => $e->getMessage()]);

            return $this->errorResponse('Talepler alınamadı.', 500);
        }
    }

    /**
     * Öğretmen tenant'a katılma talebi gönderir (davet kodu ile)
     */
    public function sendJoinRequest(Request $request): JsonResponse
    {
        $request->validate([
            'invite_code' => 'required|string',
        ]);

        try {
            $profile = $this->teacherProfile();
            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $tenant = Tenant::where('invite_code', $request->invite_code)->first();
            if (! $tenant) {
                return $this->errorResponse('Geçersiz davet kodu.', 404);
            }

            $existing = TeacherTenantMembership::where('teacher_profile_id', $profile->id)
                ->where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'inactive', 'pending'])
                ->exists();

            if ($existing) {
                return $this->errorResponse('Bu kurumla zaten ilişkiniz mevcut veya bekleyen talebiniz var.', 422);
            }

            TeacherTenantMembership::create([
                'teacher_profile_id' => $profile->id,
                'tenant_id' => $tenant->id,
                'status' => 'pending',
                'invite_type' => 'teacher_request',
            ]);

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
