<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivityClassSchoolClassAssignmentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activity_class_school_class_assignments')->delete();

    }
}
