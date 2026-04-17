<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FamilyProfilesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('family_profiles_histories')->delete();

        \DB::table('family_profiles_histories')->insert([
            0 => [
                'id' => 1,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "ulid": "01KPDGS0E5G6KDCNTKP9T2D080", "created_at": "2026-04-17T10:46:21.000000Z", "created_by": 3, "updated_at": "2026-04-17T10:46:21.000000Z", "family_name": "Aydogdu Ailesi", "owner_user_id": 3}',
                'operated_by' => 3,
                'created_at' => '2026-04-17 10:46:21',
                'updated_at' => '2026-04-17 10:46:21',
            ],
            1 => [
                'id' => 2,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "ulid": "01KPDGYP6X1GGM60SCN6FMADGZ", "created_at": "2026-04-17T10:49:27.000000Z", "created_by": 2, "updated_at": "2026-04-17T10:49:27.000000Z", "family_name": "Aydogdu Ailesi", "owner_user_id": 2}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 10:49:27',
                'updated_at' => '2026-04-17 10:49:27',
            ],
            2 => [
                'id' => 3,
                'original_id' => 2,
                'operation_type' => 'create',
                'snapshot' => '{"id": 2, "ulid": "01KPDHPHBD9CH92WNWN2ZF42T1", "created_at": "2026-04-17T11:02:28.000000Z", "created_by": 2, "updated_at": "2026-04-17T11:02:28.000000Z", "family_name": "Yeni Bahar Familiy", "owner_user_id": 2}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 11:02:28',
                'updated_at' => '2026-04-17 11:02:28',
            ],
        ]);

    }
}
