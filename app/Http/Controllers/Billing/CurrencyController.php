<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\CurrencyResource;
use App\Services\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Para Birimi Controller
 *
 * Aktif para birimlerini listeleme, kur dönüşümü ve
 * güncel kurları gösterme.
 */
class CurrencyController extends BaseController
{
    public function __construct(
        protected CurrencyService $currencyService
    ) {}

    /**
     * Aktif para birimlerini listele (public)
     */
    public function index(): JsonResponse
    {
        try {
            $currencies = $this->currencyService->getActiveCurrencies();

            return $this->successResponse(
                CurrencyResource::collection($currencies),
                'Aktif para birimleri.'
            );
        } catch (\Throwable $e) {
            Log::error('CurrencyController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Para birimleri getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Güncel döviz kurlarını listele (public)
     */
    public function rates(): JsonResponse
    {
        try {
            $rates = $this->currencyService->getLatestRates();

            return $this->successResponse([
                'base_currency' => \App\Models\Billing\Currency::getBaseCurrencyCode(),
                'rates' => $rates,
                'last_update' => \App\Models\Billing\ExchangeRate::latest('fetched_at')
                    ->first()?->fetched_at?->format('Y-m-d H:i:s'),
            ], 'Güncel döviz kurları.');
        } catch (\Throwable $e) {
            Log::error('CurrencyController::rates Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Döviz kurları getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Para birimi dönüşümü (public)
     *
     * GET /api/currencies/convert?amount=100&from=USD&to=TRY
     */
    public function convert(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'from' => 'required|string|size:3',
            'to' => 'required|string|size:3',
        ]);

        try {
            $result = $this->currencyService->convert(
                (float) $request->amount,
                $request->from,
                $request->to
            );

            return $this->successResponse($result, 'Dönüşüm sonucu.');
        } catch (\Throwable $e) {
            Log::error('CurrencyController::convert Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Döviz dönüşümü yapılırken bir hata oluştu.', 500);
        }
    }

    /**
     * Belirli bir para biriminin kur geçmişi
     *
     * GET /api/currencies/history/TRY?days=30
     */
    public function history(Request $request, string $code): JsonResponse
    {
        $request->validate([
            'days' => 'nullable|integer|min:1|max:365',
        ]);

        try {
            $days = $request->integer('days', 30);
            $history = $this->currencyService->getRateHistory($code, $days);

            return $this->successResponse([
                'currency' => strtoupper($code),
                'base_currency' => \App\Models\Billing\Currency::getBaseCurrencyCode(),
                'days' => $days,
                'rates' => $history->map(fn ($r) => [
                    'rate' => (float) $r->rate,
                    'date' => $r->rate_date->format('Y-m-d'),
                    'source' => $r->source,
                ]),
            ], 'Kur geçmişi.');
        } catch (\Throwable $e) {
            Log::error('CurrencyController::history Error', ['message' => $e->getMessage(), 'code' => $code]);

            return $this->errorResponse('Kur geçmişi getirilirken bir hata oluştu.', 500);
        }
    }
}
