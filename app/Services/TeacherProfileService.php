<?php

namespace App\Services;

use App\Models\School\TeacherProfile;
use App\Models\School\TeacherCertificate;
use App\Models\School\TeacherCourse;
use App\Models\School\TeacherEducation;
use App\Models\School\TeacherSkill;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * TeacherProfileService — Öğretmen Profil Yönetim Servisi
 *
 * Öğretmenin CV/özgeçmiş bileşenlerini yönetir:
 * eğitim, sertifika, kurs/seminer, yetenekler.
 * Sertifika ve kurs/seminer onay workflow'unu yönetir.
 */
class TeacherProfileService
{
    /*
    |--------------------------------------------------------------------------
    | PROFİL
    |--------------------------------------------------------------------------
    */

    /**
     * Öğretmen profil detayını tüm ilişkilerle getir
     */
    public function getFullProfile(int $profileId): ?TeacherProfile
    {
        return TeacherProfile::with([
            'user',
            'school',
            'country',
            'educations.country',
            'certificates',
            'courses',
            'skills',
            'classes',
        ])->find($profileId);
    }

    /**
     * Profil güncelle
     */
    public function updateProfile(TeacherProfile $profile, array $data): TeacherProfile
    {
        $profile->update($data);
        $profile->updateCompleteness();

        return $profile->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | EĞİTİM GEÇMİŞİ
    |--------------------------------------------------------------------------
    */

    /**
     * Eğitim geçmişi listele
     */
    public function listEducations(int $profileId, int $perPage = 10): LengthAwarePaginator
    {
        return TeacherEducation::where('teacher_profile_id', $profileId)
            ->with('country')
            ->orderByDesc('start_date')
            ->paginate($perPage);
    }

    /**
     * Eğitim ekle
     */
    public function addEducation(int $profileId, array $data): TeacherEducation
    {
        $data['teacher_profile_id'] = $profileId;

        $education = TeacherEducation::create($data);

        // Profil tamamlanma güncelle
        TeacherProfile::find($profileId)?->updateCompleteness();

        return $education;
    }

    /**
     * Eğitim güncelle
     */
    public function updateEducation(TeacherEducation $education, array $data): TeacherEducation
    {
        $education->update($data);

        return $education->fresh();
    }

    /**
     * Eğitim sil
     */
    public function deleteEducation(TeacherEducation $education): void
    {
        $profileId = $education->teacher_profile_id;
        $education->delete();

        TeacherProfile::find($profileId)?->updateCompleteness();
    }

    /*
    |--------------------------------------------------------------------------
    | SERTİFİKALAR (Onay gerektirir)
    |--------------------------------------------------------------------------
    */

    /**
     * Sertifikalar listele
     */
    public function listCertificates(int $profileId, ?string $status = null, int $perPage = 10): LengthAwarePaginator
    {
        $query = TeacherCertificate::forProfile($profileId)
            ->with('approvedBy')
            ->orderByDesc('issue_date');

        if ($status) {
            $query->where('approval_status', $status);
        }

        return $query->paginate($perPage);
    }

    /**
     * Sertifika ekle (otomatik pending durumunda)
     */
    public function addCertificate(int $profileId, array $data): TeacherCertificate
    {
        $data['teacher_profile_id'] = $profileId;
        $data['approval_status']    = 'pending'; // Her zaman beklemede başlar

        return TeacherCertificate::create($data);
    }

    /**
     * Sertifika güncelle (sadece pending iken güncellenebilir)
     */
    public function updateCertificate(TeacherCertificate $certificate, array $data): TeacherCertificate
    {
        // Onaylı/reddedilmiş sertifika düzenlenemez (tekrar pending yapılmalı)
        if (! $certificate->isPending()) {
            // Düzenleme yapılırsa yeniden onaya gider
            $data['approval_status']  = 'pending';
            $data['approved_by']      = null;
            $data['approved_at']      = null;
            $data['rejection_reason'] = null;
        }

        $certificate->update($data);

        return $certificate->fresh();
    }

    /**
     * Sertifika sil
     */
    public function deleteCertificate(TeacherCertificate $certificate): void
    {
        $profileId = $certificate->teacher_profile_id;
        $certificate->delete();

        TeacherProfile::find($profileId)?->updateCompleteness();
    }

    /**
     * Sertifikayı onayla (okul admin yetkisi)
     */
    public function approveCertificate(TeacherCertificate $certificate, int $userId): TeacherCertificate
    {
        $certificate->approve($userId);

        TeacherProfile::find($certificate->teacher_profile_id)?->updateCompleteness();

        return $certificate->fresh();
    }

    /**
     * Sertifikayı reddet (okul admin yetkisi)
     */
    public function rejectCertificate(TeacherCertificate $certificate, int $userId, string $reason): TeacherCertificate
    {
        $certificate->reject($userId, $reason);

        return $certificate->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | KURS & SEMİNER (Onay gerektirir)
    |--------------------------------------------------------------------------
    */

    /**
     * Kurs/Seminer listele
     */
    public function listCourses(int $profileId, ?string $status = null, ?string $type = null, int $perPage = 10): LengthAwarePaginator
    {
        $query = TeacherCourse::forProfile($profileId)
            ->with('approvedBy')
            ->orderByDesc('start_date');

        if ($status) {
            $query->where('approval_status', $status);
        }

        if ($type) {
            $query->where('type', $type);
        }

        return $query->paginate($perPage);
    }

    /**
     * Kurs/Seminer ekle (otomatik pending)
     */
    public function addCourse(int $profileId, array $data): TeacherCourse
    {
        $data['teacher_profile_id'] = $profileId;
        $data['approval_status']    = 'pending';

        return TeacherCourse::create($data);
    }

    /**
     * Kurs/Seminer güncelle
     */
    public function updateCourse(TeacherCourse $course, array $data): TeacherCourse
    {
        if (! $course->isPending()) {
            $data['approval_status']  = 'pending';
            $data['approved_by']      = null;
            $data['approved_at']      = null;
            $data['rejection_reason'] = null;
        }

        $course->update($data);

        return $course->fresh();
    }

    /**
     * Kurs/Seminer sil
     */
    public function deleteCourse(TeacherCourse $course): void
    {
        $profileId = $course->teacher_profile_id;
        $course->delete();

        TeacherProfile::find($profileId)?->updateCompleteness();
    }

    /**
     * Kurs/Seminer onayla
     */
    public function approveCourse(TeacherCourse $course, int $userId): TeacherCourse
    {
        $course->approve($userId);

        TeacherProfile::find($course->teacher_profile_id)?->updateCompleteness();

        return $course->fresh();
    }

    /**
     * Kurs/Seminer reddet
     */
    public function rejectCourse(TeacherCourse $course, int $userId, string $reason): TeacherCourse
    {
        $course->reject($userId, $reason);

        return $course->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | YETENEKLER
    |--------------------------------------------------------------------------
    */

    /**
     * Yetenekleri listele
     */
    public function listSkills(int $profileId, ?string $category = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = TeacherSkill::where('teacher_profile_id', $profileId)
            ->orderBy('category')
            ->orderByDesc('proficiency');

        if ($category) {
            $query->byCategory($category);
        }

        return $query->get();
    }

    /**
     * Yetenek ekle
     */
    public function addSkill(int $profileId, array $data): TeacherSkill
    {
        $data['teacher_profile_id'] = $profileId;

        $skill = TeacherSkill::create($data);

        TeacherProfile::find($profileId)?->updateCompleteness();

        return $skill;
    }

    /**
     * Yetenek güncelle
     */
    public function updateSkill(TeacherSkill $skill, array $data): TeacherSkill
    {
        $skill->update($data);

        return $skill->fresh();
    }

    /**
     * Yetenek sil
     */
    public function deleteSkill(TeacherSkill $skill): void
    {
        $profileId = $skill->teacher_profile_id;
        $skill->delete();

        TeacherProfile::find($profileId)?->updateCompleteness();
    }

    /*
    |--------------------------------------------------------------------------
    | ONAY İŞLEMLERİ — Toplu
    |--------------------------------------------------------------------------
    */

    /**
     * Bir okuldaki tüm onay bekleyen öğeleri getir
     */
    public function getPendingApprovals(int $schoolId, int $perPage = 20): LengthAwarePaginator
    {
        // Sertifikalar + kurslar birleşik sorgu (union)
        $profiles = TeacherProfile::where('school_id', $schoolId)->pluck('id');

        // Onay bekleyen sertifikalar
        $certificates = TeacherCertificate::whereIn('teacher_profile_id', $profiles)
            ->pending()
            ->with('teacherProfile.user')
            ->get()
            ->map(fn ($c) => [
                'id'        => $c->id,
                'type'      => 'certificate',
                'title'     => $c->name,
                'teacher'   => $c->teacherProfile->user->name ?? 'Bilinmiyor',
                'detail'    => $c->issuing_organization,
                'date'      => $c->issue_date?->format('Y-m-d'),
                'created_at' => $c->created_at,
            ]);

        // Onay bekleyen kurslar
        $courses = TeacherCourse::whereIn('teacher_profile_id', $profiles)
            ->pending()
            ->with('teacherProfile.user')
            ->get()
            ->map(fn ($c) => [
                'id'        => $c->id,
                'type'      => 'course',
                'title'     => $c->title,
                'teacher'   => $c->teacherProfile->user->name ?? 'Bilinmiyor',
                'detail'    => $c->provider . ' (' . $c->type_label . ')',
                'date'      => $c->start_date?->format('Y-m-d'),
                'created_at' => $c->created_at,
            ]);

        // Birleştir ve sırala
        $all = $certificates->merge($courses)->sortByDesc('created_at')->values();

        // Manuel sayfalama
        $page    = request()->input('page', 1);
        $items   = $all->forPage($page, $perPage);

        return new LengthAwarePaginator(
            $items,
            $all->count(),
            $perPage,
            $page,
            ['path' => request()->url()]
        );
    }

    /**
     * Toplu onay
     */
    public function bulkApprove(array $items, int $userId): array
    {
        $results = ['approved' => 0, 'errors' => 0];

        foreach ($items as $item) {
            try {
                if ($item['type'] === 'certificate') {
                    $cert = TeacherCertificate::find($item['id']);
                    if ($cert) {
                        $this->approveCertificate($cert, $userId);
                        $results['approved']++;
                    }
                } elseif ($item['type'] === 'course') {
                    $course = TeacherCourse::find($item['id']);
                    if ($course) {
                        $this->approveCourse($course, $userId);
                        $results['approved']++;
                    }
                }
            } catch (\Throwable $e) {
                $results['errors']++;
            }
        }

        return $results;
    }
}
