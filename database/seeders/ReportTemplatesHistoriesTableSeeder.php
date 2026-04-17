<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ReportTemplatesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('report_templates_histories')->delete();

    }
}
