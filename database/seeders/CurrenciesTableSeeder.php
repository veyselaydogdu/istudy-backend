<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CurrenciesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('currencies')->delete();

        \DB::table('currencies')->insert([
            0 => [
                'id' => 1,
                'code' => 'TRY',
                'name' => 'Turkish Lira',
                'name_tr' => 'Türk Lirası',
                'symbol' => '₺',
                'symbol_position' => 'before',
                'thousands_separator' => '.',
                'decimal_separator' => ',',
                'decimal_places' => 2,
                'is_active' => 1,
                'is_base' => 1,
                'sort_order' => 1,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'code' => 'USD',
                'name' => 'US Dollar',
                'name_tr' => 'Amerikan Doları',
                'symbol' => '$',
                'symbol_position' => 'before',
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'decimal_places' => 2,
                'is_active' => 1,
                'is_base' => 0,
                'sort_order' => 2,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            2 => [
                'id' => 3,
                'code' => 'EUR',
                'name' => 'Euro',
                'name_tr' => 'Euro',
                'symbol' => '€',
                'symbol_position' => 'before',
                'thousands_separator' => '.',
                'decimal_separator' => ',',
                'decimal_places' => 2,
                'is_active' => 1,
                'is_base' => 0,
                'sort_order' => 3,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            3 => [
                'id' => 4,
                'code' => 'GBP',
                'name' => 'British Pound',
                'name_tr' => 'İngiliz Sterlini',
                'symbol' => '£',
                'symbol_position' => 'before',
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'decimal_places' => 2,
                'is_active' => 1,
                'is_base' => 0,
                'sort_order' => 4,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
        ]);

    }
}
