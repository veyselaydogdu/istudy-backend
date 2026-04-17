<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ClassTeacherAssignmentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('class_teacher_assignments')->delete();

    }
}
