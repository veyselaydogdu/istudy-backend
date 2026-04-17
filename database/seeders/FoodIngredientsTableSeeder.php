<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FoodIngredientsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('food_ingredients')->delete();

        \DB::table('food_ingredients')->insert([
            0 => [
                'id' => 1,
                'tenant_id' => null,
                'name' => 'Mercimek',
                'allergen_info' => 'Baklagil ailesine aittir. Bazı bireylerde legümin alerjisi olabilir.',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'tenant_id' => null,
                'name' => 'Yulaf',
                'allergen_info' => 'Çölyak veya gluten hassasiyeti olan çocuklar için kontrol edilmeli.',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            2 => [
                'id' => 3,
                'tenant_id' => null,
                'name' => 'Tam Buğday Unu',
                'allergen_info' => 'Gluten içerir. Çölyak ve buğday alerjisi olanlarda kullanılmamalı.',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            3 => [
                'id' => 4,
                'tenant_id' => null,
                'name' => 'Zeytinyağı',
                'allergen_info' => 'Genellikle güvenlidir. Zeytin alerjisi nadirdir.',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            4 => [
                'id' => 5,
                'tenant_id' => null,
                'name' => 'Süt',
                'allergen_info' => 'Laktoz intoleransı veya süt proteini alerjisi olan çocuklar için uygun alternatif sunulmalı.',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
        ]);

    }
}
