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
    public function index(): JsonResponse
    {
        try {
            $school = $this->resolveSchool();
            if (! $school) {
                return $this->errorResponse('Okul bulunamadı.', 404);
            }

            $parents = $this->service->parentsForSchool($school->id);

            $result = $parents->through(fn ($fp) => [
                'id' => $fp->id,
                'family_name' => $fp->family_name,
                'owner_name' => trim(($fp->owner?->name ?? '').' '.($fp->owner?->surname ?? '')),
                'email' => $fp->owner?->email,
                'phone' => $fp->owner?->phone,
                'children' => $fp->children->map(fn ($c) => [
                    'id' => $c->ulid,
                    'name' => trim(($c->first_name ?? '').' '.($c->last_name ?? '')),
                    'birth_date' => $c->birth_date,
                    'gender' => $c->gender,
                    'status' => $c->status,
                    'special_notes' => $c->special_notes,
                    'parent_notes' => $c->parent_notes,
                    'allergens' => $c->allergens->map(fn ($a) => ['id' => $a->id, 'name' => $a->name, 'risk_level' => $a->risk_level])->values(),
                    'conditions' => $c->conditions->map(fn ($cd) => ['id' => $cd->id, 'name' => $cd->name])->values(),
                    'medications' => $c->medications->map(fn ($m) => ['id' => $m->id, 'name' => $m->name])->values(),
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
    public function inviteInfo(): JsonResponse
    {
        try {
            $school = $this->resolveSchool();
            if (! $school) {
                return $this->errorResponse('Okul bulunamadı.', 404);
            }

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
        } catch (\Throwable $e) {
            Log::error('SchoolParentController::inviteInfo Error: '.$e->getMessage());

            return $this->errorResponse('Davet bilgisi alınamadı.', 500);
        }
    }

    /**
     * Davet tokenini yenile (eski link geçersiz olur)
     * POST /schools/{school_id}/invite/regenerate
     */
    public function regenerateInvite(): JsonResponse
    {
        try {
            $school = $this->resolveSchool();
            if (! $school) {
                return $this->errorResponse('Okul bulunamadı.', 404);
            }

            $newToken = $school->regenerateInviteToken();

            return $this->successResponse([
                'registration_code' => $school->registration_code,
                'invite_token' => $newToken,
            ], 'Davet linki yenilendi.');
        } catch (\Throwable $e) {
            Log::error('SchoolParentController::regenerateInvite Error: '.$e->getMessage());

            return $this->errorResponse('Davet yenilenirken hata oluştu.', 500);
        }
    }

    private function resolveSchool(): ?School
    {
        $param = request()->route('school_id');
        if (! $param) {
            return null;
        }

        $query = School::where('tenant_id', $this->user()->tenant_id);

        return is_numeric($param)
            ? $query->where('id', (int) $param)->first()
            : $query->where('ulid', $param)->first();
    }
}
