<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MedicationsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('medications_histories')->delete();

    }
}
