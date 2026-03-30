<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\TeacherCertificate;
use App\Models\School\TeacherCourse;
use App\Services\TeacherProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * TeacherApprovalController — Öğretmen Onay İşlemleri (Okul Admin)
 *
 * Okul yöneticisinin öğretmen sertifika ve kurs/seminer onay/red işlemleri.
 * Workflow: Öğretmen ekler → pending → Okul admin onaylar/reddeder
 */
class TeacherApprovalController extends BaseController
{
    public function __construct(
        private readonly TeacherProfileService $teacherProfileService
    ) {}

    /**
     * Onay bekleyen tüm öğeleri listele (okul bazında)
     */
    public function pendingApprovals(Request $request): JsonResponse
    {
        try {
            $user = $this->user();

            // Kullanıcının yönettiği okul(lar)ı bul
            $schoolId = $request->input('school_id');
            if (! $schoolId) {
                return $this->errorResponse('Okul ID\'si gereklidir.', 422);
            }

            $approvals = $this->teacherProfileService->getPendingApprovals(
                (int) $schoolId,
                $request->integer('per_page', 20)
            );

            return $this->paginatedResponse($approvals);
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
            $certificate = TeacherCertificate::with('teacherProfile')->findOrFail($certificateId);

            if (! $certificate->isPending()) {
                return $this->errorResponse('Bu sertifika zaten işlem görmüş.', 422);
            }

            DB::beginTransaction();
            $certificate = $this->teacherProfileService->approveCertificate($certificate, $this->user()->id);
            DB::commit();

            return $this->successResponse($certificate, 'Sertifika onaylandı.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Sertifika onay hatası', ['id' => $certificateId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Onay işlemi başarısız.', 500);
        }
    }

    /**
     * Sertifika reddet
     */
    public function rejectCertificate(Request $request, int $certificateId): JsonResponse
    {
        try {
            $request->validate([
                'rejection_reason' => 'required|string|max:1000',
            ]);

            $certificate = TeacherCertificate::with('teacherProfile')->findOrFail($certificateId);

            if (! $certificate->isPending()) {
                return $this->errorResponse('Bu sertifika zaten işlem görmüş.', 422);
            }

            DB::beginTransaction();
            $certificate = $this->teacherProfileService->rejectCertificate(
                $certificate,
                $this->user()->id,
                $request->input('rejection_reason')
            );
            DB::commit();

            return $this->successResponse($certificate, 'Sertifika reddedildi.');
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
            $course = TeacherCourse::with('teacherProfile')->findOrFail($courseId);

            if (! $course->isPending()) {
                return $this->errorResponse('Bu kurs/seminer zaten işlem görmüş.', 422);
            }

            DB::beginTransaction();
            $course = $this->teacherProfileService->approveCourse($course, $this->user()->id);
            DB::commit();

            return $this->successResponse($course, 'Kurs/Seminer onaylandı.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Kurs onay hatası', ['id' => $courseId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Onay işlemi başarısız.', 500);
        }
    }

    /**
     * Kurs/Seminer reddet
     */
    public function rejectCourse(Request $request, int $courseId): JsonResponse
    {
        try {
            $request->validate([
                'rejection_reason' => 'required|string|max:1000',
            ]);

            $course = TeacherCourse::with('teacherProfile')->findOrFail($courseId);

            if (! $course->isPending()) {
                return $this->errorResponse('Bu kurs/seminer zaten işlem görmüş.', 422);
            }

            DB::beginTransaction();
            $course = $this->teacherProfileService->rejectCourse(
                $course,
                $this->user()->id,
                $request->input('rejection_reason')
            );
            DB::commit();

            return $this->successResponse($course, 'Kurs/Seminer reddedildi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Kurs red hatası', ['id' => $courseId, 'error' => $e->getMessage()]);

            return $this->errorResponse('Red işlemi başarısız.', 500);
        }
    }

    /**
     * Toplu onay
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'items'        => 'required|array|min:1|max:50',
                'items.*.id'   => 'required|integer',
                'items.*.type' => 'required|in:certificate,course',
            ]);

            DB::beginTransaction();
            $results = $this->teacherProfileService->bulkApprove(
                $request->input('items'),
                $this->user()->id
            );
            DB::commit();

            return $this->successResponse($results, "{$results['approved']} öğe onaylandı.");
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Toplu onay hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Toplu onay işlemi başarısız.', 500);
        }
    }
}
