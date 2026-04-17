<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PackagesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('packages')->delete();

        \DB::table('packages')->insert([
            0 => [
                'id' => 1,
                'name' => 'Başlangıç',
                'description' => 'Küçük kreşler için ideal başlangıç paketi. Tek okul, temel özellikler.',
                'max_schools' => 1,
                'max_classes_per_school' => 3,
                'max_students' => 30,
                'monthly_price' => '299.00',
                'yearly_price' => '2990.00',
                'is_active' => 1,
                'features' => '{"yoklama": true, "veli_app": true, "bildirimler": true, "gunluk_rapor": true}',
                'sort_order' => 1,
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'name' => 'Profesyonel',
                'description' => 'Büyüyen kurumlar için genişletilmiş özellikler ve daha yüksek limitler.',
                'max_schools' => 3,
                'max_classes_per_school' => 10,
                'max_students' => 200,
                'monthly_price' => '799.00',
                'yearly_price' => '7990.00',
                'is_active' => 1,
                'features' => '{"yoklama": true, "etkinlik": true, "veli_app": true, "bildirimler": true, "gunluk_rapor": true, "yemek_menusu": true, "finansal_raporlar": true}',
                'sort_order' => 2,
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            2 => [
                'id' => 3,
                'name' => 'Kurumsal',
                'description' => 'Büyük kurumlar ve zincir kreşler için sınırsız erişim ve premium özellikler.',
                'max_schools' => 0,
                'max_classes_per_school' => 0,
                'max_students' => 0,
                'monthly_price' => '1999.00',
                'yearly_price' => '19990.00',
                'is_active' => 1,
                'features' => '{"yoklama": true, "etkinlik": true, "veli_app": true, "api_erisimi": true, "bildirimler": true, "gunluk_rapor": true, "yemek_menusu": true, "ozel_raporlar": true, "oncelikli_destek": true, "finansal_raporlar": true}',
                'sort_order' => 3,
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
        ]);

    }
}
