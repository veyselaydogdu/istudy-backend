<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Package\StorePackageRequest;
use App\Http\Requests\Package\UpdatePackageRequest;
use App\Http\Resources\PackageResource;
use App\Models\Package\Package;
use App\Services\PackageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Admin Paket Yönetimi
 * Yalnızca Super Admin erişebilir (route middleware ile kontrol edilir)
 */
class PackageController extends BaseController
{
    public function __construct(
        protected PackageService $service
    ) {}

    /**
     * Tüm paketleri listele (admin)
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->service->getAll(request()->all());

            return $this->paginatedResponse(
                PackageResource::collection($data)
            );
        } catch (Throwable $e) {
            Log::error('PackageController::index Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Paket detayı
     */
    public function show(Package $package): JsonResponse
    {
        try {
            return $this->successResponse(
                PackageResource::make($package->load('packageFeatures')->loadCount('subscriptions')),
                'Paket detayı.'
            );
        } catch (Throwable $e) {
            Log::error('PackageController::show Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Yeni paket oluştur
     */
    public function store(StorePackageRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $data['created_by'] = $this->user()->id;

            $package = $this->service->create($data);

            DB::commit();

            return $this->successResponse(
                PackageResource::make($package),
                'Paket başarıyla oluşturuldu.',
                201
            );
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PackageController::store Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Paket güncelle
     */
    public function update(UpdatePackageRequest $request, Package $package): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $data['updated_by'] = $this->user()->id;

            $package = $this->service->update($package, $data);

            DB::commit();

            return $this->successResponse(
                PackageResource::make($package),
                'Paket başarıyla güncellendi.'
            );
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PackageController::update Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Paket sil (soft delete)
     */
    public function destroy(Package $package): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Aktif aboneliği olan paket silinemez
            $activeCount = $package->subscriptions()->where('status', 'active')->count();
            if ($activeCount > 0) {
                return $this->errorResponse(
                    "Bu paketin {$activeCount} aktif aboneliği var. Önce abonelikleri iptal edin."
                );
            }

            $this->service->delete($package);

            DB::commit();

            return $this->successResponse(null, 'Paket başarıyla silindi.');
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('PackageController::destroy Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Mevcut paket özelliklerini listele
     */
    public function getPackageFeatures(): JsonResponse
    {
        try {
            $features = \App\Models\PackageFeature::orderBy('display_order')->get();

            return $this->successResponse($features);
        } catch (Throwable $e) {
            Log::error('PackageController::getPackageFeatures Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage());
        }
    }
}
