<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AllergensHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('allergens_histories')->delete();

        \DB::table('allergens_histories')->insert([
            0 => [
                'id' => 1,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "name": "Gluten", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "risk_level": "high", "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Buğday, arpa, çavdar ve yulaf gibi tahıllarda bulunan protein. Çölyak hastalığında ciddi reaksiyonlara yol açar."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 2,
                'original_id' => 2,
                'operation_type' => 'create',
                'snapshot' => '{"id": 2, "name": "Süt / Laktoz", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "risk_level": "high", "updated_at": "2026-04-17T10:47:08.000000Z", "description": "İnek, koyun ve keçi sütü ile süt ürünlerinde (peynir, yoğurt, tereyağı) bulunan protein ve şeker."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            2 => [
                'id' => 3,
                'original_id' => 3,
                'operation_type' => 'create',
                'snapshot' => '{"id": 3, "name": "Yumurta", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "risk_level": "high", "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Tavuk ve diğer kuş yumurtalarında bulunan protein. Bebeklik döneminde en yaygın gıda alerjilerinden biri."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            3 => [
                'id' => 4,
                'original_id' => 4,
                'operation_type' => 'create',
                'snapshot' => '{"id": 4, "name": "Fıstık (Yerfıstığı)", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "risk_level": "high", "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Anafilaksiye neden olabilen güçlü bir alerjen. Küçük miktarlar bile ciddi reaksiyon yaratabilir."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            4 => [
                'id' => 5,
                'original_id' => 5,
                'operation_type' => 'create',
                'snapshot' => '{"id": 5, "name": "Bal kabağı / Polen", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "risk_level": "low", "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Mevsimsel bitki polenleriyle çapraz reaktivite gösteren gıdalar. Bahar aylarında semptomlar artabilir."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            5 => [
                'id' => 6,
                'original_id' => 6,
                'operation_type' => 'create',
                'snapshot' => '{"id": 6, "name": "Badem", "status": "pending", "tenant_id": null, "created_at": "2026-04-17T11:00:15.000000Z", "created_by": 2, "risk_level": "medium", "updated_at": "2026-04-17T11:00:15.000000Z", "description": null, "suggested_by_user_id": 2}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
        ]);

    }
}
