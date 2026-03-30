<?php

namespace App\Console\Commands;

use App\Services\CountryService;
use Illuminate\Console\Command;

/**
 * SyncCountries — RestCountries API'den ülke verilerini senkronize et
 *
 * Kullanım:
 *   php artisan countries:sync          → Tüm ülkeleri senkronize et
 *   php artisan countries:sync --iso=TR → Sadece belirli ülkeyi senkronize et
 */
class SyncCountries extends Command
{
    protected $signature = 'countries:sync
                            {--iso= : Belirli bir ülkeyi ISO2 koduyla senkronize et (örn: TR)}';

    protected $description = 'RestCountries API\'den ülke verilerini çek ve veritabanına kaydet';

    public function handle(CountryService $countryService): int
    {
        $iso = $this->option('iso');

        if ($iso) {
            $this->info("Ülke senkronize ediliyor: {$iso}...");

            $country = $countryService->syncCountry($iso);

            if ($country) {
                $this->info("✅ {$country->name} ({$country->iso2}) başarıyla senkronize edildi.");

                return self::SUCCESS;
            }

            $this->error("❌ Ülke bulunamadı veya API hatası: {$iso}");

            return self::FAILURE;
        }

        $this->info('Tüm ülkeler RestCountries API\'den senkronize ediliyor...');
        $this->newLine();

        $bar = $this->output->createProgressBar(1);
        $bar->start();

        $stats = $countryService->syncFromApi();

        $bar->finish();
        $this->newLine(2);

        if (isset($stats['error'])) {
            $this->error("❌ Senkronizasyon hatası: {$stats['error']}");

            return self::FAILURE;
        }

        $this->table(
            ['Metrik', 'Değer'],
            [
                ['Toplam', $stats['total']],
                ['Yeni Eklenen', $stats['created']],
                ['Güncellenen', $stats['updated']],
                ['Hatalar', $stats['errors']],
                ['Süre (sn)', $stats['duration'] ?? '-'],
            ]
        );

        $this->info('✅ Ülke senkronizasyonu tamamlandı!');

        return self::SUCCESS;
    }
}
