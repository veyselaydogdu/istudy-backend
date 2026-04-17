<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolMealTypesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_meal_types')->delete();

    }
}
