<?php

namespace App\Http\Controllers\Parents;

use App\Http\Resources\Parent\ParentSocialPostResource;
use App\Models\School\School;
use App\Models\School\SchoolEnrollmentRequest;
use App\Models\Social\SocialPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ParentSchoolController extends BaseParentController
{
    /**
     * Velinin kayıtlı olduğu okullar.
     */
    public function mySchools(): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->successResponse([], 'Okullar listelendi.');
            }

            $schools = $familyProfile->schools()
                ->withoutGlobalScope('tenant')
                ->wherePivot('is_active', true)
                ->get()
                ->map(fn ($school) => [
                    'id' => $school->id,
                    'name' => $school->name,
                    'type' => $school->type ?? null,
                    'address' => $school->address ?? null,
                    'phone' => $school->phone ?? null,
                    'logo' => $school->logo ?? null,
                    'joined_at' => $school->pivot->joined_at,
                ]);

            return $this->successResponse($schools, 'Okullar listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::mySchools Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Okul detayı.
     */
    public function schoolDetail(int $school): JsonResponse
    {
        try {
            if (! $this->hasSchoolAccess($school)) {
                return $this->errorResponse('Bu okula erişim yetkiniz yok.', 403);
            }

            $schoolModel = School::withoutGlobalScope('tenant')
                ->with(['academicYears' => fn ($q) => $q->where('is_current', true)])
                ->find($school);

            if (! $schoolModel) {
                return $this->errorResponse('Okul bulunamadı.', 404);
            }

            $currentYear = $schoolModel->academicYears->first();

            return $this->successResponse([
                'id' => $schoolModel->id,
                'name' => $schoolModel->name,
                'type' => $schoolModel->type ?? null,
                'address' => $schoolModel->address ?? null,
                'phone' => $schoolModel->phone ?? null,
                'email' => $schoolModel->email ?? null,
                'logo' => $schoolModel->logo ?? null,
                'current_academic_year' => $currentYear ? [
                    'id' => $currentYear->id,
                    'name' => $currentYear->name,
                    'start_date' => $currentYear->start_date,
                    'end_date' => $currentYear->end_date,
                ] : null,
            ], 'Okul detayı.');
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::schoolDetail Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Okula katılım talebi oluşturur (davet kodu veya invite token ile).
     * Aynı okul için pending/approved talep varsa yeni talep açılmaz.
     */
    public function joinSchool(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invite_token' => ['nullable', 'string'],
            'registration_code' => ['nullable', 'string'],
        ]);

        try {
            if (empty($data['invite_token']) && empty($data['registration_code'])) {
                return $this->errorResponse('Davet tokeni veya kayıt kodu gereklidir.', 422);
            }

            $schoolQuery = School::withoutGlobalScope('tenant');

            $school = ! empty($data['invite_token'])
                ? $schoolQuery->where('invite_token', $data['invite_token'])->first()
                : $schoolQuery->where('registration_code', $data['registration_code'])->first();

            if (! $school) {
                return $this->errorResponse('Geçersiz davet kodu veya token.', 404);
            }

            $user = $this->user();

            // Aynı okul için zaten pending veya approved talep var mı?
            $existingRequest = SchoolEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('school_id', $school->id)
                ->where('user_id', $user->id)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existingRequest) {
                $message = $existingRequest->status === 'approved'
                    ? 'Bu okula zaten kayıtlısınız.'
                    : 'Bu okul için zaten bekleyen bir başvurunuz bulunmaktadır.';

                return $this->errorResponse($message, 409);
            }

            SchoolEnrollmentRequest::withoutGlobalScope('tenant')->create([
                'school_id' => $school->id,
                'user_id' => $user->id,
                'parent_name' => $user->name,
                'parent_surname' => $user->surname,
                'parent_email' => $user->email,
                'parent_phone' => $user->phone,
                'invite_token' => $data['invite_token'] ?? null,
                'status' => 'pending',
            ]);

            return $this->successResponse(null, 'Okul kayıt talebiniz gönderildi. Onay bekleniyor.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::joinSchool Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Okul sosyal akışı (sadece kayıtlı veli erişebilir).
     */
    public function socialFeed(int $school): JsonResponse
    {
        try {
            if (! $this->hasSchoolAccess($school)) {
                return $this->errorResponse('Bu okula erişim yetkiniz yok.', 403);
            }

            $posts = SocialPost::withoutGlobalScope('tenant')
                ->where('school_id', $school)
                ->with(['author', 'media', 'reactions', 'comments'])
                ->orderByDesc('is_pinned')
                ->orderByDesc('published_at')
                ->paginate(20);

            return $this->paginatedResponse(
                ParentSocialPostResource::collection($posts)
            );
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::socialFeed Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Global akış (tüm kayıtlı veliler erişebilir).
     */
    public function globalFeed(): JsonResponse
    {
        try {
            $posts = SocialPost::withoutGlobalScope('tenant')
                ->where('is_global', true)
                ->with(['author', 'media', 'reactions', 'comments'])
                ->orderByDesc('is_pinned')
                ->orderByDesc('published_at')
                ->paginate(20);

            return $this->paginatedResponse(
                ParentSocialPostResource::collection($posts)
            );
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::globalFeed Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Velinin kayıtlı olduğu tüm okulların birleşik sosyal akışı.
     */
    public function mySchoolsFeed(): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->paginatedResponse(
                    ParentSocialPostResource::collection(collect())
                );
            }

            $schoolIds = $familyProfile->schools()
                ->withoutGlobalScope('tenant')
                ->wherePivot('is_active', true)
                ->pluck('schools.id');

            $posts = SocialPost::withoutGlobalScope('tenant')
                ->whereIn('school_id', $schoolIds)
                ->with(['author', 'media', 'reactions', 'comments'])
                ->orderByDesc('is_pinned')
                ->orderByDesc('published_at')
                ->paginate(20);

            return $this->paginatedResponse(
                ParentSocialPostResource::collection($posts)
            );
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::mySchoolsFeed Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Velinin (owner veya co-parent) belirtilen okula erişim hakkı var mı?
     */
    private function hasSchoolAccess(int $schoolId): bool
    {
        $familyProfile = $this->getFamilyProfile();

        if (! $familyProfile) {
            return false;
        }

        return $familyProfile->schools()
            ->withoutGlobalScope('tenant')
            ->wherePivot('is_active', true)
            ->where('schools.id', $schoolId)
            ->exists();
    }
}
