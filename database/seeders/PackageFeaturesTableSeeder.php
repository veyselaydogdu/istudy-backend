<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PackageFeaturesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('package_features')->delete();

        \DB::table('package_features')->insert([
            0 => [
                'id' => 1,
                'key' => 'yoklama',
                'value_type' => 'bool',
                'label' => 'Günlük Yoklama',
                'description' => null,
                'display_order' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 2,
                'key' => 'gunluk_rapor',
                'value_type' => 'bool',
                'label' => 'Günlük Rapor',
                'description' => null,
                'display_order' => 2,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            2 => [
                'id' => 3,
                'key' => 'bildirimler',
                'value_type' => 'bool',
                'label' => 'Push Bildirimler',
                'description' => null,
                'display_order' => 3,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            3 => [
                'id' => 4,
                'key' => 'etkinlik',
                'value_type' => 'bool',
                'label' => 'Etkinlik Yönetimi',
                'description' => null,
                'display_order' => 4,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            4 => [
                'id' => 5,
                'key' => 'yemek_menusu',
                'value_type' => 'bool',
                'label' => 'Yemek Menüsü',
                'description' => null,
                'display_order' => 5,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            5 => [
                'id' => 6,
                'key' => 'finansal_raporlar',
                'value_type' => 'bool',
                'label' => 'Finansal Raporlar',
                'description' => null,
                'display_order' => 6,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            6 => [
                'id' => 7,
                'key' => 'ozel_raporlar',
                'value_type' => 'bool',
                'label' => 'Özel Raporlar',
                'description' => null,
                'display_order' => 7,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            7 => [
                'id' => 8,
                'key' => 'api_erisimi',
                'value_type' => 'bool',
                'label' => 'API Erişimi',
                'description' => null,
                'display_order' => 8,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            8 => [
                'id' => 9,
                'key' => 'oncelikli_destek',
                'value_type' => 'bool',
                'label' => 'Öncelikli Destek',
                'description' => null,
                'display_order' => 9,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            9 => [
                'id' => 10,
                'key' => 'veli_app',
                'value_type' => 'bool',
                'label' => 'Veli Mobil Uygulaması',
                'description' => null,
                'display_order' => 10,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
        ]);

    }
}
