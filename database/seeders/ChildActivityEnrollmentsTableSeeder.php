<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildActivityEnrollmentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_activity_enrollments')->delete();

    }
}
