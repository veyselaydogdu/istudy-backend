<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\EnrollmentRequest\StoreEnrollmentRequestRequest;
use App\Http\Resources\EnrollmentRequestResource;
use App\Models\School\SchoolEnrollmentRequest;
use App\Services\EnrollmentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Veli Okul Kayıt Talebi Controller
 *
 * Velilerin kayıt kodu ile okul arama ve kayıt talebi işlemleri.
 * Okul yöneticilerinin talep onay/red işlemleri.
 */
class EnrollmentRequestController extends BaseSchoolController
{
    public function __construct(
        protected EnrollmentRequestService $service
    ) {
        parent::__construct();
    }

    /**
     * Kayıt kodu ile okul ara
     * Herkes erişebilir (veli tarafı)
     */
    public function searchSchool(Request $request): JsonResponse
    {
        try {
            $request->validate(['registration_code' => 'required|string|min:6']);

            $school = $this->service->searchByRegistrationCode($request->registration_code);

            if (! $school) {
                return $this->errorResponse('Okul bulunamadı. Kayıt kodunu kontrol ediniz.', 404);
            }

            return $this->successResponse([
                'id' => $school->id,
                'name' => $school->name,
                'address' => $school->address,
                'logo' => $school->logo,
            ], 'Okul bulundu.');
        } catch (\Throwable $e) {
            Log::error('Okul arama hatası: ' . $e->getMessage());

            return $this->errorResponse('Okul araması sırasında bir hata oluştu.', 500);
        }
    }

    /**
     * Kayıt talebi gönder (Veli tarafı)
     */
    public function store(StoreEnrollmentRequestRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['user_id'] = $this->user()->id;
            $data['status'] = 'pending';
            $data['created_by'] = $this->user()->id;

            $enrollmentRequest = $this->service->createRequest($data);

            DB::commit();

            return $this->successResponse(
                new EnrollmentRequestResource($enrollmentRequest),
                'Kayıt talebiniz gönderildi. Okul yönetiminin onayını bekleyiniz.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Kayıt talebi oluşturma hatası: ' . $e->getMessage());

            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Bekleyen talepleri listele (Okul yöneticisi tarafı)
     */
    public function pending(Request $request): JsonResponse
    {
        try {
            $schoolId = $request->input('school_id');

            if (! $schoolId) {
                return $this->errorResponse('Okul ID gereklidir.', 422);
            }

            $requests = $this->service->pendingForSchool($schoolId);

            return $this->paginatedResponse(
                EnrollmentRequestResource::collection($requests)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Bekleyen talepler listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Talepler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Tüm talepleri listele (Okul yöneticisi tarafı)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['school_id', 'status', 'user_id']);
            $requests = $this->service->list($filters, 15);

            return $this->paginatedResponse(
                EnrollmentRequestResource::collection($requests)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Kayıt talepleri listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Talepler listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Talebi onayla (Okul yöneticisi)
     */
    public function approve(SchoolEnrollmentRequest $enrollmentRequest): JsonResponse
    {
        DB::beginTransaction();
        try {
            if (! $enrollmentRequest->isPending()) {
                return $this->errorResponse('Bu talep zaten işlenmiş.', 422);
            }

            $result = $this->service->approveRequest($enrollmentRequest, $this->user()->id);

            DB::commit();

            return $this->successResponse(
                new EnrollmentRequestResource($result),
                'Kayıt talebi onaylandı.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Kayıt talebi onaylama hatası: ' . $e->getMessage());

            return $this->errorResponse('Talep onaylanırken bir hata oluştu.', 500);
        }
    }

    /**
     * Talebi reddet (Okul yöneticisi)
     */
    public function reject(Request $request, SchoolEnrollmentRequest $enrollmentRequest): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate(['rejection_reason' => 'required|string|max:500']);

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
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Kayıt talebi reddetme hatası: ' . $e->getMessage());

            return $this->errorResponse('Talep reddedilirken bir hata oluştu.', 500);
        }
    }
}
