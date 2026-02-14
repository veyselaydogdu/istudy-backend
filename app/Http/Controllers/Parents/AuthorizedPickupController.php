<?php

namespace App\Http\Controllers\Parents;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\AuthorizedPickupResource;
use App\Models\Child\AuthorizedPickup;
use App\Services\AuthorizedPickupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Yetkili Alıcı Controller
 *
 * Ebeveyn, çocuğu okuldan alabilecek yetkili kişileri yönetir.
 */
class AuthorizedPickupController extends BaseController
{
    public function __construct(
        protected AuthorizedPickupService $service
    ) {
    }

    /**
     * Yetkili alıcıları listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['child_id', 'family_profile_id', 'is_active']);
            $pickups = $this->service->list($filters, 15);

            return $this->paginatedResponse(
                AuthorizedPickupResource::collection($pickups)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Yetkili alıcılar listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Yetkili alıcılar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yetkili alıcı detayı
     */
    public function show(AuthorizedPickup $authorizedPickup): JsonResponse
    {
        try {
            return $this->successResponse(new AuthorizedPickupResource($authorizedPickup));
        } catch (\Throwable $e) {
            Log::error('Yetkili alıcı detay hatası: ' . $e->getMessage());

            return $this->errorResponse('Detay getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni yetkili alıcı ekle
     */
    public function store(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'child_id' => 'required|exists:children,id',
                'family_profile_id' => 'required|exists:family_profiles,id',
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'phone' => 'required|string|max:20',
                'relation' => 'required|string|max:50',
                'address' => 'required|string|max:500',
                'id_number' => 'nullable|string|max:20',
                'photo' => 'nullable|string',
            ]);

            $data = $request->all();
            $data['is_active'] = true;
            $data['created_by'] = $this->user()->id;

            $pickup = $this->service->create($data);

            DB::commit();

            return $this->successResponse(
                new AuthorizedPickupResource($pickup),
                'Yetkili alıcı başarıyla eklendi.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Yetkili alıcı ekleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Yetkili alıcı eklenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yetkili alıcı güncelle
     */
    public function update(Request $request, AuthorizedPickup $authorizedPickup): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'first_name' => 'sometimes|string|max:100',
                'last_name' => 'sometimes|string|max:100',
                'phone' => 'sometimes|string|max:20',
                'relation' => 'sometimes|string|max:50',
                'address' => 'sometimes|string|max:500',
                'id_number' => 'nullable|string|max:20',
                'photo' => 'nullable|string',
                'is_active' => 'nullable|boolean',
            ]);

            $data = $request->all();
            $data['updated_by'] = $this->user()->id;

            $this->service->update($authorizedPickup, $data);

            DB::commit();

            return $this->successResponse(
                new AuthorizedPickupResource($authorizedPickup->fresh()),
                'Yetkili alıcı başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Yetkili alıcı güncelleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Yetkili alıcı güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yetkili alıcı sil
     */
    public function destroy(AuthorizedPickup $authorizedPickup): JsonResponse
    {
        DB::beginTransaction();
        try {
            $authorizedPickup->delete();

            DB::commit();

            return $this->successResponse(null, 'Yetkili alıcı başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Yetkili alıcı silme hatası: ' . $e->getMessage());

            return $this->errorResponse('Yetkili alıcı silinirken bir hata oluştu.', 500);
        }
    }
}
