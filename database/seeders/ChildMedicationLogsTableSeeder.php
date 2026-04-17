<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildMedicationLogsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_medication_logs')->delete();

    }
}
