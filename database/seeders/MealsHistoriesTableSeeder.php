<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MealsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('meals_histories')->delete();

    }
}
