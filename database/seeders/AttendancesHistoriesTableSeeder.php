<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AttendancesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('attendances_histories')->delete();

    }
}
