<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class EventsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('events_histories')->delete();

    }
}
