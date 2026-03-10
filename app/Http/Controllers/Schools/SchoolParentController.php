<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\School;
use App\Services\EnrollmentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * Okuldaki Veli Yönetimi
 *
 * Okula kayıtlı velileri ve çocuklarını listeleme.
 * Davet kodu / linki görüntüleme ve yenileme.
 */
class SchoolParentController extends BaseController
{
    public function __construct(
        protected EnrollmentRequestService $service
    ) {}

    /**
     * Okuldaki velileri ve çocuklarını listele
     * GET /schools/{school_id}/parents
     */
    public function index(int $schoolId): JsonResponse
    {
        try {
            $parents = $this->service->parentsForSchool($schoolId);

            $result = $parents->through(fn ($fp) => [
                'id' => $fp->id,
                'family_name' => $fp->family_name,
                'owner_name' => trim(($fp->owner?->name ?? '').' '.($fp->owner?->surname ?? '')),
                'email' => $fp->owner?->email,
                'phone' => $fp->owner?->phone,
                'children' => $fp->children->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => trim(($c->name ?? '').' '.($c->surname ?? '')),
                    'birth_date' => $c->birth_date,
                    'gender' => $c->gender,
                    'status' => $c->status,
                ]),
            ]);

            return $this->paginatedResponse($result);
        } catch (\Throwable $e) {
            Log::error('SchoolParentController::index Error: '.$e->getMessage());

            return $this->errorResponse('Veliler yüklenemedi.', 500);
        }
    }

    /**
     * Okul davet bilgisini getir (kayıt kodu + davet linki)
     * GET /schools/{school_id}/invite-info
     */
    public function inviteInfo(int $schoolId): JsonResponse
    {
        try {
            $school = School::where('id', $schoolId)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            // invite_token yoksa oluştur
            if (! $school->invite_token) {
                $school->regenerateInviteToken();
                $school->refresh();
            }

            // registration_code yoksa oluştur
            if (! $school->registration_code) {
                $school->update(['registration_code' => School::generateRegistrationCode()]);
                $school->refresh();
            }

            return $this->successResponse([
                'registration_code' => $school->registration_code,
                'invite_token' => $school->invite_token,
            ], 'Davet bilgisi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Okul bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('SchoolParentController::inviteInfo Error: '.$e->getMessage());

            return $this->errorResponse('Davet bilgisi alınamadı.', 500);
        }
    }

    /**
     * Davet tokenini yenile (eski link geçersiz olur)
     * POST /schools/{school_id}/invite/regenerate
     */
    public function regenerateInvite(int $schoolId): JsonResponse
    {
        try {
            $school = School::where('id', $schoolId)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $newToken = $school->regenerateInviteToken();

            return $this->successResponse([
                'registration_code' => $school->registration_code,
                'invite_token' => $newToken,
            ], 'Davet linki yenilendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Okul bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('SchoolParentController::regenerateInvite Error: '.$e->getMessage());

            return $this->errorResponse('Davet yenilenirken hata oluştu.', 500);
        }
    }
}
