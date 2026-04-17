<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildMedicationsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_medications')->delete();

        \DB::table('child_medications')->insert([
            0 => [
                'id' => 1,
                'child_id' => 1,
                'medication_id' => null,
                'custom_name' => 'Nitrogen',
                'dose' => '5ml',
                'usage_time' => '[]',
                'usage_days' => '["monday", "wednesday", "thursday"]',
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
            1 => [
                'id' => 2,
                'child_id' => 1,
                'medication_id' => null,
                'custom_name' => 'Aspirin',
                'dose' => '1',
                'usage_time' => '[]',
                'usage_days' => '["tuesday"]',
                'created_at' => '2026-04-17 11:00:15',
                'updated_at' => '2026-04-17 11:00:15',
            ],
        ]);

    }
}
