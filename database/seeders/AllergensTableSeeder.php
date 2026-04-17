<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AllergensTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('allergens')->delete();

        \DB::table('allergens')->insert([
            0 => [
                'id' => 1,
                'tenant_id' => null,
                'name' => 'Gluten',
                'description' => 'Buğday, arpa, çavdar ve yulaf gibi tahıllarda bulunan protein. Çölyak hastalığında ciddi reaksiyonlara yol açar.',
                'risk_level' => 'high',
                'status' => 'approved',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
                'suggested_by_user_id' => null,
            ],
            1 => [
                'id' => 2,
                'tenant_id' => null,
                'name' => 'Süt / Laktoz',
                'description' => 'İnek, koyun ve keçi sütü ile süt ürünlerinde (peynir, yoğurt, tereyağı) bulunan protein ve şeker.',
                'risk_level' => 'high',
                'status' => 'approved',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
                'suggested_by_user_id' => null,
            ],
            2 => [
                'id' => 3,
                'tenant_id' => null,
                'name' => 'Yumurta',
                'description' => 'Tavuk ve diğer kuş yumurtalarında bulunan protein. Bebeklik döneminde en yaygın gıda alerjilerinden biri.',
                'risk_level' => 'high',
                'status' => 'approved',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
                'suggested_by_user_id' => null,
            ],
            3 => [
                'id' => 4,
                'tenant_id' => null,
                'name' => 'Fıstık (Yerfıstığı)',
                'description' => 'Anafilaksiye neden olabilen güçlü bir alerjen. Küçük miktarlar bile ciddi reaksiyon yaratabilir.',
                'risk_level' => 'high',
                'status' => 'approved',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
                'suggested_by_user_id' => null,
            ],
            4 => [
                'id' => 5,
                'tenant_id' => null,
                'name' => 'Bal kabağı / Polen',
                'description' => 'Mevsimsel bitki polenleriyle çapraz reaktivite gösteren gıdalar. Bahar aylarında semptomlar artabilir.',
                'risk_level' => 'low',
                'status' => 'approved',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
                'suggested_by_user_id' => null,
            ],
            5 => [
                'id' => 6,
                'tenant_id' => null,
                'name' => 'Badem',
                'description' => null,
                'risk_level' => 'medium',
                'status' => 'pending',
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
                'deleted_at' => null,
                'suggested_by_user_id' => 2,
            ],
        ]);

    }
}
