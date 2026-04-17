<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FamilyProfilesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('family_profiles')->delete();

        \DB::table('family_profiles')->insert([
            0 => [
                'id' => 1,
                'ulid' => '01KPDGYP6X1GGM60SCN6FMADGZ',
                'owner_user_id' => 2,
                'family_name' => 'Aydogdu Ailesi',
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:49:27',
                'updated_at' => '2026-04-17 10:49:27',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'ulid' => '01KPDHPHBD9CH92WNWN2ZF42T1',
                'owner_user_id' => 2,
                'family_name' => 'Yeni Bahar Familiy',
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 11:02:28',
                'updated_at' => '2026-04-17 11:02:28',
                'deleted_at' => null,
            ],
        ]);

    }
}
