<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivityEnrollmentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activity_enrollments')->delete();

    }
}
