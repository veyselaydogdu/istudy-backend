<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('schools_histories')->delete();

    }
}
