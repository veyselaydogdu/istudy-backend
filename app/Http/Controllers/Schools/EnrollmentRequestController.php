<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\EnrollmentRequestResource;
use App\Models\School\School;
use App\Models\School\SchoolEnrollmentRequest;
use App\Services\EnrollmentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Veli Okul Kayıt Talebi Controller
 *
 * Velilerin kayıt kodu / davet linki ile okul bulma ve talep gönderme.
 * Okul yöneticilerinin talep onay/red işlemleri.
 * Onay → User + FamilyProfile oluşturulur + school_family_assignments kaydı açılır.
 */
class EnrollmentRequestController extends BaseController
{
    public function __construct(
        protected EnrollmentRequestService $service
    ) {}

    // ──────────────────────────────────────────────────────────────
    // HERKESE AÇIK (Auth gerekmez)
    // ──────────────────────────────────────────────────────────────

    /**
     * Kayıt kodu ile okul ara (anonim)
     */
    public function searchSchool(Request $request): JsonResponse
    {
        $request->validate(['registration_code' => ['required', 'string', 'min:4']]);

        try {
            $school = $this->service->searchByRegistrationCode($request->registration_code);

            if (! $school) {
                return $this->errorResponse('Okul bulunamadı. Kayıt kodunu kontrol ediniz.', 404);
            }

            return $this->successResponse([
                'id' => $school->id,
                'name' => $school->name,
                'address' => $school->address,
                'city' => $school->city,
                'logo' => $school->logo ?? null,
            ], 'Okul bulundu.');
        } catch (\Throwable $e) {
            Log::error('EnrollmentRequestController::searchSchool Error: '.$e->getMessage());

            return $this->errorResponse('Okul araması sırasında bir hata oluştu.', 500);
        }
    }

    /**
     * Davet linki bilgisi — token ile okul bilgisini döndür (anonim)
     * GET /invite/{token}
     */
    public function inviteInfo(string $token): JsonResponse
    {
        try {
            $school = $this->service->findSchoolByInviteToken($token);

            if (! $school) {
                return $this->errorResponse('Geçersiz veya süresi dolmuş davet linki.', 404);
            }

            return $this->successResponse([
                'id' => $school->id,
                'name' => $school->name,
                'address' => $school->address,
                'city' => $school->city,
                'logo' => $school->logo ?? null,
            ], 'Davet bilgisi.');
        } catch (\Throwable $e) {
            Log::error('EnrollmentRequestController::inviteInfo Error: '.$e->getMessage());

            return $this->errorResponse('Bir hata oluştu.', 500);
        }
    }

    /**
     * Anonim veli kayıt talebi gönder
     * POST /schools/join
     * code (registration_code) veya invite_token + parent bilgileri
     */
    public function publicJoin(Request $request): JsonResponse
    {
        $request->validate([
            'registration_code' => ['nullable', 'string'],
            'invite_token' => ['nullable', 'string'],
            'parent_name' => ['required', 'string', 'max:100'],
            'parent_surname' => ['required', 'string', 'max:100'],
            'parent_email' => ['required', 'email', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        if (! $request->registration_code && ! $request->invite_token) {
            return $this->errorResponse('Kayıt kodu veya davet linki gereklidir.', 422);
        }

        DB::beginTransaction();
        try {
            $request_model = $this->service->createPublicRequest($request->only([
                'registration_code', 'invite_token',
                'parent_name', 'parent_surname', 'parent_email', 'parent_phone', 'message',
            ]));

            DB::commit();

            return $this->successResponse([
                'id' => $request_model->id,
                'status' => $request_model->status,
            ], 'Kayıt talebiniz gönderildi. Okul yönetiminin onayını bekleyiniz.', 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('EnrollmentRequestController::publicJoin Error: '.$e->getMessage());

            return $this->errorResponse('Talep gönderilemedi.', 500);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // AUTH GEREKLİ — Veli tarafı (kendi taleplerim)
    // ──────────────────────────────────────────────────────────────

    /**
     * Veli kendi taleplerini gönder (kayıtlı kullanıcı)
     * POST /parent/enrollment-requests
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        DB::beginTransaction();
        try {
            $enrollmentRequest = $this->service->createRequest([
                'school_id' => $request->school_id,
                'user_id' => $this->user()->id,
                'message' => $request->message,
                'status' => 'pending',
                'created_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse(
                new EnrollmentRequestResource($enrollmentRequest),
                'Kayıt talebiniz gönderildi. Okul yönetiminin onayını bekleyiniz.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('EnrollmentRequestController::store Error: '.$e->getMessage());

            return $this->errorResponse('Talep gönderilemedi.', 500);
        }
    }

    /**
     * Veli kendi taleplerini listele
     * GET /parent/enrollment-requests
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = array_merge(
                $request->only(['school_id', 'status']),
                ['user_id' => $this->user()->id]
            );
            $requests = $this->service->list($filters, 15);

            return $this->paginatedResponse(EnrollmentRequestResource::collection($requests));
        } catch (\Throwable $e) {
            Log::error('EnrollmentRequestController::index Error: '.$e->getMessage());

            return $this->errorResponse('Talepler listelenirken bir hata oluştu.', 500);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // OKUL YÖNETİCİSİ — school_id bazlı
    // ──────────────────────────────────────────────────────────────

    /**
     * Okuldaki kayıt taleplerini listele
     * GET /schools/{school_id}/enrollment-requests?status=pending
     */
    public function schoolIndex(Request $request): JsonResponse
    {
        try {
            $school = $this->resolveSchool();
            if (! $school) {
                return $this->errorResponse('Okul bulunamadı.', 404);
            }

            $status = $request->query('status'); // pending | approved | rejected | null (hepsi)
            $requests = $this->service->listForSchool($school->id, $status);

            return $this->paginatedResponse(EnrollmentRequestResource::collection($requests));
        } catch (\Throwable $e) {
            Log::error('EnrollmentRequestController::schoolIndex Error: '.$e->getMessage());

            return $this->errorResponse('Talepler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Rota parametresinden okul çöz (ULID veya integer PK).
     * Tenant sahipliğini doğrular.
     */
    private function resolveSchool(): ?School
    {
        $param = request()->route('school_id');
        if (! $param) {
            return null;
        }

        $user = $this->user();
        $query = School::where('tenant_id', $user->tenant_id);

        return is_numeric($param)
            ? $query->where('id', (int) $param)->first()
            : $query->where('ulid', $param)->first();
    }

    /**
     * Bekleyen talepleri listele (eski uyumluluk)
     */
    public function pending(Request $request): JsonResponse
    {
        try {
            $schoolId = $request->input('school_id');

            if (! $schoolId) {
                return $this->errorResponse('Okul ID gereklidir.', 422);
            }

            $requests = $this->service->pendingForSchool($schoolId);

            return $this->paginatedResponse(EnrollmentRequestResource::collection($requests));
        } catch (\Throwable $e) {
            Log::error('EnrollmentRequestController::pending Error: '.$e->getMessage());

            return $this->errorResponse('Talepler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Talebi onayla (User + FamilyProfile + schoolAssignment oluşturulur)
     * PATCH /schools/{school_id}/enrollment-requests/{id}/approve
     */
    public function approve(int $id): JsonResponse
    {
        $school = $this->resolveSchool();
        if (! $school) {
            return $this->errorResponse('Okul bulunamadı.', 404);
        }

        DB::beginTransaction();
        try {
            $enrollmentRequest = SchoolEnrollmentRequest::where('id', $id)
                ->where('school_id', $school->id)
                ->with('school')
                ->firstOrFail();

            if (! $enrollmentRequest->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            $result = $this->service->approveRequest($enrollmentRequest, $this->user()->id);

            DB::commit();

            return $this->successResponse(
                new EnrollmentRequestResource($result),
                'Kayıt talebi onaylandı.'
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            DB::rollBack();

            return $this->errorResponse('Talep bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('EnrollmentRequestController::approve Error: '.$e->getMessage());

            return $this->errorResponse('Talep onaylanırken bir hata oluştu.', 500);
        }
    }

    /**
     * Talebi reddet (red sebebi zorunlu)
     * PATCH /schools/{school_id}/enrollment-requests/{id}/reject
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $school = $this->resolveSchool();
        if (! $school) {
            return $this->errorResponse('Okul bulunamadı.', 404);
        }

        DB::beginTransaction();
        try {
            $enrollmentRequest = SchoolEnrollmentRequest::where('id', $id)
                ->where('school_id', $school->id)
                ->firstOrFail();

            if (! $enrollmentRequest->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            $result = $this->service->rejectRequest(
                $enrollmentRequest,
                $this->user()->id,
                $request->rejection_reason
            );

            DB::commit();

            return $this->successResponse(
                new EnrollmentRequestResource($result),
                'Kayıt talebi reddedildi.'
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            DB::rollBack();

            return $this->errorResponse('Talep bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('EnrollmentRequestController::reject Error: '.$e->getMessage());

            return $this->errorResponse('Talep reddedilirken bir hata oluştu.', 500);
        }
    }
}
