<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\CurrencyResource;
use App\Models\Billing\Currency;
use App\Services\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Para Birimi & Kur Yönetimi Controller
 *
 * Para birimi CRUD, kur güncelleme (manuel + API),
 * baz para birimi ayarlama, istatistikler.
 */
class AdminCurrencyController extends BaseController
{
    public function __construct(
        protected CurrencyService $currencyService
    ) {}

    /**
     * Tüm para birimlerini listele (aktif + pasif)
     */
    public function index(): JsonResponse
    {
        try {
            $currencies = $this->currencyService->getAllCurrencies();

            return $this->successResponse(
                CurrencyResource::collection($currencies),
                'Tüm para birimleri.'
            );
        } catch (\Throwable $e) {
            Log::error('AdminCurrencyController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Yeni para birimi ekle
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code'                => 'required|string|size:3|unique:currencies,code',
            'name'                => 'required|string|max:100',
            'name_tr'             => 'nullable|string|max:100',
            'symbol'              => 'required|string|max:10',
            'symbol_position'     => 'nullable|string|in:before,after',
            'thousands_separator' => 'nullable|string|max:1',
            'decimal_separator'   => 'nullable|string|max:1',
            'decimal_places'      => 'nullable|integer|min:0|max:4',
            'is_active'           => 'nullable|boolean',
            'is_base'             => 'nullable|boolean',
            'sort_order'          => 'nullable|integer|min:0',
        ]);

        try {
            DB::beginTransaction();

            $data = $request->all();
            $data['code'] = strtoupper($data['code']);
            $data['created_by'] = auth()->id();

            $currency = $this->currencyService->createCurrency($data);

            DB::commit();

            return $this->successResponse(
                CurrencyResource::make($currency->load('latestRate')),
                'Para birimi başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminCurrencyController::store Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Para birimi detayı
     */
    public function show(Currency $currency): JsonResponse
    {
        try {
            $currency->load('latestRate');

            return $this->successResponse(
                CurrencyResource::make($currency),
                'Para birimi detayı.'
            );
        } catch (\Throwable $e) {
            Log::error('AdminCurrencyController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Para birimi güncelle
     */
    public function update(Request $request, Currency $currency): JsonResponse
    {
        $request->validate([
            'name'                => 'sometimes|string|max:100',
            'name_tr'             => 'nullable|string|max:100',
            'symbol'              => 'sometimes|string|max:10',
            'symbol_position'     => 'nullable|string|in:before,after',
            'thousands_separator' => 'nullable|string|max:1',
            'decimal_separator'   => 'nullable|string|max:1',
            'decimal_places'      => 'nullable|integer|min:0|max:4',
            'is_active'           => 'nullable|boolean',
            'is_base'             => 'nullable|boolean',
            'sort_order'          => 'nullable|integer|min:0',
        ]);

        try {
            DB::beginTransaction();

            $data = $request->all();
            $data['updated_by'] = auth()->id();

            $currency = $this->currencyService->updateCurrency($currency, $data);

            DB::commit();

            return $this->successResponse(
                CurrencyResource::make($currency->load('latestRate')),
                'Para birimi başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminCurrencyController::update Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Para birimini sil
     */
    public function destroy(Currency $currency): JsonResponse
    {
        try {
            DB::beginTransaction();

            $this->currencyService->deleteCurrency($currency);

            DB::commit();

            return $this->successResponse(null, 'Para birimi başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminCurrencyController::destroy Error', ['message' => $e->getMessage()]);

            $code = $e->getCode() === 400 ? 400 : 500;

            return $this->errorResponse($e->getMessage(), $code);
        }
    }

    /**
     * Para birimini aktif/pasif yap
     */
    public function toggleStatus(Currency $currency): JsonResponse
    {
        try {
            $currency = $this->currencyService->toggleStatus($currency);

            return $this->successResponse(
                CurrencyResource::make($currency->load('latestRate')),
                $currency->is_active ? 'Para birimi aktifleştirildi.' : 'Para birimi pasifleştirildi.'
            );
        } catch (\Throwable $e) {
            Log::error('AdminCurrencyController::toggleStatus Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Baz para birimini değiştir
     */
    public function setBase(Currency $currency): JsonResponse
    {
        try {
            DB::beginTransaction();

            $currency->setAsBase();

            DB::commit();

            return $this->successResponse(
                CurrencyResource::make($currency->fresh()->load('latestRate')),
                "{$currency->code} artık baz para birimidir."
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminCurrencyController::setBase Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Manuel kur güncelle
     */
    public function setRate(Request $request): JsonResponse
    {
        $request->validate([
            'currency_code' => 'required|string|size:3',
            'rate'          => 'required|numeric|min:0.00000001',
            'date'          => 'nullable|date',
        ]);

        try {
            $exchangeRate = $this->currencyService->setManualRate(
                $request->currency_code,
                (float) $request->rate,
                $request->date
            );

            return $this->successResponse([
                'currency_code' => strtoupper($request->currency_code),
                'rate'          => (float) $exchangeRate->rate,
                'rate_date'     => $exchangeRate->rate_date,
                'source'        => $exchangeRate->source,
            ], 'Kur başarıyla güncellendi.');
        } catch (\Throwable $e) {
            Log::error('AdminCurrencyController::setRate Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Toplu kur güncelleme
     */
    public function setBulkRates(Request $request): JsonResponse
    {
        $request->validate([
            'rates'      => 'required|array|min:1',
            'rates.*'    => 'numeric|min:0.00000001',
            'date'       => 'nullable|date',
        ]);

        try {
            $updated = $this->currencyService->setBulkRates(
                $request->rates,
                $request->date
            );

            return $this->successResponse([
                'updated_count' => $updated,
            ], "{$updated} kur başarıyla güncellendi.");
        } catch (\Throwable $e) {
            Log::error('AdminCurrencyController::setBulkRates Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * API'den kurları güncelle (manual trigger)
     */
    public function fetchRates(Request $request): JsonResponse
    {
        $request->validate([
            'source' => 'nullable|string|in:exchangerate-api,openexchangerates,fixer,tcmb',
        ]);

        try {
            $result = $this->currencyService->fetchRatesFromApi($request->source);

            if ($result['success']) {
                return $this->successResponse($result, 'Döviz kurları API\'den başarıyla güncellendi.');
            }

            return $this->errorResponse('Kur güncellemesi başarısız: ' . $result['error'], 500);
        } catch (\Throwable $e) {
            Log::error('AdminCurrencyController::fetchRates Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Para birimi & kur istatistikleri
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = $this->currencyService->getStats();

            return $this->successResponse($stats, 'Para birimi istatistikleri.');
        } catch (\Throwable $e) {
            Log::error('AdminCurrencyController::stats Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Kur güncelleme loglarını listele
     */
    public function logs(Request $request): JsonResponse
    {
        try {
            $limit = $request->input('limit', 50);
            $logs = $this->currencyService->getUpdateLogs((int) $limit);

            return $this->successResponse($logs, 'Kur güncelleme logları.');
        } catch (\Throwable $e) {
            Log::error('AdminCurrencyController::logs Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
