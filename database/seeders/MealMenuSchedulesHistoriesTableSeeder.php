<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MealMenuSchedulesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('meal_menu_schedules_histories')->delete();

    }
}
