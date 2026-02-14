<?php

namespace App\Services;

use App\Models\School\School;
use App\Models\School\SchoolEnrollmentRequest;
use Illuminate\Database\Eloquent\Model;

/**
 * Veli Okul Kayıt Talebi Servisi
 *
 * Velilerin kayıt kodu ile okul arama ve kayıt talebi gönderme işlemleri.
 */
class EnrollmentRequestService extends BaseService
{
    protected function model(): string
    {
        return SchoolEnrollmentRequest::class;
    }

    /**
     * Kayıt kodu ile okul ara
     */
    public function searchByRegistrationCode(string $code): ?School
    {
        return School::findByRegistrationCode($code);
    }

    /**
     * Kayıt talebi oluştur
     */
    public function createRequest(array $data): Model
    {
        // Aynı okula mükerrer talep kontrolü
        $existing = SchoolEnrollmentRequest::where('school_id', $data['school_id'])
            ->where('user_id', $data['user_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            throw new \Exception('Bu okula zaten bir kayıt talebiniz mevcut veya onaylanmış.');
        }

        return $this->create($data);
    }

    /**
     * Talebi onayla
     */
    public function approveRequest(SchoolEnrollmentRequest $request, int $reviewerId): SchoolEnrollmentRequest
    {
        $request->approve($reviewerId);

        return $request->fresh();
    }

    /**
     * Talebi reddet
     */
    public function rejectRequest(SchoolEnrollmentRequest $request, int $reviewerId, string $reason): SchoolEnrollmentRequest
    {
        $request->reject($reviewerId, $reason);

        return $request->fresh();
    }

    /**
     * Okula ait bekleyen talepleri listele
     */
    public function pendingForSchool(int $schoolId)
    {
        return SchoolEnrollmentRequest::where('school_id', $schoolId)
            ->pending()
            ->with(['user', 'familyProfile'])
            ->latest()
            ->paginate(15);
    }

    /**
     * Filtreleme
     */
    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
    }
}
