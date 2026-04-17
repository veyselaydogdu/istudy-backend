<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DailyChildReportsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('daily_child_reports_histories')->delete();

    }
}
