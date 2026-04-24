<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\TeacherCertificate;
use App\Models\School\TeacherCourse;
use App\Models\School\TeacherCredentialTenantApproval;
use App\Models\School\TeacherTenantMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * TeacherApprovalController — Per-Tenant Öğretmen Onay İşlemleri
 *
 * Her tenant, kayıtlı öğretmenin sertifika ve kurslarını bağımsız onaylayıp reddedebilir.
 * Red işleminde sebep zorunludur.
 */
class TeacherApprovalController extends BaseController
{
    /**
     * Tenant'ın onaylamadığı (kayıt yok) sertifika + kurs listesi
     */
    public function pendingApprovals(Request $request): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $approvedCertIds = TeacherCredentialTenantApproval::where('credential_type', 'certificate')
                ->where('tenant_id', $tenantId)
                ->pluck('credential_id');

            $approvedCourseIds = TeacherCredentialTenantApproval::where('credential_type', 'course')
                ->where('tenant_id', $tenantId)
                ->pluck('credential_id');

            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            $perPage = $request->integer('per_page', 20);

            $certificates = TeacherCertificate::whereIn('teacher_profile_id', $teacherProfileIds)
                ->whereNotIn('id', $approvedCertIds)
                ->with(['teacherProfile.user'])
                ->get()
                ->map(fn ($c) => [
                    'type' => 'certificate',
                    'id' => $c->id,
                    'title' => $c->name,
                    'subtitle' => $c->issuing_organization,
                    'date' => $c->issue_date?->toDateString(),
                    'teacher_name' => trim(($c->teacherProfile?->user?->name ?? '').' '.($c->teacherProfile?->user?->surname ?? '')),
                    'teacher_profile_id' => $c->teacher_profile_id,
                ]);

            $courses = TeacherCourse::whereIn('teacher_profile_id', $teacherProfileIds)
                ->whereNotIn('id', $approvedCourseIds)
                ->with(['teacherProfile.user'])
                ->get()
                ->map(fn ($c) => [
                    'type' => 'course',
                    'id' => $c->id,
                    'title' => $c->title,
                    'subtitle' => $c->provider,
                    'date' => $c->start_date?->toDateString(),
                    'teacher_name' => trim(($c->teacherProfile?->user?->name ?? '').' '.($c->teacherProfile?->user?->surname ?? '')),
                    'teacher_profile_id' => $c->teacher_profile_id,
                ]);

            $all = $certificates->merge($courses)->values();

            return $this->successResponse($all);
        } catch (\Throwable $e) {
            Log::error('Onay listesi hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Onay listesi alınamadı.', 500);
        }
    }

    /**
     * Sertifika onayla
     */
    public function approveCertificate(int $certificateId): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $certificate = TeacherCertificate::with('teacherProfile')
                ->whereHas('teacherProfile.memberships', fn ($q) => $q->where('tenant_id', $tenantId)->whereIn('status', ['active', 'inactive']))
                ->findOrFail($certificateId);

            DB::beginTransaction();

            TeacherCredentialTenantApproval::updateOrCreate(
                ['credential_type' => 'certificate', 'credential_id' => $certificateId, 'tenant_id' => $tenantId],
                [
                    'status' => 'approved',
                    'reviewed_by' => $this->user()->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => null,
                ]
            );

            DB::commit();

            return $this->successResponse(null, 'Sertifika onaylandı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Sertifika bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Sertifika onay hatası', ['id' => $certificateId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Onay işlemi başarısız.', 500);
        }
    }

    /**
     * Sertifika reddet (sebep zorunlu)
     */
    public function rejectCertificate(Request $request, int $certificateId): JsonResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            $tenantId = $this->user()->tenant_id;

            TeacherCertificate::with('teacherProfile')
                ->whereHas('teacherProfile.memberships', fn ($q) => $q->where('tenant_id', $tenantId)->whereIn('status', ['active', 'inactive']))
                ->findOrFail($certificateId);

            DB::beginTransaction();

            TeacherCredentialTenantApproval::updateOrCreate(
                ['credential_type' => 'certificate', 'credential_id' => $certificateId, 'tenant_id' => $tenantId],
                [
                    'status' => 'rejected',
                    'reviewed_by' => $this->user()->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => $request->input('rejection_reason'),
                ]
            );

            DB::commit();

            return $this->successResponse(null, 'Sertifika reddedildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Sertifika bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Sertifika red hatası', ['id' => $certificateId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Red işlemi başarısız.', 500);
        }
    }

    /**
     * Kurs/Seminer onayla
     */
    public function approveCourse(int $courseId): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            TeacherCourse::with('teacherProfile')
                ->whereHas('teacherProfile.memberships', fn ($q) => $q->where('tenant_id', $tenantId)->whereIn('status', ['active', 'inactive']))
                ->findOrFail($courseId);

            DB::beginTransaction();

            TeacherCredentialTenantApproval::updateOrCreate(
                ['credential_type' => 'course', 'credential_id' => $courseId, 'tenant_id' => $tenantId],
                [
                    'status' => 'approved',
                    'reviewed_by' => $this->user()->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => null,
                ]
            );

            DB::commit();

            return $this->successResponse(null, 'Kurs/Seminer onaylandı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Kurs bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Kurs onay hatası', ['id' => $courseId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Onay işlemi başarısız.', 500);
        }
    }

    /**
     * Kurs/Seminer reddet (sebep zorunlu)
     */
    public function rejectCourse(Request $request, int $courseId): JsonResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            $tenantId = $this->user()->tenant_id;

            TeacherCourse::with('teacherProfile')
                ->whereHas('teacherProfile.memberships', fn ($q) => $q->where('tenant_id', $tenantId)->whereIn('status', ['active', 'inactive']))
                ->findOrFail($courseId);

            DB::beginTransaction();

            TeacherCredentialTenantApproval::updateOrCreate(
                ['credential_type' => 'course', 'credential_id' => $courseId, 'tenant_id' => $tenantId],
                [
                    'status' => 'rejected',
                    'reviewed_by' => $this->user()->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => $request->input('rejection_reason'),
                ]
            );

            DB::commit();

            return $this->successResponse(null, 'Kurs/Seminer reddedildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Kurs bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Kurs red hatası', ['id' => $courseId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Red işlemi başarısız.', 500);
        }
    }
}
