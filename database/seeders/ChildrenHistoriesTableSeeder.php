<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildrenHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('children_histories')->delete();

        \DB::table('children_histories')->insert([
            0 => [
                'id' => 1,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "ulid": "01KPDHJEZX10HHCYQSZSDHZM9N", "gender": "female", "status": "active", "languages": ["Türkçe", "İngilizce"], "last_name": "Aydogdu", "birth_date": "2021-01-15T00:00:00.000000Z", "blood_type": "A+", "created_at": "2026-04-17T11:00:15.000000Z", "created_by": 2, "first_name": "Nehir Ada", "updated_at": "2026-04-17T11:00:15.000000Z", "parent_notes": "Bazen cildirabilir dikkat", "special_notes": "AMA normalde tatlidir", "identity_number": "41412414124", "passport_number": "A12312312312", "family_profile_id": 1, "nationality_country_id": 1}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
            1 => [
                'id' => 2,
                'original_id' => 2,
                'operation_type' => 'create',
                'snapshot' => '{"id": 2, "ulid": "01KPDHMNN43ESZQEQ2HX96H5MG", "gender": "female", "status": "active", "languages": ["Türkçe", "İngilizce"], "last_name": "Aydogdu", "birth_date": "2023-01-04T00:00:00.000000Z", "blood_type": "A-", "created_at": "2026-04-17T11:01:27.000000Z", "created_by": 2, "first_name": "Evrim", "updated_at": "2026-04-17T11:01:27.000000Z", "parent_notes": "Her zaman deli", "special_notes": "Cilgin", "identity_number": "41231231231", "passport_number": "E2131231231", "family_profile_id": 1, "nationality_country_id": 2}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 11:01:27',
                'updated_at' => '2026-04-17 11:01:27',
            ],
            2 => [
                'id' => 3,
                'original_id' => 3,
                'operation_type' => 'create',
                'snapshot' => '{"id": 3, "ulid": "01KPDHNYPJ9HM79DVP2XAKD4WN", "gender": "male", "status": "active", "languages": ["Türkçe"], "last_name": "Kadayif", "birth_date": "2025-01-04T00:00:00.000000Z", "blood_type": "A+", "created_at": "2026-04-17T11:02:09.000000Z", "created_by": 2, "first_name": "Abuzer", "updated_at": "2026-04-17T11:02:09.000000Z", "parent_notes": "Erkek cocuk", "special_notes": "Her sey yapabilir", "identity_number": "41412431231", "passport_number": null, "family_profile_id": 1, "nationality_country_id": 2}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 11:02:09',
                'updated_at' => '2026-04-17 11:02:09',
            ],
        ]);

    }
}
