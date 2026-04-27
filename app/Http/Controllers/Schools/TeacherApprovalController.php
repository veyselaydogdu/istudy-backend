<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\TeacherCertificate;
use App\Models\School\TeacherCourse;
use App\Models\School\TeacherCredentialTenantApproval;
use App\Models\School\TeacherEducation;
use App\Models\School\TeacherTenantMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

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

            $approvedEduIds = TeacherCredentialTenantApproval::where('credential_type', 'education')
                ->where('tenant_id', $tenantId)
                ->pluck('credential_id');

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
                    'has_document' => (bool) $c->file_path,
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
                    'has_document' => (bool) $c->file_path,
                ]);

            $educations = TeacherEducation::whereIn('teacher_profile_id', $teacherProfileIds)
                ->whereNotIn('id', $approvedEduIds)
                ->with(['teacherProfile.user'])
                ->get()
                ->map(fn ($e) => [
                    'type' => 'education',
                    'id' => $e->id,
                    'title' => $e->institution,
                    'subtitle' => $e->degree,
                    'date' => $e->start_date?->toDateString(),
                    'teacher_name' => trim(($e->teacherProfile?->user?->name ?? '').' '.($e->teacherProfile?->user?->surname ?? '')),
                    'teacher_profile_id' => $e->teacher_profile_id,
                    'has_document' => (bool) $e->file_path,
                ]);

            $all = collect($certificates)->merge($courses)->merge($educations)->values();

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

            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            TeacherCertificate::whereIn('teacher_profile_id', $teacherProfileIds)
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

            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            TeacherCertificate::whereIn('teacher_profile_id', $teacherProfileIds)
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

            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            TeacherCourse::whereIn('teacher_profile_id', $teacherProfileIds)
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

            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            TeacherCourse::whereIn('teacher_profile_id', $teacherProfileIds)
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

    /**
     * Eğitim onayla
     */
    public function approveEducation(int $educationId): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            TeacherEducation::whereIn('teacher_profile_id', $teacherProfileIds)
                ->findOrFail($educationId);

            DB::beginTransaction();

            TeacherCredentialTenantApproval::updateOrCreate(
                ['credential_type' => 'education', 'credential_id' => $educationId, 'tenant_id' => $tenantId],
                [
                    'status' => 'approved',
                    'reviewed_by' => $this->user()->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => null,
                ]
            );

            DB::commit();

            return $this->successResponse(null, 'Eğitim onaylandı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Eğitim bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim onay hatası', ['id' => $educationId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Onay işlemi başarısız.', 500);
        }
    }

    /**
     * Eğitim reddet (sebep zorunlu)
     */
    public function rejectEducation(Request $request, int $educationId): JsonResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            $tenantId = $this->user()->tenant_id;

            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            TeacherEducation::whereIn('teacher_profile_id', $teacherProfileIds)
                ->findOrFail($educationId);

            DB::beginTransaction();

            TeacherCredentialTenantApproval::updateOrCreate(
                ['credential_type' => 'education', 'credential_id' => $educationId, 'tenant_id' => $tenantId],
                [
                    'status' => 'rejected',
                    'reviewed_by' => $this->user()->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => $request->input('rejection_reason'),
                ]
            );

            DB::commit();

            return $this->successResponse(null, 'Eğitim reddedildi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Eğitim bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim red hatası', ['id' => $educationId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Red işlemi başarısız.', 500);
        }
    }

    /**
     * Tek credential'ın tüm detaylarını döndür
     */
    public function show(string $type, int $id): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            // teacherProfile global scope'u (tenant_id filtresi) atlatmak için
            // pendingApprovals ile aynı yaklaşım: önce üye teacher_profile_id'leri çek
            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            $withProfile = ['teacherProfile' => fn ($q) => $q->withoutGlobalScope('tenant'), 'teacherProfile.user'];

            $model = match ($type) {
                'certificates' => TeacherCertificate::with($withProfile)
                    ->whereIn('teacher_profile_id', $teacherProfileIds)
                    ->findOrFail($id),
                'courses' => TeacherCourse::with($withProfile)
                    ->whereIn('teacher_profile_id', $teacherProfileIds)
                    ->findOrFail($id),
                'educations' => TeacherEducation::with($withProfile)
                    ->whereIn('teacher_profile_id', $teacherProfileIds)
                    ->findOrFail($id),
                default => null,
            };

            if (! $model) {
                return $this->errorResponse('Geçersiz tür.', 400);
            }

            $teacherName = trim(($model->teacherProfile?->user?->name ?? '').' '.($model->teacherProfile?->user?->surname ?? ''));

            $documentUrl = $model->file_path
                ? URL::temporarySignedRoute('tenant.credential.document', now()->addMinutes(60), ['type' => $type, 'id' => $model->id])
                : null;

            $data = match ($type) {
                'certificates' => [
                    'type' => 'certificate',
                    'id' => $model->id,
                    'teacher_name' => $teacherName,
                    'name' => $model->name,
                    'issuing_organization' => $model->issuing_organization,
                    'issue_date' => $model->issue_date?->toDateString(),
                    'expiry_date' => $model->expiry_date?->toDateString(),
                    'credential_id' => $model->credential_id,
                    'credential_url' => $model->credential_url,
                    'description' => $model->description,
                    'has_document' => (bool) $model->file_path,
                    'document_url' => $documentUrl,
                ],
                'courses' => [
                    'type' => 'course',
                    'id' => $model->id,
                    'teacher_name' => $teacherName,
                    'title' => $model->title,
                    'course_type' => $model->type,
                    'provider' => $model->provider,
                    'start_date' => $model->start_date?->toDateString(),
                    'end_date' => $model->end_date?->toDateString(),
                    'duration_hours' => $model->duration_hours,
                    'location' => $model->location,
                    'is_online' => $model->is_online,
                    'certificate_url' => $model->certificate_url,
                    'description' => $model->description,
                    'has_document' => (bool) $model->file_path,
                    'document_url' => $documentUrl,
                ],
                'educations' => [
                    'type' => 'education',
                    'id' => $model->id,
                    'teacher_name' => $teacherName,
                    'institution' => $model->institution,
                    'degree' => $model->degree,
                    'field_of_study' => $model->field_of_study,
                    'start_date' => $model->start_date?->toDateString(),
                    'end_date' => $model->end_date?->toDateString(),
                    'is_current' => $model->is_current,
                    'gpa' => $model->gpa,
                    'description' => $model->description,
                    'has_document' => (bool) $model->file_path,
                    'document_url' => $documentUrl,
                ],
            };

            return $this->successResponse($data);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Kayıt bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('Credential detay hatası', ['type' => $type, 'id' => $id, 'error' => $e->getMessage()]);

            return $this->errorResponse('Detay alınamadı.', 500);
        }
    }

    /**
     * Öğretmenin yüklediği belgeyi tenant için sun
     * GET /teacher-approvals/document/{type}/{id}  — middleware: auth:sanctum + signed
     */
    public function serveCredentialDocument(Request $request, string $type, int $id): Response|JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            $teacherProfileIds = TeacherTenantMembership::where('tenant_id', $tenantId)
                ->whereIn('status', ['active', 'inactive'])
                ->pluck('teacher_profile_id');

            $model = match ($type) {
                'educations' => TeacherEducation::whereIn('teacher_profile_id', $teacherProfileIds)->findOrFail($id),
                'courses' => TeacherCourse::whereIn('teacher_profile_id', $teacherProfileIds)->findOrFail($id),
                'certificates' => TeacherCertificate::whereIn('teacher_profile_id', $teacherProfileIds)->findOrFail($id),
                default => null,
            };

            if (! $model || ! $model->file_path || ! Storage::disk('local')->exists($model->file_path)) {
                return $this->errorResponse('Belge bulunamadı.', 404);
            }

            $mime = Storage::disk('local')->mimeType($model->file_path);

            return response(Storage::disk('local')->get($model->file_path), 200, [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Belge bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('Tenant belge sunumu hatası', ['type' => $type, 'id' => $id, 'error' => $e->getMessage()]);

            return $this->errorResponse('Belge sunulamadı.', 500);
        }
    }
}
