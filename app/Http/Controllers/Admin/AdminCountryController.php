<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\CountryResource;
use App\Models\Base\Country;
use App\Services\CountryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * AdminCountryController — Ülke Yönetimi (Super Admin)
 *
 * Ülke CRUD, API senkronizasyonu, aktif/pasif yönetimi.
 */
class AdminCountryController extends BaseController
{
    public function __construct(
        private readonly CountryService $countryService
    ) {}

    /**
     * Tüm ülkeleri listele (filtreli + sayfalı)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['search', 'region', 'currency_code', 'phone_code', 'is_active']);
            $perPage = $request->integer('per_page', 50);

            $countries = $this->countryService->list($filters, $perPage);

            return $this->paginatedResponse(CountryResource::collection($countries));
        } catch (\Throwable $e) {
            Log::error('Ülke listeleme hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('Ülkeler listelenemedi.', 500);
        }
    }

    /**
     * Tek ülke detayı
     */
    public function show(int $id): JsonResponse
    {
        try {
            $country = Country::findOrFail($id);

            return $this->successResponse(new CountryResource($country));
        } catch (\Throwable $e) {
            return $this->errorResponse('Ülke bulunamadı.', 404);
        }
    }

    /**
     * Ülke güncelle
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $country = Country::findOrFail($id);

            DB::beginTransaction();

            $country->update($request->only([
                'name', 'official_name', 'native_name', 'phone_code',
                'currency_code', 'currency_name', 'currency_symbol',
                'is_active', 'sort_order', 'extra_data',
            ]));

            DB::commit();

            return $this->successResponse(new CountryResource($country->fresh()), 'Ülke güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Ülke güncelleme hatası', ['id' => $id, 'error' => $e->getMessage()]);

            return $this->errorResponse('Ülke güncellenemedi.', 500);
        }
    }

    /**
     * Ülke sil (soft delete)
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $country = Country::findOrFail($id);

            DB::beginTransaction();
            $country->delete();
            DB::commit();

            return $this->successResponse(null, 'Ülke silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->errorResponse('Ülke silinemedi.', 500);
        }
    }

    /**
     * RestCountries API'den tüm ülkeleri senkronize et
     */
    public function syncFromApi(): JsonResponse
    {
        try {
            $stats = $this->countryService->syncFromApi();

            if (isset($stats['error'])) {
                return $this->errorResponse('API senkronizasyonu başarısız: ' . $stats['error'], 500);
            }

            return $this->successResponse($stats, 'Ülkeler başarıyla senkronize edildi.');
        } catch (\Throwable $e) {
            Log::error('API senkronizasyon hatası', ['error' => $e->getMessage()]);

            return $this->errorResponse('API senkronizasyonu başarısız.', 500);
        }
    }

    /**
     * Belirli bir ülkeyi API'den senkronize et
     */
    public function syncCountry(string $iso2): JsonResponse
    {
        try {
            $country = $this->countryService->syncCountry($iso2);

            if (! $country) {
                return $this->errorResponse('Ülke bulunamadı veya API hatası.', 404);
            }

            return $this->successResponse(new CountryResource($country), 'Ülke senkronize edildi.');
        } catch (\Throwable $e) {
            return $this->errorResponse('Ülke senkronizasyonu başarısız.', 500);
        }
    }

    /**
     * Ülke aktif/pasif toggle
     */
    public function toggleActive(int $id): JsonResponse
    {
        try {
            $country = Country::findOrFail($id);
            $country = $this->countryService->toggleActive($country);

            $status = $country->is_active ? 'aktif' : 'pasif';

            return $this->successResponse(new CountryResource($country), "Ülke {$status} yapıldı.");
        } catch (\Throwable $e) {
            return $this->errorResponse('İşlem başarısız.', 500);
        }
    }

    /**
     * Sıralama güncelle
     */
    public function updateSortOrder(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate(['sort_order' => 'required|integer|min:0']);

            $country = Country::findOrFail($id);
            $country = $this->countryService->updateSortOrder($country, $request->integer('sort_order'));

            return $this->successResponse(new CountryResource($country), 'Sıralama güncellendi.');
        } catch (\Throwable $e) {
            return $this->errorResponse('Sıralama güncellenemedi.', 500);
        }
    }

    /**
     * İstatistikler
     */
    public function stats(): JsonResponse
    {
        try {
            return $this->successResponse($this->countryService->stats());
        } catch (\Throwable $e) {
            return $this->errorResponse('İstatistikler alınamadı.', 500);
        }
    }

    /**
     * Bölge listesi
     */
    public function regions(): JsonResponse
    {
        try {
            return $this->successResponse($this->countryService->regions());
        } catch (\Throwable $e) {
            return $this->errorResponse('Bölgeler alınamadı.', 500);
        }
    }
}
