<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TeacherProfilesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('teacher_profiles_histories')->delete();

    }
}
