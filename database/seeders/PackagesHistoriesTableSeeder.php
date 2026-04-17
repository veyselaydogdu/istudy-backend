<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PackagesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('packages_histories')->delete();

        \DB::table('packages_histories')->insert([
            0 => [
                'id' => 1,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "name": "Başlangıç", "features": {"yoklama": true, "veli_app": true, "bildirimler": true, "gunluk_rapor": true}, "is_active": true, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "sort_order": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Küçük kreşler için ideal başlangıç paketi. Tek okul, temel özellikler.", "max_schools": 1, "max_students": 30, "yearly_price": "2990.00", "monthly_price": "299.00", "max_classes_per_school": 3}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 2,
                'original_id' => 2,
                'operation_type' => 'create',
                'snapshot' => '{"id": 2, "name": "Profesyonel", "features": {"yoklama": true, "etkinlik": true, "veli_app": true, "bildirimler": true, "gunluk_rapor": true, "yemek_menusu": true, "finansal_raporlar": true}, "is_active": true, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "sort_order": 2, "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Büyüyen kurumlar için genişletilmiş özellikler ve daha yüksek limitler.", "max_schools": 3, "max_students": 200, "yearly_price": "7990.00", "monthly_price": "799.00", "max_classes_per_school": 10}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            2 => [
                'id' => 3,
                'original_id' => 3,
                'operation_type' => 'create',
                'snapshot' => '{"id": 3, "name": "Kurumsal", "features": {"yoklama": true, "etkinlik": true, "veli_app": true, "api_erisimi": true, "bildirimler": true, "gunluk_rapor": true, "yemek_menusu": true, "ozel_raporlar": true, "oncelikli_destek": true, "finansal_raporlar": true}, "is_active": true, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "sort_order": 3, "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Büyük kurumlar ve zincir kreşler için sınırsız erişim ve premium özellikler.", "max_schools": 0, "max_students": 0, "yearly_price": "19990.00", "monthly_price": "1999.00", "max_classes_per_school": 0}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
        ]);

    }
}
