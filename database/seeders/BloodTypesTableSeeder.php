<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class BloodTypesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('blood_types')->delete();

        \DB::table('blood_types')->insert([
            0 => [
                'id' => 1,
                'name' => 'A+',
                'is_active' => 1,
                'sort_order' => 8,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'name' => 'A-',
                'is_active' => 1,
                'sort_order' => 7,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
                'deleted_at' => null,
            ],
            2 => [
                'id' => 3,
                'name' => 'B+',
                'is_active' => 1,
                'sort_order' => 6,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
                'deleted_at' => null,
            ],
            3 => [
                'id' => 4,
                'name' => 'B-',
                'is_active' => 1,
                'sort_order' => 5,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
                'deleted_at' => null,
            ],
            4 => [
                'id' => 5,
                'name' => 'AB+',
                'is_active' => 1,
                'sort_order' => 4,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
                'deleted_at' => null,
            ],
            5 => [
                'id' => 6,
                'name' => 'AB-',
                'is_active' => 1,
                'sort_order' => 3,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
                'deleted_at' => null,
            ],
            6 => [
                'id' => 7,
                'name' => 'O+',
                'is_active' => 1,
                'sort_order' => 2,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
                'deleted_at' => null,
            ],
            7 => [
                'id' => 8,
                'name' => 'O-',
                'is_active' => 1,
                'sort_order' => 1,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
                'deleted_at' => null,
            ],
        ]);

    }
}
