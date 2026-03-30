<?php

namespace App\Services;

use App\Models\Academic\AcademicYear;
use App\Models\Academic\SchoolClass;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Eğitim Yılı Servisi
 *
 * Eğitim yılı CRUD, sınıf yönetimi ve yeni eğitim yılına geçiş işlemleri.
 */
class AcademicYearService extends BaseService
{
    protected function model(): string
    {
        return AcademicYear::class;
    }

    /**
     * Okula ait eğitim yıllarını listele
     */
    public function listForSchool(int $schoolId, int $perPage = 15): LengthAwarePaginator
    {
        return AcademicYear::forSchool($schoolId)
            ->withCount('classes')
            ->latest('start_date')
            ->paginate($perPage);
    }

    /**
     * Okulun güncel eğitim yılını getir
     */
    public function getCurrentYear(int $schoolId): ?AcademicYear
    {
        return AcademicYear::forSchool($schoolId)
            ->current()
            ->with(['classes' => function ($q) {
                $q->withCount('children');
            }])
            ->first();
    }

    /**
     * Yeni eğitim yılı oluştur
     */
    public function createYear(array $data): AcademicYear
    {
        // Eğer is_current true ise, diğer yılların is_current'ını kaldır
        if ($data['is_current'] ?? false) {
            AcademicYear::where('school_id', $data['school_id'])
                ->update(['is_current' => false]);
        }

        return AcademicYear::create($data);
    }

    /**
     * Eğitim yılını güncelle
     */
    public function updateYear(AcademicYear $year, array $data): AcademicYear
    {
        if ($data['is_current'] ?? false) {
            AcademicYear::where('school_id', $year->school_id)
                ->where('id', '!=', $year->id)
                ->update(['is_current' => false]);
        }

        $year->update($data);

        return $year->fresh();
    }

    /**
     * Eğitim yılını aktif/güncel olarak ayarla
     */
    public function setAsCurrent(AcademicYear $year): AcademicYear
    {
        return $year->makeCurrent();
    }

    /**
     * Eğitim yılını kapat
     */
    public function closeYear(AcademicYear $year): AcademicYear
    {
        return $year->close();
    }

    /**
     * Yeni eğitim yılına geçiş yap
     *
     * 1. Mevcut eğitim yılını kapat
     * 2. Yeni eğitim yılı oluştur
     * 3. Opsiyonel: Mevcut sınıfları yeni yıla kopyala
     */
    public function transition(int $schoolId, array $newYearData, bool $copyClasses = false): AcademicYear
    {
        // Mevcut aktif yılı kapat
        $currentYear = $this->getCurrentYear($schoolId);
        if ($currentYear) {
            $currentYear->close();
        }

        // Yeni yılı oluştur ve aktif yap
        $newYearData['school_id'] = $schoolId;
        $newYearData['is_current'] = true;
        $newYearData['is_active'] = true;

        $newYear = AcademicYear::create($newYearData);

        // Sınıfları kopyala (isteğe bağlı)
        if ($copyClasses && $currentYear) {
            $this->copyClassesToNewYear($currentYear, $newYear);
        }

        return $newYear->load('classes');
    }

    /**
     * Mevcut eğitim yılındaki sınıfları yeni eğitim yılına kopyala
     * Öğrenciler ve öğretmenler kopyalanmaz, sadece sınıf yapısı
     */
    protected function copyClassesToNewYear(AcademicYear $fromYear, AcademicYear $toYear): void
    {
        $fromYear->classes->each(function ($class) use ($toYear) {
            SchoolClass::create([
                'school_id' => $class->school_id,
                'academic_year_id' => $toYear->id,
                'name' => $class->name,
                'color' => $class->color,
                'logo' => $class->logo,
                'capacity' => $class->capacity,
                'created_by' => $toYear->created_by,
            ]);
        });
    }

    /**
     * Eğitim yılına sınıf ekle
     */
    public function addClass(AcademicYear $year, array $classData): SchoolClass
    {
        $classData['academic_year_id'] = $year->id;
        $classData['school_id'] = $year->school_id;

        return SchoolClass::create($classData);
    }

    /**
     * Eğitim yılından sınıf kaldır
     */
    public function removeClass(AcademicYear $year, int $classId): bool
    {
        $class = SchoolClass::where('academic_year_id', $year->id)
            ->where('id', $classId)
            ->firstOrFail();

        return $class->delete();
    }

    /**
     * Eğitim yılı istatistikleri
     */
    public function getStats(AcademicYear $year): array
    {
        return [
            'total_classes' => $year->totalClasses(),
            'total_students' => $year->totalStudents(),
            'total_activities' => $year->activities()->count(),
            'total_events' => $year->events()->count(),
            'total_homework' => $year->homework()->count(),
            'is_ongoing' => $year->isOngoing(),
            'is_completed' => $year->isCompleted(),
            'is_upcoming' => $year->isUpcoming(),
        ];
    }
}
