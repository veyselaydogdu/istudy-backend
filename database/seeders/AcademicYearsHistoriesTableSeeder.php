<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AcademicYearsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('academic_years_histories')->delete();

    }
}
