<?php

namespace App\Console\Commands;

use App\Services\CurrencyService;
use Illuminate\Console\Command;

/**
 * Döviz Kurlarını Güncelle (Cron Job)
 *
 * Kullanım:
 *   php artisan currency:update-rates
 *   php artisan currency:update-rates --source=tcmb
 *   php artisan currency:update-rates --source=exchangerate-api
 *
 * Cron ayarı (routes/console.php):
 *   Schedule::command('currency:update-rates')->dailyAt('09:00');
 */
class UpdateExchangeRates extends Command
{
    protected $signature = 'currency:update-rates
                            {--source= : API kaynağı (exchangerate-api, openexchangerates, fixer, tcmb)}
                            {--force : Cache temizleyerek zorla güncelle}';

    protected $description = 'Döviz kurlarını API üzerinden günceller';

    public function __construct(
        protected CurrencyService $currencyService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $source = $this->option('source');

        $this->info('🔄 Döviz kurları güncelleniyor...');
        $this->info("   Kaynak: " . ($source ?? config('currency.api_source', 'exchangerate-api')));

        $result = $this->currencyService->fetchRatesFromApi($source);

        if ($result['success']) {
            $this->info("✅ Başarılı! {$result['rates_updated']} kur güncellendi.");
            $this->info("   Baz para birimi: {$result['base_currency']}");
            $this->info("   Süre: {$result['duration_ms']}ms");

            return self::SUCCESS;
        }

        $this->error("❌ Hata: {$result['error']}");
        $this->error("   Süre: {$result['duration_ms']}ms");

        return self::FAILURE;
    }
}
