<?php

namespace App\Http\Controllers\Parents;

use App\Http\Resources\Parent\ParentSocialPostResource;
use App\Models\Child\Child;
use App\Models\School\School;
use App\Models\School\SchoolChildEnrollmentRequest;
use App\Models\School\SchoolEnrollmentRequest;
use App\Models\Social\SocialPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
     * Velinin okula kayıt edilebilecek çocuklarını listeler.
     * Başka bir okula kayıtlı olan veya bekleyen/onaylı talebi olan çocuklar dahil edilmez.
     */
    public function enrollableChildren(): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->successResponse([], 'Çocuklar listelendi.');
            }

            $enrolledChildIds = SchoolChildEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->whereIn('status', ['pending', 'approved'])
                ->pluck('child_id');

            $children = Child::withoutGlobalScope('tenant')
                ->where('family_profile_id', $familyProfile->id)
                ->whereNull('school_id')
                ->whereNotIn('id', $enrolledChildIds)
                ->get()
                ->map(fn ($child) => [
                    'id' => $child->id,
                    'first_name' => $child->first_name,
                    'last_name' => $child->last_name,
                    'full_name' => $child->first_name.' '.$child->last_name,
                    'birth_date' => $child->birth_date,
                    'gender' => $child->gender,
                ]);

            return $this->successResponse($children, 'Çocuklar listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::enrollableChildren Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Okula katılım talebi oluşturur (davet kodu veya invite token ile).
     * Çocuk seçimi zorunludur; bir çocuk yalnızca bir okula kaydedilebilir.
     * Aynı okul için pending/approved talep varsa yeni talep açılmaz.
     */
    public function joinSchool(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invite_token' => ['nullable', 'string'],
            'registration_code' => ['nullable', 'string'],
            'child_id' => ['required', 'integer'],
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
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            // Çocuk bu veliye ait mi?
            $child = Child::withoutGlobalScope('tenant')
                ->where('id', $data['child_id'])
                ->where('family_profile_id', $familyProfile->id)
                ->first();

            if (! $child) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            // Çocuk başka bir okula kayıtlı mı?
            if ($child->school_id) {
                return $this->errorResponse('Bu çocuk zaten bir okula kayıtlı. Bir çocuk yalnızca bir okulda olabilir.', 409);
            }

            // Çocuğun başka bir okula bekleyen/onaylı talebi var mı?
            $childExistingRequest = SchoolChildEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('child_id', $child->id)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($childExistingRequest) {
                return $this->errorResponse('Bu çocuk için zaten bir okul kaydı veya bekleyen bir talep bulunmaktadır.', 409);
            }

            // Aynı okul için zaten pending veya approved veli talebi var mı?
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

            DB::transaction(function () use ($school, $user, $familyProfile, $child, $data) {
                SchoolEnrollmentRequest::withoutGlobalScope('tenant')->create([
                    'school_id' => $school->id,
                    'user_id' => $user->id,
                    'family_profile_id' => $familyProfile->id,
                    'child_id' => $child->id,
                    'parent_name' => $user->name,
                    'parent_surname' => $user->surname,
                    'parent_email' => $user->email,
                    'parent_phone' => $user->phone,
                    'invite_token' => $data['invite_token'] ?? null,
                    'status' => 'pending',
                ]);

                SchoolChildEnrollmentRequest::create([
                    'school_id' => $school->id,
                    'child_id' => $child->id,
                    'family_profile_id' => $familyProfile->id,
                    'requested_by_user_id' => $user->id,
                    'status' => 'pending',
                ]);
            });

            return $this->successResponse(null, 'Okul kayıt talebiniz gönderildi. Onay bekleniyor.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::joinSchool Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Velinin bekleyen ve reddedilen okul başvurularını listeler.
     */
    public function myEnrollmentRequests(): JsonResponse
    {
        try {
            $user = $this->user();

            $requests = SchoolEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('user_id', $user->id)
                ->whereIn('status', ['pending', 'rejected'])
                ->with(['school:id,name,address,phone,logo'])
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($req) => [
                    'id' => $req->id,
                    'status' => $req->status,
                    'rejection_reason' => $req->rejection_reason,
                    'created_at' => $req->created_at,
                    'school' => $req->school ? [
                        'id' => $req->school->id,
                        'name' => $req->school->name,
                        'address' => $req->school->address ?? null,
                        'phone' => $req->school->phone ?? null,
                        'logo' => $req->school->logo ?? null,
                    ] : null,
                ]);

            return $this->successResponse($requests, 'Başvurular listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::myEnrollmentRequests Error', ['message' => $e->getMessage()]);

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
                return response()->json([
                    'success' => true,
                    'message' => 'Veriler başarıyla listelendi.',
                    'data' => [],
                    'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0],
                ]);
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
     * Çocuğu okula kayıt talebi gönder.
     * POST /parent/schools/{school}/enroll-child
     */
    public function enrollChild(Request $request, int $school): JsonResponse
    {
        $data = $request->validate([
            'child_id' => ['required', 'integer'],
        ]);

        try {
            // Velinin bu okula erişimi var mı?
            if (! $this->hasSchoolAccess($school)) {
                return $this->errorResponse('Bu okula erişim yetkiniz yok.', 403);
            }

            $familyProfile = $this->getFamilyProfile();
            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            // Co-parent çocuk kısıtlamalarına uygun erişim kontrolü
            $child = $this->findOwnedChild($data['child_id']);

            if (! $child) {
                return $this->errorResponse('Çocuk bulunamadı veya bu çocuğa erişim yetkiniz yok.', 404);
            }

            // Co-parent için okul kayıt izni kontrolü
            if ($this->isCoParentForChild($child) && ! $this->coParentHasPermission($child, 'can_enroll_child')) {
                return $this->errorResponse('Bu işlem için yetkiniz yok.', 403);
            }

            // Çocuk zaten bir okula kayıtlı mı?
            if ($child->school_id) {
                return $this->errorResponse('Bu çocuk zaten bir okula kayıtlı. Bir çocuk yalnızca bir okulda olabilir.', 409);
            }

            // Bu okul için zaten bir talep var mı?
            $existingRequest = SchoolChildEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('school_id', $school)
                ->where('child_id', $child->id)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existingRequest) {
                $message = $existingRequest->status === 'approved'
                    ? 'Bu çocuk zaten bu okula kayıtlı.'
                    : 'Bu çocuk için bu okula zaten bekleyen bir talep var.';

                return $this->errorResponse($message, 409);
            }

            $enrollmentRequest = SchoolChildEnrollmentRequest::create([
                'school_id' => $school,
                'child_id' => $child->id,
                'family_profile_id' => $familyProfile->id,
                'requested_by_user_id' => $this->user()->id,
                'status' => 'pending',
            ]);

            return $this->successResponse([
                'id' => $enrollmentRequest->id,
                'child_id' => $child->id,
                'child_name' => $child->first_name.' '.$child->last_name,
                'status' => 'pending',
            ], 'Çocuk kayıt talebiniz gönderildi. Okul onayı bekleniyor.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::enrollChild Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Velinin bir okul için gönderdiği çocuk kayıt taleplerini listele.
     * GET /parent/schools/{school}/child-enrollments
     */
    public function myChildEnrollments(int $school): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->successResponse([], 'Talepler listelendi.');
            }

            $requests = SchoolChildEnrollmentRequest::withoutGlobalScope('tenant')
                ->where('school_id', $school)
                ->where('family_profile_id', $familyProfile->id)
                ->with(['child' => fn ($q) => $q->withoutGlobalScope('tenant')])
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($req) => [
                    'id' => $req->id,
                    'status' => $req->status,
                    'rejection_reason' => $req->rejection_reason,
                    'created_at' => $req->created_at,
                    'child' => $req->child ? [
                        'id' => $req->child->id,
                        'first_name' => $req->child->first_name,
                        'last_name' => $req->child->last_name,
                        'full_name' => $req->child->first_name.' '.$req->child->last_name,
                        'birth_date' => $req->child->birth_date,
                        'gender' => $req->child->gender,
                    ] : null,
                ]);

            return $this->successResponse($requests, 'Talepler listelendi.');
        } catch (\Throwable $e) {
            Log::error('ParentSchoolController::myChildEnrollments Error', ['message' => $e->getMessage()]);

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
