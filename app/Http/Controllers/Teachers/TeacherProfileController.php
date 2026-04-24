<?php

namespace App\Http\Controllers\Teachers;

use App\Http\Resources\TeacherProfileResource;
use App\Models\School\TeacherCertificate;
use App\Models\School\TeacherCourse;
use App\Models\School\TeacherCredentialTenantApproval;
use App\Models\School\TeacherEducation;
use App\Models\School\TeacherSkill;
use App\Models\School\TeacherTenantMembership;
use App\Services\TeacherProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * TeacherProfileController — Öğretmen Profil Yönetimi
 *
 * Öğretmenin kendi profilini yönetmesi için:
 * CV/özgeçmiş, eğitim, sertifika, kurs/seminer, yetenek.
 */
class TeacherProfileController extends BaseTeacherController
{
    public function __construct(
        private readonly TeacherProfileService $teacherProfileService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | PROFİL
    |--------------------------------------------------------------------------
    */

    /**
     * Kendi profilimi getir (tüm ilişkilerle)
     */
    public function myProfile(): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $fullProfile = $this->teacherProfileService->getFullProfile($profile->id);

            return $this->successResponse(new TeacherProfileResource($fullProfile));
        } catch (\Throwable $e) {
            Log::error('Profil getirme hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Profil bulunamadı.', 404);
        }
    }

    /**
     * Profilimi güncelle
     */
    public function updateMyProfile(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $validated = $request->validate([
                'title' => 'nullable|string|max:20',
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other,prefer_not_to_say',
                'nationality' => 'nullable|string|max:255',
                'country_id' => 'nullable|exists:countries,id',
                'bio' => 'nullable|string|max:5000',
                'education_summary' => 'nullable|string|max:5000',
                'experience_years' => 'nullable|integer|min:0|max:60',
                'specialization' => 'nullable|string|max:255',
                'linkedin_url' => 'nullable|url|max:255',
                'website_url' => 'nullable|url|max:255',
                'languages' => 'nullable|array',
            ]);

            DB::beginTransaction();
            $profile = $this->teacherProfileService->updateProfile($profile, $validated);
            DB::commit();

            return $this->successResponse(new TeacherProfileResource($profile), 'Profil güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Profil güncelleme hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Profil güncellenemedi.', 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EĞİTİM GEÇMİŞİ
    |--------------------------------------------------------------------------
    */

    /**
     * Eğitim geçmişimi listele
     */
    public function educations(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $educations = $this->teacherProfileService->listEducations(
                $profile->id,
                $request->integer('per_page', 10)
            );

            return $this->paginatedResponse($educations);
        } catch (\Throwable $e) {
            return $this->errorResponse('Eğitim geçmişi alınamadı.', 500);
        }
    }

    /**
     * Eğitim ekle
     */
    public function storeEducation(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $validated = $request->validate([
                'institution' => 'required|string|max:255',
                'degree' => 'required|string|max:50',
                'field_of_study' => 'required|string|max:255',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'is_current' => 'nullable|boolean',
                'gpa' => 'nullable|numeric|min:0|max:4',
                'description' => 'nullable|string|max:2000',
                'country_id' => 'nullable|exists:countries,id',
            ]);

            DB::beginTransaction();
            $education = $this->teacherProfileService->addEducation($profile->id, $validated);
            DB::commit();

            return $this->successResponse($education, 'Eğitim bilgisi eklendi.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Eğitim ekleme hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Eğitim bilgisi eklenemedi.', 500);
        }
    }

    /**
     * Eğitim güncelle
     */
    public function updateEducation(Request $request, int $educationId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $education = TeacherEducation::where('teacher_profile_id', $profile->id)
                ->findOrFail($educationId);

            $validated = $request->validate([
                'institution' => 'sometimes|string|max:255',
                'degree' => 'sometimes|string|max:50',
                'field_of_study' => 'sometimes|string|max:255',
                'start_date' => 'sometimes|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'is_current' => 'nullable|boolean',
                'gpa' => 'nullable|numeric|min:0|max:4',
                'description' => 'nullable|string|max:2000',
                'country_id' => 'nullable|exists:countries,id',
            ]);

            DB::beginTransaction();
            $education = $this->teacherProfileService->updateEducation($education, $validated);
            DB::commit();

            return $this->successResponse($education, 'Eğitim bilgisi güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Eğitim bilgisi güncellenemedi.', 500);
        }
    }

    /**
     * Eğitim sil
     */
    public function destroyEducation(int $educationId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $education = TeacherEducation::where('teacher_profile_id', $profile->id)
                ->findOrFail($educationId);

            DB::beginTransaction();
            $this->teacherProfileService->deleteEducation($education);
            DB::commit();

            return $this->successResponse(null, 'Eğitim bilgisi silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Eğitim bilgisi silinemedi.', 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SERTİFİKALAR
    |--------------------------------------------------------------------------
    */

    /**
     * Sertifikalarımı listele
     */
    public function certificates(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $certificates = $this->teacherProfileService->listCertificates(
                $profile->id,
                $request->input('status'),
                $request->integer('per_page', 10)
            );

            return $this->paginatedResponse($certificates);
        } catch (\Throwable $e) {
            return $this->errorResponse('Sertifikalar alınamadı.', 500);
        }
    }

    /**
     * Sertifika ekle (pending olarak oluşturulur)
     */
    public function storeCertificate(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'issuing_organization' => 'required|string|max:255',
                'issue_date' => 'required|date',
                'expiry_date' => 'nullable|date|after_or_equal:issue_date',
                'credential_id' => 'nullable|string|max:255',
                'credential_url' => 'nullable|url|max:500',
                'description' => 'nullable|string|max:2000',
            ]);

            DB::beginTransaction();
            $certificate = $this->teacherProfileService->addCertificate($profile->id, $validated);
            DB::commit();

            return $this->successResponse($certificate, 'Sertifika eklendi, okul onayı bekleniyor.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Sertifika ekleme hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Sertifika eklenemedi.', 500);
        }
    }

    /**
     * Sertifika güncelle
     */
    public function updateCertificate(Request $request, int $certificateId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $certificate = TeacherCertificate::where('teacher_profile_id', $profile->id)
                ->findOrFail($certificateId);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'issuing_organization' => 'sometimes|string|max:255',
                'issue_date' => 'sometimes|date',
                'expiry_date' => 'nullable|date|after_or_equal:issue_date',
                'credential_id' => 'nullable|string|max:255',
                'credential_url' => 'nullable|url|max:500',
                'description' => 'nullable|string|max:2000',
            ]);

            DB::beginTransaction();
            $certificate = $this->teacherProfileService->updateCertificate($certificate, $validated);
            DB::commit();

            $message = $certificate->isPending()
                ? 'Sertifika güncellendi, yeniden onay bekleniyor.'
                : 'Sertifika güncellendi.';

            return $this->successResponse($certificate, $message);
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Sertifika güncellenemedi.', 500);
        }
    }

    /**
     * Sertifika sil
     */
    public function destroyCertificate(int $certificateId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $certificate = TeacherCertificate::where('teacher_profile_id', $profile->id)
                ->findOrFail($certificateId);

            DB::beginTransaction();
            $this->teacherProfileService->deleteCertificate($certificate);
            DB::commit();

            return $this->successResponse(null, 'Sertifika silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Sertifika silinemedi.', 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | KURS & SEMİNER
    |--------------------------------------------------------------------------
    */

    /**
     * Kurslarımı listele
     */
    public function courses(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $courses = $this->teacherProfileService->listCourses(
                $profile->id,
                $request->input('status'),
                $request->input('type'),
                $request->integer('per_page', 10)
            );

            return $this->paginatedResponse($courses);
        } catch (\Throwable $e) {
            return $this->errorResponse('Kurslar alınamadı.', 500);
        }
    }

    /**
     * Kurs/Seminer ekle (pending olarak oluşturulur)
     */
    public function storeCourse(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'type' => 'required|in:course,seminar,workshop,conference,training,webinar,other',
                'provider' => 'required|string|max:255',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'duration_hours' => 'nullable|integer|min:1|max:9999',
                'location' => 'nullable|string|max:255',
                'is_online' => 'nullable|boolean',
                'certificate_url' => 'nullable|url|max:500',
                'description' => 'nullable|string|max:2000',
            ]);

            DB::beginTransaction();
            $course = $this->teacherProfileService->addCourse($profile->id, $validated);
            DB::commit();

            return $this->successResponse($course, 'Kurs/Seminer eklendi, okul onayı bekleniyor.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Kurs ekleme hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Kurs/Seminer eklenemedi.', 500);
        }
    }

    /**
     * Kurs/Seminer güncelle
     */
    public function updateCourse(Request $request, int $courseId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $course = TeacherCourse::where('teacher_profile_id', $profile->id)
                ->findOrFail($courseId);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'type' => 'sometimes|in:course,seminar,workshop,conference,training,webinar,other',
                'provider' => 'sometimes|string|max:255',
                'start_date' => 'sometimes|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'duration_hours' => 'nullable|integer|min:1|max:9999',
                'location' => 'nullable|string|max:255',
                'is_online' => 'nullable|boolean',
                'certificate_url' => 'nullable|url|max:500',
                'description' => 'nullable|string|max:2000',
            ]);

            DB::beginTransaction();
            $course = $this->teacherProfileService->updateCourse($course, $validated);
            DB::commit();

            return $this->successResponse($course, 'Kurs/Seminer güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Kurs/Seminer güncellenemedi.', 500);
        }
    }

    /**
     * Kurs/Seminer sil
     */
    public function destroyCourse(int $courseId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $course = TeacherCourse::where('teacher_profile_id', $profile->id)
                ->findOrFail($courseId);

            DB::beginTransaction();
            $this->teacherProfileService->deleteCourse($course);
            DB::commit();

            return $this->successResponse(null, 'Kurs/Seminer silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Kurs/Seminer silinemedi.', 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | YETENEKLER
    |--------------------------------------------------------------------------
    */

    /**
     * Yeteneklerimi listele
     */
    public function skills(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $skills = $this->teacherProfileService->listSkills(
                $profile->id,
                $request->input('category')
            );

            return $this->successResponse($skills);
        } catch (\Throwable $e) {
            return $this->errorResponse('Yetenekler alınamadı.', 500);
        }
    }

    /**
     * Yetenek ekle
     */
    public function storeSkill(Request $request): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'level' => 'required|in:beginner,intermediate,advanced,expert',
                'category' => 'required|in:language,technology,pedagogy,art,sport,music,science,other',
                'proficiency' => 'nullable|integer|min:0|max:100',
            ]);

            DB::beginTransaction();
            $skill = $this->teacherProfileService->addSkill($profile->id, $validated);
            DB::commit();

            return $this->successResponse($skill, 'Yetenek eklendi.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Yetenek eklenemedi.', 500);
        }
    }

    /**
     * Yetenek güncelle
     */
    public function updateSkill(Request $request, int $skillId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $skill = TeacherSkill::where('teacher_profile_id', $profile->id)
                ->findOrFail($skillId);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:100',
                'level' => 'sometimes|in:beginner,intermediate,advanced,expert',
                'category' => 'sometimes|in:language,technology,pedagogy,art,sport,music,science,other',
                'proficiency' => 'nullable|integer|min:0|max:100',
            ]);

            DB::beginTransaction();
            $skill = $this->teacherProfileService->updateSkill($skill, $validated);
            DB::commit();

            return $this->successResponse($skill, 'Yetenek güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Yetenek güncellenemedi.', 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ONAY DURUMLARI
    |--------------------------------------------------------------------------
    */

    /**
     * Sertifikanın tüm tenant onay durumlarını getir
     */
    public function certificateApprovals(int $certificateId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            TeacherCertificate::where('teacher_profile_id', $profile->id)->findOrFail($certificateId);

            return $this->successResponse($this->buildApprovalStatus('certificate', $certificateId, $profile->id));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Sertifika bulunamadı.', 404);
        } catch (\Throwable $e) {
            return $this->errorResponse('Onay durumları alınamadı.', 500);
        }
    }

    /**
     * Kursun tüm tenant onay durumlarını getir
     */
    public function courseApprovals(int $courseId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            TeacherCourse::where('teacher_profile_id', $profile->id)->findOrFail($courseId);

            return $this->successResponse($this->buildApprovalStatus('course', $courseId, $profile->id));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Kurs bulunamadı.', 404);
        } catch (\Throwable $e) {
            return $this->errorResponse('Onay durumları alınamadı.', 500);
        }
    }

    /**
     * Öğretmenin aktif tenant üyeliklerini + credential'ın bu tenantlardaki onay durumunu döner
     *
     * @return array<int, array{tenant_id: int, tenant_name: string, status: string, rejection_reason: string|null, reviewed_at: string|null}>
     */
    private function buildApprovalStatus(string $type, int $credentialId, int $profileId): array
    {
        $memberships = TeacherTenantMembership::where('teacher_profile_id', $profileId)
            ->whereIn('status', ['active', 'inactive'])
            ->with('tenant')
            ->get();

        $approvals = TeacherCredentialTenantApproval::where('credential_type', $type)
            ->where('credential_id', $credentialId)
            ->whereIn('tenant_id', $memberships->pluck('tenant_id'))
            ->with('reviewer')
            ->get()
            ->keyBy('tenant_id');

        return $memberships->map(function ($m) use ($approvals) {
            $approval = $approvals->get($m->tenant_id);

            return [
                'tenant_id' => $m->tenant_id,
                'tenant_name' => $m->tenant?->name ?? 'Kurum',
                'membership_status' => $m->status,
                'status' => $approval?->status ?? 'pending',
                'rejection_reason' => $approval?->rejection_reason,
                'reviewed_at' => $approval?->reviewed_at?->toDateTimeString(),
                'reviewed_by' => $approval?->reviewer
                    ? trim(($approval->reviewer->name ?? '').' '.($approval->reviewer->surname ?? ''))
                    : null,
            ];
        })->values()->all();
    }

    /**
     * Yetenek sil
     */
    public function destroySkill(int $skillId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            $skill = TeacherSkill::where('teacher_profile_id', $profile->id)
                ->findOrFail($skillId);

            DB::beginTransaction();
            $this->teacherProfileService->deleteSkill($skill);
            DB::commit();

            return $this->successResponse(null, 'Yetenek silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Yetenek silinemedi.', 500);
        }
    }
}
