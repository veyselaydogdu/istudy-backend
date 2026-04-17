<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildConditionsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_conditions')->delete();

        \DB::table('child_conditions')->insert([
            0 => [
                'id' => 1,
                'child_id' => 1,
                'condition_id' => 3,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
            1 => [
                'id' => 2,
                'child_id' => 1,
                'condition_id' => 4,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
            2 => [
                'id' => 3,
                'child_id' => 1,
                'condition_id' => 2,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
            3 => [
                'id' => 4,
                'child_id' => 1,
                'condition_id' => 6,
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
            4 => [
                'id' => 5,
                'child_id' => 2,
                'condition_id' => 5,
                'created_at' => '2026-04-17 11:01:27',
                'updated_at' => '2026-04-17 11:01:27',
            ],
            5 => [
                'id' => 6,
                'child_id' => 2,
                'condition_id' => 3,
                'created_at' => '2026-04-17 11:01:27',
                'updated_at' => '2026-04-17 11:01:27',
            ],
        ]);

    }
}
