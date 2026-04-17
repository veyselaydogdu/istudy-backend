<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivityLogsArchiveTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activity_logs_archive')->delete();

    }
}
