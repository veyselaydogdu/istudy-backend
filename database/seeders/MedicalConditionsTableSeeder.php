<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MedicalConditionsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('medical_conditions')->delete();

        \DB::table('medical_conditions')->insert([
            0 => [
                'id' => 1,
                'tenant_id' => null,
                'name' => 'Astım',
                'description' => 'Kronik hava yolu iltihabı. Egzersiz, soğuk hava veya alerjenlerle tetiklenebilir. İnhaler kullanımı gerektirebilir.',
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
                'name' => 'Tip 1 Diyabet',
                'description' => 'Pankreas yeterli insülin üretemez. Kan şekeri takibi ve insülin uygulaması gerektirir. Okul saatlerinde şeker takibi önemlidir.',
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
                'name' => 'Epilepsi (Sara)',
                'description' => 'Tekrarlayan nöbet geçirme durumu. Nöbet anında müdahale protokolü bilinmeli, okul personeli bilgilendirilmeli.',
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
                'name' => 'Serebral Palsi',
                'description' => 'Beyin gelişimindeki bozukluk nedeniyle hareket ve kas kontrolünde güçlük. Fiziksel destek ve erişilebilirlik önemlidir.',
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
                'name' => 'DEHB (Dikkat Eksikliği)',
                'description' => 'Dikkat güçlüğü, aşırı hareketlilik ve dürtüsellik ile karakterize nörogelişimsel bozukluk. Yapılandırılmış ortam önerilir.',
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
                'name' => 'Astim',
                'description' => null,
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
