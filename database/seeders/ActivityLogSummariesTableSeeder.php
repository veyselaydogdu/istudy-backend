<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivityLogSummariesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activity_log_summaries')->delete();

    }
}
