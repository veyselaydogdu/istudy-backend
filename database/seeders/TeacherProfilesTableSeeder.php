<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TeacherProfilesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('teacher_profiles')->delete();

    }
}
