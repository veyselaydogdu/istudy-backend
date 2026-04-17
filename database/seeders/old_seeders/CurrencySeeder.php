<?php

namespace Database\Seeders\old_seeders;

use App\Models\Billing\Currency;
use Illuminate\Database\Seeder;

/**
 * Varsayılan para birimlerini yükle
 *
 * php artisan db:seed --class=CurrencySeeder
 */
class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $currencies = config('currency.default_currencies', []);

        foreach ($currencies as $data) {
            Currency::firstOrCreate(
                ['code' => $data['code']],
                [
                    'name'                => $data['name'],
                    'name_tr'             => $data['name_tr'] ?? null,
                    'symbol'              => $data['symbol'],
                    'symbol_position'     => $data['symbol_position'] ?? 'before',
                    'thousands_separator' => $data['thousands_separator'] ?? ',',
                    'decimal_separator'   => $data['decimal_separator'] ?? '.',
                    'decimal_places'      => $data['decimal_places'] ?? 2,
                    'is_active'           => true,
                    'is_base'             => $data['is_base'] ?? false,
                    'sort_order'          => $data['sort_order'] ?? 0,
                ]
            );
        }

        $this->command->info('✅ Para birimleri yüklendi: ' . count($currencies) . ' adet');
    }
}
