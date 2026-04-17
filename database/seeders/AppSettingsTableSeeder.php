<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AppSettingsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('app_settings')->delete();

        \DB::table('app_settings')->insert([
            0 => [
                'id' => 1,
                'key' => 'max_emergency_contacts',
                'value' => '5',
                'description' => 'Acil durum kişisi limiti',
                'created_at' => '2026-04-17 10:30:33',
                'updated_at' => '2026-04-17 10:30:33',
            ],
        ]);

    }
}
