<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolTeacherAssignmentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_teacher_assignments')->delete();

    }
}
