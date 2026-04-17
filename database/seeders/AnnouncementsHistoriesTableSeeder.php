<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AnnouncementsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('announcements_histories')->delete();

    }
}
