<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FoodIngredientsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('food_ingredients_histories')->delete();

        \DB::table('food_ingredients_histories')->insert([
            0 => [
                'id' => 1,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "name": "Mercimek", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "allergen_info": "Baklagil ailesine aittir. Bazı bireylerde legümin alerjisi olabilir."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 2,
                'original_id' => 2,
                'operation_type' => 'create',
                'snapshot' => '{"id": 2, "name": "Yulaf", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "allergen_info": "Çölyak veya gluten hassasiyeti olan çocuklar için kontrol edilmeli."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            2 => [
                'id' => 3,
                'original_id' => 3,
                'operation_type' => 'create',
                'snapshot' => '{"id": 3, "name": "Tam Buğday Unu", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "allergen_info": "Gluten içerir. Çölyak ve buğday alerjisi olanlarda kullanılmamalı."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            3 => [
                'id' => 4,
                'original_id' => 4,
                'operation_type' => 'create',
                'snapshot' => '{"id": 4, "name": "Zeytinyağı", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "allergen_info": "Genellikle güvenlidir. Zeytin alerjisi nadirdir."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            4 => [
                'id' => 5,
                'original_id' => 5,
                'operation_type' => 'create',
                'snapshot' => '{"id": 5, "name": "Süt", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "allergen_info": "Laktoz intoleransı veya süt proteini alerjisi olan çocuklar için uygun alternatif sunulmalı."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
        ]);

    }
}
