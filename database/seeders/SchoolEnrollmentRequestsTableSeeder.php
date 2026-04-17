<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolEnrollmentRequestsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_enrollment_requests')->delete();

    }
}
