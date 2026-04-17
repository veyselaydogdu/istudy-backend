<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildPickupLogsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_pickup_logs')->delete();

    }
}
