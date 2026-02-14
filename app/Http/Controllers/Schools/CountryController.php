<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\CountryResource;
use App\Services\CountryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CountryController — Herkese Açık Ülke Endpoint'leri
 *
 * Dropdown'lar, telefon kodu seçimi, ülke listesi.
 */
class CountryController extends BaseController
{
    public function __construct(
        private readonly CountryService $countryService
    ) {}

    /**
     * Aktif ülkeleri listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['search', 'region', 'phone_code']);
            $filters['is_active'] = true;

            $perPage = $request->integer('per_page', 250); // Ülke listesi genelde full gelir

            $countries = $this->countryService->list($filters, $perPage);

            return $this->paginatedResponse(CountryResource::collection($countries));
        } catch (\Throwable $e) {
            return $this->errorResponse('Ülkeler listelenemedi.', 500);
        }
    }

    /**
     * Telefon kodları listesi (dropdown için optimize)
     */
    public function phoneCodes(): JsonResponse
    {
        try {
            $codes = $this->countryService->phoneCodeList();

            return $this->successResponse($codes);
        } catch (\Throwable $e) {
            return $this->errorResponse('Telefon kodları alınamadı.', 500);
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
