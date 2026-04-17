<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolFamilyAssignmentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_family_assignments')->delete();

    }
}
