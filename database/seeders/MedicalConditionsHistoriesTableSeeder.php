<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MedicalConditionsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('medical_conditions_histories')->delete();

        \DB::table('medical_conditions_histories')->insert([
            0 => [
                'id' => 1,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "name": "Astım", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Kronik hava yolu iltihabı. Egzersiz, soğuk hava veya alerjenlerle tetiklenebilir. İnhaler kullanımı gerektirebilir."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 2,
                'original_id' => 2,
                'operation_type' => 'create',
                'snapshot' => '{"id": 2, "name": "Tip 1 Diyabet", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Pankreas yeterli insülin üretemez. Kan şekeri takibi ve insülin uygulaması gerektirir. Okul saatlerinde şeker takibi önemlidir."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            2 => [
                'id' => 3,
                'original_id' => 3,
                'operation_type' => 'create',
                'snapshot' => '{"id": 3, "name": "Epilepsi (Sara)", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Tekrarlayan nöbet geçirme durumu. Nöbet anında müdahale protokolü bilinmeli, okul personeli bilgilendirilmeli."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            3 => [
                'id' => 4,
                'original_id' => 4,
                'operation_type' => 'create',
                'snapshot' => '{"id": 4, "name": "Serebral Palsi", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Beyin gelişimindeki bozukluk nedeniyle hareket ve kas kontrolünde güçlük. Fiziksel destek ve erişilebilirlik önemlidir."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            4 => [
                'id' => 5,
                'original_id' => 5,
                'operation_type' => 'create',
                'snapshot' => '{"id": 5, "name": "DEHB (Dikkat Eksikliği)", "status": "approved", "tenant_id": null, "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z", "description": "Dikkat güçlüğü, aşırı hareketlilik ve dürtüsellik ile karakterize nörogelişimsel bozukluk. Yapılandırılmış ortam önerilir."}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            5 => [
                'id' => 6,
                'original_id' => 6,
                'operation_type' => 'create',
                'snapshot' => '{"id": 6, "name": "Astim", "status": "pending", "tenant_id": null, "created_at": "2026-04-17T11:00:15.000000Z", "created_by": 2, "updated_at": "2026-04-17T11:00:15.000000Z", "description": null, "suggested_by_user_id": 2}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
        ]);

    }
}
