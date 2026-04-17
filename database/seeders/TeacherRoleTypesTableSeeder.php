<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TeacherRoleTypesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('teacher_role_types')->delete();

    }
}
