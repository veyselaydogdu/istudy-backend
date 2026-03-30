<?php

namespace App\Services;

use App\Models\Billing\Currency;
use App\Models\Billing\ExchangeRate;
use App\Models\Billing\ExchangeRateLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Para Birimi ve Döviz Kuru Servisi
 *
 * Para birimi CRUD, kur yönetimi, API entegrasyonu ve
 * dönüşüm işlemlerini yönetir.
 *
 * Desteklenen API kaynakları:
 * - ExchangeRate-API (exchangerate-api.com) — Ücretsiz plan
 * - Open Exchange Rates (openexchangerates.org)
 * - Fixer.io
 * - TCMB (Türkiye Cumhuriyet Merkez Bankası - XML)
 */
class CurrencyService extends BaseService
{
    protected function model(): string
    {
        return Currency::class;
    }

    /*
    |--------------------------------------------------------------------------
    | Para Birimi CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Yeni para birimi ekle
     */
    public function createCurrency(array $data): Currency
    {
        // Eğer baz olarak işaretlendiyse, diğerlerini baz olmaktan çıkar
        if (! empty($data['is_base'])) {
            Currency::where('is_base', true)->update(['is_base' => false]);
            cache()->forget('base_currency');
        }

        $currency = Currency::create($data);

        $this->clearCache();

        return $currency;
    }

    /**
     * Para birimi güncelle
     */
    public function updateCurrency(Currency $currency, array $data): Currency
    {
        if (! empty($data['is_base']) && ! $currency->is_base) {
            Currency::where('is_base', true)->update(['is_base' => false]);
            cache()->forget('base_currency');
        }

        $currency->update($data);

        $this->clearCache();

        return $currency->fresh();
    }

    /**
     * Para birimini soft-delete
     */
    public function deleteCurrency(Currency $currency): bool
    {
        if ($currency->is_base) {
            throw new \Exception('Baz para birimi silinemez. Önce başka bir para birimini baz olarak ayarlayın.', 400);
        }

        $currency->delete();
        $this->clearCache();

        return true;
    }

    /**
     * Para birimini aktif/pasif yap
     */
    public function toggleStatus(Currency $currency): Currency
    {
        $currency->update(['is_active' => ! $currency->is_active]);
        $this->clearCache();

        return $currency->fresh();
    }

    /**
     * Aktif para birimlerini listele (cache ile)
     */
    public function getActiveCurrencies(): \Illuminate\Database\Eloquent\Collection
    {
        return cache()->remember('active_currencies', 3600, function () {
            return Currency::active()
                ->with('latestRate')
                ->orderByDesc('is_base')
                ->orderBy('sort_order')
                ->orderBy('code')
                ->get();
        });
    }

    /**
     * Tüm para birimlerini listele (admin)
     */
    public function getAllCurrencies()
    {
        return Currency::with('latestRate')
            ->orderByDesc('is_base')
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | Kur Yönetimi
    |--------------------------------------------------------------------------
    */

    /**
     * Manuel kur güncelle / ekle
     */
    public function setManualRate(string $currencyCode, float $rate, ?string $date = null): ExchangeRate
    {
        $currency = Currency::byCode($currencyCode)->firstOrFail();
        $baseCode = Currency::getBaseCurrencyCode();
        $date = $date ?? now()->toDateString();

        $exchangeRate = ExchangeRate::updateOrCreate(
            [
                'currency_id'   => $currency->id,
                'base_currency' => $baseCode,
                'rate_date'     => $date,
            ],
            [
                'rate'   => $rate,
                'source' => 'manual',
                'fetched_at' => now(),
            ]
        );

        $this->clearRateCache();

        return $exchangeRate;
    }

    /**
     * Toplu kur güncelle (Admin manual)
     */
    public function setBulkRates(array $rates, ?string $date = null): int
    {
        $baseCode = Currency::getBaseCurrencyCode();
        $date = $date ?? now()->toDateString();
        $updated = 0;

        foreach ($rates as $code => $rate) {
            $currency = Currency::byCode($code)->first();

            if (! $currency) {
                continue;
            }

            ExchangeRate::updateOrCreate(
                [
                    'currency_id'   => $currency->id,
                    'base_currency' => $baseCode,
                    'rate_date'     => $date,
                ],
                [
                    'rate'   => (float) $rate,
                    'source' => 'manual',
                    'fetched_at' => now(),
                ]
            );

            $updated++;
        }

        $this->clearRateCache();

        return $updated;
    }

    /**
     * Belirli bir para birimi için kur geçmişini getir
     */
    public function getRateHistory(string $currencyCode, int $days = 30): \Illuminate\Database\Eloquent\Collection
    {
        $currency = Currency::byCode($currencyCode)->firstOrFail();

        return ExchangeRate::where('currency_id', $currency->id)
            ->where('rate_date', '>=', now()->subDays($days)->toDateString())
            ->orderByDesc('rate_date')
            ->get();
    }

    /**
     * En güncel kurları al (tüm aktif para birimleri için)
     */
    public function getLatestRates(): array
    {
        return cache()->remember('exchange_rates', 3600, function () {
            $currencies = Currency::active()->nonBase()->with('latestRate')->get();

            $rates = [];
            foreach ($currencies as $currency) {
                $rates[$currency->code] = [
                    'currency_id' => $currency->id,
                    'code'        => $currency->code,
                    'name'        => $currency->name,
                    'name_tr'     => $currency->name_tr,
                    'symbol'      => $currency->symbol,
                    'rate'        => (float) ($currency->latestRate?->rate ?? 0),
                    'buy_rate'    => $currency->latestRate?->buy_rate ? (float) $currency->latestRate->buy_rate : null,
                    'sell_rate'   => $currency->latestRate?->sell_rate ? (float) $currency->latestRate->sell_rate : null,
                    'rate_date'   => $currency->latestRate?->rate_date?->format('Y-m-d'),
                    'source'      => $currency->latestRate?->source ?? 'N/A',
                ];
            }

            return $rates;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Dönüşüm İşlemleri
    |--------------------------------------------------------------------------
    */

    /**
     * Tutarı bir para biriminden diğerine çevir
     */
    public function convert(float $amount, string $fromCode, string $toCode): array
    {
        $converted = ExchangeRate::convert($amount, $fromCode, $toCode);
        $rate = $this->getCrossRate($fromCode, $toCode);

        return [
            'from_amount'   => $amount,
            'from_currency' => strtoupper($fromCode),
            'to_amount'     => $converted,
            'to_currency'   => strtoupper($toCode),
            'rate'          => $rate,
            'rate_date'     => now()->toDateString(),
        ];
    }

    /**
     * İki para birimi arasındaki çapraz kuru hesapla
     */
    public function getCrossRate(string $fromCode, string $toCode): float
    {
        if (strtoupper($fromCode) === strtoupper($toCode)) {
            return 1.0;
        }

        $fromRate = ExchangeRate::getRate($fromCode);
        $toRate   = ExchangeRate::getRate($toCode);

        if ($fromRate <= 0) {
            return 0;
        }

        // İki kuru birbirine bölerek çapraz kur elde ederiz
        return round($toRate / $fromRate, 8);
    }

    /**
     * Tutarı baz para birimi cinsinden göster (fatura/ödeme için)
     */
    public function toBase(float $amount, string $fromCode): float
    {
        return ExchangeRate::convertToBase($amount, $fromCode);
    }

    /**
     * Baz para birimi cinsiden tutarı hedef para birimine çevir (müşteriye gösterim)
     */
    public function fromBase(float $amount, string $toCode): float
    {
        return ExchangeRate::convertFromBase($amount, $toCode);
    }

    /*
    |--------------------------------------------------------------------------
    | API Entegrasyonu — Döviz Kuru Güncelleme
    |--------------------------------------------------------------------------
    */

    /**
     * API üzerinden döviz kurlarını güncelle
     *
     * Desteklenen kaynaklar:
     * - exchangerate-api  (varsayılan, ücretsiz)
     * - openexchangerates
     * - fixer
     * - tcmb             (TCMB XML)
     */
    public function fetchRatesFromApi(?string $source = null): array
    {
        $source   = $source ?? config('currency.api_source', 'exchangerate-api');
        $baseCode = Currency::getBaseCurrencyCode();
        $startMs  = now()->timestamp * 1000 + now()->micro / 1000;

        try {
            $rates = match ($source) {
                'exchangerate-api'    => $this->fetchFromExchangeRateApi($baseCode),
                'openexchangerates'   => $this->fetchFromOpenExchangeRates($baseCode),
                'fixer'               => $this->fetchFromFixer($baseCode),
                'tcmb'                => $this->fetchFromTcmb(),
                default               => throw new \Exception("Desteklenmeyen API kaynağı: {$source}"),
            };

            $rateDate  = now()->toDateString();
            $updated   = 0;
            $activeCodes = Currency::active()->nonBase()->pluck('id', 'code')->toArray();

            foreach ($rates as $code => $rate) {
                $code = strtoupper($code);

                if (! isset($activeCodes[$code])) {
                    continue;
                }

                ExchangeRate::updateOrCreate(
                    [
                        'currency_id'   => $activeCodes[$code],
                        'base_currency' => $baseCode,
                        'rate_date'     => $rateDate,
                    ],
                    [
                        'rate'       => (float) $rate,
                        'source'     => 'api',
                        'fetched_at' => now(),
                    ]
                );

                $updated++;
            }

            $durationMs = (int) ((now()->timestamp * 1000 + now()->micro / 1000) - $startMs);

            // Başarılı log
            ExchangeRateLog::logSuccess($source, $baseCode, $updated, $durationMs);

            // Cache temizle
            $this->clearRateCache();

            Log::info("Döviz kurları güncellendi. Kaynak: {$source}, Güncellenen: {$updated}");

            return [
                'success'      => true,
                'source'       => $source,
                'base_currency' => $baseCode,
                'rates_updated' => $updated,
                'duration_ms'  => $durationMs,
            ];
        } catch (\Throwable $e) {
            $durationMs = (int) ((now()->timestamp * 1000 + now()->micro / 1000) - $startMs);

            ExchangeRateLog::logFailure($source, $baseCode, $e->getMessage(), $durationMs);

            Log::error("Döviz kuru güncelleme hatası [{$source}]: " . $e->getMessage());

            return [
                'success'       => false,
                'source'        => $source,
                'error'         => $e->getMessage(),
                'duration_ms'   => $durationMs,
            ];
        }
    }

    /**
     * ExchangeRate-API (exchangerate-api.com)
     *
     * Ücretsiz plan: 1500 req/ay — Open Access (API key opsiyonel)
     * URL: https://open.er-api.com/v6/latest/{base}
     * Veya API key ile: https://v6.exchangerate-api.com/v6/{key}/latest/{base}
     */
    private function fetchFromExchangeRateApi(string $baseCode): array
    {
        $apiKey = config('currency.exchangerate_api_key');

        if ($apiKey) {
            $url = "https://v6.exchangerate-api.com/v6/{$apiKey}/latest/{$baseCode}";
        } else {
            // Ücretsiz, API key gerektirmez
            $url = "https://open.er-api.com/v6/latest/{$baseCode}";
        }

        $response = Http::timeout(15)->get($url);

        if (! $response->successful()) {
            throw new \Exception("ExchangeRate-API isteği başarısız: HTTP {$response->status()}");
        }

        $data = $response->json();

        if (($data['result'] ?? '') !== 'success') {
            throw new \Exception('ExchangeRate-API hatalı yanıt: ' . ($data['error-type'] ?? 'Bilinmeyen hata'));
        }

        return $data['rates'] ?? [];
    }

    /**
     * Open Exchange Rates (openexchangerates.org)
     *
     * API key zorunlu (ücretsiz plan: 1000 req/ay, baz: sadece USD)
     * URL: https://openexchangerates.org/api/latest.json?app_id={key}&base={base}
     */
    private function fetchFromOpenExchangeRates(string $baseCode): array
    {
        $apiKey = config('currency.openexchangerates_key');

        if (! $apiKey) {
            throw new \Exception('Open Exchange Rates API key tanımlı değil. config/currency.php → openexchangerates_key');
        }

        $url = "https://openexchangerates.org/api/latest.json?app_id={$apiKey}&base={$baseCode}";

        $response = Http::timeout(15)->get($url);

        if (! $response->successful()) {
            throw new \Exception("OpenExchangeRates isteği başarısız: HTTP {$response->status()}");
        }

        $data = $response->json();

        return $data['rates'] ?? [];
    }

    /**
     * Fixer.io
     *
     * API key zorunlu (ücretsiz plan: 100 req/ay, baz: sadece EUR)
     * URL: https://data.fixer.io/api/latest?access_key={key}&base={base}
     */
    private function fetchFromFixer(string $baseCode): array
    {
        $apiKey = config('currency.fixer_key');

        if (! $apiKey) {
            throw new \Exception('Fixer.io API key tanımlı değil. config/currency.php → fixer_key');
        }

        $url = "https://data.fixer.io/api/latest?access_key={$apiKey}&base={$baseCode}";

        $response = Http::timeout(15)->get($url);

        if (! $response->successful()) {
            throw new \Exception("Fixer.io isteği başarısız: HTTP {$response->status()}");
        }

        $data = $response->json();

        if (! ($data['success'] ?? false)) {
            throw new \Exception('Fixer.io hatalı yanıt: ' . ($data['error']['info'] ?? 'Bilinmeyen hata'));
        }

        return $data['rates'] ?? [];
    }

    /**
     * TCMB (Türkiye Cumhuriyet Merkez Bankası) — XML
     *
     * Ücretsiz, API key gerektirmez.
     * URL: https://www.tcmb.gov.tr/kurlar/today.xml
     * Baz her zaman TRY (1 [YabanciParaBirimi] = X TRY)
     * Bu metod TRY bazlı kur döndürür, ardından ana baza çevrilir.
     */
    private function fetchFromTcmb(): array
    {
        $url = 'https://www.tcmb.gov.tr/kurlar/today.xml';

        $response = Http::timeout(15)->get($url);

        if (! $response->successful()) {
            throw new \Exception("TCMB XML isteği başarısız: HTTP {$response->status()}");
        }

        $xml = simplexml_load_string($response->body());

        if (! $xml) {
            throw new \Exception('TCMB XML parse edilemedi.');
        }

        $rates = [];

        foreach ($xml->Currency as $currency) {
            $code = (string) $currency['CurrencyCode'];

            // Döviz alış kuru (ForexBuying) → 1 Yabancı = X TRY
            $forexBuying = (float) str_replace(',', '.', (string) $currency->ForexBuying);
            $forexSelling = (float) str_replace(',', '.', (string) $currency->ForexSelling);

            if ($forexBuying > 0) {
                $rates[$code] = $forexBuying;
            }
        }

        // TCMB her zaman 1 YP = X TRY verir
        // Baz USD ise, TRY kurunu ters çevirmemiz gerekir
        $baseCode = Currency::getBaseCurrencyCode();

        if (strtoupper($baseCode) !== 'TRY') {
            // Baz USD ise: USD kuru TCMB'den alınıp diğer kurlar yeniden hesaplanır
            $baseInTry = $rates[$baseCode] ?? 0;

            if ($baseInTry <= 0) {
                throw new \Exception("TCMB'den {$baseCode} kuru alınamadı.");
            }

            $normalizedRates = [];
            foreach ($rates as $code => $tryRate) {
                // 1 BASE = baseInTry TRY
                // 1 CODE  = tryRate  TRY
                // O zaman 1 BASE = baseInTry / tryRate CODE
                // Tersini alırsak: 1 BASE = tryRate / baseInTry şeklinde kur
                // Ama biz rate'i "1 BASE = ? TARGET" olarak saklıyoruz
                // Yani: rate = tryRate / baseInTry (her iki tarafı TRY cinsinden karşılaştır)
                $normalizedRates[$code] = $tryRate / $baseInTry;
            }

            // TRY'nin kendisi: 1 BASE = baseInTry TRY
            $normalizedRates['TRY'] = $baseInTry;

            // Baz para biriminin kendisini çıkar
            unset($normalizedRates[$baseCode]);

            return $normalizedRates;
        }

        // Baz TRY ise, kurlar zaten TRY bazlı
        return $rates;
    }

    /*
    |--------------------------------------------------------------------------
    | İstatistikler
    |--------------------------------------------------------------------------
    */

    /**
     * Kur güncelleme loglarını listele
     */
    public function getUpdateLogs(int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return ExchangeRateLog::latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Genel para birimi istatistikleri
     */
    public function getStats(): array
    {
        return [
            'base_currency'     => Currency::getBaseCurrencyCode(),
            'total_currencies'  => Currency::count(),
            'active_currencies' => Currency::active()->count(),
            'last_update'       => ExchangeRateLog::successful()->latest()->first()?->fetched_at?->format('Y-m-d H:i:s'),
            'last_update_source' => ExchangeRateLog::successful()->latest()->first()?->source,
            'total_api_calls'   => ExchangeRateLog::count(),
            'failed_calls'      => ExchangeRateLog::failed()->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Cache Yönetimi
    |--------------------------------------------------------------------------
    */

    private function clearCache(): void
    {
        cache()->forget('active_currencies');
        cache()->forget('base_currency');
        $this->clearRateCache();
    }

    private function clearRateCache(): void
    {
        cache()->forget('exchange_rates');

        // Belirli kur cache'lerini temizle (pattern ile)
        // Not: Redis kullanıyorsanız pattern ile silebilirsiniz
        // Dosya tabanlı cache için bu yeterli olacaktır
        $codes = Currency::active()->pluck('code')->toArray();
        $baseCode = Currency::getBaseCurrencyCode();
        $today = now()->toDateString();

        foreach ($codes as $code) {
            cache()->forget("rate_{$baseCode}_{$code}_{$today}");
        }
    }
}
