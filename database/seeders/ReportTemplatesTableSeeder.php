<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ReportTemplatesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('report_templates')->delete();

    }
}
