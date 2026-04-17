<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildrenTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('children')->delete();

        \DB::table('children')->insert([
            0 => [
                'id' => 1,
                'ulid' => '01KPDHJEZX10HHCYQSZSDHZM9N',
                'family_profile_id' => 1,
                'school_id' => null,
                'academic_year_id' => null,
                'first_name' => 'Nehir Ada',
                'last_name' => 'Aydogdu',
                'birth_date' => '2021-01-15',
                'gender' => 'female',
                'blood_type' => 'A+',
                'profile_photo' => null,
                'enrollment_date' => null,
                'status' => 'active',
                'special_notes' => 'AMA normalde tatlidir',
                'identity_number' => '41412414124',
                'passport_number' => 'A12312312312',
                'nationality_country_id' => 1,
                'languages' => '["Türkçe", "İngilizce"]',
                'parent_notes' => 'Bazen cildirabilir dikkat',
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'ulid' => '01KPDHMNN43ESZQEQ2HX96H5MG',
                'family_profile_id' => 1,
                'school_id' => null,
                'academic_year_id' => null,
                'first_name' => 'Evrim',
                'last_name' => 'Aydogdu',
                'birth_date' => '2023-01-04',
                'gender' => 'female',
                'blood_type' => 'A-',
                'profile_photo' => null,
                'enrollment_date' => null,
                'status' => 'active',
                'special_notes' => 'Cilgin',
                'identity_number' => '41231231231',
                'passport_number' => 'E2131231231',
                'nationality_country_id' => 2,
                'languages' => '["Türkçe", "İngilizce"]',
                'parent_notes' => 'Her zaman deli',
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 11:01:27',
                'updated_at' => '2026-04-17 11:01:27',
                'deleted_at' => null,
            ],
            2 => [
                'id' => 3,
                'ulid' => '01KPDHNYPJ9HM79DVP2XAKD4WN',
                'family_profile_id' => 1,
                'school_id' => null,
                'academic_year_id' => null,
                'first_name' => 'Abuzer',
                'last_name' => 'Kadayif',
                'birth_date' => '2025-01-04',
                'gender' => 'male',
                'blood_type' => 'A+',
                'profile_photo' => null,
                'enrollment_date' => null,
                'status' => 'active',
                'special_notes' => 'Her sey yapabilir',
                'identity_number' => '41412431231',
                'passport_number' => null,
                'nationality_country_id' => 2,
                'languages' => '["Türkçe"]',
                'parent_notes' => 'Erkek cocuk',
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 11:02:09',
                'updated_at' => '2026-04-17 11:02:09',
                'deleted_at' => null,
            ],
        ]);

    }
}
