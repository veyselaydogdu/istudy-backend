<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolChildEnrollmentRequestsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_child_enrollment_requests')->delete();

    }
}
