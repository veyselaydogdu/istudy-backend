<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivitiesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activities_histories')->delete();

    }
}
