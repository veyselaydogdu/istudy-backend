<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ReportInputValuesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('report_input_values')->delete();

    }
}
